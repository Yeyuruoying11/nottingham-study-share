"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Heart, MessageCircle, Share, Bookmark, MoreHorizontal, Send } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getPostById, getCommentsByPostId } from "@/lib/posts-data";

export default function PostDetailPage() {
  const params = useParams();
  const postId = parseInt(params.id as string);
  const post = getPostById(postId);
  const comments = getCommentsByPostId(postId);
  
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [showComments, setShowComments] = useState(true);

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

  const handleLike = () => {
    setIsLiked(!isLiked);
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
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-all">
                <MoreHorizontal className="w-5 h-5" />
              </button>
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
                    {post.author.university} · {post.author.year} · {post.createdAt}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 transition-all ${
                    isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                  <span className="font-medium">{post.likes + (isLiked ? 1 : 0)}</span>
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
                          {comment.createdAt}
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