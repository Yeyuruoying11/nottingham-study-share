"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Location } from '@/lib/types';
import { MapPin, Search, X, Maximize2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Toast from '@/components/ui/Toast';

// 修复Leaflet图标路径问题
const fixLeafletIcons = () => {
  if (typeof window !== 'undefined') {
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });
    });
  }
};

interface FullscreenLocationPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: Location | null) => void;
  initialLocation?: Location;
}

// 自定义地图组件，使用 ref 管理生命周期
const CustomLeafletMap = React.memo(({ 
  center, 
  selectedLocation, 
  onLocationSelect 
}: {
  center: [number, number];
  selectedLocation: Location | null;
  onLocationSelect: (location: Location) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // 确保之前的地图实例被清理
    if (mapInstanceRef.current) {
      try {
        mapInstanceRef.current.remove();
      } catch (error) {
        console.warn('清理地图实例时出现警告:', error);
      }
      mapInstanceRef.current = null;
    }

    // 异步加载 Leaflet 并创建地图
    const initializeMap = async () => {
      try {
        const L = await import('leaflet');
        
        // 清空容器
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
        }

        // 创建新的地图实例
        const map = L.map(mapRef.current!, {
          center: center,
          zoom: selectedLocation ? 12 : 6,
          zoomControl: false,
          attributionControl: true,
        });

        // 添加瓦片层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        // 添加点击事件 - 使用反向地理编码获取地名
        map.on('click', async (e: any) => {
          const { lat, lng } = e.latlng;
          
          // 先立即显示坐标，然后异步获取地名
          const tempLocation: Location = {
            latitude: lat,
            longitude: lng,
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
            country: '',
            city: ''
          };
          onLocationSelect(tempLocation);
          
          try {
            // 使用反向地理编码获取地址信息
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`
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
            // 如果获取地址失败，保持坐标
          }
        });

        mapInstanceRef.current = map;

        // 如果有选中的位置，添加标记
        if (selectedLocation) {
          markerRef.current = L.marker([selectedLocation.latitude, selectedLocation.longitude]).addTo(map);
        }

      } catch (error) {
        console.error('地图初始化失败:', error);
      }
    };

    // 延迟初始化以避免竞态条件
    const timer = setTimeout(initializeMap, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (error) {
          console.warn('清理地图实例时出现警告:', error);
        }
        mapInstanceRef.current = null;
      }
    };
  }, [center, onLocationSelect]);

  // 更新标记位置
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const L = import('leaflet');
    L.then((LeafletModule) => {
      // 清除旧标记
      if (markerRef.current) {
        mapInstanceRef.current.removeLayer(markerRef.current);
        markerRef.current = null;
      }

      // 添加新标记
      if (selectedLocation) {
        markerRef.current = LeafletModule.marker([selectedLocation.latitude, selectedLocation.longitude])
          .addTo(mapInstanceRef.current);
        
        // 移动地图中心到新位置
        mapInstanceRef.current.setView([selectedLocation.latitude, selectedLocation.longitude], 12);
      }
    });
  }, [selectedLocation]);

  return <div ref={mapRef} className="h-full w-full" />;
});

CustomLeafletMap.displayName = 'CustomLeafletMap';

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
  const [isSelecting, setIsSelecting] = useState(false);
  const [showMapHint, setShowMapHint] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // 修复Leaflet图标路径
      fixLeafletIcons();
      
      // 延迟初始化地图
      const timer = setTimeout(() => {
      setMapReady(true);
      if (initialLocation) {
        setSelectedLocation(initialLocation);
        setMapCenter([initialLocation.latitude, initialLocation.longitude]);
      }
      }, 200);
      
      return () => clearTimeout(timer);
    } else {
      setMapReady(false);
      setSelectedLocation(null);
      setSearchQuery("");
      setShowMapHint(true);
    }
  }, [isOpen, initialLocation]);

  const showToast = (message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  };

  const handleLocationSelect = useCallback((location: Location) => {
    setSelectedLocation(location);
    setShowMapHint(false);
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
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
    if (isSelecting) return;
    setIsSelecting(true);

    const location: Location = {
      latitude: destination.lat,
      longitude: destination.lng,
      address: `${destination.name}, ${destination.country}`,
      country: destination.country,
      city: destination.name
    };
    
    handleLocationSelect(location);
    setMapCenter([destination.lat, destination.lng]);
    
    setTimeout(() => {
      showToast(`📍 已选择${destination.name}，${destination.country}`);
      setIsSelecting(false);
    }, 300);
  };

  const handleClose = () => {
    onClose();
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
                <CustomLeafletMap
                  center={mapCenter}
                  selectedLocation={selectedLocation}
                  onLocationSelect={handleLocationSelect}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-100">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">加载地图中...</p>
                  </div>
                </div>
              )}
              
              {showMapHint && (
                <div className="absolute top-4 left-4 bg-white p-3 rounded-xl shadow-md text-sm text-gray-600 z-[1000] border border-gray-200 backdrop-blur-sm bg-white/95">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-green-600" />
                    <span>💡 点击地图上的任意位置来选择旅行地点</span>
                  </div>
                </div>
              )}
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