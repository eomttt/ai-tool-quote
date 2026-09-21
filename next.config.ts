import type { NextConfig } from 'next';

const config: NextConfig = {
  agentRules: false,
  output: process.env.BUILD_STANDALONE === 'true' ? 'standalone' : undefined,
  poweredByHeader: false,
  async redirects() {
    return [{ source: '/index.html', destination: '/', permanent: true }];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default config;
