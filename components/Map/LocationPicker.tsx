"use client";

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Location } from '@/lib/types';
import { MapPin, Search, X, Maximize2 } from 'lucide-react';
import FullscreenLocationPicker from './FullscreenLocationPicker';

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

  useEffect(() => {
    setMapReady(true);
  }, []);

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setMapCenter([initialLocation.latitude, initialLocation.longitude]);
    }
  }, [initialLocation]);

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
    onLocationSelect(location);
  }, [onLocationSelect]);

  // 新增：处理全屏地图选择
  const handleFullscreenLocationSelect = useCallback((location: Location | null) => {
    if (location) {
      setSelectedLocation(location);
      setMapCenter([location.latitude, location.longitude]);
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
        setMapCenter([location.latitude, location.longitude]);
      } else {
        alert('Location not found, please try other search terms');
      }
    } catch (error) {
      console.error('Search location failed:', error);
      alert('Search failed, please try again later');
    } finally {
      setIsSearching(false);
    }
  };

  const selectPopularDestination = (destination: any) => {
    const location: Location = {
      latitude: destination.lat,
      longitude: destination.lng,
      address: `${destination.name}, ${destination.country}`,
      country: destination.country,
      city: destination.name
    };
    
    // 先设置位置
    handleLocationSelect(location);
    
    // 设置地图中心，使用适合城市查看的缩放级别
    setMapCenter([destination.lat, destination.lng]);
    
    // 添加提示信息
    setTimeout(() => {
      alert(`📍 图标已移动到${destination.name}，${destination.country}`);
    }, 300); // 延迟300ms让地图先移动
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
              onClick={searchLocation}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Search className="w-4 h-4" />
              <span>{isSearching ? '搜索中...' : '搜索'}</span>
            </button>
            {/* 新增：扩大地图按钮 */}
            <button
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
          <MapContainer
            key={mapCenter.join(',')}
            center={mapCenter}
            zoom={selectedLocation ? 10 : 6}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            <MapClickHandler onLocationSelect={handleLocationSelect} />
            
            {selectedLocation && (
              <Marker position={[selectedLocation.latitude, selectedLocation.longitude]} />
            )}
          </MapContainer>
          
          <div className="absolute top-2 left-2 bg-white p-2 rounded-lg shadow-sm text-xs text-gray-600 z-10">
            💡 点击地图选择位置，或使用右上角"扩大地图"按钮
          </div>
        </div>
      </div>

      {/* 全屏地图选择器 */}
      <FullscreenLocationPicker
        isOpen={showFullscreenPicker}
        onClose={() => setShowFullscreenPicker(false)}
        onLocationSelect={handleFullscreenLocationSelect}
        initialLocation={selectedLocation || undefined}
      />
    </>
  );
} 