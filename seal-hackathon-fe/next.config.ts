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

};

export default nextConfig;
