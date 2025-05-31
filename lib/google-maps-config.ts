// Google Maps API 配置
// 这个 API 密钥仅用于开发和演示目的
// 在生产环境中，请使用您自己的 API 密钥
export const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

// 检查是否配置了 API 密钥
export const hasGoogleMapsApiKey = () => {
  return GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY !== '';
}; 