/** @type {import('next-sitemap').IConfig} */
const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.stepandstyl.com').replace(/\/$/, '');

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 50000,
  
  // Exclude paths that shouldn't be indexed
  exclude: [
    '/admin',
    '/admin/*',
    '/api',
    '/api/*',
    '/auth/*',
    '/checkout',
    '/order-success',
    '/account',
    '/account/*',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/debug-run*',
    '/*.xml',
    '/*.json',
  ],

  // Transform function for custom handling
  transform: async (config, path) => {
    // Dynamic priorities for different page types
    let priority = 0.7;
    let changefreq = 'weekly';

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path.includes('/products')) {
      priority = 0.9;
      changefreq = 'daily';
    } else if (path.includes('/collections')) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.includes('/reviews') || path.includes('/sales')) {
      priority = 0.7;
      changefreq = 'weekly';
    } else if (path.includes('/help-center') || path.includes('/our-story') || path.includes('/shipping-delivery')) {
      priority = 0.6;
      changefreq = 'monthly';
    } else if (path.includes('/affiliate') || path.includes('/influencer') || path.includes('/careers')) {
      priority = 0.5;
      changefreq = 'monthly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },

  // Robots.txt configuration
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/api',
          '/auth',
          '/checkout',
          '/order-success',
          '/account',
          '/forgot-password',
          '/reset-password',
          '/verify-email',
          '/debug*',
          '/*.json',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
    ],
    host: siteUrl,
    sitemap: `${siteUrl}/sitemap.xml`,
  },
}
