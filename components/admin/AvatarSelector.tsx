"use client";

import React, { useState, useRef } from 'react';
import { Upload, Check, User, Image as ImageIcon, X, UserCheck } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';

interface AvatarSelectorProps {
  selectedAvatar: string;
  onAvatarChange: (avatarUrl: string) => void;
  characterName?: string;
}

// 预设的20张人物头像（来自Unsplash）
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

// 本地卡通头像（Peeps风格）
const LOCAL_AVATARS = {
  boys: [
    '/avatars/boys/peeps-avatar.png',
    '/avatars/boys/peeps-avatar-alpha.png',
    '/avatars/boys/peeps-avatar (1).png',
    '/avatars/boys/peeps-avatar (4).png',
    '/avatars/boys/peeps-avatar (6).png',
    '/avatars/boys/peeps-avatar (7).png',
    '/avatars/boys/peeps-avatar (8).png',
    '/avatars/boys/peeps-avatar (10).png',
    '/avatars/boys/peeps-avatar (18).png',
    '/avatars/boys/peeps-avatar (19).png'
  ],
  girls: [
    '/avatars/girls/peeps-avatar (2).png',
    '/avatars/girls/peeps-avatar (3).png',
    '/avatars/girls/peeps-avatar (5).png',
    '/avatars/girls/peeps-avatar (11).png',
    '/avatars/girls/peeps-avatar (12).png',
    '/avatars/girls/peeps-avatar (13).png',
    '/avatars/girls/peeps-avatar (14).png',
    '/avatars/girls/peeps-avatar (15).png',
    '/avatars/girls/peeps-avatar (16).png',
    '/avatars/girls/peeps-avatar (17).png'
  ]
};

type AvatarTab = 'local' | 'preset' | 'upload';

export default function AvatarSelector({ selectedAvatar, onAvatarChange, characterName }: AvatarSelectorProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<AvatarTab>('local');
  const [localGender, setLocalGender] = useState<'boys' | 'girls'>('boys');
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

  const handleAvatarSelect = (avatarUrl: string) => {
    onAvatarChange(avatarUrl);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* 当前头像预览 */}
      <div className="flex items-center space-x-4 p-3 bg-white rounded-lg border border-gray-200">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-200 flex-shrink-0">
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
          <p className="text-sm font-medium text-gray-700">当前头像</p>
          <p className="text-xs text-gray-500">
            {selectedAvatar ? '已选择头像' : '未选择头像'}
          </p>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">选择头像</h4>
        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => setActiveTab('local')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              activeTab === 'local'
                ? 'bg-green-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            卡通头像
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              activeTab === 'preset'
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            真人头像
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              activeTab === 'upload'
                ? 'bg-purple-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            自定义上传
          </button>
        </div>
      </div>

      {/* 本地卡通头像 */}
      {activeTab === 'local' && (
        <div className="space-y-3">
          {/* 性别选择 */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setLocalGender('boys')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                localGender === 'boys'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              <span className="text-sm">男生头像</span>
            </button>
            <button
              type="button"
              onClick={() => setLocalGender('girls')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border-2 transition-all ${
                localGender === 'girls'
                  ? 'border-pink-500 bg-pink-50 text-pink-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span className="text-sm">女生头像</span>
            </button>
          </div>

          <p className="text-xs text-gray-500">Peeps风格卡通头像（共{LOCAL_AVATARS[localGender].length}个）</p>
          <div className="grid grid-cols-5 gap-3 p-3 border border-gray-200 rounded-lg bg-white">
            {LOCAL_AVATARS[localGender].map((avatarUrl, index) => (
              <button
                key={avatarUrl}
                type="button"
                onClick={() => handleAvatarSelect(avatarUrl)}
                className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                  selectedAvatar === avatarUrl
                    ? 'border-green-500 ring-2 ring-green-200'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img
                  src={avatarUrl}
                  alt={`卡通头像 ${index + 1}`}
                  className="w-full h-full object-cover bg-gray-50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
                  }}
                />
                {selectedAvatar === avatarUrl && (
                  <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 预设真人头像 */}
      {activeTab === 'preset' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">从Unsplash精选头像中选择（共{PRESET_AVATARS.length}个）</p>
          <div className="grid grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-white">
            {PRESET_AVATARS.map((avatarUrl, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAvatarSelect(avatarUrl)}
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
      )}

      {/* 自定义上传 */}
      {activeTab === 'upload' && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500">上传自定义头像 (支持JPG、PNG，最大5MB)</p>
          
          {/* 上传按钮 */}
          <button
            type="button"
            onClick={triggerFileUpload}
            disabled={isUploading}
            className="w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center space-y-2 bg-white"
          >
            {isUploading ? (
              <>
                <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                <span>上传中...</span>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8" />
                <span className="font-medium">点击上传头像</span>
                <span className="text-xs text-gray-400">或拖拽图片到这里</span>
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

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 提示：上传的头像将存储到Firebase Storage，适合使用品牌logo或特定的AI角色形象。
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 