"use client";

import React, { useState, useEffect } from 'react';
import { MapPin, Maximize2, Minimize2, X } from 'lucide-react';

interface GoogleStreetViewEmbedProps {
  address?: string;
  latitude?: number;
  longitude?: number;
  height?: string;
  className?: string;
}

export default function GoogleStreetViewEmbed({ 
  address, 
  latitude, 
  longitude, 
  height = 'h-96',
  className = ''
}: GoogleStreetViewEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateEmbedUrl = () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('[GoogleStreetViewEmbed] 开始生成街景URL');
        console.log('[GoogleStreetViewEmbed] 参数:', { address, latitude, longitude });

        // 如果没有提供经纬度，显示错误
        if (!latitude || !longitude) {
          console.error('[GoogleStreetViewEmbed] 缺少经纬度坐标');
          setError('需要准确的经纬度坐标来显示街景');
          setIsLoading(false);
          return;
        }

        let streetViewUrl = '';

        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
        if (apiKey) {
          streetViewUrl = `https://www.google.com/maps/embed/v1/streetview?key=${apiKey}&location=${latitude},${longitude}&heading=0&fov=90&pitch=0`;
        } else {
          streetViewUrl = `https://www.google.com/maps/embed?pb=!6m8!1m7!1s!2m2!1d${latitude}!2d${longitude}!3f0!4f0!5f0.7820865974627469`;
        }
        
        console.log('[GoogleStreetViewEmbed] 生成的街景URL:', streetViewUrl);
        setEmbedUrl(streetViewUrl);
        setIsLoading(false);

      } catch (err) {
        console.error('[GoogleStreetViewEmbed] 街景URL生成失败:', err);
        setError('街景加载失败');
        setIsLoading(false);
      }
    };

    generateEmbedUrl();
  }, [address, latitude, longitude]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''} ${className}`}>
      <div 
        className={`w-full ${isFullscreen ? 'h-full' : height} rounded-lg overflow-hidden bg-gray-100`}
        style={{ minHeight: '300px' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">加载街景中...</h3>
              <p className="text-sm text-gray-600">正在获取360°街景视图</p>
              <div className="mt-4 flex items-center justify-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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
              <h3 className="text-lg font-semibold text-red-600 mb-2">街景加载失败</h3>
              <p className="text-sm text-gray-600 mb-4">{error}</p>
              <div className="text-xs text-gray-500 bg-gray-50 p-4 rounded-lg text-left">
                <p className="mb-2 font-semibold">可能的原因：</p>
                <ul className="space-y-1">
                  <li>• 该位置可能没有街景数据</li>
                  <li>• 位置坐标不正确</li>
                  <li>• 网络连接问题</li>
                  <li>• Google服务暂时不可用</li>
                </ul>
                <p className="mt-3 font-semibold">提示：</p>
                <p className="mt-1">您可以点击上方的"在 Google Maps 中查看街景"链接查看</p>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && embedUrl && (
          <iframe
            src={embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`街景视图 - ${address || '选定位置'}`}
            className="w-full h-full"
          />
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
        </div>
      )}

      {!isLoading && !error && (
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-600 font-medium">
              🏠 360° 街景视图 • 鼠标拖动查看周围环境
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