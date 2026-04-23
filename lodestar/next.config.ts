import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
  devIndicators: false,
  serverExternalPackages: ["@mozilla/readability", "jsdom"],
};

export default nextConfig;
