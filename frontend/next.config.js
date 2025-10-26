/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output for Vercel deployment
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', '*.vercel.app', '*.railway.app', '*.onrender.com']
    }
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
