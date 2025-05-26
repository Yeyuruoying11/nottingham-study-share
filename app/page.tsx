"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Heart, MessageCircle, Share, Bookmark, User, Bell, Menu, LogOut, Settings } from "lucide-react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { postsData } from "@/lib/posts-data";

// 使用真实的帖子数据
const posts = postsData;

const testimonials = [
  {
    quote: "在诺丁汉的第一年，这个平台帮我解决了很多生活上的问题，感谢大家的分享！",
    name: "李小明",
    title: "商学院研一学生",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
  },
  {
    quote: "作为一个社恐，通过这个平台认识了很多志同道合的朋友，诺丁汉的生活变得更精彩了。",
    name: "王小美",
    title: "工程学院大三学生",
    image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
  },
  {
    quote: "这里的美食推荐真的太棒了，每个周末都会尝试新的餐厅，已经成为了美食达人！",
    name: "张小华",
    title: "艺术学院大二学生",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
  },
  {
    quote: "论文季的时候，这里的学习技巧分享救了我的命，顺利完成了毕业论文。",
    name: "陈小强",
    title: "计算机学院研二学生",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
  },
];

const categories = [
  { name: "学习", icon: "📚", color: "bg-blue-100 text-blue-800" },
  { name: "生活", icon: "🏠", color: "bg-green-100 text-green-800" },
  { name: "美食", icon: "🍕", color: "bg-red-100 text-red-800" },
  { name: "旅行", icon: "✈️", color: "bg-purple-100 text-purple-800" },
  { name: "购物", icon: "🛍️", color: "bg-pink-100 text-pink-800" },
  { name: "租房", icon: "🏡", color: "bg-yellow-100 text-yellow-800" },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  
  const { user, logout } = useAuth();

  // 点击外部关闭用户菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setShowUserMenu(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const PostCard = ({ post, index }: { post: any; index: number }) => (
    <Link href={`/post/${post.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer"
      >
        <div className="relative overflow-hidden">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-sm leading-tight">
            {post.title}
          </h3>
          <p className="text-gray-600 text-xs line-clamp-3 mb-3 leading-relaxed">
            {post.content}
          </p>
          
          <div className="flex flex-wrap gap-1 mb-3">
            {post.tags.map((tag: string, tagIndex: number) => (
              <span
                key={tagIndex}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-xs text-gray-600 font-medium">{post.author.name}</span>
            </div>
            
            <div className="flex items-center space-x-4 text-gray-500">
              <div className="flex items-center space-x-1">
                <Heart className="w-4 h-4" />
                <span className="text-xs">{post.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{post.comments}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="bg-white shadow-sm border-b sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 notts-green rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">N</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900">诺丁汉留学圈</h1>
                <p className="text-xs text-gray-500">分享你的留学故事</p>
              </div>
            </Link>

            {/* 搜索栏 */}
            <div className="flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索攻略、美食、生活经验..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 右侧按钮 */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* 发布按钮 */}
                  <Link href="/create">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="notts-green text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">发布</span>
                    </motion.button>
                  </Link>

                  {/* 通知按钮 */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all relative"
                  >
                    <Bell className="w-5 h-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </motion.button>

                  {/* 用户头像菜单 */}
                  <div className="relative" ref={userMenuRef}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-green-500 transition-all"
                    >
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt={user.displayName || user.email || "用户"} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-600" />
                      )}
                    </motion.button>

                    {/* 用户下拉菜单 */}
                    {showUserMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50"
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.displayName || "用户"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        
                        <Link 
                          href="/profile"
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4" />
                          <span>个人资料</span>
                        </Link>
                        
                        <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2">
                          <Settings className="w-4 h-4" />
                          <span>设置</span>
                        </button>
                        
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button 
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>退出登录</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </>
              ) : (
                /* 未登录状态 */
                <div className="flex items-center space-x-3">
                  <Link 
                    href="/login"
                    className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                  >
                    登录
                  </Link>
                  <Link 
                    href="/login"
                    className="notts-green text-white px-4 py-2 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
                  >
                    注册
                  </Link>
                </div>
              )}

              {/* 移动端菜单按钮 */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all md:hidden"
              >
                <Menu className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* 分类导航 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white border-b"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6 py-4 overflow-x-auto">
            <button
              onClick={() => setSelectedCategory("全部")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                selectedCategory === "全部"
                  ? "bg-green-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <span>🌟</span>
              <span className="text-sm font-medium">全部</span>
            </button>
            {categories.map((category) => (
              <button
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category.name
                    ? "bg-green-500 text-white shadow-lg"
                    : `${category.color} hover:shadow-md`
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 用户评价滚动 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-center text-gray-900 mb-6"
          >
            来自同学们的真实分享
          </motion.h2>
          <InfiniteMovingCards
            items={testimonials}
            direction="left"
            speed="slow"
            className="py-4"
          />
        </div>
      </div>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} />
          ))}
        </div>

        {/* 加载更多 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-12"
        >
          <button className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-full hover:border-green-500 hover:text-green-600 transition-all duration-300 shadow-lg hover:shadow-xl">
            加载更多精彩内容
          </button>
        </motion.div>
      </main>

      {/* 底部导航（移动端） */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t md:hidden">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center space-y-1 p-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">🏠</span>
            </div>
            <span className="text-xs text-green-600 font-medium">首页</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-xs text-gray-600">发现</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Plus className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-xs text-gray-600">发布</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-xs text-gray-600">消息</span>
          </button>
          <button className="flex flex-col items-center space-y-1 p-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-xs text-gray-600">我的</span>
          </button>
        </div>
      </div>
    </div>
  );
} 