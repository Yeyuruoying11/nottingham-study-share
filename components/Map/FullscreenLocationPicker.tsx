"use client";

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Location } from '@/lib/types';
import { MapPin, Search, X, Maximize2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface FullscreenLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: Location | null) => void;
  initialLocation?: Location;
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
  { name: "慕尼黑", country: "德国", lat: 48.1351, lng: 11.5820 },
  { name: "布鲁塞尔", country: "比利时", lat: 50.8503, lng: 4.3517 },
  { name: "爱丁堡", country: "苏格兰", lat: 55.9533, lng: -3.1883 },
  { name: "都柏林", country: "爱尔兰", lat: 53.3498, lng: -6.2603 },
];

export default function FullscreenLocationPicker({ 
  isOpen, 
  onClose, 
  onLocationSelect, 
  initialLocation 
}: FullscreenLocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(initialLocation || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([54.9783, -1.9540]); // 诺丁汉
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isSelecting, setIsSelecting] = useState(false); // 防重复触发

  useEffect(() => {
    if (isOpen) {
      setMapReady(true);
      // 如果有初始位置，设置地图中心
      if (initialLocation) {
        setSelectedLocation(initialLocation);
        setMapCenter([initialLocation.latitude, initialLocation.longitude]);
      }
    }
  }, [isOpen, initialLocation]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
  }, []);

  const confirmSelection = () => {
    onLocationSelect(selectedLocation);
    onClose();
  };

  const clearLocation = () => {
    setSelectedLocation(null);
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
    
    // 先设置位置
    handleLocationSelect(location);
    
    // 设置地图中心，使用适合城市查看的缩放级别
    setMapCenter([destination.lat, destination.lng]);
    
    // 添加提示信息
    setTimeout(() => {
      showToast(`📍 图标已移动到${destination.name}，${destination.country}`);
      setIsSelecting(false); // 重置防重复标识
    }, 300); // 延迟300ms让地图先移动
  };

  const handleClose = () => {
    onClose();
    setMapReady(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between p-6 border-b bg-white">
              <div className="flex items-center space-x-3">
                <Maximize2 className="w-6 h-6 text-green-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">选择旅行地点</h2>
                  <p className="text-sm text-gray-600">在大地图上精确选择你的旅行位置</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* 搜索和控制区域 */}
            <div className="p-6 border-b bg-gray-50">
              {/* 搜索栏 */}
              <div className="flex items-center space-x-4 mb-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                    placeholder="搜索地点，如：巴黎、东京、巴塞罗那..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-lg"
                  />
                </div>
                <button
                  type="button"
                  onClick={searchLocation}
                  disabled={isSearching || !searchQuery.trim()}
                  className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Search className="w-5 h-5" />
                  <span>{isSearching ? '搜索中...' : '搜索'}</span>
                </button>
              </div>

              {/* 当前选中的位置 */}
              {selectedLocation && (
                <div className="flex items-center justify-between bg-green-50 p-4 rounded-xl mb-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">{selectedLocation.address}</p>
                      <p className="text-sm text-green-600">
                        坐标: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={clearLocation}
                    className="text-green-600 hover:text-green-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* 热门目的地 */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">🔥 热门旅行目的地</h3>
                <div className="flex flex-wrap gap-2">
                  {popularDestinations.map((destination, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => selectPopularDestination(destination)}
                      className="px-3 py-2 text-sm bg-white text-gray-700 rounded-full hover:bg-gray-100 border border-gray-200 transition-colors flex items-center space-x-1"
                    >
                      <span>{destination.name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-500">{destination.country}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 地图区域 */}
            <div className="flex-1 relative">
              {mapReady ? (
                <MapContainer
                  key={mapCenter.join(',')}
                  center={mapCenter}
                  zoom={selectedLocation ? 12 : 6}
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
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">加载地图中...</p>
                  </div>
                </div>
              )}
              
              <div className="absolute top-4 left-4 bg-white p-3 rounded-xl shadow-sm text-sm text-gray-600 z-10 border">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-green-600" />
                  <span>💡 点击地图上的任意位置来选择旅行地点</span>
                </div>
              </div>
            </div>

            {/* 底部操作区域 */}
            <div className="p-6 border-t bg-white flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedLocation ? '已选择位置，点击确认使用' : '请在地图上选择一个位置'}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={confirmSelection}
                  disabled={!selectedLocation}
                  className="px-8 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
                >
                  <Check className="w-5 h-5" />
                  <span>确认选择</span>
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
      
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