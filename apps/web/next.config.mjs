/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui", "@workspace/auth", "@workspace/db", "@workspace/api", "@workspace/template-engine"],
}

export default nextConfig
