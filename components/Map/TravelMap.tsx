"use client";

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Post, Location } from '@/lib/types';
import { getPostsByCategoryFromFirestore, type FirestorePost } from '@/lib/firestore-posts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
  onPostClick 
}: {
  travelPosts: FirestorePost[];
  onPostClick: (postId: string) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

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
          zoomControl: true,
          attributionControl: true,
          worldCopyJump: true, // 允许世界地图复制
        });

        // 添加瓦片层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          noWrap: false // 允许地图水平环绕
        }).addTo(map);

        mapInstanceRef.current = map;

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
            
            const marker = L.marker([post.location.latitude, post.location.longitude])
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
      `}</style>
    </>
  );
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

  const handlePostClick = (postId: string) => {
    // 如果提供了onPostSelect回调，使用它
    if (onPostSelect) {
      const selectedPost = travelPosts.find(post => post.id === postId);
      if (selectedPost) {
        onPostSelect(selectedPost);
      }
    }
    // 导航到帖子页面
    router.push(`/post/${postId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">🗺️ 旅行地图</h2>
        <p className="text-gray-600">探索世界各地的旅行分享</p>
      </div>
      
      <div className="h-[600px] border border-gray-300 rounded-lg overflow-hidden">
        {mapReady ? (
          <TravelLeafletMap
            travelPosts={travelPosts}
            onPostClick={handlePostClick}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-600">加载地图中...</p>
            </div>
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