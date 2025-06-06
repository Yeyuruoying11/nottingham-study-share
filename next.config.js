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
  },
  // 添加安全头部配置
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com *.google.com *.googletagmanager.com *.youtube.com;
              style-src 'self' 'unsafe-inline' fonts.googleapis.com;
              img-src 'self' data: blob: https:;
              font-src 'self' fonts.gstatic.com;
              connect-src 'self' *.googleapis.com *.firebaseio.com *.cloudfunctions.net *.google-analytics.com *.analytics.google.com *.googletagmanager.com nominatim.openstreetmap.org wss:;
              frame-src 'self' *.google.com maps.google.com www.google.com https://www.google.com/maps/embed maps.googleapis.com *.maps.google.com *.youtube.com www.youtube.com youtube.com youtu.be;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\s+/g, ' ').trim()
          },
          {
            key: 'Permissions-Policy',
            value: 'accelerometer=(self "https://*.google.com" "https://maps.google.com" "https://www.google.com" "https://*.youtube.com" "https://www.youtube.com"), camera=(self "https://*.google.com" "https://*.youtube.com"), geolocation=(self "https://*.google.com" "https://maps.google.com" "https://www.google.com"), gyroscope=(self "https://*.google.com" "https://maps.google.com" "https://www.google.com" "https://*.youtube.com" "https://www.youtube.com"), magnetometer=(self "https://*.google.com" "https://maps.google.com" "https://www.google.com"), microphone=(self "https://*.google.com" "https://*.youtube.com"), payment=(), usb=(), picture-in-picture=(self "https://*.youtube.com" "https://www.youtube.com"), encrypted-media=(self "https://*.youtube.com" "https://www.youtube.com"), web-share=(self "https://*.youtube.com" "https://www.youtube.com")'
          }
        ]
      }
    ];
  }
}

module.exports = nextConfig 