'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadImageWithProgress } from '@/lib/firebase-storage';

export default function TestUploadCloud() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult('');
      setError('');
    }
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

    try {
      console.log('🚀 开始云端上传测试...');
      console.log('文件信息:', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      console.log('用户信息:', {
        uid: user.uid,
        email: user.email
      });

      const imageUrl = await uploadImageWithProgress(
        file,
        user.uid,
        (progressValue) => {
          console.log('上传进度:', progressValue + '%');
          setProgress(progressValue);
        }
      );

      console.log('✅ 上传成功:', imageUrl);
      setResult(`上传成功！图片URL: ${imageUrl}`);
    } catch (error: any) {
      console.error('❌ 上传失败:', error);
      setError(`上传失败: ${error.message || error.toString()}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            云端图片上传测试
          </h1>

          {!user && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <p className="text-yellow-800">请先登录才能测试上传功能</p>
            </div>
          )}

          <div className="space-y-6">
            {/* 文件选择 */}
            <div>
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
                <p className="mt-2 text-sm text-gray-600">
                  已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {/* 上传按钮 */}
            <button
              onClick={testUpload}
              disabled={!file || !user || uploading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {uploading ? `上传中... ${progress}%` : '开始上传测试'}
            </button>

            {/* 进度条 */}
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            {/* 结果显示 */}
            {result && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-green-800 font-medium mb-2">上传成功！</h3>
                <p className="text-green-700 text-sm break-all">{result}</p>
              </div>
            )}

            {/* 错误显示 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-red-800 font-medium mb-2">上传失败</h3>
                <p className="text-red-700 text-sm break-all">{error}</p>
                
                {error.includes('CORS') && (
                  <div className="mt-4 p-3 bg-red-100 rounded">
                    <h4 className="font-medium text-red-800 mb-2">CORS错误解决方案：</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>1. CORS配置可能需要几分钟才能生效</li>
                      <li>2. 尝试等待5-10分钟后重试</li>
                      <li>3. 检查Firebase Storage的安全规则</li>
                      <li>4. 确认Vercel域名已添加到CORS配置中</li>
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 调试信息 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-2">调试信息</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>当前域名: {typeof window !== 'undefined' ? window.location.origin : 'N/A'}</p>
                <p>用户状态: {user ? '已登录' : '未登录'}</p>
                <p>Firebase Storage: guidin-db601.firebasestorage.app</p>
                <p>CORS状态: 已配置（可能需要时间生效）</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 