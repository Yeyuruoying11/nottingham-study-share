"use client";

import { useEffect } from 'react';
import { aiScheduler } from '@/lib/ai-scheduler';

export default function AISchedulerProvider() {
  useEffect(() => {
    // 启动AI调度器
    try {
      console.log('🚀 初始化AI调度器...');
      aiScheduler.start();
      console.log('✅ AI调度器已启动');
    } catch (error) {
      console.error('❌ 启动AI调度器失败:', error);
    }
    
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
  }, []);

  // 这个组件不渲染任何内容
  return null;
} 