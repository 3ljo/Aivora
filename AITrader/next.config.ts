import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "15mb" },
  },
  serverExternalPackages: ["yahoo-finance2"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      const existing = Array.isArray(config.externals) ? config.externals : [];
      config.externals = [...existing, "yahoo-finance2"];
    }
    return config;
  },
};

export default nextConfig;
