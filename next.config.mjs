/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Use this repo as workspace root (avoids "multiple lockfiles" warning on Vercel)
  turbopack: {
    root: process.cwd(),
  },
}

export default nextConfig
