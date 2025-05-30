/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'guidin-db601.firebasestorage.app',
      }
    ],
  },
  // 暂时移除CSP配置，避免开发时的问题
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion']
  },
  webpack: (config, { isServer }) => {
    // 修复Firebase在服务端渲染的问题
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('firebase');
    }
    return config;
  }
}

module.exports = nextConfig 