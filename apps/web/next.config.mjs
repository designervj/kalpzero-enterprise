/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  transpilePackages: ["@kalpzero/contracts", "@kalpzero/ui"]
};

export default nextConfig;
