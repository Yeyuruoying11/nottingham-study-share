"use client";

import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapCenterControllerProps {
  center: [number, number];
  zoom?: number;
}

export default function MapCenterController({ center, zoom = 10 }: MapCenterControllerProps) {
  const map = useMap();

  useEffect(() => {
    if (center && center[0] && center[1]) {
      // 使用动画移动到新位置
      map.flyTo(center, zoom, {
        duration: 1.5, // 动画持续时间（秒）
        easeLinearity: 0.25
      });
    }
  }, [map, center, zoom]);

  return null;
} 