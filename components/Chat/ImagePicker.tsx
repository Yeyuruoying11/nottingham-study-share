"use client";

import React, { useRef } from 'react';
import { Image as ImageIcon, X, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImagePickerProps {
  onImageSelect: (file: File) => void;
  isUploading: boolean;
  disabled?: boolean;
}

export default function ImagePicker({ onImageSelect, isUploading, disabled }: ImagePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) {
        alert('图片文件不能超过5MB');
        return;
      }

      onImageSelect(file);
    }
    
    // 清除输入，允许选择相同文件
    e.target.value = '';
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <button
        onClick={triggerFileSelect}
        disabled={disabled || isUploading}
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="发送图片"
      >
        {isUploading ? (
          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        ) : (
          <ImageIcon className="w-5 h-5" />
        )}
      </button>
    </>
  );
}

// 图片预览组件
interface ImagePreviewProps {
  imageUrl: string;
  onClose: () => void;
  isOpen: boolean;
}

export function ImagePreviewModal({ imageUrl, onClose, isOpen }: ImagePreviewProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative max-w-full max-h-full"
        >
          <button
            onClick={onClose}
            className="absolute -top-12 right-0 p-2 text-white hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <img
            src={imageUrl}
            alt="放大查看"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={onClose}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 