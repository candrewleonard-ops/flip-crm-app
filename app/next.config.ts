import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for desktop/server packaging.
  // Safe for website deployment — Vercel ignores this.
  output: process.env.DESKTOP_BUILD === "true" ? "standalone" : undefined,
};

export default nextConfig;
