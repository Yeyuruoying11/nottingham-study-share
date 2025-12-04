"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, AlertCircle, CheckCircle, Send } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!email) {
        throw new Error("请输入邮箱地址");
      }

      const result = await resetPassword(email);
      
      if (result.success) {
        setSuccess(result.message || "密码重置邮件已发送，请检查您的邮箱（包括垃圾邮件文件夹）");
        setEmail(""); // 清空输入
      } else {
        setError(result.error || "发送失败，请重试");
      }
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError(error.message || "发送失败，请重试");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* 动态背景 */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-blue-500 to-purple-600">
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
      </div>

      {/* 浮动元素 */}
      <motion.div
        className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 right-20 w-24 h-24 bg-yellow-300/20 rounded-full blur-xl"
        animate={{
          y: [0, 20, 0],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* 主要内容 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-md mx-4 shadow-2xl border border-white/20"
      >
        {/* Logo和标题 */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-4 notts-green rounded-2xl flex items-center justify-center shadow-lg"
          >
            <span className="text-white text-2xl font-bold">N</span>
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">找回密码</h1>
          <p className="text-white/80 text-sm">输入您的邮箱，我们将发送密码重置链接</p>
        </div>

        {/* 错误和成功消息 */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0" />
            <span className="text-red-100 text-sm">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg"
          >
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-300" />
              <span className="text-green-100 font-medium">邮件已发送！</span>
            </div>
            <p className="text-green-100/80 text-sm">{success}</p>
          </motion.div>
        )}

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 邮箱输入 */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="请输入注册时使用的邮箱"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-300"
                required
                disabled={isLoading}
              />
            </div>
          </motion.div>

          {/* 提交按钮 */}
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            type="submit"
            disabled={isLoading}
            className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send className="mr-2 w-5 h-5" />
                发送重置邮件
              </>
            )}
          </motion.button>
        </form>

        {/* 提示信息 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10"
        >
          <h3 className="text-white/90 text-sm font-medium mb-2">📧 温馨提示</h3>
          <ul className="text-white/70 text-xs space-y-1">
            <li>• 重置链接将发送到您的注册邮箱</li>
            <li>• 请检查垃圾邮件文件夹</li>
            <li>• 链接有效期为1小时</li>
            <li>• 如果仍未收到，请稍后重试</li>
          </ul>
        </motion.div>

        {/* 返回登录链接 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-6"
        >
          <Link 
            href="/login" 
            className="text-white/80 hover:text-white text-sm transition-colors inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回登录
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

