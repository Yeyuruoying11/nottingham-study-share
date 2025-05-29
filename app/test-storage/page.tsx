"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImageUltimate, uploadImageSimple } from '@/lib/firebase-storage';

export default function TestStoragePage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult('');
      setError('');
      setProgress(0);
      setDiagnostics([]);
    }
  };

  const addDiagnostic = (message: string) => {
    setDiagnostics(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testUpload = async () => {
    if (!file || !user) {
      setError('请选择文件并登录');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');
    setResult('');
    setDiagnostics([]);

    try {
      addDiagnostic('开始上传测试...');
      addDiagnostic(`文件信息: ${file.name}, ${file.size} bytes, ${file.type}`);
      addDiagnostic(`用户: ${user.email}`);
      
      const imageUrl = await uploadImageUltimate(
        file,
        user.uid,
        (progressValue) => {
          setProgress(progressValue);
          addDiagnostic(`上传进度: ${progressValue}%`);
        }
      );

      addDiagnostic('上传成功!');
      setResult(`上传成功！图片URL: ${imageUrl}`);
    } catch (error: any) {
      addDiagnostic(`上传失败: ${error.message}`);
      setError(`上传失败: ${error.message || error.toString()}`);
      
      // 额外的错误信息
      if (error.code) {
        addDiagnostic(`错误代码: ${error.code}`);
      }
    } finally {
      setUploading(false);
    }
  };

  const testSimpleUpload = async () => {
    if (!file || !user) {
      setError('请选择文件并登录');
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');
    setResult('');
    setDiagnostics([]);

    try {
      addDiagnostic('开始简单上传测试...');
      
      const imageUrl = await uploadImageSimple(
        file,
        user.uid,
        (progressValue) => {
          setProgress(progressValue);
          addDiagnostic(`上传进度: ${progressValue}%`);
        }
      );

      addDiagnostic('简单上传成功!');
      setResult(`简单上传成功！图片URL: ${imageUrl}`);
    } catch (error: any) {
      addDiagnostic(`简单上传失败: ${error.message}`);
      setError(`简单上传失败: ${error.message || error.toString()}`);
    } finally {
      setUploading(false);
    }
  };

  const runDiagnostics = async () => {
    setDiagnostics([]);
    addDiagnostic('开始运行诊断...');
    
    try {
      // 检查Firebase配置
      const { storage } = await import('@/lib/firebase');
      addDiagnostic('✅ Firebase Storage初始化成功');
      addDiagnostic(`📦 Storage bucket: ${storage.app.options.storageBucket}`);
      
      // 检查用户状态
      if (user) {
        addDiagnostic(`✅ 用户已登录: ${user.email}`);
        addDiagnostic(`👤 用户ID: ${user.uid}`);
      } else {
        addDiagnostic('❌ 用户未登录');
        return;
      }
      
      // 检查网络连接
      addDiagnostic('🌐 检查网络连接...');
      try {
        const response = await fetch('https://firebasestorage.googleapis.com', { method: 'HEAD' });
        if (response.ok) {
          addDiagnostic('✅ Firebase Storage网络连接正常');
        } else {
          addDiagnostic(`⚠️ Firebase Storage响应异常: ${response.status}`);
        }
      } catch (networkError) {
        addDiagnostic(`❌ 网络连接问题: ${networkError}`);
      }
      
      addDiagnostic('✅ 诊断完成');
      
    } catch (error: any) {
      addDiagnostic(`❌ 诊断过程出错: ${error.message}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Storage 上传测试</h1>
          <p className="text-gray-600 mb-6">请先登录才能测试上传功能</p>
          <a href="/login" className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600">
            去登录
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Firebase Storage 上传测试</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：测试区域 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">上传测试</h2>
            
            {/* 文件选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择图片文件
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {file && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>文件: {file.name}</p>
                  <p>大小: {(file.size / 1024).toFixed(2)} KB</p>
                  <p>类型: {file.type}</p>
                </div>
              )}
            </div>

            {/* 进度条 */}
            {uploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>上传进度</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* 按钮区域 */}
            <div className="space-y-3">
              <button
                onClick={runDiagnostics}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                disabled={uploading}
              >
                运行诊断
              </button>
              
              <button
                onClick={testSimpleUpload}
                disabled={!file || uploading}
                className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:opacity-50"
              >
                测试简单上传
              </button>
              
              <button
                onClick={testUpload}
                disabled={!file || uploading}
                className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                测试终极上传
              </button>
            </div>

            {/* 结果显示 */}
            {result && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="text-green-800 font-medium mb-2">上传成功</h3>
                <p className="text-green-700 text-sm break-all">{result}</p>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-red-800 font-medium mb-2">上传失败</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* 右侧：诊断日志 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4">诊断日志</h2>
            
            <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto">
              {diagnostics.length === 0 ? (
                <p className="text-gray-400 text-sm">点击"运行诊断"开始检查...</p>
              ) : (
                <div className="space-y-1">
                  {diagnostics.map((log, index) => (
                    <div key={index} className="text-sm font-mono">
                      <span className="text-green-400">[{index + 1}]</span>
                      <span className="text-gray-100 ml-2">{log}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setDiagnostics([])}
              className="mt-4 w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600"
            >
              清空日志
            </button>
          </div>
        </div>

        {/* 返回按钮 */}
        <div className="mt-8 text-center">
          <a 
            href="/"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← 返回首页
          </a>
        </div>
      </div>
    </div>
  );
} 