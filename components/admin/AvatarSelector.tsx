"use client";

import React, { useState, useRef } from 'react';
import { Upload, Check, User, Image as ImageIcon, X } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onAvatarChange: (avatarUrl: string) => void;
  characterName?: string;
}

// 预设的20张人物头像
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1494790108755-2616b9d9e1d0?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1528892952291-009c663ce843?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1504593811423-6dd665756598?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1559526324-593bc073d938?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=100&h=100&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1523419409543-a5e549c1faa8?w=100&h=100&fit=crop&crop=face'
];

export default function AvatarSelector({ selectedAvatar, onAvatarChange, characterName }: AvatarSelectorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [showPresets, setShowPresets] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    // 验证文件大小 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB');
      return;
    }

    setIsUploading(true);
    try {
      // 生成唯一文件名
      const fileName = `avatars/ai_character_${characterName || 'unknown'}_${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, fileName);
      
      // 上传文件
      const snapshot = await uploadBytes(storageRef, file);
      
      // 获取下载URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // 更新选中的头像
      onAvatarChange(downloadURL);
      
      console.log('头像上传成功:', downloadURL);
    } catch (error) {
      console.error('头像上传失败:', error);
      alert('头像上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePresetSelect = (avatarUrl: string) => {
    onAvatarChange(avatarUrl);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">选择头像</h4>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setShowPresets(true)}
            className={`px-3 py-1 text-xs rounded-full ${
              showPresets 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            预设头像
          </button>
          <button
            type="button"
            onClick={() => setShowPresets(false)}
            className={`px-3 py-1 text-xs rounded-full ${
              !showPresets 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            自定义上传
          </button>
        </div>
      </div>

      {showPresets ? (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">从精选头像中选择一个</p>
          <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg">
            {PRESET_AVATARS.map((avatarUrl, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handlePresetSelect(avatarUrl)}
                className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                  selectedAvatar === avatarUrl
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={avatarUrl}
                  alt={`预设头像 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {selectedAvatar === avatarUrl && (
                  <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-blue-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">上传自定义头像 (支持JPG、PNG，最大5MB)</p>
          
          {/* 当前选中的头像预览 */}
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
              {selectedAvatar ? (
                <img
                  src={selectedAvatar}
                  alt="当前头像"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">当前头像</p>
              <p className="text-xs text-gray-500">点击右侧按钮上传新头像</p>
            </div>
          </div>

          {/* 上传按钮 */}
          <button
            type="button"
            onClick={triggerFileUpload}
            disabled={isUploading}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>上传中...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>点击上传头像</span>
              </>
            )}
          </button>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}
    </div>
  );
} 