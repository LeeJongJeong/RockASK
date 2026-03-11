import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@rockask/types", "@rockask/ui"],
};

export default nextConfig;
