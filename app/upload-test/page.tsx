"use client";

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  uploadImageSmart, 
  uploadImageTurbo, 
  uploadImageUltimate, 
  uploadImageSimple,
  uploadImageWithProgress,
  getImageInfo 
} from '@/lib/firebase-storage';

interface TestResult {
  strategy: string;
  success: boolean;
  duration: number;
  fileSize: number;
  compressedSize?: number;
  url?: string;
  error?: string;
}

export default function UploadTestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [testing, setTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState('');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<TestResult[]>([]);
  const [imageInfo, setImageInfo] = useState<any>(null);
  const { user } = useAuth();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResults([]);
      setProgress(0);
      
      // 获取图片信息
      try {
        const info = await getImageInfo(selectedFile);
        setImageInfo(info);
      } catch (error) {
        console.error('获取图片信息失败:', error);
      }
    }
  };

  const testUploadStrategy = async (
    strategy: string,
    uploadFunction: (file: File, userId: string, onProgress?: (progress: number) => void) => Promise<string>
  ): Promise<TestResult> => {
    const startTime = Date.now();
    setCurrentTest(strategy);
    setProgress(0);

    try {
      const url = await uploadFunction(file!, user!.uid, (progress) => {
        setProgress(progress);
      });

      const duration = Date.now() - startTime;
      return {
        strategy,
        success: true,
        duration,
        fileSize: file!.size,
        url
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        strategy,
        success: false,
        duration,
        fileSize: file!.size,
        error: error instanceof Error ? error.message : '未知错误'
      };
    }
  };

  const runAllTests = async () => {
    if (!file || !user) {
      alert('请选择文件并确保已登录');
      return;
    }

    setTesting(true);
    setResults([]);

    const strategies = [
      { name: '智能上传', func: uploadImageSmart },
      { name: '极速上传', func: uploadImageTurbo },
      { name: '终极上传', func: uploadImageUltimate },
      { name: '简化上传', func: uploadImageSimple },
      { name: '带进度上传', func: uploadImageWithProgress }
    ];

    const testResults: TestResult[] = [];

    for (const strategy of strategies) {
      try {
        const result = await testUploadStrategy(strategy.name, strategy.func);
        testResults.push(result);
        setResults([...testResults]);
        
        // 测试间隔
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`${strategy.name}测试失败:`, error);
      }
    }

    setTesting(false);
    setCurrentTest('');
    setProgress(0);
  };

  const runSingleTest = async (strategyName: string, uploadFunction: any) => {
    if (!file || !user) {
      alert('请选择文件并确保已登录');
      return;
    }

    setTesting(true);
    const result = await testUploadStrategy(strategyName, uploadFunction);
    setResults([result]);
    setTesting(false);
    setCurrentTest('');
    setProgress(0);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">图片上传测试</h1>
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">📸 图片上传功能测试</h1>
          
          {/* 用户信息 */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h2 className="font-semibold text-blue-900 mb-2">当前用户</h2>
            <p className="text-blue-700">用户ID: {user.uid}</p>
            <p className="text-blue-700">邮箱: {user.email}</p>
          </div>

          {/* 文件选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              选择测试图片
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            
            {file && imageInfo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-2">图片信息</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">文件名:</span>
                    <p className="font-medium">{file.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">文件大小:</span>
                    <p className="font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div>
                    <span className="text-gray-600">尺寸:</span>
                    <p className="font-medium">{imageInfo.width} × {imageInfo.height}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">类型:</span>
                    <p className="font-medium">{file.type}</p>
                  </div>
                </div>
                
                {/* 图片预览 */}
                <div className="mt-4">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt="预览" 
                    className="max-w-xs h-32 object-cover rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 测试按钮 */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">测试选项</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <button
                onClick={() => runSingleTest('智能上传', uploadImageSmart)}
                disabled={!file || testing}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                智能上传
              </button>
              
              <button
                onClick={() => runSingleTest('极速上传', uploadImageTurbo)}
                disabled={!file || testing}
                className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 disabled:bg-gray-300"
              >
                极速上传
              </button>
              
              <button
                onClick={() => runSingleTest('终极上传', uploadImageUltimate)}
                disabled={!file || testing}
                className="bg-purple-500 text-white py-2 px-4 rounded-lg hover:bg-purple-600 disabled:bg-gray-300"
              >
                终极上传
              </button>
              
              <button
                onClick={() => runSingleTest('简化上传', uploadImageSimple)}
                disabled={!file || testing}
                className="bg-yellow-500 text-white py-2 px-4 rounded-lg hover:bg-yellow-600 disabled:bg-gray-300"
              >
                简化上传
              </button>
              
              <button
                onClick={() => runSingleTest('带进度上传', uploadImageWithProgress)}
                disabled={!file || testing}
                className="bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 disabled:bg-gray-300"
              >
                带进度上传
              </button>
              
              <button
                onClick={runAllTests}
                disabled={!file || testing}
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 disabled:bg-gray-300"
              >
                全部测试
              </button>
            </div>
          </div>

          {/* 当前测试状态 */}
          {testing && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-900 mb-2">
                正在测试: {currentTest}
              </h3>
              <div className="w-full bg-yellow-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-yellow-700 text-sm mt-2">进度: {progress}%</p>
            </div>
          )}

          {/* 测试结果 */}
          {results.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">测试结果</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 px-4 py-2 text-left">策略</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">状态</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">耗时</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">文件大小</th>
                      <th className="border border-gray-300 px-4 py-2 text-left">结果</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index} className={result.success ? 'bg-green-50' : 'bg-red-50'}>
                        <td className="border border-gray-300 px-4 py-2 font-medium">
                          {result.strategy}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {result.success ? (
                            <span className="text-green-600 font-semibold">✅ 成功</span>
                          ) : (
                            <span className="text-red-600 font-semibold">❌ 失败</span>
                          )}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {(result.duration / 1000).toFixed(2)}秒
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {(result.fileSize / 1024 / 1024).toFixed(2)} MB
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {result.success ? (
                            <div>
                              <a 
                                href={result.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-700 text-sm"
                              >
                                查看图片
                              </a>
                            </div>
                          ) : (
                            <span className="text-red-600 text-sm">{result.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 性能分析 */}
          {results.length > 1 && (
            <div className="mb-6 p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">性能分析</h3>
              <div className="text-sm text-green-700">
                <p>最快策略: {results.filter(r => r.success).sort((a, b) => a.duration - b.duration)[0]?.strategy}</p>
                <p>成功率: {((results.filter(r => r.success).length / results.length) * 100).toFixed(1)}%</p>
                <p>平均耗时: {(results.filter(r => r.success).reduce((sum, r) => sum + r.duration, 0) / results.filter(r => r.success).length / 1000).toFixed(2)}秒</p>
              </div>
            </div>
          )}

          {/* 建议 */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">💡 使用建议</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>智能上传</strong>: 根据文件大小自动选择最佳策略，推荐日常使用</li>
              <li>• <strong>极速上传</strong>: 轻度压缩，速度较快，适合网络良好时使用</li>
              <li>• <strong>终极上传</strong>: 多重重试机制，网络不稳定时使用</li>
              <li>• <strong>简化上传</strong>: 无压缩直接上传，适合小文件</li>
              <li>• <strong>带进度上传</strong>: 详细进度显示，适合大文件上传</li>
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