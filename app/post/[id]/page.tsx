"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  getPostByIdFromFirestore, 
  getCommentsByPostIdFromFirestore, 
  deletePostFromFirestore,
  formatTimestamp,
  toggleLike,
  getUserLikeStatus,
  type FirestorePost,
  type FirestoreComment
} from "@/lib/firestore-posts";
import { useAuth } from "@/contexts/AuthContext";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const postId = params.id as string;
  
  const [post, setPost] = useState<FirestorePost | null>(null);
  const [comments, setComments] = useState<FirestoreComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [localLikes, setLocalLikes] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 加载帖子和评论数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [postData, commentsData] = await Promise.all([
          getPostByIdFromFirestore(postId),
          getCommentsByPostIdFromFirestore(postId)
        ]);
        
        setPost(postData);
        setComments(commentsData);
        setLocalLikes(postData?.likes || 0);
        
        // 如果用户已登录，获取点赞状态
        if (user && postData) {
          const likeStatus = await getUserLikeStatus(postId, user.uid);
          setIsLiked(likeStatus);
        }
      } catch (error) {
        console.error('加载数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    if (postId) {
      loadData();
    }
  }, [postId, user]);

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

  // 计算是否为作者（在hooks之后）
  const isAuthor = user && post?.author.uid && user.uid === post.author.uid;

  // 调试信息（开发环境下显示）- 只在菜单打开时显示
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user && showMenu && post) {
      console.log('详情页 - 用户信息:', {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email
      });
      console.log('详情页 - 帖子作者UID:', post.author.uid);
      console.log('详情页 - 是否为作者:', isAuthor);
    }
  }, [user, showMenu, post, isAuthor]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">帖子未找到</h1>
          <Link href="/" className="text-green-600 hover:text-green-700">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  const handleLike = async () => {
    if (!user) {
      alert('请先登录才能点赞');
      return;
    }

    if (isLiking) return;

    // 先更新本地状态，提供即时反馈
    const newLiked = !isLiked;
    const newLikes = newLiked ? localLikes + 1 : localLikes - 1;
    
    setIsLiked(newLiked);
    setLocalLikes(newLikes);
    setIsLiking(true);
    
    try {
      const result = await toggleLike(postId, user.uid);
      
      // 确保本地状态与服务器状态一致
      setIsLiked(result.liked);
      setLocalLikes(result.likesCount);
      
      // 更新帖子数据
      if (post) {
        setPost({
          ...post,
          likes: result.likesCount
        });
      }
      
    } catch (error) {
      console.error('点赞失败:', error);
      // 如果失败，恢复原来的状态
      setIsLiked(!newLiked);
      setLocalLikes(localLikes);
      alert('点赞失败，请重试');
    } finally {
      setIsLiking(false);
    }
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      console.log("New comment:", newComment);
      setNewComment("");
    }
  };

  const handleDeletePost = async () => {
    if (!user || !isAuthor) {
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
      const success = await deletePostFromFirestore(postId, user.uid);
      
      if (success) {
        alert("帖子删除成功！");
        router.push("/");
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

  const handleMenuClick = () => {
    setShowMenu(!showMenu);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回</span>
            </Link>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBookmark}
                className={`p-2 rounded-xl transition-all ${
                  isBookmarked 
                    ? "bg-yellow-100 text-yellow-600" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Bookmark className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <Share className="w-5 h-5" />
              </button>
              
              {/* 三个点菜单 */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={handleMenuClick}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* 下拉菜单 */}
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                  >
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        // 这里可以添加举报功能
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <span>🚨</span>
                      <span>举报</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        // 这里可以添加复制链接功能
                        navigator.clipboard.writeText(window.location.href);
                        alert("链接已复制到剪贴板");
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <span>🔗</span>
                      <span>复制链接</span>
                    </button>

                    {/* 删除选项 - 只有作者才能看到 */}
                    {isAuthor && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={handleDeletePost}
                          disabled={isDeleting}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>删除中...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              <span>删除帖子</span>
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* 帖子头图 */}
          <div className="relative h-64 md:h-80">
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
                {post.title}
              </h1>
            </div>
          </div>

          {/* 作者信息和互动 */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                  <p className="text-sm text-gray-500">
                    {post.author.university} · {post.author.year} · {formatTimestamp(post.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center space-x-2 transition-colors duration-150 ${
                    isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                  } ${isLiking ? 'opacity-75' : ''}`}
                  title={isLiked ? '取消点赞' : '点赞'}
                >
                  <Heart 
                    className={`w-5 h-5 transition-all duration-150 ${
                      isLiked ? "fill-current scale-110" : ""
                    }`} 
                  />
                  <span className="font-medium">{localLikes}</span>
                </button>
                
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span className="font-medium">{post.comments}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 帖子内容 */}
          <div className="p-6">
            <div className="prose prose-lg max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {post.fullContent}
              </div>
            </div>
          </div>
        </motion.article>

        {/* 评论区 */}
        {showComments && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                评论 ({comments.length})
              </h2>
              
              {/* 发表评论 */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex space-x-4">
                  <img
                    src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="写下你的评论..."
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!newComment.trim()}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="w-4 h-4" />
                        <span>发表</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* 评论列表 */}
            <div className="divide-y divide-gray-100">
              {comments.map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-6"
                >
                  <div className="flex space-x-4">
                    <img
                      src={comment.author.avatar}
                      alt={comment.author.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {comment.author.name}
                        </h4>
                        <span className="text-sm text-gray-500">
                          {formatTimestamp(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 mb-3 leading-relaxed">
                        {comment.content}
                      </p>
                      <div className="flex items-center space-x-4">
                        <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm">{comment.likes}</span>
                        </button>
                        <button className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                          回复
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
} 