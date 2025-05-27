"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImageSmart } from '@/lib/firebase-storage';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setImageUrl(null);
      setProgress(0);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) {
      setError('请选择文件并确保已登录');
      return;
    }

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      console.log('开始上传测试...');
      const url = await uploadImageSmart(file, user.uid, (progress) => {
        setProgress(progress);
      });
      
      setImageUrl(url);
      console.log('上传成功！URL:', url);
      alert('上传成功！');
    } catch (error) {
      console.error('上传失败:', error);
      setError(error instanceof Error ? error.message : '上传失败');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Storage 上传测试</h1>
          <p className="text-gray-600">请先登录才能测试上传功能</p>
          <a href="/login" className="mt-4 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            去登录
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">🧪 Firebase Storage 上传测试</h1>
          
          {/* 用户信息 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">当前用户</h2>
            <p className="text-blue-700">用户ID: {user.uid}</p>
            <p className="text-blue-700">邮箱: {user.email}</p>
          </div>

          {/* 文件选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择图片文件
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {file && (
              <div className="mt-2 text-sm text-gray-600">
                <p>文件名: {file.name}</p>
                <p>文件大小: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <p>文件类型: {file.type}</p>
              </div>
            )}
          </div>

          {/* 上传按钮 */}
          <div className="mb-6">
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {uploading ? `上传中... ${progress}%` : '开始上传'}
            </button>
          </div>

          {/* 进度条 */}
          {uploading && (
            <div className="mb-6">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-center text-sm text-gray-600 mt-2">{progress}%</p>
            </div>
          )}

          {/* 错误信息 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">❌ 上传失败</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 成功结果 */}
          {imageUrl && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">✅ 上传成功！</h3>
              <p className="text-green-700 text-sm mb-4 break-all">URL: {imageUrl}</p>
              <img 
                src={imageUrl} 
                alt="上传的图片" 
                className="max-w-full h-auto rounded-lg shadow-md"
                onLoad={() => console.log('图片加载成功')}
                onError={() => console.error('图片加载失败')}
              />
            </div>
          )}

          {/* 测试说明 */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">📋 测试说明</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 选择一张图片文件（支持 JPG、PNG、GIF 等格式）</li>
              <li>• 文件大小不超过 5MB</li>
              <li>• 上传成功后会显示图片和下载URL</li>
              <li>• 图片会自动压缩以提高上传速度</li>
              <li>• 打开浏览器控制台查看详细日志</li>
            </ul>
          </div>

          {/* 返回按钮 */}
          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="inline-block bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 