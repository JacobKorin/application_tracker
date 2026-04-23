import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  eslint: {
    // CI runs ESLint explicitly, so the production build does not need to lint again.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

