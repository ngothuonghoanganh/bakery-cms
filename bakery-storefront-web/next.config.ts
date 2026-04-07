import type { NextConfig } from 'next';

const resolveApiOrigin = (): string => {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return 'http://localhost:3000';
  }
};

const apiOrigin = resolveApiOrigin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/upload/:path*',
        destination: `${apiOrigin}/upload/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${apiOrigin}/uploads/:path*`,
      },
      {
        source: '/api/v1/files/:path*',
        destination: `${apiOrigin}/api/v1/files/:path*`,
      },
    ];
  },
};

export default nextConfig;
