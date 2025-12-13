"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Edit3, Save, User, Mail, Calendar, School } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AvatarSelector from '@/components/AvatarSelector';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { syncUserProfileInConversations, syncUserProfileInPosts } from '@/lib/chat-service';

interface UserProfile {
  displayName: string;
  email: string;
  photoURL: string;
  university: string;
  year: string;
  bio: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile>({
    displayName: '',
    email: '',
    photoURL: '',
    university: '诺丁汉大学',
    year: '学生',
    bio: ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // 加载用户资料
  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
  }, [user]);

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      // 从Firestore获取用户资料
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setProfile({
          displayName: userData.displayName || user.displayName || '',
          email: userData.email || user.email || '',
          photoURL: userData.photoURL || user.photoURL || '',
          university: userData.university || '诺丁汉大学',
          year: userData.year || '学生',
          bio: userData.bio || ''
        });
      } else {
        // 如果Firestore中没有数据，使用Firebase Auth的数据
        setProfile({
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          university: '诺丁汉大学',
          year: '学生',
          bio: ''
        });
      }
    } catch (error) {
      console.error('加载用户资料失败:', error);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAvatarSelect = async (avatarUrl: string) => {
    // 立即更新界面
    setProfile(prev => ({
      ...prev,
      photoURL: avatarUrl
    }));

    // 保存到Firestore
    try {
      if (user) {
        await updateDoc(doc(db, 'users', user.uid), {
          photoURL: avatarUrl,
          updatedAt: new Date()
        });
        console.log('头像更新成功');
        
        // 同步更新所有会话中的头像
        try {
          await syncUserProfileInConversations(user.uid, undefined, avatarUrl);
          console.log('会话头像同步成功');
        } catch (syncError) {
          console.error('同步会话头像失败:', syncError);
          // 同步失败不影响主流程
        }
        
        // 同步更新所有帖子中的头像
        try {
          await syncUserProfileInPosts(user.uid, undefined, avatarUrl);
          console.log('帖子头像同步成功');
        } catch (syncError) {
          console.error('同步帖子头像失败:', syncError);
          // 同步失败不影响主流程
        }
        
        // 触发全局头像更新事件
        window.dispatchEvent(new CustomEvent('userAvatarUpdated', {
          detail: { 
            uid: user.uid,
            newAvatarUrl: avatarUrl 
          }
        }));
        
        // 也触发storage事件作为备用方案
        if (typeof window !== 'undefined') {
          const event = new StorageEvent('storage', {
            key: 'userAvatarUpdate',
            newValue: JSON.stringify({ uid: user.uid, photoURL: avatarUrl }),
            oldValue: null
          });
          window.dispatchEvent(event);
        }
      }
    } catch (error) {
      console.error('更新头像失败:', error);
      alert('更新头像失败，请重试');
      // 如果保存失败，恢复原来的头像
      setProfile(prev => ({
        ...prev,
        photoURL: prev.photoURL
      }));
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    
    try {
      // 更新Firestore中的用户数据
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        university: profile.university,
        year: profile.year,
        bio: profile.bio,
        updatedAt: new Date()
      });
      
      // 同步更新所有会话中的名称和头像
      try {
        await syncUserProfileInConversations(user.uid, profile.displayName, profile.photoURL);
        console.log('会话资料同步成功');
      } catch (syncError) {
        console.error('同步会话资料失败:', syncError);
        // 同步失败不影响主流程
      }
      
      // 同步更新所有帖子中的名称和头像
      try {
        await syncUserProfileInPosts(user.uid, profile.displayName, profile.photoURL);
        console.log('帖子资料同步成功');
      } catch (syncError) {
        console.error('同步帖子资料失败:', syncError);
        // 同步失败不影响主流程
      }

      setIsEditing(false);
      alert('资料更新成功！');
      
      // 触发全局用户资料更新事件
      window.dispatchEvent(new CustomEvent('userProfileUpdated', {
        detail: { 
          uid: user.uid,
          profile: {
            displayName: profile.displayName,
            photoURL: profile.photoURL,
            university: profile.university,
            year: profile.year,
            bio: profile.bio
          }
        }
      }));
      
      // 特别触发用户名更新事件（兼容现有代码）
      window.dispatchEvent(new CustomEvent('usernameUpdated', {
        detail: { 
          uid: user.uid,
          newUsername: profile.displayName 
        }
      }));
      
      // 也触发storage事件作为备用方案
      if (typeof window !== 'undefined') {
        const profileEvent = new StorageEvent('storage', {
          key: 'userProfileUpdate',
          newValue: JSON.stringify({ 
            uid: user.uid, 
            displayName: profile.displayName,
            photoURL: profile.photoURL 
          }),
          oldValue: null
        });
        window.dispatchEvent(profileEvent);
        
        const usernameEvent = new StorageEvent('storage', {
          key: 'usernameUpdate',
          newValue: profile.displayName,
          oldValue: null
        });
        window.dispatchEvent(usernameEvent);
      }
      
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600 mb-6">您需要登录后才能访问设置页面</p>
          <Link 
            href="/login"
            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/profile"
              className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回</span>
            </Link>
            
            <h1 className="text-lg font-semibold text-gray-900">个人设置</h1>
            
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 disabled:opacity-50 transition-all"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? '保存中...' : '保存'}</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition-all"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>编辑</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧：头像和基本信息 */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6 text-center"
            >
              {/* 头像 */}
              <div className="relative inline-block mb-4">
                <img
                  src={profile.photoURL || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face'}
                  alt="用户头像"
                  className="w-24 h-24 rounded-full object-cover border-4 border-gray-100"
                />
                <button
                  onClick={() => setShowAvatarSelector(true)}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {profile.displayName || '未设置姓名'}
              </h2>
              <p className="text-gray-600 mb-4">{profile.email}</p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <School className="w-4 h-4" />
                  <span>{profile.university}</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{profile.year}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 右侧：详细信息表单 */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">个人资料</h3>
              
              <div className="space-y-6">
                {/* 姓名 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓名
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={profile.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="请输入您的姓名"
                    />
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profile.displayName || '未设置'}</span>
                    </div>
                  )}
                </div>

                {/* 邮箱 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    邮箱
                  </label>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{profile.email}</span>
                    <span className="text-xs text-gray-500 ml-auto">无法修改</span>
                  </div>
                </div>

                {/* 学校 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    学校
                  </label>
                  {isEditing ? (
                    <select
                      value={profile.university}
                      onChange={(e) => handleInputChange('university', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="诺丁汉大学">诺丁汉大学</option>
                      <option value="诺丁汉大学中国校区">诺丁汉大学中国校区</option>
                      <option value="其他">其他</option>
                    </select>
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <School className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profile.university}</span>
                    </div>
                  )}
                </div>

                {/* 年级/身份 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    年级/身份
                  </label>
                  {isEditing ? (
                    <select
                      value={profile.year}
                      onChange={(e) => handleInputChange('year', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="大一学生">大一学生</option>
                      <option value="大二学生">大二学生</option>
                      <option value="大三学生">大三学生</option>
                      <option value="大四学生">大四学生</option>
                      <option value="研究生">研究生</option>
                      <option value="博士生">博士生</option>
                      <option value="校友">校友</option>
                      <option value="教职工">教职工</option>
                    </select>
                  ) : (
                    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-900">{profile.year}</span>
                    </div>
                  )}
                </div>

                {/* 个人简介 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    个人简介
                  </label>
                  {isEditing ? (
                    <textarea
                      value={profile.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="简单介绍一下自己吧..."
                    />
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-xl min-h-[100px]">
                      <span className="text-gray-900">
                        {profile.bio || '这个人很懒，什么都没有留下...'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* 头像选择器 */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={profile.photoURL}
      />
    </div>
  );
} 