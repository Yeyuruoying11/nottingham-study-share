"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MultiImageGalleryProps {
  images: string[];
  className?: string;
  showCount?: boolean;
}

export function MultiImageGallery({ images, className = "", showCount = true }: MultiImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return null;
  }

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const goToPrevious = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null) {
      setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1);
    }
  };

  // 单张图片
  if (images.length === 1) {
    return (
      <>
        <div className={`relative ${className}`}>
          <img
            src={images[0]}
            alt="图片"
            className="w-full h-full object-cover cursor-pointer"
            onClick={() => openLightbox(0)}
          />
        </div>
        
        {/* 灯箱 */}
        <AnimatePresence>
          {selectedIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
              onClick={closeLightbox}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <X className="w-8 h-8" />
              </button>
              
              <img
                src={images[selectedIndex]}
                alt="大图"
                className="max-w-full max-h-full object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // 多张图片 - 网格布局
  return (
    <>
      <div className={`grid gap-1 ${className}`}>
        {images.length === 2 && (
          <div className="grid grid-cols-2 gap-1">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image}
                  alt={`图片 ${index + 1}`}
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(index)}
                />
              </div>
            ))}
          </div>
        )}
        
        {images.length === 3 && (
          <div className="grid grid-cols-2 gap-1 h-64">
            <div className="relative">
              <img
                src={images[0]}
                alt="图片 1"
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openLightbox(0)}
              />
            </div>
            <div className="grid grid-rows-2 gap-1">
              {images.slice(1).map((image, index) => (
                <div key={index + 1} className="relative">
                  <img
                    src={image}
                    alt={`图片 ${index + 2}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => openLightbox(index + 1)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
        
        {images.length >= 4 && (
          <div className="grid grid-cols-2 gap-1 h-64">
            <div className="relative">
              <img
                src={images[0]}
                alt="图片 1"
                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => openLightbox(0)}
              />
            </div>
            <div className="grid grid-rows-2 gap-1">
              <div className="relative">
                <img
                  src={images[1]}
                  alt="图片 2"
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(1)}
                />
              </div>
              <div className="relative">
                <img
                  src={images[2]}
                  alt="图片 3"
                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => openLightbox(2)}
                />
                {images.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center cursor-pointer hover:bg-opacity-40 transition-all">
                    <span className="text-white text-lg font-semibold">
                      +{images.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 灯箱 */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
            onClick={closeLightbox}
          >
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            
            {/* 导航按钮 */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToPrevious();
                  }}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    goToNext();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
            
            <img
              src={images[selectedIndex]}
              alt="大图"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* 图片计数 */}
            {showCount && images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 