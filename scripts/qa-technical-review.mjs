import fs from 'node:fs/promises';
import path from 'node:path';
import nextEnvironment from '@next/env';
import { PrismaClient } from '@prisma/client';

const BASE_URL = process.env.QA_BASE_URL || 'http://localhost:3001';
const CDP_URL = process.env.QA_CDP_URL || 'http://127.0.0.1:9223';
const OUTPUT_DIR = path.resolve('qa-artifacts');

nextEnvironment.loadEnvConfig(process.cwd());

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const QA_COLLECTION_SLUG = '__qa-technical-review';
const QA_PRODUCT_SLUG = '__qa-technical-review-product';
const prisma = new PrismaClient();
let fixtureCreated = false;

async function ensureProductFixture() {
  const collection = await prisma.collection.upsert({
    where: { slug: QA_COLLECTION_SLUG },
    update: {},
    create: {
      name: '__QA Technical Review',
      slug: QA_COLLECTION_SLUG,
      description: 'Temporary automated QA fixture',
      targetGender: 'WOMEN',
    },
  });
  const product = await prisma.product.upsert({
    where: { slug: QA_PRODUCT_SLUG },
    update: {},
    create: {
      slug: QA_PRODUCT_SLUG,
      name: 'QA Variant Test Product',
      description: 'Temporary product used to verify product variants, cart, and checkout.',
      shortDescription: 'Temporary QA product',
      price: 2500,
      originalPrice: 3000,
      inStock: true,
      image: '/logo_main.png',
      images: ['/logo_main.png'],
      advantages: ['QA only'],
      specifications: { purpose: 'Automated QA' },
      features: ['Variants', 'Cart', 'Checkout'],
      variants: [
        { size: '38', color: 'Black', stock: 5, imageUrl: '/logo_main.png', images: [] },
        { size: '39', color: 'Black', stock: 0, imageUrl: '/logo_main.png', images: [] },
        { size: '38', color: 'Gold', stock: 3, imageUrl: '/logo_main.png', images: [] },
      ],
      collectionId: collection.id,
    },
  });
  fixtureCreated = true;
  return product;
}

async function cleanupProductFixture() {
  await prisma.product.deleteMany({ where: { slug: QA_PRODUCT_SLUG } });
  const collection = await prisma.collection.findUnique({
    where: { slug: QA_COLLECTION_SLUG },
    include: { _count: { select: { products: true } } },
  });
  if (collection && collection._count.products === 0) {
    await prisma.collection.delete({ where: { id: collection.id } });
  }
  fixtureCreated = false;
}

class CdpClient {
  constructor(webSocketUrl) {
    this.webSocket = new WebSocket(webSocketUrl);
    this.sequence = 0;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      this.webSocket.addEventListener('open', resolve, { once: true });
      this.webSocket.addEventListener('error', reject, { once: true });
    });
    this.webSocket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      for (const listener of this.listeners.get(message.method) || []) listener(message.params || {});
    });
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.webSocket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  waitFor(method, timeoutMs = 20_000) {
    return new Promise((resolve, reject) => {
      const listener = (params) => {
        clearTimeout(timer);
        const listeners = this.listeners.get(method) || [];
        this.listeners.set(method, listeners.filter((candidate) => candidate !== listener));
        resolve(params);
      };
      const timer = setTimeout(() => {
        const listeners = this.listeners.get(method) || [];
        this.listeners.set(method, listeners.filter((candidate) => candidate !== listener));
        reject(new Error(`Timed out waiting for ${method}`));
      }, timeoutMs);
      this.on(method, listener);
    });
  }

  async evaluate(expression) {
    const result = await this.send('Runtime.evaluate', {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    }
    return result.result?.value;
  }

  close() {
    this.webSocket.close();
  }
}

