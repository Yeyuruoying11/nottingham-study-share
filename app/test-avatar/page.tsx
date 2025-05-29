"use client";

import React, { useState } from 'react';
import AvatarSelector from '@/components/AvatarSelector';
import { useAuth } from '@/contexts/AuthContext';

export default function TestAvatarPage() {
  const { user } = useAuth();
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState('');

  const handleAvatarSelect = (avatarUrl: string) => {
    setSelectedAvatar(avatarUrl);
    console.log('选择了头像:', avatarUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">头像选择测试页面</h1>
        
        <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">当前选择的头像</h2>
            {selectedAvatar ? (
              <div className="inline-block">
                <img
                  src={selectedAvatar}
                  alt="选中的头像"
                  className="w-32 h-32 rounded-full object-cover border-4 border-green-500 mx-auto"
                />
                <p className="mt-2 text-sm text-gray-600">头像路径: {selectedAvatar}</p>
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                <span className="text-gray-500">未选择头像</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              onClick={() => setShowAvatarSelector(true)}
              className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
            >
              选择头像
            </button>
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">用户信息</h3>
            {user ? (
              <div className="space-y-2">
                <p><strong>用户ID:</strong> {user.uid}</p>
                <p><strong>邮箱:</strong> {user.email}</p>
                <p><strong>姓名:</strong> {user.displayName || '未设置'}</p>
                <p><strong>当前头像:</strong></p>
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt="当前头像"
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                  />
                )}
              </div>
            ) : (
              <p className="text-red-600">请先登录</p>
            )}
          </div>

          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">测试步骤</h3>
            <ol className="list-decimal list-inside space-y-2 text-gray-700">
              <li>点击"选择头像"按钮</li>
              <li>选择性别（男生或女生）</li>
              <li>从对应的头像中选择一个</li>
              <li>点击"确认选择"</li>
              <li>查看选择的头像是否显示在上方</li>
            </ol>
          </div>

          {/* 头像路径测试 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">头像路径测试</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">测试男生头像:</p>
                <img
                  src="/avatars/boys/peeps-avatar.png"
                  alt="测试男生头像"
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    console.error('男生头像加载失败');
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">测试女生头像:</p>
                <img
                  src="/avatars/girls/peeps-avatar (2).png"
                  alt="测试女生头像"
                  className="w-16 h-16 rounded-full object-cover"
                  onError={(e) => {
                    console.error('女生头像加载失败');
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 头像选择器 */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={selectedAvatar}
      />
    </div>
  );
} 