import type { NextConfig } from "next";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https:",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https://www.googletagmanager.com https://www.facebook.com https://www.youtube.com https://www.youtube-nocookie.com https://js.stripe.com https://hooks.stripe.com",
  "media-src 'self' blob: https:",
  "worker-src 'self' blob:",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  logging: {
    incomingRequests: false,
    browserToTerminal: 'error',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      { key: 'X-XSS-Protection', value: '0' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
    ];

    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({ key: 'Content-Security-Policy', value: contentSecurityPolicy });
    }

    const headers = [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];

    return headers;
  },
};

export default nextConfig;
