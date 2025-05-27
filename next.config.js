/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com', 
      'via.placeholder.com',
      'firebasestorage.googleapis.com',
      'guidin-db601.firebasestorage.app'
    ],
  },
  // 暂时移除CSP配置，避免开发时的问题
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion']
  }
}

module.exports = nextConfig 