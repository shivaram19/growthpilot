/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@growthpilot/database", "@growthpilot/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.shopify.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
