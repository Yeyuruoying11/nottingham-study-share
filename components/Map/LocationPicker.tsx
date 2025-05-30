"use client";

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Location } from '@/lib/types';
import { MapPin, Search, X, Maximize2 } from 'lucide-react';
import FullscreenLocationPicker from './FullscreenLocationPicker';
import Toast from '@/components/ui/Toast';

// 动态导入地图组件
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);

// 动态导入MapCenterController
const MapCenterController = dynamic(
  () => import('./MapCenterController'),
  { ssr: false }
);

interface LocationPickerProps {
  onLocationSelect: (location: Location | null) => void;
  initialLocation?: Location;
  className?: string;
}

// 地图点击处理组件 - 使用动态导入包装
const MapClickHandler = dynamic(
  () => import('./MapClickHandler'),
  { ssr: false }
);

// 常用旅行目的地
const popularDestinations = [
  { name: "伦敦", country: "英国", lat: 51.5074, lng: -0.1278 },
  { name: "巴黎", country: "法国", lat: 48.8566, lng: 2.3522 },
  { name: "罗马", country: "意大利", lat: 41.9028, lng: 12.4964 },
  { name: "巴塞罗那", country: "西班牙", lat: 41.3851, lng: 2.1734 },
  { name: "阿姆斯特丹", country: "荷兰", lat: 52.3676, lng: 4.9041 },
  { name: "布拉格", country: "捷克", lat: 50.0755, lng: 14.4378 },
  { name: "维也纳", country: "奥地利", lat: 48.2082, lng: 16.3738 },
  { name: "苏黎世", country: "瑞士", lat: 47.3769, lng: 8.5417 },
];

export default function LocationPicker({ onLocationSelect, initialLocation, className = "" }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([54.9783, -1.9540]); // 诺丁汉
  const [showFullscreenPicker, setShowFullscreenPicker] = useState(false); // 新增：控制全屏地图显示
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSelecting, setIsSelecting] = useState(false); // 防重复触发
  const [showMapHint, setShowMapHint] = useState(true); // 控制地图提示显示
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`); // 新增：地图key来强制重新渲染

  useEffect(() => {
    setMapReady(true);
    
    // 清理函数 - 组件卸载时执行
    return () => {
      setMapReady(false);
      // 清理任何可能的地图实例
      console.log('LocationPicker component unmounting, cleaning up...');
    };
  }, []);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setMapCenter([initialLocation.latitude, initialLocation.longitude]);
      // 强制重新渲染地图以避免初始化错误
      setMapKey(`map-${Date.now()}`);
    }
  }, [initialLocation]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
    setShowMapHint(false); // 用户点击地图后隐藏提示
  }, [onLocationSelect]);

  // 新增：处理全屏地图选择
  const handleFullscreenLocationSelect = useCallback((location: Location | null) => {
    if (location) {
      setSelectedLocation(location);
      // 移除自动居中，避免地图闪烁
      onLocationSelect(location);
    }
  }, [onLocationSelect]);

  const clearLocation = () => {
    setSelectedLocation(null);
    onLocationSelect(null);
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const location: Location = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          address: result.display_name,
          country: result.address?.country || '',
          city: result.address?.city || result.address?.town || result.address?.village || '',
          placeId: result.place_id?.toString()
        };
        
        handleLocationSelect(location);
        // 搜索时也移动地图中心
        setMapCenter([location.latitude, location.longitude]);
      } else {
        showToast('未找到位置，请尝试其他搜索词');
      }
    } catch (error) {
      console.error('搜索位置失败:', error);
      showToast('搜索失败，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  const selectPopularDestination = (destination: any) => {
    // 防止重复触发
    if (isSelecting) return;
    setIsSelecting(true);

    const location: Location = {
      latitude: destination.lat,
      longitude: destination.lng,
      address: `${destination.name}, ${destination.country}`,
      country: destination.country,
      city: destination.name
    };
    
    // 设置位置并移动地图中心
    handleLocationSelect(location);
    setMapCenter([destination.lat, destination.lng]);
    
    // 添加提示信息
    setTimeout(() => {
      showToast(`📍 已选择${destination.name}，${destination.country}`);
      setIsSelecting(false); // 重置防重复标识
    }, 300);
  };

  if (!mapReady) {
    return (
      <div className={`bg-gray-100 rounded-xl p-6 ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-gray-600 mt-2">加载地图中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-white rounded-xl border border-gray-200 overflow-hidden ${className}`}>
        {/* 搜索栏和扩大按钮 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                placeholder="搜索地点，如：巴黎、东京..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={searchLocation}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? '搜索中...' : '搜索'}</span>
            </button>
            {/* 新增：扩大地图按钮 */}
            <button
              type="button"
              onClick={() => setShowFullscreenPicker(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
              title="在大地图中选择位置"
            >
              <Maximize2 className="w-4 h-4" />
              <span className="hidden sm:inline">扩大地图</span>
            </button>
          </div>

          {/* 当前选中的位置 */}
          {selectedLocation && (
            <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-800">{selectedLocation.address}</span>
              </div>
              <button
                type="button"
                onClick={clearLocation}
                className="text-green-600 hover:text-green-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* 热门目的地 */}
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700 mb-2">热门目的地</h3>
          <div className="flex flex-wrap gap-2">
            {popularDestinations.map((destination, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selectPopularDestination(destination)}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {destination.name}
              </button>
            ))}
          </div>
        </div>

        {/* 地图 */}
        <div className="h-64 relative">
          {mapReady ? (
            <div key={mapKey} className="h-full w-full">
              <MapContainer
                center={mapCenter}
                zoom={selectedLocation ? 10 : 6}
                style={{ height: '100%', width: '100%' }}
                className="z-0"
                whenCreated={(mapInstance) => {
                  // 确保地图实例正确创建
                  console.log('Map created successfully');
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* 添加地图中心控制器 */}
                <MapCenterController center={mapCenter} zoom={selectedLocation ? 12 : 10} />
                
                <MapClickHandler onLocationSelect={handleLocationSelect} />
                
                {selectedLocation && (
                  <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
                )}
              </MapContainer>
            </div>
          ) : (
            <div className="h-full w-full bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                <p className="text-gray-600 mt-2 text-sm">地图加载中...</p>
              </div>
            </div>
          )}
          
          {showMapHint && mapReady && (
            <div className="absolute top-2 left-2 bg-white p-2 rounded-lg shadow-md text-xs text-gray-600 z-[1000] border border-gray-200 backdrop-blur-sm bg-white/95">
              <div className="flex items-center space-x-1">
                <span>💡</span>
                <span>点击地图选择位置，或使用右上角"扩大地图"按钮</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 全屏地图选择器 */}
      <FullscreenLocationPicker
        isOpen={showFullscreenPicker}
        onClose={() => setShowFullscreenPicker(false)}
        onLocationSelect={handleFullscreenLocationSelect}
        initialLocation={selectedLocation || undefined}
      />
      
      {/* Toast 提示 */}
      <Toast
        message={toastMessage}
        isVisible={toastVisible}
        onClose={() => setToastVisible(false)}
        duration={2500}
      />
    </>
  );
} 