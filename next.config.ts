import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  locale: "id",
  defaultLocale: "id",
};

export default nextConfig;
