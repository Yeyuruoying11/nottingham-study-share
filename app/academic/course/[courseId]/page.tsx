"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Users, Calendar, Award, Plus, Filter, Search } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getCourseById, getDepartmentById, courses } from '@/lib/academic-data';
import { Course, Department } from '@/lib/types';
import { getAllPostsFromFirestore, FirestorePost } from '@/lib/firestore-posts';

interface PostCardProps {
  post: FirestorePost;
}

function PostCard({ post }: PostCardProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      let date;
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else {
        return '';
      }
      
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return '今天';
      } else if (diffDays === 1) {
        return '昨天';
      } else if (diffDays < 7) {
        return `${diffDays}天前`;
      } else {
        return date.toLocaleDateString('zh-CN');
      }
    } catch (error) {
      return '';
    }
  };

  return (
    <Link href={`/post/${post.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer group"
      >
        {post.images && post.images.length > 0 && (
          <div className="aspect-w-16 aspect-h-9">
            <img 
              src={post.images[0]} 
              alt={post.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-6">
          <div className="flex items-center space-x-2 mb-3">
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {post.category}
            </span>
            {post.tags && post.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                #{tag}
              </span>
            ))}
          </div>
          
          <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors line-clamp-2">
            {post.title}
          </h3>
          
          <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
            {post.content}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src={post.author.avatar} 
                alt={post.author.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{post.author.name}</p>
                <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <span>❤️</span>
                <span>{post.likes}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>💬</span>
                <span>{post.comments}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

export default function CoursePage() {
  const params = useParams();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const courseData = getCourseById(courseId);
    if (courseData) {
      setCourse(courseData);
      const deptData = getDepartmentById(courseData.departmentId);
      setDepartment(deptData || null);
    }
    
    fetchPosts();
  }, [courseId]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const allPosts = await getAllPostsFromFirestore();
      
      // 根据课程ID筛选相关帖子
      const coursePosts = allPosts.filter(post => {
        // 1. 直接匹配course字段（用户在发布帖子时选择的课程ID）
        if (post.course === courseId) {
          return true;
        }
        
        // 2. 匹配课程代码（从课程数据中获取）
        if (course && post.course === course.code) {
          return true;
        }
        
        // 3. 标签匹配：检查标签中是否包含课程相关信息
        if (post.tags && course) {
          const hasMatchingTag = post.tags.some(tag => 
            tag.toLowerCase().includes(course.name.toLowerCase()) ||
            tag.toLowerCase().includes(course.nameEn.toLowerCase()) ||
            tag.toLowerCase().includes(course.code.toLowerCase()) ||
            tag.toLowerCase().includes(courseId.toLowerCase())
          );
          if (hasMatchingTag) {
            return true;
          }
        }
        
        // 4. 标题或内容匹配（较宽松的匹配）
        if (course && post.category === '学习') {
          const titleMatch = post.title.toLowerCase().includes(course.name.toLowerCase()) ||
                            post.title.toLowerCase().includes(course.code.toLowerCase());
          const contentMatch = post.content.toLowerCase().includes(course.name.toLowerCase()) ||
                              post.content.toLowerCase().includes(course.code.toLowerCase());
          
          if (titleMatch || contentMatch) {
            return true;
          }
        }
        
        return false;
      });
      
      // 按创建时间降序排序
      coursePosts.sort((a, b) => {
        let timeA: Date;
        let timeB: Date;
        
        // 处理a.createdAt
        if (a.createdAt instanceof Date) {
          timeA = a.createdAt;
        } else if (a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt) {
          timeA = (a.createdAt as any).toDate();
        } else {
          timeA = new Date(0);
        }
        
        // 处理b.createdAt
        if (b.createdAt instanceof Date) {
          timeB = b.createdAt;
        } else if (b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt) {
          timeB = (b.createdAt as any).toDate();
        } else {
          timeB = new Date(0);
        }
        
        return timeB.getTime() - timeA.getTime();
      });
      
      setPosts(coursePosts);
      console.log(`为课程 ${courseId} 找到 ${coursePosts.length} 篇相关帖子`);
      
    } catch (error) {
      console.error('获取帖子失败:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = searchQuery === '' || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">课程未找到</h1>
          <Link href="/academic" className="text-green-600 hover:text-green-700">
            返回学院页面
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/academic"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回学院</span>
            </Link>
            
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-green-600" />
              <h1 className="text-xl font-bold text-gray-900">{course.name}</h1>
            </div>

            <Link
              href="/create"
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>发布帖子</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 课程信息头部 */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  course.level === 'undergraduate' ? 'bg-green-100 text-green-700' :
                  course.level === 'postgraduate' ? 'bg-blue-100 text-blue-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {course.level === 'undergraduate' ? '本科课程' : 
                   course.level === 'postgraduate' ? '研究生课程' : '博士课程'}
                </div>
                <span className="text-sm font-mono text-blue-600">{course.code}</span>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.name}</h1>
              <p className="text-lg text-gray-600 mb-4">{course.nameEn}</p>
              
              {department && (
                <p className="text-sm text-gray-500 mb-4">
                  {department.name} • {department.nameEn}
                </p>
              )}
              
              <p className="text-gray-700 leading-relaxed">
                {course.description}
              </p>
            </div>
            
            <div className="ml-8 text-right">
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                {course.year && (
                  <div className="flex items-center justify-end space-x-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Year {course.year}</span>
                  </div>
                )}
                {course.credits && (
                  <div className="flex items-center justify-end space-x-2 text-sm">
                    <Award className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">{course.credits} 学分</span>
                  </div>
                )}
                <div className="flex items-center justify-end space-x-2 text-sm">
                  <Users className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">{filteredPosts.length} 篇讨论</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">课程讨论</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索帖子..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">所有分类</option>
                <option value="学习">学习</option>
                <option value="生活">生活</option>
                <option value="美食">美食</option>
                <option value="旅行">旅行</option>
                <option value="资源">资源</option>
                <option value="租房">租房</option>
              </select>
            </div>
          </div>
          
          <p className="text-gray-600 text-sm">
            找到 {filteredPosts.length} 篇与 {course.name} 相关的讨论
          </p>
        </div>

        {/* 帖子列表 */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
            <p className="text-gray-600 mt-4">加载中...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">暂无相关讨论</h3>
            <p className="text-gray-600 mb-6">
              成为第一个分享 {course.name} 学习经验的人吧！
            </p>
            <Link
              href="/create"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>发布帖子</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post, index) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
} 