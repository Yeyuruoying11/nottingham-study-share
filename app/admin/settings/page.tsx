"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, ArrowLeft, Crown, Bot, Plus, Edit, Trash2, User, MessageCircle, Brain, Palette, Globe } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { isAdminUser } from '@/lib/admin-config';
import AIConfigManager from '@/components/admin/AIConfigManager';
import AIPostHistoryManager from '@/components/admin/AIPostHistoryManager';
import { AICharacter } from '@/lib/types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('ai-config');
  const [aiCharacters, setAICharacters] = useState<AICharacter[]>([]);
  const [charactersLoading, setCharactersLoading] = useState(true);

  // 加载AI角色列表
  const loadAICharacters = async () => {
    try {
      setCharactersLoading(true);
      console.log('加载AI角色列表...');
      
      const q = query(
        collection(db, 'ai_characters'),
        where('status', '==', 'active')
      );
      
      const snapshot = await getDocs(q);
      const characters = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AICharacter[];
      
      setAICharacters(characters);
      console.log('AI角色加载完成:', characters.length, '个角色');
      
    } catch (error) {
      console.error('加载AI角色失败:', error);
    } finally {
      setCharactersLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    if (!loading && user && !isAdminUser(user)) {
      router.push('/');
      return;
    }

    if (!loading && user) {
      loadAICharacters();
    }
  }, [user, loading, router]);

  if (loading || charactersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user || !isAdminUser(user)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 添加返回按钮和标题区域 */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="text-sm font-medium">返回管理面板</span>
          </Link>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">管理员设置</h1>
            <p className="mt-2 text-gray-600">管理AI角色配置、发帖历史和系统设置</p>
          </div>
        </div>

        {/* 标签页导航 */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('ai-config')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'ai-config'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              AI角色配置
            </button>
            
            <button
              onClick={() => setActiveTab('post-history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'post-history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              帖子历史管理
            </button>
            
            <button
              onClick={() => setActiveTab('system-settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'system-settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              系统设置
            </button>
          </nav>
        </div>

        {/* 标签页内容 */}
        <div className="space-y-6">
          {activeTab === 'ai-config' && (
            <AIConfigManager />
          )}

          {activeTab === 'post-history' && (
            <AIPostHistoryManager characters={aiCharacters} />
          )}

          {activeTab === 'system-settings' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">系统设置</h2>
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">AI发帖设置</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        全局发帖间隔 (小时)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="168"
                        defaultValue="6"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        每日最大发帖数
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        defaultValue="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">内容重复检测</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        相似度阈值 (%)
                      </label>
                      <input
                        type="number"
                        min="50"
                        max="95"
                        defaultValue="70"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">超过此阈值将被认为是重复内容</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        历史记录保留天数
                      </label>
                      <input
                        type="number"
                        min="30"
                        max="365"
                        defaultValue="90"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
                    保存设置
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// 通用设置组件
function GeneralSettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Settings className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">通用设置</h2>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">平台基础设置</h3>
          <p className="text-sm text-gray-600">配置平台的基本信息和行为设置</p>
          <div className="mt-3">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">即将推出</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 外观设置组件
function AppearanceSettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Palette className="w-6 h-6 text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900">外观设置</h2>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">主题和样式</h3>
          <p className="text-sm text-gray-600">自定义平台的外观和主题设置</p>
          <div className="mt-3">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">即将推出</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 集成设置组件
function IntegrationsSettings() {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Globe className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-semibold text-gray-900">集成设置</h2>
      </div>
      
      <div className="space-y-6">
        <div className="p-4 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">第三方服务</h3>
          <p className="text-sm text-gray-600">配置外部服务和API集成</p>
          <div className="mt-3">
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">即将推出</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 系统设置组件
function SystemSettings() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">系统设置</h2>
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">AI发帖设置</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                全局发帖间隔 (小时)
              </label>
              <input
                type="number"
                min="1"
                max="168"
                defaultValue="6"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                每日最大发帖数
              </label>
              <input
                type="number"
                min="1"
                max="20"
                defaultValue="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">内容重复检测</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                相似度阈值 (%)
              </label>
              <input
                type="number"
                min="50"
                max="95"
                defaultValue="70"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">超过此阈值将被认为是重复内容</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                历史记录保留天数
              </label>
              <input
                type="number"
                min="30"
                max="365"
                defaultValue="90"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
} 