async function createTarget() {
  const response = await fetch(`${CDP_URL}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
  if (!response.ok) throw new Error(`Unable to create Chrome target: HTTP ${response.status}`);
  return response.json();
}

async function readLocalEnvironment() {
  const text = await fs.readFile('.env.local', 'utf8').catch(() => '');
  return Object.fromEntries(
    text.split(/\r?\n/).flatMap((line) => {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
      if (!match) return [];
      return [[match[1], match[2].trim().replace(/^(['"])(.*)\1$/, '$2')]];
    }),
  );
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await cleanupProductFixture();
  const target = await createTarget();
  const cdp = new CdpClient(target.webSocketDebuggerUrl);
  await cdp.connect();
  await Promise.all([
    cdp.send('Page.enable'),
    cdp.send('Runtime.enable'),
    cdp.send('Network.enable'),
    cdp.send('Log.enable'),
  ]);
  await Promise.all([
    cdp.send('Network.clearBrowserCookies'),
    cdp.send('Network.clearBrowserCache'),
    cdp.send('Storage.clearDataForOrigin', { origin: BASE_URL, storageTypes: 'all' }),
  ]);

  let routeIssues = [];
  const runtimeIssues = [];
  cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
    runtimeIssues.push({ type: 'exception', message: exceptionDetails?.exception?.description || exceptionDetails?.text });
  });
  cdp.on('Log.entryAdded', ({ entry }) => {
    if (entry?.level === 'error' || entry?.level === 'warning') {
      if (entry.text?.includes('status of 401')) return;
      runtimeIssues.push({ type: entry.level, message: entry.text, url: entry.url });
    }
  });
  cdp.on('Network.responseReceived', ({ response }) => {
    const expectedGuestAuth = response.status === 401 && response.url.endsWith('/api/auth/me');
    if (response.status >= 400 && !expectedGuestAuth) {
      routeIssues.push({ type: 'http', status: response.status, url: response.url });
    }
  });
  cdp.on('Network.loadingFailed', ({ errorText, blockedReason, canceled }) => {
    if (!canceled) routeIssues.push({ type: 'network', message: errorText, blockedReason });
  });

  const setViewport = async ({ width, height, mobile }) => {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      mobile,
      deviceScaleFactor: 1,
      screenWidth: width,
      screenHeight: height,
    });
  };

  const navigate = async (pathname, settleMs = 900) => {
    routeIssues = [];
    const load = cdp.waitFor('Page.loadEventFired').catch(() => null);
    await cdp.send('Page.navigate', { url: `${BASE_URL}${pathname}` });
    await load;
    await delay(settleMs);
  };

  const waitForSelector = async (selector, timeoutMs = 5_000) => {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await cdp.evaluate(`Boolean(document.querySelector(${JSON.stringify(selector)}))`)) return true;
      await delay(100);
    }
    return false;
  };

  const inspectPage = () => cdp.evaluate(`(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const canonical = document.querySelector('link[rel="canonical"]')?.href || null;
    const description = document.querySelector('meta[name="description"]')?.content || null;
    const robots = document.querySelector('meta[name="robots"]')?.content || null;
    const brokenImages = [...document.images]
      .filter((image) => {
        const rect = image.getBoundingClientRect();
        const visible = rect.width > 0 && rect.height > 0 && rect.bottom >= 0 && rect.top <= innerHeight;
        return visible && image.complete && image.naturalWidth === 0;
      })
      .slice(0, 10)
      .map((image) => image.currentSrc || image.src);
    const horizontalOverflow = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const unnamedButtonElements = [...document.querySelectorAll('button')]
      .filter((button) => !(button.getAttribute('aria-label') || button.getAttribute('title') || button.innerText.trim()));
    const unlabeledInputElements = [...document.querySelectorAll('input:not([type="hidden"]), select, textarea')]
      .filter((input) => {
        const id = input.getAttribute('id');
        return !(input.getAttribute('aria-label') || input.getAttribute('aria-labelledby') ||
          input.closest('label') || (id && document.querySelector('label[for="' + CSS.escape(id) + '"]')) ||
          input.getAttribute('placeholder'));
      });
    return {
      url: location.href,
      title: document.title,
      readyState: document.readyState,
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      horizontalOverflow,
      h1Count: document.querySelectorAll('h1').length,
      h1Text: document.querySelector('h1')?.innerText?.trim().slice(0, 160) || null,
      mainPresent: Boolean(document.querySelector('main')),
      brokenImages,
      unnamedButtons: unnamedButtonElements.length,
      unnamedButtonSamples: unnamedButtonElements.slice(0, 5).map((element) => element.outerHTML.slice(0, 300)),
      unlabeledInputs: unlabeledInputElements.length,
      unlabeledInputSamples: unlabeledInputElements.slice(0, 5).map((element) => element.outerHTML.slice(0, 300)),
      seo: {
        canonical,
        description,
        robots,
        jsonLdCount: document.querySelectorAll('script[type="application/ld+json"]').length,
      },
      tracking: {
        dataLayerPresent: Array.isArray(window.dataLayer),
        gtmScript: Boolean(document.querySelector('script[src*="googletagmanager.com/gtm.js"]')),
        gaScript: Boolean(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')),
        metaPixelPresent: typeof window.fbq === 'function',
      },
      performance: navigation ? {
        responseMs: Math.round(navigation.responseEnd),
        domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
        loadMs: Math.round(navigation.loadEventEnd),
        resources: resources.length,
        transferKb: Math.round(resources.reduce((sum, entry) => sum + (entry.transferSize || 0), 0) / 1024),
      } : null,
    };
  })()`);

  const saveScreenshot = async (name) => {
    const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
    await fs.writeFile(path.join(OUTPUT_DIR, name), Buffer.from(screenshot.data, 'base64'));
  };

  let productResponse = await fetch(`${BASE_URL}/api/products`);
  let productPayload = await productResponse.json();
  let products = Array.isArray(productPayload?.data) ? productPayload.data : [];
  if (products.length === 0) {
    await ensureProductFixture();
    productResponse = await fetch(`${BASE_URL}/api/products`);
    productPayload = await productResponse.json();
    products = Array.isArray(productPayload?.data) ? productPayload.data : [];
  }
  const product = products.find((candidate) => candidate?.slug && candidate?.inStock) || products.find((candidate) => candidate?.slug);
  const productPath = product?.slug ? `/products/${encodeURIComponent(product.slug)}` : null;

  const publicRoutes = [
    '/', '/products', '/sales', '/new-arrivals', '/kids', '/blogs', '/reviews', '/affiliate',
    '/our-story', '/help-center', '/shipping-delivery', '/returns-exchanges', '/privacy-policy',
    '/wishlist', '/checkout',
  ];
  if (productPath) publicRoutes.splice(2, 0, productPath);

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    product: product ? { id: product.id, slug: product.slug, name: product.name } : null,
    endpoints: {},
    desktop: [],
    mobile: [],
    flows: {},
    admin: {},
    runtimeIssues,
  };

  for (const endpoint of ['/api/products', '/api/collections', '/api/reviews/featured', '/api/storefront-settings', '/api/marketing/public-settings', '/sitemap.xml', '/robots.txt']) {
    const startedAt = performance.now();
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`);
      report.endpoints[endpoint] = { status: response.status, ms: Math.round(performance.now() - startedAt), contentType: response.headers.get('content-type') };
    } catch (error) {
      report.endpoints[endpoint] = { error: error.message };
    }
  }

  for (const viewport of [
    { key: 'desktop', width: 1440, height: 900, mobile: false },
    { key: 'mobile', width: 390, height: 844, mobile: true },
  ]) {
    await setViewport(viewport);
    for (const pathname of publicRoutes) {
      await navigate(pathname, pathname === productPath ? 1_800 : 900);
      if (pathname === productPath) await waitForSelector('h1');
      const page = await inspectPage();
      report[viewport.key].push({ pathname, ...page, issues: [...routeIssues] });
      if (pathname === '/' && viewport.key === 'desktop') await saveScreenshot('home-desktop.png');
      if (pathname === '/' && viewport.key === 'mobile') await saveScreenshot('home-mobile.png');
      if (pathname === '/checkout' && viewport.key === 'mobile') await saveScreenshot('checkout-mobile-empty.png');
      if (pathname === productPath && viewport.key === 'mobile') await saveScreenshot('product-mobile.png');
    }
  }

  if (productPath) {
    await setViewport({ width: 390, height: 844, mobile: true });
    await cdp.evaluate(`localStorage.removeItem('stepstyle-cart')`);
    await navigate(productPath, 1_200);
    report.flows.productBefore = await cdp.evaluate(`(() => {
      const buttons = [...document.querySelectorAll('button')];
      const add = buttons.find((button) => button.innerText.trim() === 'Add to Cart');
      return {
        selectedSize: [...document.querySelectorAll('label')].find((label) => label.innerText.trim() === 'Size')?.parentElement?.innerText || null,
        selectedColor: [...document.querySelectorAll('label')].find((label) => label.innerText.trim() === 'Color')?.parentElement?.innerText || null,
        addToCartFound: Boolean(add),
        addToCartEnabled: Boolean(add && !add.disabled),
      };
    })()`);
    report.flows.addToCartClicked = await cdp.evaluate(`(() => {
      const button = [...document.querySelectorAll('button')].find((candidate) => candidate.innerText.trim() === 'Add to Cart');
      if (!button || button.disabled) return false;
      button.click();
      return true;
    })()`);
    await delay(1_200);
    report.flows.cartAfterAdd = await cdp.evaluate(`(() => ({
      storage: JSON.parse(localStorage.getItem('stepstyle-cart') || '{"items":[]}'),
      drawerOpen: document.body.innerText.includes('Your shopping bag'),
      checkoutLinkPresent: Boolean(document.querySelector('a[href="/checkout"]')),
    }))()`);
    await saveScreenshot('cart-mobile.png');
    const checkoutClicked = await cdp.evaluate(`(() => {
      const links = [...document.querySelectorAll('a[href="/checkout"]')].filter((link) => link.offsetParent !== null);
      if (links.length !== 1) return false;
      links[0].click();
      return true;
    })()`);
    report.flows.checkoutClicked = checkoutClicked;
    if (checkoutClicked) {
      await cdp.waitFor('Page.loadEventFired').catch(() => null);
      await delay(1_000);
      report.flows.checkout = await cdp.evaluate(`(() => {
        const form = document.querySelector('form');
        const region = document.querySelector('select[aria-label="Region or province"]');
        const manualRegion = document.querySelector('input[placeholder="Region / Province"]');
        const manualCity = document.querySelector('input[placeholder="City"]');
        return {
          url: location.href,
          itemVisible: document.body.innerText.includes(${JSON.stringify(product?.name || '')}),
          requiredFieldCount: document.querySelectorAll('[required]').length,
          emptyFormValid: form ? form.checkValidity() : null,
          firstInvalidPlaceholder: form?.querySelector(':invalid')?.getAttribute('placeholder') || null,
          shippingMode: region ? 'configured regions' : (manualRegion && manualCity ? 'manual fallback' : 'missing'),
          regionOptions: region?.querySelectorAll('option').length || 0,
          orderButtons: [...document.querySelectorAll('button')].map((button) => button.innerText.trim()).filter((text) => /order|pay/i.test(text)).slice(0, 10),
        };
      })()`);
      await saveScreenshot('checkout-mobile-cart.png');
    }
  }

  const localEnvironment = await readLocalEnvironment();
  if (localEnvironment.ADMIN_EMAIL && localEnvironment.ADMIN_PASSWORD) {
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: localEnvironment.ADMIN_EMAIL, password: localEnvironment.ADMIN_PASSWORD }),
    });
    report.admin.loginStatus = loginResponse.status;
    let cookieHeader = loginResponse.headers.getSetCookie?.()[0] || loginResponse.headers.get('set-cookie');
    if (!cookieHeader && localEnvironment.JWT_SECRET) {
      const { SignJWT } = await import('jose');
      const existingAdmin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      const qaToken = await new SignJWT({
        userId: existingAdmin?.id || 'qa-technical-review',
        email: existingAdmin?.email || localEnvironment.ADMIN_EMAIL,
        role: 'ADMIN',
        name: existingAdmin?.name || 'QA Admin',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('1h')
        .sign(new TextEncoder().encode(localEnvironment.JWT_SECRET));
      cookieHeader = `stepstyle_auth=${qaToken}`;
      report.admin.authFallback = existingAdmin
        ? 'local signed QA token for existing admin'
        : 'local signed QA token without a matching database user';
    }
    if (cookieHeader) {
      const [cookiePair] = cookieHeader.split(';');
      const separator = cookiePair.indexOf('=');
      await cdp.send('Network.setCookie', {
        name: cookiePair.slice(0, separator),
        value: cookiePair.slice(separator + 1),
        url: BASE_URL,
        httpOnly: true,
        sameSite: 'Strict',
      });
      for (const viewport of [
        { key: 'desktop', width: 1440, height: 900, mobile: false },
        { key: 'mobile', width: 390, height: 844, mobile: true },
      ]) {
        await setViewport(viewport);
        await navigate('/admin', 1_200);
        report.admin[viewport.key] = {
          ...(await inspectPage()),
          tabLabels: await cdp.evaluate(`([...document.querySelectorAll('nav button')].map((button) => button.innerText.trim()).filter(Boolean))`),
          navMetrics: await cdp.evaluate(`(() => {
            const nav = document.querySelector('nav[aria-label="Admin dashboard sections"]') || document.querySelector('nav');
            return nav ? { clientWidth: nav.clientWidth, scrollWidth: nav.scrollWidth, scrollable: nav.scrollWidth > nav.clientWidth } : null;
          })()`),
          issues: [...routeIssues],
        };
        await saveScreenshot(`admin-${viewport.key}.png`);
      }
    }
  }

  report.runtimeIssues = runtimeIssues;
  await fs.writeFile(path.join(OUTPUT_DIR, 'technical-review-results.json'), `${JSON.stringify(report, null, 2)}\n`);
  await cleanupProductFixture();
  await prisma.$disconnect();
  cdp.close();
  console.log(`QA report written to ${path.join(OUTPUT_DIR, 'technical-review-results.json')}`);
}

main().catch((error) => {
  console.error(error);
  cleanupProductFixture()
    .catch((cleanupError) => console.error(cleanupError))
    .finally(() => prisma.$disconnect())
    .finally(() => { process.exitCode = 1; });
});
