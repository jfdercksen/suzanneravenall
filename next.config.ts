import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Add allowed external image domains here:
      // { protocol: "https", hostname: "example.com" },
    ],
  },
};

export default nextConfig;
