"use client";

import React, { useEffect, useState } from 'react';
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
  onPostSelect?: (post: FirestorePost) => void;
  selectedPostId?: string;
  className?: string;
}

export default function TravelMap({ onPostSelect, selectedPostId, className = "" }: TravelMapProps) {
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

  // 处理查看详情点击
  const handleViewDetails = (post: FirestorePost, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation(); // 防止事件冒泡
      e.preventDefault(); // 防止默认行为
    }
    
    console.log('查看详情被点击，帖子ID:', post.id);
    console.log('准备导航到:', `/post/${post.id}`);
    
    // 调用可选的回调函数
    if (onPostSelect) {
      onPostSelect(post);
    }
    
    // 导航到帖子详情页面
    if (post.id) {
      // 使用 window.location 进行可靠的导航
      window.location.href = `/post/${post.id}`;
    } else {
      console.error('帖子 ID 不存在:', post);
    }
  };

  // 处理整个 Popup 点击
  const handlePopupClick = (post: FirestorePost) => {
    console.log('Popup 被点击，导航到帖子:', post.id);
    if (post.id) {
      window.location.href = `/post/${post.id}`;
    }
  };

  if (!mapReady) {
    return (
      <div className={`bg-gray-200 rounded-xl flex items-center justify-center ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`bg-gray-200 rounded-xl flex items-center justify-center ${className}`}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={`rounded-xl overflow-hidden shadow-lg ${className}`}>
      <MapContainer
        center={[54.9783, -1.9540]} // 诺丁汉的坐标
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {travelPosts.map((post) => (
          post.location && (
            <Marker
              key={post.id}
              position={[post.location.latitude, post.location.longitude]}
              eventHandlers={{
                click: () => {
                  if (onPostSelect) {
                    onPostSelect(post);
                  }
                },
              }}
            >
              <Popup
                eventHandlers={{
                  click: () => handlePopupClick(post)
                }}
              >
                <div className="max-w-xs cursor-pointer" onClick={() => handlePopupClick(post)}>
                  <div className="flex items-start space-x-3">
                    {post.images && post.images[0] && (
                      <img
                        src={post.images[0]}
                        alt={post.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm text-gray-900 mb-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2">
                        {post.location.address}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 mb-2">
                        <span>{post.author.name}</span>
                        <span>•</span>
                        <span>{post.likes} 点赞</span>
                      </div>
                      <div className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors text-center">
                        点击查看详情
                      </div>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
      
      {travelPosts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <p className="text-gray-600 font-medium">还没有旅行帖子</p>
            <p className="text-sm text-gray-500">快来分享你的旅行经历吧！</p>
          </div>
        </div>
      )}
    </div>
  );
} 