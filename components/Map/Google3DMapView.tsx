"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { MapPin, Maximize2, Minimize2, RotateCw, X } from 'lucide-react';

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
    let rotationInterval: number | undefined;
    let mapInstance: google.maps.Map | null = null;
    let marker: any = null;
    let isComponentMounted = true;

    const initializeMap = async () => {
      if (!mapRef.current || !isComponentMounted) return;

      try {
        setIsLoading(true);
        setError(null);

        // 检查API密钥
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          console.warn('Google Maps API密钥未配置');
          throw new Error('Google Maps API密钥未配置，请在环境变量中设置NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
        }

        // 初始化 Google Maps Loader
        const loader = new Loader({
          apiKey: apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry', 'marker']
        });

        await loader.load();

        if (!isComponentMounted) return;

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

        if (!isComponentMounted) return;

        // 创建地图实例
        mapInstance = new google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: 18,
          mapTypeId: 'satellite',
          tilt: 45,
          heading: 0,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: false,
          zoomControl: true,
          rotateControl: true,
          mapId: 'DEMO_MAP_ID',
          mapTypeControlOptions: {
            mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
            position: google.maps.ControlPosition.TOP_LEFT
          }
        });

        // 使用新的AdvancedMarkerElement API（如果可用）
        try {
          const { AdvancedMarkerElement } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;
          
          const markerElement = document.createElement('div');
          markerElement.className = 'custom-marker';
          markerElement.style.cssText = `
            background: linear-gradient(135deg, #ef4444, #dc2626);
            border: 3px solid white;
            border-radius: 50%;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            cursor: pointer;
            transition: transform 0.2s ease;
          `;
          markerElement.innerHTML = '🏠';
          
          markerElement.addEventListener('mouseenter', () => {
            markerElement.style.transform = 'scale(1.1)';
          });
          
          markerElement.addEventListener('mouseleave', () => {
            markerElement.style.transform = 'scale(1)';
          });
          
          marker = new AdvancedMarkerElement({
            map: mapInstance,
            position: mapCenter,
            content: markerElement,
            title: address || '房屋位置'
          });

        } catch (advancedMarkerError) {
          console.warn('AdvancedMarkerElement 不可用，使用传统 Marker:', advancedMarkerError);
          
          marker = new google.maps.Marker({
            position: mapCenter,
            map: mapInstance,
            title: address || '房屋位置',
            animation: google.maps.Animation.DROP,
            icon: {
              url: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="36" height="36" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="18" cy="18" r="16" fill="#ef4444" stroke="#fff" stroke-width="3"/>
                  <text x="18" y="24" text-anchor="middle" fill="white" font-size="16">🏠</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(36, 36),
              anchor: new google.maps.Point(18, 18)
            }
          });
        }

        // 创建信息窗口
        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div class="p-3 max-w-xs">
              <h3 class="font-semibold text-gray-900 mb-2 flex items-center">
                <span class="mr-2">🏠</span>
                房屋位置
              </h3>
              <p class="text-sm text-gray-600 mb-2">${address || '选定位置'}</p>
              <div class="text-xs text-gray-500 space-y-1 bg-gray-50 p-2 rounded">
                <p><strong>经度:</strong> ${mapCenter.lat.toFixed(6)}</p>
                <p><strong>纬度:</strong> ${mapCenter.lng.toFixed(6)}</p>
              </div>
              <div class="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                💡 拖动地图查看不同角度，鼠标悬停自动旋转
              </div>
            </div>
          `
        });

        if (marker) {
          if (marker.addListener) {
            marker.addListener('click', () => {
              infoWindow.open(mapInstance, marker);
            });
          } else if (marker.addEventListener) {
            marker.addEventListener('click', () => {
              infoWindow.open(mapInstance);
            });
          }
        }

        if (!isComponentMounted) return;
        setMap(mapInstance);

        const startAutoRotation = () => {
          if (rotationInterval) clearInterval(rotationInterval);
          rotationInterval = window.setInterval(() => {
            if (mapInstance && isComponentMounted) {
              const heading = mapInstance.getHeading() || 0;
              mapInstance.setHeading(heading + 0.5);
            }
          }, 100);
        };

        const stopAutoRotation = () => {
          if (rotationInterval) {
            clearInterval(rotationInterval);
            rotationInterval = undefined;
          }
        };

        if (mapRef.current) {
          mapRef.current.addEventListener('mouseenter', startAutoRotation);
          mapRef.current.addEventListener('mouseleave', stopAutoRotation);
        }

      } catch (err) {
        console.error('地图初始化失败:', err);
        if (!isComponentMounted) return;
        
        let errorMessage = '地图加载失败';
        
        if (err instanceof Error) {
          if (err.message.includes('API密钥')) {
            errorMessage = err.message;
          } else if (err.message.includes('quota') || err.message.includes('billing')) {
            errorMessage = 'Google Maps API配额不足或计费未启用';
          } else if (err.message.includes('network')) {
            errorMessage = '网络连接失败，请检查网络连接';
          } else {
            errorMessage = `地图加载失败: ${err.message}`;
          }
        }
        
        setError(errorMessage);
      } finally {
        if (isComponentMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeMap();

    return () => {
      isComponentMounted = false;
      if (rotationInterval) {
        clearInterval(rotationInterval);
      }
      if (mapRef.current) {
        try {
          const mapElement = mapRef.current;
          const newMapElement = mapElement.cloneNode(true) as HTMLElement;
          if (mapElement.parentNode) {
            mapElement.parentNode.replaceChild(newMapElement, mapElement);
          }
        } catch (cleanupError) {
          console.warn('地图清理时出现错误:', cleanupError);
        }
      }
    };
  }, [address, latitude, longitude, onLocationFound]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

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

  const resetView = () => {
    if (!map) return;
    
    map.setTilt(45);
    map.setHeading(0);
    map.setZoom(18);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      <div 
        ref={mapRef} 
        className={`w-full ${isFullscreen ? 'h-full' : height} rounded-lg overflow-hidden`}
        style={{ minHeight: '300px' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">加载3D建筑视图中...</h3>
              <p className="text-sm text-gray-600">首次加载可能需要几秒钟</p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 p-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-red-600 mb-2">地图加载失败</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg text-left">
                <p className="mb-2 font-semibold">可能的解决方案：</p>
                <ul className="space-y-1">
                  <li>• 检查网络连接</li>
                  <li>• 确认Google Maps API密钥已正确配置</li>
                  <li>• 确认API密钥已启用相关服务</li>
                  <li>• 查看控制台是否有更多错误信息</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {!isLoading && !error && (
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button
            onClick={toggleFullscreen}
            className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg hover:bg-white hover:shadow-xl transition-all border border-gray-200"
            title={isFullscreen ? "退出全屏" : "全屏查看"}
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-gray-700" />
            ) : (
              <Maximize2 className="w-5 h-5 text-gray-700" />
            )}
          </button>

          <button
            onClick={resetView}
            className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg hover:bg-white hover:shadow-xl transition-all border border-gray-200"
            title="重置3D视角"
          >
            <RotateCw className="w-5 h-5 text-gray-700" />
          </button>

          <button
            onClick={toggleStreetView}
            className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg hover:bg-white hover:shadow-xl transition-all border border-gray-200"
            title={viewMode === '3d' ? "切换到街景" : "切换到3D视图"}
          >
            <span className="text-xs font-semibold text-gray-700">
              {viewMode === '3d' ? '街景' : '3D'}
            </span>
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-600 font-medium">
              🖱️ 拖动旋转视角 • 滚轮缩放 • 悬停自动旋转
            </p>
          </div>
        </div>
      )}

      {isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-6 left-6 bg-black/70 text-white p-3 rounded-full hover:bg-black/90 transition-all shadow-lg"
          title="退出全屏"
        >
          <X className="w-6 h-6" />
        </button>
      )}
    </div>
  );
} 