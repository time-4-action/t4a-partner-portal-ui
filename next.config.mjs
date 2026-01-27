/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "imgs.pnvnet.si",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "www.patrikinternational.com",
        pathname: "/assets/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  output: "standalone",
};

export default nextConfig;
