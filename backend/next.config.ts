import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Product photo uploads in the admin go through server actions (8 MB max per image).
    serverActions: { bodySizeLimit: '9mb' },
  },
};

export default nextConfig;
