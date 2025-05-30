"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Maximize2, Minimize2, RotateCw } from 'lucide-react';

interface Google3DMapViewProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  height?: string;
  onLocationFound?: (lat: number, lng: number) => void;
}

export default function Google3DMapView({ 
  address, 
  latitude, 
  longitude, 
  height = 'h-96',
  onLocationFound 
}: Google3DMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<'3d' | 'street'>('3d');

  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) return;

      try {
        setIsLoading(true);
        setError(null);

        // 初始化 Google Maps Loader
        const loader = new Loader({
          apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
          libraries: ['places', 'geometry']
        });

        await loader.load();

        let mapCenter: google.maps.LatLngLiteral;

        // 如果提供了经纬度，直接使用
        if (latitude && longitude) {
          mapCenter = { lat: latitude, lng: longitude };
        } 
        // 如果提供了地址，使用地理编码
        else if (address) {
          const geocoder = new google.maps.Geocoder();
          const response = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
            geocoder.geocode({ address }, (results, status) => {
              if (status === 'OK' && results) {
                resolve(results);
              } else {
                reject(new Error(`地理编码失败: ${status}`));
              }
            });
          });

          const location = response[0].geometry.location;
          mapCenter = { lat: location.lat(), lng: location.lng() };
          onLocationFound?.(location.lat(), location.lng());
        } else {
          throw new Error('请提供地址或经纬度');
        }

        // 创建地图实例
        const mapInstance = new google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: 18,
          mapTypeId: 'satellite',
          tilt: 45, // 倾斜角度，实现3D效果
          heading: 0, // 方向
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: false, // 我们自定义全屏控制
          zoomControl: true,
          rotateControl: true,
          // 启用3D建筑
          mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
            position: google.maps.ControlPosition.TOP_LEFT
          }
        });

        // 添加标记
        const marker = new google.maps.Marker({
          position: mapCenter,
          map: mapInstance,
          title: address || '位置',
          animation: google.maps.Animation.DROP
        });

        // 创建信息窗口
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-2">
              <h3 class="font-semibold text-gray-900">${address || '选定位置'}</h3>
              <p class="text-sm text-gray-600 mt-1">经度: ${mapCenter.lat.toFixed(6)}</p>
              <p class="text-sm text-gray-600">纬度: ${mapCenter.lng.toFixed(6)}</p>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstance, marker);
        });

        setMap(mapInstance);

        // 自动旋转功能
        let rotationInterval: number | undefined;
        const startAutoRotation = () => {
          rotationInterval = window.setInterval(() => {
            const heading = mapInstance.getHeading() || 0;
            mapInstance.setHeading(heading + 1);
          }, 50);
        };

        // 停止自动旋转
        const stopAutoRotation = () => {
          if (rotationInterval) {
            clearInterval(rotationInterval);
          }
        };

        // 鼠标悬停时开始旋转，移开时停止
        mapRef.current.addEventListener('mouseenter', startAutoRotation);
        mapRef.current.addEventListener('mouseleave', stopAutoRotation);

        // 清理函数
        return () => {
          stopAutoRotation();
          if (mapRef.current) {
            mapRef.current.removeEventListener('mouseenter', startAutoRotation);
            mapRef.current.removeEventListener('mouseleave', stopAutoRotation);
          }
        };

      } catch (err) {
        console.error('地图初始化失败:', err);
        setError(err instanceof Error ? err.message : '地图加载失败');
      } finally {
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [address, latitude, longitude, onLocationFound]);

  // 切换全屏
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 切换到街景视图
  const toggleStreetView = () => {
    if (!map) return;

    const panorama = map.getStreetView();
    const mapCenter = map.getCenter();
    
    if (mapCenter) {
      panorama.setPosition(mapCenter);
      panorama.setPov({
        heading: 0,
        pitch: 0
      });
      panorama.setVisible(viewMode === '3d');
      setViewMode(viewMode === '3d' ? 'street' : '3d');
    }
  };

  // 重置视角
  const resetView = () => {
    if (!map) return;
    
    map.setTilt(45);
    map.setHeading(0);
    map.setZoom(18);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* 地图容器 */}
      <div 
        ref={mapRef} 
        className={`w-full ${isFullscreen ? 'h-full' : height} rounded-lg overflow-hidden`}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">加载3D地图中...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center text-red-600">
              <MapPin className="w-8 h-8 mx-auto mb-2" />
              <p>{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* 控制按钮 */}
      {!isLoading && !error && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          {/* 全屏按钮 */}
          <button
            onClick={toggleFullscreen}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
            title={isFullscreen ? "退出全屏" : "全屏查看"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-gray-700" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-700" />
            )}
          </button>

          {/* 重置视角按钮 */}
          <button
            onClick={resetView}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
            title="重置视角"
          >
            <RotateCw className="w-5 h-5 text-gray-700" />
          </button>

          {/* 街景切换按钮 */}
          <button
            onClick={toggleStreetView}
            className="bg-white p-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
            title={viewMode === '3d' ? "切换到街景" : "切换到3D视图"}
          >
            <span className="text-xs font-medium text-gray-700">
              {viewMode === '3d' ? '街景' : '3D'}
            </span>
          </button>
        </div>
      )}

      {/* 提示信息 */}
      {!isLoading && !error && (
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
          <p className="text-xs text-gray-600">
            🖱️ 拖动旋转视角 | 滚轮缩放 | 悬停自动旋转
          </p>
        </div>
      )}
    </div>
  );
} 