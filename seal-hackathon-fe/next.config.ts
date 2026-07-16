import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // This project builds/dev-runs with webpack (see "next dev --webpack" in
  // package.json), so no Turbopack-specific config is needed here.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
  devIndicators: {
    position: 'bottom-left',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5000',
      }
    ],
  },
};

export default nextConfig;
