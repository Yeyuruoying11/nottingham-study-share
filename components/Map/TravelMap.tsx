"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Post, Location } from '@/lib/types';
import { getPostsByCategoryFromFirestore, type FirestorePost } from '@/lib/firestore-posts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Search, X, Maximize2, Minimize2 } from 'lucide-react';

// 修复Leaflet图标路径问题
const fixLeafletIcons = () => {
  if (typeof window !== 'undefined') {
    // 动态导入Leaflet并修复图标路径
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

// 动态导入地图组件，避免SSR问题
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

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
);

interface TravelMapProps {
  className?: string;
  onPostSelect?: (post: FirestorePost) => void;
  selectedPostId?: string;
}

// 旅行地图组件
const TravelLeafletMap = React.memo(({ 
  travelPosts, 
  onPostClick,
  searchLocation,
  onMapReady
}: {
  travelPosts: FirestorePost[];
  onPostClick: (postId: string) => void;
  searchLocation?: { lat: number; lng: number; name: string } | null;
  onMapReady?: (map: any) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const searchMarkerRef = useRef<any>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // 处理搜索位置变化 - 独立的 effect，不会重建地图
  useEffect(() => {
    if (!mapInstanceRef.current || !searchLocation) return;

    const updateSearchMarker = async () => {
      try {
        const L = await import('leaflet');
        
        console.log('搜索位置跳转:', searchLocation);
        
        // 移除之前的搜索标记
        if (searchMarkerRef.current) {
          mapInstanceRef.current.removeLayer(searchMarkerRef.current);
          searchMarkerRef.current = null;
        }

        // 创建自定义图标
        const searchIcon = L.divIcon({
          html: `
            <div class="relative">
              <div class="absolute -top-10 -left-10 w-20 h-20 bg-blue-500 bg-opacity-20 rounded-full animate-ping"></div>
              <div class="absolute -top-6 -left-6 w-12 h-12 bg-blue-500 bg-opacity-30 rounded-full animate-pulse"></div>
              <svg class="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          `,
          className: 'custom-search-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        // 跳转视角
        console.log('执行地图跳转到:', [searchLocation.lat, searchLocation.lng]);
        mapInstanceRef.current.flyTo([searchLocation.lat, searchLocation.lng], 10, {
          duration: 1.5,
          easeLinearity: 0.5
        });

        // 添加搜索标记
        const searchMarker = L.marker([searchLocation.lat, searchLocation.lng], { icon: searchIcon })
          .addTo(mapInstanceRef.current)
          .bindPopup(`
            <div class="p-3">
              <h3 class="font-bold text-sm mb-1">搜索位置</h3>
              <p class="text-xs text-gray-600">${searchLocation.name}</p>
            </div>
          `);

        // 延迟打开弹窗
        setTimeout(() => {
          if (searchMarker && mapInstanceRef.current.hasLayer(searchMarker)) {
            searchMarker.openPopup();
          }
        }, 1600);

        searchMarkerRef.current = searchMarker;

      } catch (error) {
        console.error('更新搜索标记失败:', error);
      }
    };

    // 在地图初始化后，如果已经有搜索位置，立即更新
    if (searchLocation) {
      // 使用微任务队列确保地图完全就绪
      Promise.resolve().then(() => {
        updateSearchMarker();
      });
    }
  }, [searchLocation]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // 清理之前的地图实例
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

        // 创建新的地图实例，显示世界地图全景
        const map = L.map(mapRef.current!, {
          center: [20, 0], // 世界中心
          zoom: 2, // 缩放级别调整为显示世界地图
          minZoom: 2, // 最小缩放级别
          maxZoom: 18, // 最大缩放级别
          zoomControl: false,
          attributionControl: true,
          worldCopyJump: true, // 允许世界地图复制
        });

        // 添加瓦片层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          noWrap: false // 允许地图水平环绕
        }).addTo(map);

        mapInstanceRef.current = map;
        
        // 通知父组件地图已准备好
        if (onMapReady) {
          onMapReady(map);
        }

        // 存储已经使用的位置，用于检测冲突
        const usedPositions = new Map<string, number>();
        
        // 计算偏移后的坐标
        const getOffsetPosition = (lat: number, lng: number): [number, number] => {
          const key = `${lat.toFixed(6)},${lng.toFixed(6)}`;
          const count = usedPositions.get(key) || 0;
          usedPositions.set(key, count + 1);
          
          if (count === 0) {
            // 第一个帖子使用原始坐标
            return [lat, lng];
          }
          
          // 使用螺旋形偏移算法
          const offsetDistance = 0.0008 * Math.ceil(count / 8); // 约100米的初始偏移
          const angle = (count - 1) * (Math.PI / 4); // 每45度放置一个
          
          const offsetLat = lat + offsetDistance * Math.sin(angle);
          const offsetLng = lng + offsetDistance * Math.cos(angle);
          
          console.log(`位置冲突检测: ${key} 已有 ${count} 个标记，新标记偏移到 [${offsetLat.toFixed(6)}, ${offsetLng.toFixed(6)}]`);
          
          return [offsetLat, offsetLng];
        };

        // 添加旅行帖子标记
        const markers: any[] = [];
        travelPosts.forEach((post) => {
          if (post.location && post.id) {
            // 调试日志
            console.log('创建标记，帖子数据:', {
              id: post.id,
              title: post.title,
              image: post.image,
              content: post.content,
              location: post.location
            });
            
            // 获取可能偏移后的坐标
            const [adjustedLat, adjustedLng] = getOffsetPosition(
              post.location.latitude, 
              post.location.longitude
            );
            
            const marker = L.marker([adjustedLat, adjustedLng])
              .addTo(map);
            
            // 自定义弹出窗口内容
            const popupContent = `
              <div class="p-3 min-w-[250px]">
                ${post.image ? `
                  <img src="${post.image}" alt="${post.title}" class="w-full h-32 object-cover rounded-lg mb-3">
                ` : ''}
                <h3 class="font-bold text-base mb-2">${post.title}</h3>
                <p class="text-sm text-gray-600 mb-2 line-clamp-2">${post.content || '暂无简介'}</p>
                <div class="flex items-center text-xs text-gray-500 mb-3">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <span>${post.location.address}</span>
                </div>
                <button 
                  id="view-detail-${post.id}"
                  class="w-full px-4 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                >
                  查看详情
                </button>
              </div>
            `;
            
            marker.bindPopup(popupContent, {
              maxWidth: 300,
              className: 'custom-popup'
            });
            
            // 监听弹出窗口打开事件
            marker.on('popupopen', () => {
              // 延迟添加事件监听器，确保DOM已经渲染
              setTimeout(() => {
                const button = document.getElementById(`view-detail-${post.id}`);
                if (button) {
                  button.addEventListener('click', () => {
                    onPostClick(post.id!);
                  });
                }
              }, 100);
            });
            
            markers.push(marker);
          }
        });

        markersRef.current = markers;

        // 不再自动调整视图以适应所有标记，保持世界地图视图

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
  }, [travelPosts, onPostClick]);

  return (
    <>
      <div ref={mapRef} className="h-full w-full" />
      <style jsx global>{`
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .custom-popup .leaflet-popup-tip {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .line-clamp-2 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .custom-search-marker {
          background: transparent !important;
          border: none !important;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes pulse {
          50% {
            opacity: .5;
          }
        }
        .animate-ping {
          animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </>
  );
}, (prevProps, nextProps) => {
  const postsEqual = prevProps.travelPosts === nextProps.travelPosts;
  const searchEqual = JSON.stringify(prevProps.searchLocation) === JSON.stringify(nextProps.searchLocation);
  return postsEqual && searchEqual; // ignore callback compare to avoid false positives
});

TravelLeafletMap.displayName = 'TravelLeafletMap';

export default function TravelMap({ 
  className = "", 
  onPostSelect,
  selectedPostId 
}: TravelMapProps) {
  const router = useRouter();
  const [travelPosts, setTravelPosts] = useState<FirestorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapInstanceRef = useRef<any>(null);

  // 保存地图实例
  const handleMapReady = (map: any) => {
    mapInstanceRef.current = map;
    console.log('地图实例已保存');
  };

  // 加载旅行帖子
  useEffect(() => {
    // 修复Leaflet图标路径
    fixLeafletIcons();
    
    // 设置地图准备状态
    const timer = setTimeout(() => {
      setMapReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchTravelPosts = async () => {
        setLoading(true);
      try {
        const posts = await getPostsByCategoryFromFirestore('旅行');
        setTravelPosts(posts);
      } catch (error) {
        console.error('Failed to fetch travel posts:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mapReady) {
      fetchTravelPosts();
    }
  }, [mapReady]);

  const handlePostClick = useCallback((postId: string) => {
    if (onPostSelect) {
      const selectedPost = travelPosts.find(post => post.id === postId);
      if (selectedPost) {
        onPostSelect(selectedPost);
      }
    }
    router.push(`/post/${postId}`);
  }, [onPostSelect, travelPosts, router]);

  // 处理搜索
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // 使用 Nominatim API 进行地理编码（免费的 OpenStreetMap 服务）
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'User-Agent': 'StudyShareWebsite/1.0'
          }
        }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        console.log('搜索结果:', result);
        setSearchLocation({
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          name: result.display_name
        });
      } else {
        alert('未找到该地点，请尝试其他搜索词');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      alert('搜索出错，请稍后重试');
    } finally {
      setIsSearching(false);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
    setSearchLocation(null);
  };

  const toggleFullscreen = () => {
    console.log('全屏切换:', !isFullscreen ? '进入全屏' : '退出全屏');
    setIsFullscreen(!isFullscreen);
  };

  // 当全屏时禁用页面滚动
  useEffect(() => {
    if (isFullscreen) {
      console.log('进入全屏模式，禁用页面滚动');
      document.body.classList.add('overflow-hidden');
    } else {
      console.log('退出全屏模式，恢复页面滚动');
      document.body.classList.remove('overflow-hidden');
    }
    
    // 清理函数，确保组件卸载时恢复滚动
    return () => {
      if (isFullscreen) {
        document.body.classList.remove('overflow-hidden');
      }
    };
  }, [isFullscreen]);

  // 切换全屏后让 Leaflet 重新计算尺寸，避免出现空白
  useEffect(() => {
    if (mapInstanceRef.current) {
      // 立即调用
      requestAnimationFrame(() => {
        try {
          mapInstanceRef.current.invalidateSize();
          console.log('第一次 invalidateSize 调用');
        } catch (e) {
          console.warn('invalidateSize 调用失败', e);
        }
      });
      
      // 延迟再调用一次确保渲染完成
      setTimeout(() => {
        try {
          mapInstanceRef.current.invalidateSize();
          console.log('第二次 invalidateSize 调用');
        } catch (e) {
          console.warn('第二次 invalidateSize 调用失败', e);
        }
      }, 300);
    }
  }, [isFullscreen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div
        className={`relative border border-gray-300 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999] bg-white' : 'h-[80vh]'}`}
      >
        {/* 搜索框覆盖在地图顶部 */}
        <div className="absolute top-4 right-4 z-[10000] w-80">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="搜索地点（如：巴黎、东京、纽约）"
              className="w-full pl-10 pr-24 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm shadow-md"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-20 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 px-4 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isSearching ? '搜索中...' : '搜索'}
            </button>
          </div>
          {searchLocation && (
            <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg p-3 z-10">
              <p className="text-xs text-gray-600 mb-1">当前搜索位置：</p>
              <p className="text-sm font-medium text-gray-800 line-clamp-2">{searchLocation.name}</p>
            </div>
          )}
        </div>

        {/* 全屏切换按钮 */}
        <button
          onClick={toggleFullscreen}
          className="absolute top-4 left-4 z-[10000] p-3 bg-white/90 backdrop-blur-md rounded-full shadow-md hover:bg-white"
          title={isFullscreen ? '退出全屏' : '全屏查看'}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5 text-gray-700" /> : <Maximize2 className="w-5 h-5 text-gray-700" />}
        </button>

        {mapReady ? (
          <TravelLeafletMap
            travelPosts={travelPosts}
            onPostClick={handlePostClick}
            searchLocation={searchLocation}
            onMapReady={handleMapReady}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">加载地图中...</p>
            </div>
          </div>
        )}

        {/* 全屏模式调试指示器 */}
        {isFullscreen && (
          <div className="absolute bottom-4 left-4 z-[10001] bg-red-500 text-white px-3 py-1 rounded text-sm">
            全屏模式已激活
          </div>
        )}
      </div>
      
      {travelPosts.length > 0 && (
        <div className="mt-4 text-sm text-gray-600">
          📍 找到 {travelPosts.length} 个旅行分享地点
        </div>
      )}
    </div>
  );
} 