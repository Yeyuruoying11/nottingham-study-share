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
    const [isDragging, setIsDragging] = useState(false);
    
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
              setIsDragging(true);
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
              
              // 延迟重置拖拽状态，避免拖拽结束时误触发点击
              setTimeout(() => setIsDragging(false), 100);
            }
          }}
          onDragStart={() => {
            if (isCarouselActive) {
              setIsDragging(true);
            }
          }}
          animate={controls}
        >
          {images.map((imgUrl, i) => (
            <motion.div
              key={`key-${imgUrl}-${i}`}
              className="absolute flex h-full origin-center items-center justify-center rounded-xl bg-white p-2 shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
              style={{
                width: `${faceWidth}px`,
                transform: `rotateY(${
                  i * anglePerImage
                }deg) translateZ(${radius}px)`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDragging) {
                  console.log(`图片点击事件触发: ${i + 1}`);
                  handleClick(imgUrl, i);
                }
              }}
            >
              <motion.img
                src={imgUrl}
                alt={`图片 ${i + 1}`}
                layoutId={`img-${imgUrl}-${i}`}
                className="w-full rounded-xl object-cover aspect-square max-w-[180px] max-h-[180px] hover:scale-105 transition-transform cursor-pointer"
                initial={{ filter: "blur(4px)" }}
                animate={{ filter: "blur(0px)" }}
                transition={transition}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDragging) {
                    console.log(`图片点击事件触发: ${i + 1}`);
                    handleClick(imgUrl, i);
                  }
                }}
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
                layoutId={`img-${activeImg}-0`