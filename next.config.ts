import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    "10.0.1.167",
    "172.20.10.2",
    "127.0.0.1",
    "roster-wearing-gig-mistakes.trycloudflare.com",
  ],
  turbopack: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.next/**",
          "**/desktop.ini",
        ],
      };
    }
    return config;
  },
};

export default nextConfig;
