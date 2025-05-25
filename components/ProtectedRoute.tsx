"use client";

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean; // 默认为true，表示需要登录
}

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // 如果正在加载认证状态，显示加载器
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mb-4">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto" />
          </div>
          <p className="text-gray-600">正在加载...</p>
        </motion.div>
      </div>
    );
  }

  // 如果需要认证但用户未登录
  if (requireAuth && !user) {
    router.push('/login');
    return null;
  }

  // 如果不需要认证但用户已登录（例如登录页面）
  if (!requireAuth && user) {
    router.push('/');
    return null;
  }

  return <>{children}</>;
} 