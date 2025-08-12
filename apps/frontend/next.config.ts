import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
    externalDir: true,
  },
  transpilePackages: ['@bpstudio/shared'],
};

export default nextConfig;

