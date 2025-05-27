"use client";

import { memo, useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  AnimatePresence,
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type UseMediaQueryOptions = {
  defaultValue?: boolean;
  initializeWithValue?: boolean;
};

const IS_SERVER = typeof window === "undefined";

export function useMediaQuery(
  query: string,
  {
    defaultValue = false,
    initializeWithValue = true,
  }: UseMediaQueryOptions = {}
): boolean {
  const getMatches = (query: string): boolean => {
    if (IS_SERVER) {
      return defaultValue;
    }
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(() => {
    if (initializeWithValue) {
      return getMatches(query);
    }
    return defaultValue;
  });

  const handleChange = () => {
    setMatches(getMatches(query));
  };

  useIsomorphicLayoutEffect(() => {
    const matchMedia = window.matchMedia(query);
    handleChange();

    matchMedia.addEventListener("change", handleChange);

    return () => {
      matchMedia.removeEventListener("change", handleChange);
    };
  }, [query]);

  return matches;
}

const duration = 0.15;
const transition = { duration, ease: [0.32, 0.72, 0, 1] };
const transitionOverlay = { duration: 0.5, ease: [0.32, 0.72, 0, 1] };

const Carousel = memo(
  ({
    handleClick,
    controls,
    images,
    isCarouselActive,
  }: {
    handleClick: (imgUrl: string, index: number) => void;
    controls: any;
    images: string[];
    isCarouselActive: boolean;
  }) => {
    const isScreenSizeSm = useMediaQuery("(max-width: 640px)");
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // 简化为平面轮播，中间大图，两边小图
    const centerImageWidth = isScreenSizeSm ? 280 : 400;
    const sideImageWidth = isScreenSizeSm ? 60 : 80;
    const gap = isScreenSizeSm ? 10 : 20;

    // 自动旋转到指定索引
    const rotateToIndex = (targetIndex: number) => {
      setCurrentIndex(targetIndex);
    };

    // 点击时旋转到下一张
    const handleImageClick = (clickedIndex: number) => {
      console.log(`点击了图片 ${clickedIndex + 1}，当前索引: ${currentIndex}`);
      
      // 如果点击的是当前中心的图片，则打开灯箱
      if (clickedIndex === currentIndex) {
        console.log('点击中心图片，打开灯箱');
        handleClick(images[clickedIndex], clickedIndex);
      } else {
        // 否则旋转到被点击的图片
        console.log(`旋转到图片 ${clickedIndex + 1}`);
        rotateToIndex(clickedIndex);
      }
    };

    // 获取前一张和后一张的索引
    const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;

    return (
      <div className="flex h-full items-center justify-center relative overflow-hidden">
        <div className="flex items-center justify-center relative" style={{ width: centerImageWidth + sideImageWidth * 2 + gap * 2 }}>
          
          {/* 左侧图片 */}
          <motion.div
            className="absolute left-0 top-1/2 transform -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-80 transition-opacity z-10"
            style={{ width: sideImageWidth }}
            onClick={() => handleImageClick(prevIndex)}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 0.6 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={images[prevIndex]}
              alt={`图片 ${prevIndex + 1}`}
              className="w-full h-32 object-cover rounded-lg shadow-md"
            />
          </motion.div>

          {/* 中心图片 */}
          <motion.div
            className="relative z-20 cursor-pointer"
            style={{ width: centerImageWidth }}
            onClick={() => handleImageClick(currentIndex)}
            layout
            layoutId={`center-image-${currentIndex}`}
          >
            <motion.img
              key={currentIndex}
              src={images[currentIndex]}
              alt={`图片 ${currentIndex + 1}`}
              layoutId={`img-${images[currentIndex]}-${currentIndex}`}
              className="w-full h-64 object-cover rounded-xl shadow-xl hover:shadow-2xl transition-shadow"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            />
            
            {/* 中心图片指示器 */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
              {currentIndex + 1} / {images.length}
            </div>
          </motion.div>

          {/* 右侧图片 */}
          <motion.div
            className="absolute right-0 top-1/2 transform -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-80 transition-opacity z-10"
            style={{ width: sideImageWidth }}
            onClick={() => handleImageClick(nextIndex)}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 0.6 }}
            transition={{ duration: 0.3 }}
          >
            <img
              src={images[nextIndex]}
              alt={`图片 ${nextIndex + 1}`}
              className="w-full h-32 object-cover rounded-lg shadow-md"
            />
          </motion.div>

        </div>
      </div>
    );
  }
);

Carousel.displayName = "Carousel";

interface ThreeDPhotoCarouselProps {
  images: string[];
  className?: string;
}

export function ThreeDPhotoCarousel({ images, className = "" }: ThreeDPhotoCarouselProps) {
  const [activeImg, setActiveImg] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [isCarouselActive, setIsCarouselActive] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const controls = useAnimation();

  useEffect(() => {
    console.log("Images loaded:", images);
  }, [images]);

  useEffect(() => {
    console.log("activeImg 状态变化:", activeImg);
  }, [activeImg]);

  // 自动播放功能
  useEffect(() => {
    if (!isAutoPlay || !isCarouselActive || images.length <= 1) return;

    const interval = setInterval(() => {
      // 这里需要通过ref或其他方式调用Carousel组件的rotateToIndex
      // 暂时先实现基础功能
    }, 3000); // 每3秒自动切换

    return () => clearInterval(interval);
  }, [isAutoPlay, isCarouselActive, images.length]);

  const handleClick = (imgUrl: string, index: number) => {
    console.log('handleClick 被调用:', { imgUrl, index, activeImg, isCarouselActive });
    setActiveImg(imgUrl);
    setActiveIndex(index);
    setIsCarouselActive(false);
    controls.stop();
    console.log('handleClick 执行完成，activeImg 应该是:', imgUrl);
  };

  const handleClose = () => {
    setActiveImg(null);
    setIsCarouselActive(true);
  };

  const goToPrevious = () => {
    const newIndex = activeIndex === 0 ? images.length - 1 : activeIndex - 1;
    setActiveIndex(newIndex);
    setActiveImg(images[newIndex]);
  };

  const goToNext = () => {
    const newIndex = activeIndex === images.length - 1 ? 0 : activeIndex + 1;
    setActiveIndex(newIndex);
    setActiveImg(images[newIndex]);
  };

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeImg) return;
      
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      } else if (event.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeImg, activeIndex]);

  // 如果没有图片或只有一张图片，不显示3D轮播
  if (!images || images.length === 0) {
    return null;
  }

  if (images.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={images[0]}
          alt="图片"
          className="w-full h-64 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
          onClick={() => handleClick(images[0], 0)}
        />
        
        {/* 灯箱 */}
        <AnimatePresence mode="sync">
          {activeImg && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              layoutId={`img-container-${activeImg}`}
              layout="position"
              onClick={handleClose}
              className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
              style={{ willChange: "opacity" }}
              transition={transitionOverlay}
            >
              <motion.img
                layoutId={`img-${activeImg}-0`}
                src={activeImg}
                className="max-w-full max-h-full rounded-lg shadow-lg"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{
                  delay: 0.2,
                  duration: 0.5,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                style={{
                  willChange: "transform",
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white hover:text-gray-300 text-2xl z-10"
              >
                <X className="w-8 h-8" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <motion.div layout className={`relative ${className}`}>
      <AnimatePresence mode="sync">
        {activeImg && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            layoutId={`img-container-${activeImg}`}
            layout="position"
            onClick={handleClose}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            style={{ willChange: "opacity" }}
            transition={transitionOverlay}
          >
            {/* 关闭按钮 */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <X className="w-8 h-8" />
            </button>
            
            {/* 左右导航按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrevious();
              }}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10 p-2 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-all"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            <motion.img
              key={activeIndex} // 添加key确保动画正确触发
              layoutId={`img-${activeImg}-${activeIndex}`}
              src={activeImg}
              className="max-w-full max-h-full rounded-lg shadow-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: [0.25, 0.1, 0.25, 1],
              }}
              style={{
                willChange: "transform",
              }}
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* 图片计数和指示器 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-2">
              <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                {activeIndex + 1} / {images.length}
              </div>
              
              {/* 小圆点指示器 */}
              <div className="flex space-x-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(index);
                      setActiveImg(images[index]);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activeIndex 
                        ? 'bg-white' 
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="relative h-[320px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 z-10">
        <Carousel
          handleClick={handleClick}
          controls={controls}
          images={images}
          isCarouselActive={isCarouselActive}
        />
        
        {/* 操作提示 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm z-20">
          点击侧边图片切换 • 点击中心图片查看大图 • {images.length} 张图片
        </div>
      </div>
    </motion.div>
  );
}