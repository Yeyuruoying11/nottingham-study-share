"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Heart, MessageCircle, Share, Bookmark, User, Bell, Menu, LogOut, Trash2, MoreVertical, X, Crown, ChevronDown, Eye, MapPin } from "lucide-react";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getAllPostsFromFirestore, 
  getPostsByCategoryFromFirestore,
  getCategoryStatsFromFirestore,
  deletePostFromFirestore, 
  formatTimestamp,
  toggleLike,
  getUserLikeStatuses,
  type FirestorePost 
} from "@/lib/firestore-posts";
import { isAdminUser } from "@/lib/admin-config";
import { ThreeDPhotoCarousel } from "@/components/ui/three-d-carousel";
import { useRouter } from "next/navigation";
import { useUnreadNotificationCount } from "@/hooks/useNotifications";

// 临时导入迁移函数
const migrateTestData = async () => {
  const { migrateTestData } = await import("../scripts/migrate-data");
  return migrateTestData();
};

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
  { name: "生活", icon: "🏠", color: "bg-green-100 text-green-800" },
  { name: "美食", icon: "🍕", color: "bg-red-100 text-red-800" },
  { name: "旅行", icon: "✈️", color: "bg-purple-100 text-purple-800" },
  { name: "购物", icon: "🛍️", color: "bg-pink-100 text-pink-800" },
  { name: "租房", icon: "🏡", color: "bg-yellow-100 text-yellow-800" },
];

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [posts, setPosts] = useState<FirestorePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [firestoreUserName, setFirestoreUserName] = useState<string>('');
  const [firestoreUserAvatar, setFirestoreUserAvatar] = useState<string>('');
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showDebug, setShowDebug] = useState(false);
  const unreadNotificationCount = useUnreadNotificationCount();
  
  const { user, logout } = useAuth();
  const router = useRouter();

  // 加载帖子数据
  useEffect(() => {
    const loadPosts = async () => {
      try {
        console.log('开始加载帖子，当前分类:', selectedCategory);
        setLoading(true);
        let postsData;
        
        // 根据选中的分类加载不同的帖子
        if (selectedCategory === "全部") {
          console.log('正在获取所有帖子...');
          postsData = await getAllPostsFromFirestore();
        } else {
          console.log('正在获取分类帖子:', selectedCategory);
          postsData = await getPostsByCategoryFromFirestore(selectedCategory);
        }
        
        console.log('帖子加载成功，数量:', postsData.length);
        setPosts(postsData);
      } catch (error) {
        console.error("加载帖子失败:", error);
        console.error("错误详情:", error instanceof Error ? error.message : String(error));
        setPosts([]);
      } finally {
        console.log('设置loading为false');
        setLoading(false);
      }
    };

    loadPosts();

    // 监听帖子更新事件
    const handlePostUpdate = () => {
      console.log('收到帖子更新事件，重新加载帖子');
      loadPosts();
    };

    // 监听storage事件作为备用方案
    const handleStoragePostUpdate = (event: StorageEvent) => {
      if (event.key === 'postUpdate') {
        console.log('收到storage帖子更新事件');
        loadPosts();
      }
    };

    window.addEventListener('postUpdated', handlePostUpdate);
    window.addEventListener('storage', handleStoragePostUpdate);

    return () => {
      window.removeEventListener('postUpdated', handlePostUpdate);
      window.removeEventListener('storage', handleStoragePostUpdate);
    };
  }, [selectedCategory]); // 当选中的分类改变时重新加载帖子

  // 加载分类统计信息
  useEffect(() => {
    const loadCategoryStats = async () => {
      try {
        const stats = await getCategoryStatsFromFirestore();
        setCategoryStats(stats);
      } catch (error) {
        console.error('加载分类统计失败:', error);
      }
    };

    loadCategoryStats();
  }, [posts]); // 当帖子数据变化时更新统计

  // 筛选帖子的逻辑（只处理搜索，分类筛选已经在loadPosts中处理）
  const filteredPosts = posts.filter(post => {
    // 只进行搜索筛选，分类筛选已经在loadPosts中完成
    const searchMatch = searchQuery === "" || 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return searchMatch;
  });

  // 计算每个分类的帖子数量
  const getCategoryCount = (categoryName: string) => {
    if (categoryName === "全部") {
      // 对于"全部"分类，返回所有帖子的总数
      return posts.length;
    }
    return categoryStats[categoryName] || 0;
  };

  // 获取Firestore中的用户名和头像
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setFirestoreUserName('');
        setFirestoreUserAvatar('');
        return;
      }
      
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFirestoreUserName(userData.displayName || user.displayName || '用户');
          setFirestoreUserAvatar(userData.photoURL || user.photoURL || '');
        } else {
          setFirestoreUserName(user.displayName || '用户');
          setFirestoreUserAvatar(user.photoURL || '');
        }
      } catch (error) {
        console.error('获取用户资料失败:', error);
        setFirestoreUserName(user.displayName || '用户');
        setFirestoreUserAvatar(user.photoURL || '');
      }
    };

    fetchUserProfile();
    
    // 监听用户名更新事件（保持兼容性）
    const handleUsernameUpdate = (event: CustomEvent) => {
      if (event.detail.uid === user?.uid) {
        console.log('收到用户名更新事件:', event.detail.newUsername);
        setFirestoreUserName(event.detail.newUsername);
      }
    };
    
    // 监听用户头像更新事件
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail.uid === user?.uid) {
        console.log('收到头像更新事件:', event.detail.newAvatarUrl);
        setFirestoreUserAvatar(event.detail.newAvatarUrl);
      }
    };
    
    // 监听完整用户资料更新事件
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail.uid === user?.uid) {
        console.log('收到用户资料更新事件:', event.detail.profile);
        const profile = event.detail.profile;
        setFirestoreUserName(profile.displayName);
        setFirestoreUserAvatar(profile.photoURL);
      }
    };

    // 监听storage事件作为备用方案
    const handleStorageUpdate = (event: StorageEvent) => {
      if (event.key === 'usernameUpdate' && event.newValue) {
        console.log('收到storage用户名更新事件:', event.newValue);
        setFirestoreUserName(event.newValue);
      } else if (event.key === 'userAvatarUpdate' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.uid === user?.uid) {
            console.log('收到storage头像更新事件:', data.photoURL);
            setFirestoreUserAvatar(data.photoURL);
          }
        } catch (error) {
          console.error('解析头像更新事件失败:', error);
        }
      } else if (event.key === 'userProfileUpdate' && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.uid === user?.uid) {
            console.log('收到storage用户资料更新事件:', data);
            setFirestoreUserName(data.displayName);
            setFirestoreUserAvatar(data.photoURL);
          }
        } catch (error) {
          console.error('解析用户资料更新事件失败:', error);
        }
      }
    };

    window.addEventListener('usernameUpdated', handleUsernameUpdate as EventListener);
    window.addEventListener('userAvatarUpdated', handleAvatarUpdate as EventListener);
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    window.addEventListener('storage', handleStorageUpdate);
    
    return () => {
      window.removeEventListener('usernameUpdated', handleUsernameUpdate as EventListener);
      window.removeEventListener('userAvatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [user]);

  // 临时的数据迁移函数
  const handleMigrateData = async () => {
    if (window.confirm('确定要初始化测试数据吗？这将添加一些示例帖子到数据库。')) {
      try {
        await migrateTestData();
        alert('测试数据初始化成功！');
        // 重新加载帖子
        const updatedPosts = await getAllPostsFromFirestore();
        setPosts(updatedPosts);
      } catch (error) {
        console.error('数据迁移失败:', error);
        alert('数据迁移失败，请检查控制台');
      }
    }
  };

  // 点击外部关闭用户菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    // 只有当菜单打开时才添加监听器，优化性能
    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showUserMenu]);

  const handleLogout = async () => {
    try {
      setShowUserMenu(false); // 先关闭菜单
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 优化头像点击处理，避免重复状态更新
  const handleAvatarClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowUserMenu(prev => !prev);
  }, []);

  const PostCard = ({ post, index }: { post: any; index: number }) => {
    const [isDeleting, setIsDeleting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isLiking, setIsLiking] = useState(false);
    const [localLikes, setLocalLikes] = useState(post.likes || 0);
    const [localLiked, setLocalLiked] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    
    // 改进的作者身份验证逻辑 - 管理员可以删除任何帖子
    const isAuthor = user && post.author.uid && user.uid === post.author.uid;
    const isAdmin = user && isAdminUser(user);
    const canDelete = isAdmin || isAuthor; // 管理员优先，可以删除任何帖子

    // 只在组件挂载时获取一次点赞状态，避免依赖全局状态
    useEffect(() => {
      const initializeLikeStatus = async () => {
        if (user && post.id) {
          try {
            const { getUserLikeStatus } = await import("@/lib/firestore-posts");
            const status = await getUserLikeStatus(post.id, user.uid);
            setLocalLiked(status);
          } catch (error) {
            console.error('获取点赞状态失败:', error);
          }
        }
      };
      
      initializeLikeStatus();
    }, [user?.uid, post.id]); // 只依赖用户ID和帖子ID

    // 处理点赞
    const handleLike = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (!user) {
        alert('请先登录才能点赞');
        return;
      }

      if (isLiking) return;

      // 先更新本地状态，提供即时反馈
      const newLiked = !localLiked;
      const newLikes = newLiked ? localLikes + 1 : localLikes - 1;
      
      setLocalLiked(newLiked);
      setLocalLikes(newLikes);
      setIsLiking(true);
      
      try {
        const result = await toggleLike(post.id!, user.uid);
        
        // 确保本地状态与服务器状态一致
        setLocalLikes(result.likesCount);
        setLocalLiked(result.liked);
        
        // 完全移除全局状态更新，避免触发其他组件重新渲染
        
      } catch (error) {
        console.error('点赞失败:', error);
        // 如果失败，恢复原来的状态
        setLocalLiked(!newLiked);
        setLocalLikes(localLikes);
        alert('点赞失败，请重试');
      } finally {
        setIsLiking(false);
      }
    };

    // 点击外部关闭菜单
    useEffect(() => {
      function handleClickOutside(event: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
          setShowMenu(false);
        }
      }

      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const handleDeletePost = async (e: React.MouseEvent) => {
      e.preventDefault(); // 阻止Link的跳转
      e.stopPropagation();

      if (!user || !canDelete) {
        alert("您没有权限删除此帖子");
        return;
      }

      const confirmDelete = window.confirm("确定要删除这篇帖子吗？删除后无法恢复。");
      if (!confirmDelete) {
        setShowMenu(false);
        return;
      }

      setIsDeleting(true);
      
      try {
        const success = await deletePostFromFirestore(post.id!, user.uid);
        
        if (success) {
          // 根据当前选中的分类重新加载帖子
          let updatedPosts;
          if (selectedCategory === "全部") {
            updatedPosts = await getAllPostsFromFirestore();
          } else {
            updatedPosts = await getPostsByCategoryFromFirestore(selectedCategory);
          }
          setPosts(updatedPosts);
          alert("帖子删除成功！");
        } else {
          alert("删除失败，您可能没有权限删除此帖子");
        }
      } catch (error) {
        console.error("删除失败:", error);
        alert("删除失败，请重试");
      } finally {
        setIsDeleting(false);
        setShowMenu(false);
      }
    };

    const handleMenuClick = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setShowMenu(!showMenu);
    };

    // 处理卡片点击导航到帖子详情
    const handleCardClick = () => {
      router.push(`/post/${post.id}`);
    };

    // 调试信息（开发环境下显示）
    useEffect(() => {
      if (process.env.NODE_ENV === 'development' && user && showMenu) {
        console.log('删除权限调试:', {
          postId: post.id,
          postTitle: post.title,
          postAuthorName: post.author?.name,
          postAuthorUID: post.author?.uid,
          currentUserUID: user.uid,
          currentUserEmail: user.email,
          isAuthor,
          isAdmin,
          canDelete
        });
      }
    }, [user, showMenu, post, isAuthor, isAdmin, canDelete]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer relative"
        onClick={handleCardClick}
      >
        {/* 三个点菜单按钮 */}
        <div className="absolute top-2 right-2 z-10" ref={menuRef}>
          <button
            onClick={handleMenuClick}
            className="p-2 bg-white/80 backdrop-blur-sm text-gray-600 rounded-full hover:bg-white hover:text-gray-900 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
            title="更多选项"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* 下拉菜单 */}
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
            >
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                  // 这里可以添加收藏功能
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Bookmark className="w-4 h-4" />
                <span>收藏</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowMenu(false);
                  // 这里可以添加分享功能
                }}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
              >
                <Share className="w-4 h-4" />
                <span>分享</span>
              </button>

              {/* 删除选项 - 只有作者才能看到 */}
              {canDelete && (
                <>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={handleDeletePost}
                    disabled={isDeleting}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={isAdmin ? "管理员删除" : "删除帖子"}
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>删除中...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        <span>{isAdmin && !isAuthor ? "管理员删除" : "删除"}</span>
                      </>
                    )}
                  </button>
                </>
              )}
            </motion.div>
          )}
        </div>
        
        <div className="relative overflow-hidden">
          {/* 使用3D轮播展示多张图片，如果只有一张或没有images数组则使用传统显示 */}
          {post.images && post.images.length > 1 ? (
            <ThreeDPhotoCarousel 
              images={post.images} 
              className="h-48"
            />
          ) : (
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
          />
          )}
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
            <Link 
              href={`/user/${post.author.uid}`}
              className="flex items-center space-x-2 hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors z-10 relative"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={post.author.avatar}
                alt={post.author.name}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-xs text-gray-600 font-medium hover:text-gray-900 transition-colors">
                {post.author.name}
              </span>
            </Link>
            
            <div className="flex items-center space-x-4 text-gray-500">
              {/* 点赞按钮 */}
              <button
                onClick={handleLike}
                disabled={isLiking}
                className={`flex items-center space-x-1 transition-colors duration-150 z-10 relative ${
                  localLiked 
                    ? 'text-red-500' 
                    : 'text-gray-500 hover:text-red-500'
                } ${isLiking ? 'opacity-75' : ''}`}
                title={localLiked ? '取消点赞' : '点赞'}
              >
                <Heart 
                  className={`w-4 h-4 transition-all duration-150 ${
                    localLiked ? 'fill-current scale-110' : ''
                  }`} 
                />
                <span className="text-xs font-medium">{localLikes}</span>
              </button>
              
              <div className="flex items-center space-x-1">
                <MessageCircle className="w-4 h-4" />
                <span className="text-xs">{post.comments}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

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
                  className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="清除搜索"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* 右侧按钮 */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* 发布按钮 */}
                  <Link href="/create">
                    <button className="notts-green text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95">
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">发布</span>
                    </button>
                  </Link>

                  {/* 聊天按钮 */}
                  <Link href="/chat">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 relative hover:scale-105 active:scale-95">
                      <MessageCircle className="w-5 h-5" />
                      {/* 未读消息数量标识 - 这里可以后续添加实时未读计数 */}
                      {/* <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span> */}
                    </button>
                  </Link>

                  {/* 通知按钮 */}
                  <Link href="/notifications">
                    <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 relative hover:scale-105 active:scale-95">
                      <Bell className="w-5 h-5" />
                      {unreadNotificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                          {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
                        </span>
                      )}
                    </button>
                  </Link>

                  {/* 用户头像菜单 */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={handleAvatarClick}
                      className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-green-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      {firestoreUserAvatar ? (
                        <img 
                          src={firestoreUserAvatar} 
                          alt={firestoreUserName || user.email || "用户"} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-gray-600" />
                      )}
                    </button>

                    {/* 用户下拉菜单 */}
                    {showUserMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50 animate-fadeInUp">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {firestoreUserName || '用户'}
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

                        {/* 管理员面板入口 */}
                        {isAdminUser(user) && (
                          <Link 
                            href="/admin"
                            className="w-full px-4 py-2 text-left text-sm text-yellow-600 hover:bg-yellow-50 flex items-center space-x-2"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Crown className="w-4 h-4" />
                            <span>管理面板</span>
                          </Link>
                        )}
                        
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button 
                            onClick={handleLogout}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>退出登录</span>
                          </button>
                        </div>
                      </div>
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
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 md:hidden hover:scale-105 active:scale-95">
                <Menu className="w-5 h-5" />
              </button>
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
              <span className={`text-xs px-2 py-1 rounded-full ${
                selectedCategory === "全部" 
                  ? "bg-white/20 text-white" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {getCategoryCount("全部")}
              </span>
            </button>

            {/* 学习按钮 */}
            <button
              onClick={() => router.push("/academic")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 bg-blue-100 text-blue-800 hover:shadow-md`}
            >
              <span>📚</span>
              <span className="text-sm font-medium">学习</span>
              <span className={`text-xs px-2 py-1 rounded-full bg-white/50 text-gray-600`}>
                {getCategoryCount("学习")}
              </span>
            </button>

            {categories.map((category) => {
              const count = getCategoryCount(category.name);
              return (
              <button
                key={category.name}
                onClick={() => {
                  if (category.name === "旅行") {
                    router.push("/travel");
                  } else {
                    setSelectedCategory(category.name);
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category.name
                    ? "bg-green-500 text-white shadow-lg"
                    : `${category.color} hover:shadow-md`
                }`}
              >
                <span>{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedCategory === category.name 
                      ? "bg-white/20 text-white" 
                      : "bg-white/50 text-gray-600"
                  }`}>
                    {count}
                  </span>
              </button>
              );
            })}
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
        {/* 临时调试按钮 */}
        {user && (
          <div className="mb-4">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              {showDebug ? '隐藏调试信息' : '显示调试信息'}
            </button>
          </div>
        )}

        {/* 调试信息 */}
        {showDebug && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h3 className="font-semibold text-yellow-800 mb-3">🔍 调试信息</h3>
            <div className="space-y-2 text-sm">
              <p><strong>当前选择分类:</strong> {selectedCategory}</p>
              <p><strong>加载的帖子数量:</strong> {posts.length}</p>
              <p><strong>筛选后帖子数量:</strong> {filteredPosts.length}</p>
              <p><strong>分类统计:</strong> {JSON.stringify(categoryStats)}</p>
              
              <div className="mt-4">
                <h4 className="font-medium text-yellow-800 mb-2">当前加载的帖子:</h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {posts.map((post, index) => (
                    <div key={index} className="text-xs bg-white p-2 rounded border">
                      <strong>{post.title}</strong> - 分类: <span className="text-red-600">{post.category || '未设置'}</span> - ID: {post.id}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 mb-4">加载帖子中...</p>
              <div className="text-sm text-gray-500 space-y-2">
                <p>💡 如果一直显示加载中，请尝试：</p>
                <div className="space-y-1">
                  <p>1. 按 F12 打开控制台查看错误信息</p>
                  <p>2. 确保已登录账户</p>
                  <p>3. 登录后可初始化测试数据</p>
                </div>
                {!user && (
                  <div className="mt-4">
                    <Link 
                      href="/login"
                      className="inline-block bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      立即登录
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : posts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">还没有帖子</h3>
              <p className="text-gray-600 mb-6">数据库中还没有帖子，你可以发布第一篇帖子或初始化一些测试数据。</p>
              <div className="space-x-4">
                <Link 
                  href="/create"
                  className="inline-block bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
                >
                  发布第一篇帖子
                </Link>
                <button
                  onClick={handleMigrateData}
                  className="inline-block bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                >
                  初始化测试数据
                </button>
              </div>
            </div>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                {selectedCategory !== "全部" ? `没有找到"${selectedCategory}"分类的帖子` : "没有找到相关帖子"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery ? `搜索"${searchQuery}"没有找到相关内容` : "该分类下暂时没有帖子"}
              </p>
              <div className="space-x-4">
                {selectedCategory !== "全部" && (
                  <button
                    onClick={() => setSelectedCategory("全部")}
                    className="inline-block bg-gray-500 text-white px-6 py-3 rounded-xl hover:bg-gray-600 transition-colors"
                  >
                    查看全部帖子
                  </button>
                )}
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="inline-block bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-colors"
                  >
                    清除搜索
                  </button>
                )}
                <Link 
                  href="/create"
                  className="inline-block bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
                >
                  发布新帖子
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <motion.div 
            key={selectedCategory + searchQuery} // 当分类或搜索改变时重新渲染动画
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {filteredPosts.map((post, index) => (
              <PostCard key={post.id} post={post} index={index} />
            ))}
          </motion.div>
        )}

        {/* 加载更多 */}
        {!loading && filteredPosts.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-12"
          >
            <button className="px-8 py-3 bg-white border-2 border-gray-200 text-gray-600 rounded-full hover:border-green-500 hover:text-green-600 transition-all duration-300 shadow-lg hover:shadow-xl">
              加载更多精彩内容
            </button>
          </motion.div>
        )}
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
          
          <Link href="/chat">
            <button className="flex flex-col items-center space-y-1 p-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-xs text-gray-600">聊天</span>
            </button>
          </Link>
          
          <Link href="/create">
            <button className="flex flex-col items-center space-y-1 p-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <Plus className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-xs text-gray-600">发布</span>
            </button>
          </Link>
          
          <Link href="/profile">
            <button className="flex flex-col items-center space-y-1 p-2">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-xs text-gray-600">我的</span>
            </button>
          </Link>
          
          <button className="flex flex-col items-center space-y-1 p-2">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Bell className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-xs text-gray-600">消息</span>
          </button>
        </div>
      </div>
    </div>
  );
} 