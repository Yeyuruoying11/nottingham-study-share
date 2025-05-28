"use client";

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Post, Location } from '@/lib/types';
import { getPostsByCategoryFromFirestore } from '@/lib/firestore-posts';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

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
  onPostSelect?: (post: Post) => void;
  selectedPostId?: string;
  className?: string;
}

export default function TravelMap({ onPostSelect, selectedPostId, className = "" }: TravelMapProps) {
  const [travelPosts, setTravelPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapReady, setMapReady] = useState(false);

  // 加载旅行帖子
  useEffect(() => {
    const loadTravelPosts = async () => {
      try {
        setLoading(true);
        const posts = await getPostsByCategoryFromFirestore('旅行');
        // 只显示有位置信息的帖子
        const postsWithLocation = posts.filter(post => post.location);
        setTravelPosts(postsWithLocation);
      } catch (error) {
        console.error('加载旅行帖子失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTravelPosts();
  }, []);

  // 确保客户端渲染
  useEffect(() => {
    setMapReady(true);
  }, []);

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
              <Popup>
                <div className="max-w-xs">
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
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>{post.author.displayName}</span>
                        <span>•</span>
                        <span>{post.likes} 点赞</span>
                      </div>
                      <button
                        onClick={() => onPostSelect?.(post)}
                        className="mt-2 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 transition-colors"
                      >
                        查看详情
                      </button>
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