"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { uploadImageUltimate, uploadImageRobust, uploadImageSimple } from "@/lib/firebase-storage";
import Link from "next/link";

export default function QuickUploadPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult("");
      setErrorMessage("");
    }
  };

  const testUpload = async (uploadFunction: Function, name: string) => {
    if (!selectedFile || !user) {
      alert("请先选择文件并登录");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage("");
    setUploadResult("");

    const startTime = Date.now();

    try {
      const url = await uploadFunction(
        selectedFile,
        user.uid,
        (progress: number) => {
          setUploadProgress(progress);
        }
      );
      
      const duration = (Date.now() - startTime) / 1000;
      setUploadResult(url);
      alert(`${name}成功！耗时: ${duration.toFixed(2)}秒`);
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      setErrorMessage(errorMsg);
      alert(`${name}失败: ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <Link href="/login" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
            去登录
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 快速上传测试</h1>
          <p className="text-gray-600">简单三步，快速解决上传问题</p>
        </div>

        {/* 步骤1：选择文件 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📁 步骤1：选择图片</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          {selectedFile && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg">
              <p className="text-green-700">
                ✅ 已选择: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
              </p>
            </div>
          )}
        </div>

        {/* 步骤2：选择上传方式 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">⚡ 步骤2：选择上传方式</h2>
          <div className="space-y-4">
            <button
              onClick={() => testUpload(uploadImageUltimate, "终极上传")}
              disabled={!selectedFile || isUploading}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 font-bold text-lg"
            >
              ⚡ 终极上传 (推荐)
              <div className="text-sm font-normal mt-1">自动尝试多种策略，成功率最高</div>
            </button>
            
            <button
              onClick={() => testUpload(uploadImageRobust, "稳定上传")}
              disabled={!selectedFile || isUploading}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold text-lg"
            >
              🛡️ 稳定上传
              <div className="text-sm font-normal mt-1">如果终极上传失败，试试这个</div>
            </button>
            
            <button
              onClick={() => testUpload(uploadImageSimple, "简化上传")}
              disabled={!selectedFile || isUploading}
              className="w-full px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-bold text-lg"
            >
              📤 简化上传
              <div className="text-sm font-normal mt-1">最后的选择，用于排查问题</div>
            </button>
          </div>
        </div>

        {/* 步骤3：查看结果 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">📊 步骤3：查看结果</h2>
          
          {/* 上传进度 */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>上传进度</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* 成功结果 */}
          {uploadResult && (
            <div className="p-4 bg-green-50 rounded-lg mb-4">
              <h3 className="text-green-800 font-semibold mb-2">🎉 上传成功！</h3>
              <img src={uploadResult} alt="上传的图片" className="max-w-full h-48 object-cover rounded-lg" />
            </div>
          )}

          {/* 错误信息 */}
          {errorMessage && (
            <div className="p-4 bg-red-50 rounded-lg mb-4">
              <h3 className="text-red-800 font-semibold mb-2">❌ 上传失败</h3>
              <p className="text-red-700">{errorMessage}</p>
            </div>
          )}

          {/* 提示信息 */}
          {!selectedFile && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-700">请先选择一张图片开始测试</p>
            </div>
          )}
        </div>

        {/* 底部链接 */}
        <div className="text-center mt-8">
          <Link 
            href="/debug-upload" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            需要更详细的诊断？点击这里
          </Link>
        </div>
      </div>
    </div>
  );
} 