"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Heart, MessageCircle, Share, Bookmark, User, Bell, Menu } from "lucide-react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import Link from "next/link";

// 模拟数据
const posts = [
  {
    id: 1,
    title: "诺丁汉大学新生宿舍攻略",
    content: "刚到诺丁汉，住宿是个大问题。我整理了一份超全宿舍攻略，包括各个宿舍区的优缺点、价格对比...",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    author: {
      name: "小红同学",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
    },
    likes: 234,
    comments: 56,
    tags: ["宿舍", "新生", "攻略"],
  },
  {
    id: 2,
    title: "诺丁汉周边美食探店",
    content: "在诺丁汉生活了两年，今天分享一些我发现的宝藏餐厅，有中餐、西餐、还有当地特色...",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=600&fit=crop",
    author: {
      name: "美食探索者",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
    },
    likes: 189,
    comments: 42,
    tags: ["美食", "探店", "生活"],
  },
  {
    id: 3,
    title: "论文季生存指南",
    content: "又到了论文季，图书馆里人满为患。分享一些我的论文写作技巧和时间管理方法...",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=500&fit=crop",
    author: {
      name: "学霸小王",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
    },
    likes: 312,
    comments: 78,
    tags: ["学习", "论文", "技巧"],
  },
  {
    id: 4,
    title: "诺丁汉春天踏青地点推荐",
    content: "春天来了，诺丁汉有很多美丽的地方适合踏青拍照，今天推荐几个我的私藏景点...",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop",
    author: {
      name: "旅行小达人",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
    },
    likes: 156,
    comments: 23,
    tags: ["旅行", "踏青", "摄影"],
  },
  {
    id: 5,
    title: "租房避坑指南",
    content: "在诺丁汉租房一年多的经验总结，从找房、看房到签约，每个环节都有需要注意的地方...",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=350&fit=crop",
    author: {
      name: "租房达人",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face",
    },
    likes: 445,
    comments: 89,
    tags: ["租房", "避坑", "经验"],
  },
  {
    id: 6,
    title: "诺丁汉购物指南",
    content: "从Victoria Centre到Intu，诺丁汉的购物中心各有特色，这份购物指南帮你找到最适合的...",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=450&fit=crop",
    author: {
      name: "购物小能手",
      avatar: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=40&h=40&fit=crop&crop=face",
    },
    likes: 267,
    comments: 34,
    tags: ["购物", "商场", "推荐"],
  },
];

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

  const PostCard = ({ post, index }: { post: any; index: number }) => (
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
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 notts-green rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white text-lg font-bold">N</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">诺丁汉留学圈</h1>
                <p className="text-xs text-gray-500">分享你的留学故事</p>
              </div>
            </div>

            {/* 搜索栏 */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索留学攻略、美食推荐..."
                  className="w-full pl-12 pr-4 py-2 bg-gray-100 border-0 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-300"
                />
              </div>
            </div>

            {/* 用户操作 */}
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="notts-green text-white px-6 py-2 rounded-full flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">发布</span>
              </motion.button>
              
              <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <Link href="/login">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                  alt="User Avatar"
                  className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 hover:border-green-500 transition-colors cursor-pointer"
                />
              </Link>
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