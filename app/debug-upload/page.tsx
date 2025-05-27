"use client";

import React, { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  uploadImageWithProgress, 
  uploadImageSimple, 
  uploadImageUltraFast, 
  uploadImageSmart,
  uploadImageTurbo,
  uploadImageRobust,
  uploadImageUltimate,
  compressImage,
  ultraCompressImage 
} from "@/lib/firebase-storage";

export default function DebugUploadPage() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([]);
  const [networkSpeed, setNetworkSpeed] = useState<number | null>(null);
  const [compressionTest, setCompressionTest] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLogs(prev => [...prev, logMessage]);
    console.log(logMessage);
  };

  const clearLogs = () => {
    setLogs([]);
    setUploadResult("");
    setErrorMessage("");
    setUploadProgress(0);
  };

  // 网络速度测试
  const testNetworkSpeed = async () => {
    addLog("开始网络速度测试...");
    try {
      const startTime = Date.now();
      
      // 下载一个小文件来测试网络速度
      const response = await fetch('https://httpbin.org/bytes/1024', { 
        cache: 'no-cache' 
      });
      
      if (!response.ok) {
        throw new Error('网络测试失败');
      }
      
      await response.blob();
      const endTime = Date.now();
      const duration = endTime - startTime;
      const speed = (1024 / duration) * 1000; // bytes per second
      const speedKbps = (speed / 1024).toFixed(2);
      
      setNetworkSpeed(parseFloat(speedKbps));
      addLog(`网络速度: ${speedKbps} KB/s`);
      
      if (speed < 10240) { // 小于10KB/s
        addLog("⚠️ 网络速度较慢，这可能是上传慢的主要原因");
      } else if (speed < 51200) { // 小于50KB/s
        addLog("⚠️ 网络速度一般，建议使用超激进压缩");
      } else {
        addLog("✅ 网络速度正常");
      }
      
    } catch (error) {
      addLog(`❌ 网络测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // Firebase连接测试
  const testFirebaseConnection = async () => {
    addLog("测试Firebase Storage连接...");
    try {
      const startTime = Date.now();
      
      const { storage } = await import("@/lib/firebase");
      const { ref, listAll } = await import("firebase/storage");
      
      const storageRef = ref(storage, 'posts/');
      await listAll(storageRef);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      addLog(`✅ Firebase Storage连接正常 (耗时: ${duration}ms)`);
      
      if (duration > 3000) {
        addLog("⚠️ Firebase连接较慢，可能影响上传速度");
      }
      
    } catch (error) {
      addLog(`❌ Firebase Storage连接失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 压缩性能测试
  const testCompressionPerformance = async () => {
    if (!selectedFile) {
      addLog("请先选择文件");
      return;
    }

    addLog("开始压缩性能测试...");
    
    try {
      const originalSize = selectedFile.size;
      addLog(`原始文件大小: ${(originalSize / 1024 / 1024).toFixed(2)}MB`);

      // 测试标准压缩
      const standardStart = Date.now();
      const standardCompressed = await compressImage(selectedFile);
      const standardDuration = Date.now() - standardStart;
      const standardSize = standardCompressed.size;
      
      // 测试超激进压缩
      const ultraStart = Date.now();
      const ultraCompressed = await ultraCompressImage(selectedFile);
      const ultraDuration = Date.now() - ultraStart;
      const ultraSize = ultraCompressed.size;

      const testResult = {
        original: {
          size: originalSize,
          sizeMB: (originalSize / 1024 / 1024).toFixed(2)
        },
        standard: {
          size: standardSize,
          sizeMB: (standardSize / 1024 / 1024).toFixed(2),
          duration: standardDuration,
          ratio: ((originalSize - standardSize) / originalSize * 100).toFixed(1)
        },
        ultra: {
          size: ultraSize,
          sizeMB: (ultraSize / 1024 / 1024).toFixed(2),
          duration: ultraDuration,
          ratio: ((originalSize - ultraSize) / originalSize * 100).toFixed(1)
        }
      };

      setCompressionTest(testResult);
      
      addLog(`标准压缩: ${testResult.standard.sizeMB}MB (${testResult.standard.ratio}%减少, 耗时${standardDuration}ms)`);
      addLog(`超激进压缩: ${testResult.ultra.sizeMB}MB (${testResult.ultra.ratio}%减少, 耗时${ultraDuration}ms)`);
      
      // 预估上传时间
      if (networkSpeed) {
        const standardUploadTime = (standardSize / 1024) / networkSpeed;
        const ultraUploadTime = (ultraSize / 1024) / networkSpeed;
        addLog(`预估上传时间 - 标准压缩: ${standardUploadTime.toFixed(1)}秒`);
        addLog(`预估上传时间 - 超激进压缩: ${ultraUploadTime.toFixed(1)}秒`);
      }

    } catch (error) {
      addLog(`❌ 压缩测试失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // 完整诊断
  const runFullDiagnosis = async () => {
    clearLogs();
    addLog("🔍 开始完整诊断...");
    
    await testNetworkSpeed();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testFirebaseConnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (selectedFile) {
      await testCompressionPerformance();
    }
    
    addLog("✅ 诊断完成");
  };

  // 计时上传测试
  const timedUploadTest = async (uploadFunction: Function, name: string) => {
    if (!selectedFile || !user) {
      addLog("错误: 没有选择文件或用户未登录");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage("");
    setUploadResult("");

    const startTime = Date.now();
    addLog(`开始${name}测试...`);

    try {
      const url = await uploadFunction(
        selectedFile,
        user.uid,
        (progress: number) => {
          setUploadProgress(progress);
          addLog(`${name}进度: ${progress}%`);
        }
      );
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      setUploadResult(url);
      addLog(`✅ ${name}成功! 总耗时: ${duration.toFixed(2)}秒`);
      addLog(`上传速度: ${(selectedFile.size / 1024 / duration).toFixed(2)} KB/s`);
      
    } catch (error) {
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      const errorMsg = error instanceof Error ? error.message : "未知错误";
      setErrorMessage(errorMsg);
      addLog(`❌ ${name}失败 (耗时${duration.toFixed(2)}秒): ${errorMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult("");
      setErrorMessage("");
      setCompressionTest(null);
      addLog(`文件选择: ${file.name}`);
      addLog(`大小: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      addLog(`类型: ${file.type}`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600">需要登录后才能测试上传功能</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🔧 上传问题深度诊断</h1>
        
        {/* 快速诊断 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🚀 快速诊断</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={runFullDiagnosis}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
            >
              🔍 完整诊断
              <div className="text-sm font-normal mt-1">一键检测所有问题</div>
            </button>
            <button
              onClick={testNetworkSpeed}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold"
            >
              🌐 网络测试
              <div className="text-sm font-normal mt-1">检查网络速度</div>
            </button>
          </div>
        </div>

        {/* 文件选择 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">📁 选择测试文件</h2>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="mb-4"
          />
          {selectedFile && (
            <div className="bg-gray-50 p-4 rounded">
              <p><strong>文件名:</strong> {selectedFile.name}</p>
              <p><strong>大小:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)}MB</p>
              <p><strong>类型:</strong> {selectedFile.type}</p>
            </div>
          )}
        </div>

        {/* 系统状态 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 网络状态 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">🌐 网络状态</h3>
            {networkSpeed !== null ? (
              <div>
                <p className="text-2xl font-bold text-blue-600">{networkSpeed} KB/s</p>
                <p className="text-sm text-gray-600">
                  {networkSpeed < 10 ? "很慢" : 
                   networkSpeed < 50 ? "一般" : 
                   networkSpeed < 200 ? "良好" : "优秀"}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">未测试</p>
            )}
          </div>

          {/* 压缩效果 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">🗜️ 压缩效果</h3>
            {compressionTest ? (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">标准:</span> {compressionTest.standard.ratio}%减少
                </p>
                <p className="text-sm">
                  <span className="font-medium">超激进:</span> {compressionTest.ultra.ratio}%减少
                </p>
              </div>
            ) : (
              <p className="text-gray-500">未测试</p>
            )}
          </div>

          {/* 推荐策略 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">💡 推荐策略</h3>
            {selectedFile && networkSpeed !== null ? (
              <div className="text-sm">
                {selectedFile.size > 2 * 1024 * 1024 ? (
                  <p className="text-orange-600">使用超激进压缩</p>
                ) : selectedFile.size > 500 * 1024 ? (
                  <p className="text-blue-600">使用标准压缩</p>
                ) : (
                  <p className="text-green-600">直接上传</p>
                )}
                {networkSpeed < 50 && (
                  <p className="text-red-600 mt-1">⚠️ 网络较慢，建议压缩</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">需要测试数据</p>
            )}
          </div>
        </div>

        {/* 上传测试 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">⏱️ 上传测试</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => timedUploadTest(uploadImageUltimate, "终极上传")}
              disabled={!selectedFile || isUploading}
              className="px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 font-bold text-lg"
            >
              ⚡ 终极上传
              <div className="text-sm font-normal mt-1">自动尝试多种策略</div>
            </button>
            <button
              onClick={() => timedUploadTest(uploadImageRobust, "稳定上传")}
              disabled={!selectedFile || isUploading}
              className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-bold text-lg"
            >
              🛡️ 稳定上传
              <div className="text-sm font-normal mt-1">30秒超时保护</div>
            </button>
            <button
              onClick={() => timedUploadTest(uploadImageSimple, "简化上传")}
              disabled={!selectedFile || isUploading}
              className="px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 font-bold text-lg"
            >
              📤 简化上传
              <div className="text-sm font-normal mt-1">直接上传原文件</div>
            </button>
          </div>
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">💡 推荐使用顺序:</h3>
            <ol className="text-sm text-green-700 space-y-1">
              <li><strong>1. ⚡ 终极上传</strong> - 首选，会自动尝试最佳策略</li>
              <li><strong>2. 🛡️ 稳定上传</strong> - 如果终极上传失败，用这个</li>
              <li><strong>3. 📤 简化上传</strong> - 最后选择，用于排查问题</li>
            </ol>
          </div>
        </div>

        {/* 上传进度 */}
        {isUploading && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">📊 上传进度</h2>
            <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-center">{uploadProgress}%</p>
          </div>
        )}

        {/* 上传结果 */}
        {uploadResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-green-600">✅ 上传成功!</h2>
            <p className="break-all mb-4 text-sm">{uploadResult}</p>
            <img src={uploadResult} alt="上传的图片" className="max-w-md rounded" />
          </div>
        )}

        {/* 错误信息 */}
        {errorMessage && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">❌ 上传失败</h2>
            <p className="text-red-600">{errorMessage}</p>
          </div>
        )}

        {/* 详细日志 */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">📋 详细日志</h2>
            <button
              onClick={clearLogs}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              清空日志
            </button>
          </div>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">暂无日志</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}