"use client";

import { useMapEvents } from 'react-leaflet';
import { Location } from '@/lib/types';

interface MapClickHandlerProps {
  onLocationSelect: (location: Location) => void;
}

// 地图点击处理组件
export default function MapClickHandler({ onLocationSelect }: MapClickHandlerProps) {
  const map = useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      try {
        // 使用反向地理编码获取地址信息
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1&accept-language=zh-CN,zh,en`
        );
        const data = await response.json();
        
        const location: Location = {
          latitude: lat,
          longitude: lng,
          address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          country: data.address?.country || '',
          city: data.address?.city || data.address?.town || data.address?.village || '',
          placeId: data.place_id?.toString()
        };
        
        onLocationSelect(location);
      } catch (error) {
        console.error('获取地址信息失败:', error);
        // 如果获取地址失败，使用坐标
        const location: Location = {
          latitude: lat,
          longitude: lng,
          address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
        };
        onLocationSelect(location);
      }
    },
  });

  return null;
} 