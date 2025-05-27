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
    const cylinderWidth = isScreenSizeSm ? 800 : 1200;
    const faceCount = images.length;
    const faceWidth = cylinderWidth / faceCount;
    const radius = cylinderWidth / (2 * Math.PI);
    const rotation = useMotionValue(0);
    
    // 计算初始旋转角度，让第一张图片正对前方
    const anglePerImage = 360 / faceCount;
    const initialRotation = 0; // 第一张图片在0度位置
    
    const transform = useTransform(
      rotation,
      (value) => `rotate3d(0, 1, 0, ${value + initialRotation}deg)`
    );

    return (
      <div
        className="flex h-full items-center justify-center"
        style={{
          perspective: "1000px",
          transformStyle: "preserve-3d",
          willChange: "transform",
        }}
      >
        <motion.div
          drag={isCarouselActive ? "x" : false}
          className="relative flex h-full origin-center cursor-grab justify-center active:cursor-grabbing"
          style={{
            transform,
            rotateY: rotation,
            width: cylinderWidth,
            transformStyle: "preserve-3d",
          }}
          onDrag={(_, info) => {
            if (isCarouselActive) {
              // 增加拖拽敏感度
              rotation.set(rotation.get() + info.offset.x * 0.2);
            }
          }}
          onDragEnd={(_, info) => {
            if (isCarouselActive) {
              // 添加惯性效果
              const velocity = info.velocity.x * 0.1;
              const finalRotation = rotation.get() + velocity;
              
              // 可选：添加吸附到最近图片的效果
              const snapToNearest = Math.round(finalRotation / anglePerImage) * anglePerImage;
              
              controls.start({
                rotateY: snapToNearest,
                transition: {
                  type: "spring",
                  stiffness: 200,
                  damping: 30,
                  mass: 0.8,
                },
              });
              
              rotation.set(snapToNearest);
            }
          }}
          animate={controls}
        >
          {images.map((imgUrl, i) => (
            <motion.div
              key={`key-${imgUrl}-${i}`}
              className="absolute flex h-full origin-center items-center justify-center rounded-xl bg-white p-2 shadow-lg hover:shadow-xl transition-shadow"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${
                  i * anglePerImage
                }deg) translateZ(${radius}px)`,
              }}
              onClick={() => handleClick(imgUrl, i)}
            >
              <motion.img
                src={imgUrl}
                alt={`图片 ${i + 1}`}
                layoutId={`img-${imgUrl}-${i}`}
                className="pointer-events-none w-full rounded-xl object-cover aspect-square max-w-[180px] max-h-[180px] hover:scale-105 transition-transform"
                initial={{ filter: "blur(4px)" }}
                animate={{ filter: "blur(0px)" }}
                transition={transition}
              />
            </motion.div>
          ))}
        </motion.div>
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
  const controls = useAnimation();

  useEffect(() => {
    console.log("Images loaded:", images);
  }, [images]);

  const handleClick = (imgUrl: string, index: number) => {
    setActiveImg(imgUrl);
    setActiveIndex(index);
    setIsCarouselActive(false);
    controls.stop();
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
      
      <div className="relative h-[300px] w-full overflow-hidden rounded-xl bg-gradient-to-br from-gray-50 to-gray-100">
        <Carousel
          handleClick={handleClick}
          controls={controls}
          images={images}
          isCarouselActive={isCarouselActive}
        />
        
        {/* 操作提示 */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
          拖拽旋转 • 点击查看大图 • {images.length} 张图片
        </div>
      </div>
    </motion.div>
  );
} 