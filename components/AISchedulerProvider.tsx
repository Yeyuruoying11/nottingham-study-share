"use client";

import { useEffect } from 'react';

export default function AISchedulerProvider() {
  useEffect(() => {
    // 延迟加载AI调度器，避免在构建时出错
    const initializeScheduler = async () => {
      try {
        // 动态导入以避免SSR问题
        const { aiScheduler } = await import('@/lib/ai-scheduler');
        console.log('🚀 初始化AI调度器...');
        aiScheduler.start();
        console.log('✅ AI调度器已启动');
        
        // 清理函数
        return () => {
          try {
            console.log('🛑 正在停止AI调度器...');
            aiScheduler.stop();
            console.log('✅ AI调度器已停止');
          } catch (error) {
            console.error('❌ 停止AI调度器失败:', error);
          }
        };
      } catch (error) {
        console.error('❌ 启动AI调度器失败:', error);
        // 不抛出错误，让应用继续运行
      }
    };

    let cleanup: (() => void) | undefined;

    // 仅在客户端环境中运行
    if (typeof window !== 'undefined') {
      initializeScheduler().then((cleanupFn) => {
        cleanup = cleanupFn;
      });
    }
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  // 这个组件不渲染任何内容
  return null;
} 