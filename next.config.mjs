/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
        pathname: "/**",
      },
      {
        protocol: "http",
        hostname: "**",
        pathname: "/**",
      },
    ],
  },
  output: "standalone",
  async redirects() {
    return [
      // "Shopify Prerelease" was renamed to "Shopify Deprecated" and moved. Keep old bookmarks,
      // home-screen links, and any custom-app App URL pointing at the old path working.
      {
        source: "/integrations/shopify-prerelease",
        destination: "/integrations/shopify-deprecated",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;