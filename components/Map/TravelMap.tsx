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
}

// 旅行地图组件
const TravelLeafletMap = React.memo(({ 
  travelPosts, 
  onPostClick 
}: {
  travelPosts: Post[];
  onPostClick: (postId: string) => void;
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

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

        // 创建新的地图实例
        const map = L.map(mapRef.current!, {
          center: [51.5074, -0.1278], // 伦敦为中心
          zoom: 5,
          zoomControl: true,
          attributionControl: true,
        });

        // 添加瓦片层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map);

        mapInstanceRef.current = map;

        // 添加旅行帖子标记
        const markers: any[] = [];
        travelPosts.forEach((post) => {
          if (post.location) {
            const marker = L.marker([post.location.latitude, post.location.longitude])
              .addTo(map)
              .bindPopup(`
                <div class="p-2">
                  <h3 class="font-bold text-sm">${post.title}</h3>
                  <p class="text-xs text-gray-600 mt-1">${post.location.address}</p>
                  <button 
                    onclick="window.location.href='/post/${post.id}'" 
                    class="mt-2 px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                  >
                    查看详情
                  </button>
                </div>
              `);
            
            marker.on('click', () => {
              onPostClick(post.id);
            });
            
            markers.push(marker);
          }
        });

        markersRef.current = markers;

        // 如果有标记，调整地图视图以包含所有标记
        if (markers.length > 0) {
          const group = new L.featureGroup(markers);
          map.fitBounds(group.getBounds().pad(0.1));
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
  }, [travelPosts, onPostClick]);

  return <div ref={mapRef} className="h-full w-full" />;
});

TravelLeafletMap.displayName = 'TravelLeafletMap';

export default function TravelMap({ className = "" }: TravelMapProps = {}) {
  const router = useRouter();
  const [travelPosts, setTravelPosts] = useState<Post[]>([]);
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
        const posts = await getPostsByCategoryFromFirestore('travel');
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
      
      <div className="h-96 border border-gray-300 rounded-lg overflow-hidden">
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