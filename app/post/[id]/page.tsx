"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Share, Bookmark, MoreVertical, Send, Trash2, User, MessageSquare, MapPin } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getPostByIdFromFirestore, 
  getCommentsWithRepliesFromFirestore,
  addCommentToFirestore,
  addReplyToCommentFirestore,
  deletePostFromFirestore,
  deleteCommentFromFirestore,
  toggleLike,
  toggleCommentLike,
  getUserLikeStatus,
  getUserCommentLikeStatus,
  formatTimestamp,
  type FirestorePost,
  type FirestoreComment 
} from "@/lib/firestore-posts";
import { isAdminUser } from "@/lib/admin-config";
import { ThreeDPhotoCarousel } from "@/components/ui/three-d-carousel";
import GoogleStreetViewEmbed from '@/components/Map/GoogleStreetViewEmbed';
import { getOrCreateConversation } from "@/lib/chat-service";

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
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // 正在回复的评论ID
  const [replyContent, setReplyContent] = useState("");
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [commentLikeStates, setCommentLikeStates] = useState<Record<string, { liked: boolean; likes: number }>>({});
  const [firestoreUserAvatar, setFirestoreUserAvatar] = useState<string>(''); // 新增：用户头像状态
  const [isStartingChat, setIsStartingChat] = useState(false); // 新增：聊天状态
  const menuRef = useRef<HTMLDivElement>(null);

  // 添加返回上一页的处理函数
  const handleGoBack = () => {
    // 检查是否有历史记录可以返回
    if (window.history.length > 1) {
      router.back();
    } else {
      // 如果没有历史记录，默认返回首页
      router.push('/');
    }
  };

  // 加载帖子和评论数据
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [postData, commentsData] = await Promise.all([
          getPostByIdFromFirestore(postId),
          getCommentsWithRepliesFromFirestore(postId) // 使用新的API获取带回复的评论
        ]);
        
        setPost(postData);
        setComments(commentsData);
        setLocalLikes(postData?.likes || 0);
        
        // 如果用户已登录，获取点赞状态
        if (user && postData) {
          const likeStatus = await getUserLikeStatus(postId, user.uid);
          setIsLiked(likeStatus);
          
          // 初始化评论点赞状态
          const commentLikePromises = getAllCommentsFromTree(commentsData).map(async (comment) => {
            if (comment.id) {
              const liked = await getUserCommentLikeStatus(comment.id, user.uid);
              return {
                id: comment.id,
                liked,
                likes: comment.likes || 0
              };
            }
            return null;
          });
          
          const commentLikeResults = await Promise.all(commentLikePromises);
          const commentStates: Record<string, { liked: boolean; likes: number }> = {};
          
          commentLikeResults.forEach(result => {
            if (result) {
              commentStates[result.id] = {
                liked: result.liked,
                likes: result.likes
              };
            }
          });
          
          setCommentLikeStates(commentStates);
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

  // 辅助函数：从评论树中获取所有评论（包括回复）
  const getAllCommentsFromTree = (comments: FirestoreComment[]): FirestoreComment[] => {
    const allComments: FirestoreComment[] = [];
    
    const traverse = (commentList: FirestoreComment[]) => {
      commentList.forEach(comment => {
        allComments.push(comment);
        if (comment.replies && comment.replies.length > 0) {
          traverse(comment.replies);
        }
      });
    };
    
    traverse(comments);
    return allComments;
  };

  // 重新加载评论的函数
  const reloadComments = async () => {
    try {
      const updatedComments = await getCommentsWithRepliesFromFirestore(postId);
      setComments(updatedComments);
      
      // 重新加载评论点赞状态
      if (user) {
        const commentLikePromises = getAllCommentsFromTree(updatedComments).map(async (comment) => {
          if (comment.id) {
            const liked = await getUserCommentLikeStatus(comment.id, user.uid);
            return {
              id: comment.id,
              liked,
              likes: comment.likes || 0
            };
          }
          return null;
        });
        
        const commentLikeResults = await Promise.all(commentLikePromises);
        const commentStates: Record<string, { liked: boolean; likes: number }> = {};
        
        commentLikeResults.forEach(result => {
          if (result) {
            commentStates[result.id] = {
              liked: result.liked,
              likes: result.likes
            };
          }
        });
        
        setCommentLikeStates(commentStates);
      }
    } catch (error) {
      console.error('重新加载评论失败:', error);
    }
  };

  // 定期刷新评论（可选）
  useEffect(() => {
    if (!postId) return;
    
    const interval = setInterval(() => {
      reloadComments();
    }, 30000); // 每30秒刷新一次评论
    
    return () => clearInterval(interval);
  }, [postId]);

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

  // 计算是否为作者和管理员权限（在hooks之后）
  const isAuthor = user && post?.author.uid && user.uid === post.author.uid;
  const isAdmin = user && isAdminUser(user);
  const canDelete = isAdmin || isAuthor; // 管理员或作者都可以删除

  // 调试信息（开发环境下显示）- 只在菜单打开时显示
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user && showMenu && post) {
      console.log('详情页删除权限调试:', {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        postAuthorUID: post.author.uid,
        postAuthorName: post.author.name,
        isAuthor,
        isAdmin,
        canDelete
      });
    }
  }, [user, showMenu, post, isAuthor, isAdmin, canDelete]);

  // 获取当前用户的头像
  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user) {
        setFirestoreUserAvatar('');
        return;
      }
      
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setFirestoreUserAvatar(userData.photoURL || user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face");
        } else {
          setFirestoreUserAvatar(user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face");
        }
      } catch (error) {
        console.error('获取用户头像失败:', error);
        setFirestoreUserAvatar(user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face");
      }
    };

    fetchUserAvatar();
    
    // 监听头像更新事件
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (user && event.detail.uid === user.uid) {
        console.log('帖子详情页面收到头像更新事件:', event.detail.newAvatarUrl);
        setFirestoreUserAvatar(event.detail.newAvatarUrl);
      }
    };
    
    // 监听用户资料更新事件
    const handleProfileUpdate = (event: CustomEvent) => {
      if (user && event.detail.uid === user.uid) {
        console.log('帖子详情页面收到用户资料更新事件:', event.detail.profile);
        setFirestoreUserAvatar(event.detail.profile.photoURL);
      }
    };

    window.addEventListener('userAvatarUpdated', handleAvatarUpdate as EventListener);
    window.addEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    
    return () => {
      window.removeEventListener('userAvatarUpdated', handleAvatarUpdate as EventListener);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate as EventListener);
    };
  }, [user]);

  // 处理分享功能
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("链接已复制到剪贴板");
    } catch (error) {
      console.error('复制链接失败:', error);
      alert("复制失败，请手动复制链接");
    }
  };

  // 处理发起聊天
  const handleStartChat = async () => {
    if (!user || !post) {
      alert('请先登录才能发起聊天');
      return;
    }

    if (user.uid === post.author.uid) {
      // 如果是自己的帖子，不显示聊天按钮（这个检查是额外的保险）
      return;
    }

    setIsStartingChat(true);

    try {
      // 获取当前用户的Firestore信息
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      let currentUserName = user.displayName || '用户';
      let currentUserAvatar = firestoreUserAvatar || user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face";
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          currentUserName = userData.displayName || user.displayName || '用户';
          currentUserAvatar = userData.photoURL || user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face";
        }
      } catch (error) {
        console.warn('获取当前用户信息失败，使用默认信息:', error);
      }

      // 创建或查找会话
      const conversationId = await getOrCreateConversation(
        user.uid,
        post.author.uid!,
        currentUserName,
        currentUserAvatar,
        post.author.name,
        post.author.avatar
      );

      console.log('会话创建/获取成功:', conversationId);
      
      // 跳转到聊天页面
      router.push(`/chat?conversationId=${conversationId}`);
      
    } catch (error) {
      console.error('创建聊天会话失败:', error);
      
      let errorMessage = '创建聊天失败，请重试';
      if (error instanceof Error) {
        if (error.message.includes('权限')) {
          errorMessage = '权限不足，无法创建聊天会话';
        } else if (error.message.includes('网络')) {
          errorMessage = '网络连接问题，请检查网络后重试';
        } else {
          errorMessage = `创建聊天失败: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setIsStartingChat(false);
    }
  };

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

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('请先登录才能发表评论');
      return;
    }
    
    if (!newComment.trim()) {
      alert('评论内容不能为空');
      return;
    }

    setIsSubmittingComment(true);
    
    try {
      // 获取用户的Firestore信息
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      let userName = user.displayName || '用户';
      let userAvatar = firestoreUserAvatar || user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face";
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userName = userData.displayName || user.displayName || '用户';
          userAvatar = userData.photoURL || user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face";
        }
      } catch (error) {
        console.warn('获取用户信息失败，使用默认信息:', error);
      }

      // 添加评论到数据库
      const commentId = await addCommentToFirestore({
        postId: postId,
        content: newComment.trim(),
        author: {
          name: userName,
          avatar: userAvatar,
          uid: user.uid
        }
      });
      
      if (commentId) {
        // 评论添加成功，清空输入框
        setNewComment("");
        
        // 重新加载评论列表
        const updatedComments = await getCommentsWithRepliesFromFirestore(postId);
        setComments(updatedComments);
        
        // 更新帖子的评论数量
        if (post) {
          setPost({
            ...post,
            comments: post.comments + 1
          });
        }
        
        // 平滑滚动到评论区底部
        setTimeout(() => {
          const commentsSection = document.querySelector('#comments-section');
          if (commentsSection) {
            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 100);
      } else {
        alert('评论发表失败，请重试');
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      alert('评论发表失败，请重试');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
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

  // 删除评论
  const handleDeleteComment = async (commentId: string) => {
    if (!user) {
      alert('请先登录');
      return;
    }

    const confirmDelete = window.confirm("确定要删除这条评论吗？删除后无法恢复。");
    if (!confirmDelete) return;

    try {
      const success = await deleteCommentFromFirestore(commentId, user.uid);
      
      if (success) {
        // 重新加载评论和帖子数据
        await reloadComments();
        
        // 重新加载帖子以更新评论数量
        const updatedPost = await getPostByIdFromFirestore(postId);
        if (updatedPost) {
          setPost(updatedPost);
        }
      } else {
        alert('删除失败，您可能没有权限删除此评论');
      }
    } catch (error) {
      console.error('删除评论失败:', error);
      alert('删除失败，请重试');
    }
  };

  // 点赞评论
  const handleCommentLike = async (commentId: string) => {
    if (!user) {
      alert('请先登录才能点赞');
      return;
    }

    try {
      // 先更新本地状态
      const currentState = commentLikeStates[commentId] || { liked: false, likes: 0 };
      const newLiked = !currentState.liked;
      const newLikes = newLiked ? currentState.likes + 1 : currentState.likes - 1;
      
      setCommentLikeStates(prev => ({
        ...prev,
        [commentId]: {
          liked: newLiked,
          likes: newLikes
        }
      }));

      // 调用API
      const result = await toggleCommentLike(commentId, user.uid);
      
      // 更新为服务器返回的准确状态
      setCommentLikeStates(prev => ({
        ...prev,
        [commentId]: {
          liked: result.liked,
          likes: result.likesCount
        }
      }));
      
    } catch (error) {
      console.error('点赞评论失败:', error);
      // 恢复原始状态
      const originalState = commentLikeStates[commentId] || { liked: false, likes: 0 };
      setCommentLikeStates(prev => ({
        ...prev,
        [commentId]: originalState
      }));
      alert('点赞失败，请重试');
    }
  };

  // 提交回复
  const handleSubmitReply = async () => {
    if (!user || !replyingTo || !replyContent.trim()) {
      alert('请输入回复内容');
      return;
    }

    setIsSubmittingReply(true);
    
    try {
      // 获取用户的Firestore信息
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      let userName = user.displayName || '用户';
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          userName = userData.displayName || user.displayName || '用户';
        }
      } catch (error) {
        console.warn('获取用户信息失败，使用默认信息:', error);
      }

      // 添加回复
      const replyId = await addReplyToCommentFirestore({
        postId: postId,
        parentId: replyingTo,
        content: replyContent.trim(),
        author: {
          name: userName,
          avatar: user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
          uid: user.uid
        }
      });
      
      if (replyId) {
        // 清空回复状态
        setReplyContent("");
        setReplyingTo(null);
        
        // 重新加载评论
        await reloadComments();
        
        // 更新帖子的评论数量
        if (post) {
          setPost({
            ...post,
            comments: post.comments + 1
          });
        }
      } else {
        alert('回复发表失败，请重试');
      }
    } catch (error) {
      console.error('提交回复失败:', error);
      alert('回复发表失败，请重试');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <motion.header
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="bg-white shadow-sm sticky top-0 z-30"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button 
              onClick={handleGoBack}
              className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回</span>
            </button>
            
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
              <button
                onClick={handleShare}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                title="分享帖子"
              >
                <Share className="w-5 h-5" />
              </button>
              
              {/* 三个点菜单 */}
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={handleMenuClick}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <MoreVertical className="w-5 h-5" />
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

                    {/* 删除选项 - 只有作者才能看到 */}
                    {canDelete && (
                      <>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={handleDeletePost}
                          disabled={isDeleting}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={isAdmin && !isAuthor ? "管理员删除" : "删除帖子"}
                        >
                          {isDeleting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              <span>删除中...</span>
                            </>
                          ) : (
                            <>
                              <Trash2 className="w-4 h-4" />
                              <span>{isAdmin && !isAuthor ? "管理员删除" : "删除帖子"}</span>
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
      </motion.header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
        >
          {/* 帖子头图 */}
          <div className="relative h-64 md:h-80">
            {/* 使用3D轮播展示多张图片，如果只有一张或没有images数组则使用传统显示 */}
            {post.images && post.images.length > 1 ? (
              <ThreeDPhotoCarousel 
                images={post.images} 
                className="h-full"
              />
            ) : (
            <img
              src={post.image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
            )}
            {/* 只在非3D轮播时显示渐变层 */}
            {!(post.images && post.images.length > 1) && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            )}
            {/* 文字层 - 设置pointer-events-none让点击穿透 */}
            <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
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

          {/* 租房帖子的街景视图 */}
          {post.category === '租房' && (post.embedHtml || post.location) && (
            <div className="mb-6">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                  建筑外观 - 街景视图
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  360° 街景视图，拖动查看房屋周围环境
                </p>
              </div>
              <div className="px-6 pb-6">
                {post.embedHtml ? (
                  // 解析嵌入HTML中的iframe src
                  (() => {
                    try {
                      // 从HTML字符串中提取iframe的src属性
                      const srcMatch = post.embedHtml.match(/src="([^"]+)"/);
                      const iframeSrc = srcMatch ? srcMatch[1] : null;
                      
                      if (iframeSrc) {
                        return (
                          <iframe
                            src={iframeSrc}
                            width="100%"
                            height="500"
                            style={{ border: 0, borderRadius: '8px' }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Google Street View"
                          />
                        );
                      } else {
                        // 如果无法解析，显示错误信息
                        return (
                          <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-gray-500">街景视图加载失败，请联系管理员</p>
                          </div>
                        );
                      }
                    } catch (error) {
                      console.error('解析嵌入HTML失败:', error);
                      return (
                        <div className="w-full h-[500px] bg-gray-100 rounded-lg flex items-center justify-center">
                          <p className="text-gray-500">街景视图解析失败</p>
                        </div>
                      );
                    }
                  })()
                ) : (
                  // 备用方案：使用之前的组件（兼容旧数据）
                  <GoogleStreetViewEmbed
                    address={post.location?.address}
                    latitude={post.location?.latitude}
                    longitude={post.location?.longitude}
                    height="h-[500px]"
                  />
                )}
              </div>
            </div>
          )}

          {/* 作者信息和互动 */}
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* 可点击的头像，跳转到用户资料页面 */}
                <Link 
                  href={`/user/${post.author.uid}`}
                  className="flex-shrink-0 hover:scale-105 transition-transform"
                  title={`查看 ${post.author.name} 的资料`}
                >
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-transparent hover:border-green-300 transition-colors"
                />
                </Link>
                <div className="flex-1">
                  <Link 
                    href={`/user/${post.author.uid}`}
                    className="hover:text-green-600 transition-colors"
                  >
                  <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                  </Link>
                  <p className="text-sm text-gray-500">
                    {post.author.university} · {post.author.year} · {formatTimestamp(post.createdAt)}
                  </p>
                </div>
                
                {/* 发起聊天按钮 - 只有当前用户不是作者时才显示 */}
                {user && user.uid !== post.author.uid && (
                  <button
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                    title="发起聊天"
                  >
                    {isStartingChat ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm">连接中...</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">发起聊天</span>
                      </>
                    )}
                  </button>
                )}
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
            id="comments-section"
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
              {user ? (
                <form onSubmit={handleSubmitComment} className="mb-6">
                  <div className="flex space-x-4">
                    <img
                      src={firestoreUserAvatar}
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
                        disabled={isSubmittingComment}
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          type="submit"
                          disabled={!newComment.trim() || isSubmittingComment}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                          {isSubmittingComment ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>发表中...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>发表</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-gray-600 mb-3">请登录后发表评论</p>
                  <Link 
                    href="/login" 
                    className="inline-block bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
                  >
                    去登录
                  </Link>
                </div>
              )}
            </div>

            {/* 评论列表 */}
            <div className="divide-y divide-gray-100">
              {comments.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium mb-1">还没有评论</p>
                  <p className="text-sm">成为第一个发表评论的人吧！</p>
                </div>
              ) : (
                comments.map((comment, index) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    index={index}
                    currentUser={user}
                    currentUserAvatar={firestoreUserAvatar}
                    isAdmin={isAdmin || false}
                    commentLikeStates={commentLikeStates}
                    handleCommentLike={handleCommentLike}
                    handleDeleteComment={handleDeleteComment}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyContent={replyContent}
                    setReplyContent={setReplyContent}
                    handleSubmitReply={handleSubmitReply}
                    isSubmittingReply={isSubmittingReply}
                  />
                ))
              )}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}

// CommentItem 组件
function CommentItem({ 
  comment, 
  index, 
  currentUser, 
  currentUserAvatar,
  isAdmin, 
  commentLikeStates,
  handleCommentLike,
  handleDeleteComment,
  replyingTo,
  setReplyingTo,
  replyContent,
  setReplyContent,
  handleSubmitReply,
  isSubmittingReply
}: {
  comment: FirestoreComment;
  index: number;
  currentUser: any;
  currentUserAvatar: string;
  isAdmin: boolean;
  commentLikeStates: Record<string, { liked: boolean; likes: number }>;
  handleCommentLike: (commentId: string) => void;
  handleDeleteComment: (commentId: string) => void;
  replyingTo: string | null;
  setReplyingTo: (commentId: string | null) => void;
  replyContent: string;
  setReplyContent: (content: string) => void;
  handleSubmitReply: () => void;
  isSubmittingReply: boolean;
}) {
  const isCommentAuthor = currentUser && comment.author.uid && currentUser.uid === comment.author.uid;
  const canDeleteComment = isAdmin || isCommentAuthor;
  const commentLikeState = commentLikeStates[comment.id!] || { liked: false, likes: comment.likes };

  return (
    <motion.div
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
            <button 
              onClick={() => handleCommentLike(comment.id!)}
              className={`flex items-center space-x-1 transition-colors ${
                commentLikeState.liked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${commentLikeState.liked ? 'fill-current' : ''}`} />
              <span className="text-sm">{commentLikeState.likes}</span>
            </button>
            <button 
              onClick={() => setReplyingTo(comment.id!)}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              回复
            </button>
            {canDeleteComment && (
              <button 
                onClick={() => handleDeleteComment(comment.id!)}
                className="text-sm text-red-500 hover:text-red-700 transition-colors"
              >
                删除
              </button>
            )}
          </div>

          {/* 回复表单 */}
          {replyingTo === comment.id && currentUser && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex space-x-3">
                <img
                  src={currentUserAvatar}
                  alt="Your avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`回复 ${comment.author.name}...`}
                    className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                    rows={2}
                    disabled={isSubmittingReply}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setReplyContent("");
                      }}
                      disabled={isSubmittingReply}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSubmitReply}
                      disabled={!replyContent.trim() || isSubmittingReply}
                      className="flex items-center space-x-1 px-3 py-1 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {isSubmittingReply ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>回复中...</span>
                        </>
                      ) : (
                        <span>回复</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 回复列表 */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 pl-4 border-l-2 border-gray-100">
              {comment.replies.map((reply, replyIndex) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  index={replyIndex}
                  currentUser={currentUser}
                  currentUserAvatar={currentUserAvatar}
                  isAdmin={isAdmin || false}
                  commentLikeStates={commentLikeStates}
                  handleCommentLike={handleCommentLike}
                  handleDeleteComment={handleDeleteComment}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  handleSubmitReply={handleSubmitReply}
                  isSubmittingReply={isSubmittingReply}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
} 