"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, User, UserCheck } from 'lucide-react';

interface AvatarSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarUrl: string) => void;
  currentAvatar?: string;
}

type Gender = 'boys' | 'girls' | null;

// 头像文件列表（根据实际文件生成）
const AVATAR_FILES = {
  boys: [
    'peeps-avatar.png',
    'peeps-avatar-alpha.png',
    'peeps-avatar (1).png',
    'peeps-avatar (4).png',
    'peeps-avatar (6).png',
    'peeps-avatar (7).png',
    'peeps-avatar (8).png',
    'peeps-avatar (10).png',
    'peeps-avatar (18).png',
    'peeps-avatar (19).png'
  ],
  girls: [
    'peeps-avatar (2).png',
    'peeps-avatar (3).png',
    'peeps-avatar (5).png',
    'peeps-avatar (11).png',
    'peeps-avatar (12).png',
    'peeps-avatar (13).png',
    'peeps-avatar (14).png',
    'peeps-avatar (15).png',
    'peeps-avatar (16).png',
    'peeps-avatar (17).png'
  ]
};

export default function AvatarSelector({ isOpen, onClose, onSelect, currentAvatar }: AvatarSelectorProps) {
  const [selectedGender, setSelectedGender] = useState<Gender>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<string>('');

  // 当打开时重置状态
  useEffect(() => {
    if (isOpen) {
      setSelectedGender(null);
      setSelectedAvatar('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenderSelect = (gender: Gender) => {
    setSelectedGender(gender);
    setSelectedAvatar('');
  };

  const handleAvatarSelect = (avatarFile: string) => {
    const avatarUrl = `/avatars/${selectedGender}/${avatarFile}`;
    setSelectedAvatar(avatarUrl);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
      onClose();
    }
  };

  const renderGenderSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">选择性别</h3>
        <p className="text-gray-600">请先选择性别来查看对应的头像</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleGenderSelect('boys')}
          className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all"
        >
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <span className="text-lg font-medium text-gray-900">男生</span>
          <span className="text-sm text-gray-500 mt-1">10个头像可选</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => handleGenderSelect('girls')}
          className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-xl hover:border-pink-500 hover:bg-pink-50 transition-all"
        >
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mb-3">
            <UserCheck className="w-8 h-8 text-pink-600" />
          </div>
          <span className="text-lg font-medium text-gray-900">女生</span>
          <span className="text-sm text-gray-500 mt-1">10个头像可选</span>
        </motion.button>
      </div>
    </motion.div>
  );

  const renderAvatarSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            选择{selectedGender === 'boys' ? '男生' : '女生'}头像
          </h3>
          <p className="text-gray-600">点击头像预览，再次点击确认选择</p>
        </div>
        <button
          onClick={() => setSelectedGender(null)}
          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          重选性别
        </button>
      </div>

      {/* 头像网格 */}
      <div className="grid grid-cols-5 gap-3 max-h-80 overflow-y-auto">
        {AVATAR_FILES[selectedGender!].map((avatarFile) => {
          const avatarUrl = `/avatars/${selectedGender}/${avatarFile}`;
          const isSelected = selectedAvatar === avatarUrl;
          const isCurrent = currentAvatar === avatarUrl;
          
          return (
            <motion.button
              key={avatarFile}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleAvatarSelect(avatarFile)}
              className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                isSelected 
                  ? 'border-green-500 ring-2 ring-green-200' 
                  : isCurrent
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <img
                src={avatarUrl}
                alt={`头像 ${avatarFile}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // 图片加载失败时的处理
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face';
                }}
              />
              
              {/* 选中状态指示器 */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}

              {/* 当前头像指示器 */}
              {isCurrent && !isSelected && (
                <div className="absolute top-1 right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">当前</span>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 确认按钮 */}
      {selectedAvatar && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl"
        >
          <div className="flex items-center space-x-3">
            <img
              src={selectedAvatar}
              alt="选中的头像"
              className="w-12 h-12 rounded-full object-cover border-2 border-green-500"
            />
            <div>
              <p className="font-medium text-green-800">已选择头像</p>
              <p className="text-sm text-green-600">点击确认应用此头像</p>
            </div>
          </div>
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
          >
            确认选择
          </button>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">选择头像</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* 提示信息 */}
          <div className="px-6 pt-4 pb-2">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>温馨提示：</strong>为了更好的使用体验，建议不要从其他网站下载头像。你可以通过{' '}
                <a 
                  href="https://peeps.ui8.net/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  peeps.ui8.net
                </a>
                {' '}免费定制个性化头像。
              </p>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6">
            {selectedGender === null ? renderGenderSelection() : renderAvatarSelection()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 