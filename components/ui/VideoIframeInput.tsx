"use client";

import React, { useState, useEffect } from 'react';
import { Play, AlertCircle, CheckCircle, X, ExternalLink, Link } from 'lucide-react';

interface VideoIframeInputProps {
  onIframeChange: (iframe: string) => void;
  iframe?: string;
}

export default function VideoIframeInput({ onIframeChange, iframe = '' }: VideoIframeInputProps) {
  const [iframeCode, setIframeCode] = useState(iframe);
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState(''); // 新增：YouTube URL输入

  // 验证iframe代码
  const validateIframe = (code: string) => {
    if (!code.trim()) {
      setIsValid(true);
      setError('');
      return;
    }

    // 检查是否包含iframe标签
    if (!code.includes('<iframe') || !code.includes('</iframe>')) {
      setIsValid(false);
      setError('请输入完整的iframe代码');
      return;
    }

    // 检查是否来自支持的平台
    const supportedPlatforms = [
      'www.youtube.com',
      'youtube.com',
      'youtu.be'
    ];

    const hasValidSource = supportedPlatforms.some(platform => 
      code.toLowerCase().includes(platform)
    );

    if (!hasValidSource) {
      setIsValid(false);
      setError('目前只支持 YouTube 的视频');
      return;
    }

    // 检查是否包含必要的属性
    if (!code.includes('src=')) {
      setIsValid(false);
      setError('iframe代码缺少src属性');
      return;
    }

    setIsValid(true);
    setError('');
  };

  // 新增：优化iframe代码
  const optimizeIframeCode = (code: string): string => {
    if (!code.trim()) return code;
    
    try {
      // 移除可能导致CSP违规的属性
      let optimizedCode = code
        // 移除或替换problematic attributes
        .replace(/allow="[^"]*"/gi, 'allow="encrypted-media; picture-in-picture; web-share"')
        .replace(/referrerpolicy="[^"]*"/gi, 'referrerpolicy="no-referrer-when-downgrade"')
        // 确保有必要的属性
        .replace(/frameborder="[^"]*"/gi, 'frameborder="0"')
        .replace(/allowfullscreen(?:="[^"]*")?/gi, 'allowfullscreen');
      
      // 如果没有width和height，添加响应式设置
      if (!optimizedCode.includes('width=')) {
        optimizedCode = optimizedCode.replace('<iframe', '<iframe width="100%"');
      }
      if (!optimizedCode.includes('height=')) {
        optimizedCode = optimizedCode.replace('<iframe', '<iframe height="400"');
      }
      
      return optimizedCode;
    } catch (error) {
      console.error('优化iframe代码时出错:', error);
      return code;
    }
  };

  useEffect(() => {
    validateIframe(iframeCode);
  }, [iframeCode]);

  const handleIframeChange = (value: string) => {
    setIframeCode(value);
    onIframeChange(value);
  };

  // 新增：手动优化iframe代码
  const handleOptimizeIframe = () => {
    const optimized = optimizeIframeCode(iframeCode);
    setIframeCode(optimized);
    onIframeChange(optimized);
  };

  const clearIframe = () => {
    setIframeCode('');
    onIframeChange('');
    setShowPreview(false);
  };

  // 示例iframe代码
  const exampleIframes = {
    youtube: `<iframe width="100%" height="400" src="https://www.youtube.com/embed/VIDEO_ID" title="YouTube video player" frameborder="0" allow="encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`
  };

  // 新增：从YouTube URL生成iframe代码
  const generateIframeFromYouTubeUrl = (url: string): string => {
    try {
      // 提取YouTube视频ID
      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        return '';
      }
      
      // 生成兼容的iframe代码
      return `<iframe width="100%" height="400" src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe>`;
    } catch (error) {
      console.error('生成iframe失败:', error);
      return '';
    }
  };

  // 新增：提取YouTube视频ID
  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  // 新增：处理YouTube URL输入
  const handleYouTubeUrlConvert = () => {
    if (!youtubeUrl.trim()) {
      alert('请输入YouTube链接');
      return;
    }
    
    const iframe = generateIframeFromYouTubeUrl(youtubeUrl);
    if (iframe) {
      setIframeCode(iframe);
      onIframeChange(iframe);
      setYoutubeUrl(''); // 清空URL输入
    } else {
      alert('无法解析YouTube链接，请检查链接格式');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <h3 className="text-lg font-semibold text-gray-900">添加视频</h3>
        <div className="flex items-center space-x-2">
          {iframeCode && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>{showPreview ? '隐藏预览' : '显示预览'}</span>
            </button>
          )}
          {iframeCode && (
            <button
              onClick={handleOptimizeIframe}
              className="flex items-center space-x-2 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              title="优化iframe代码以兼容浏览器安全策略"
            >
              <span>🔧</span>
              <span>优化代码</span>
            </button>
          )}
          {iframeCode && (
            <button
              onClick={clearIframe}
              className="flex items-center space-x-1 px-2 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>清除</span>
            </button>
          )}
        </div>
      </div>

      {/* iframe输入区域 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          视频iframe代码 (可选)
        </label>
        
        {/* 新增：YouTube URL快速转换 */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">🚀 快速添加YouTube视频</h4>
          <p className="text-sm text-blue-800 mb-3">直接粘贴YouTube链接，自动生成兼容的iframe代码</p>
          <div className="flex space-x-2">
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="粘贴YouTube链接，如：https://www.youtube.com/watch?v=..."
              className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              onClick={handleYouTubeUrlConvert}
              disabled={!youtubeUrl.trim()}
              className="flex items-center space-x-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
            >
              <Link className="w-4 h-4" />
              <span>转换</span>
            </button>
          </div>
        </div>
        
        <textarea
          value={iframeCode}
          onChange={(e) => handleIframeChange(e.target.value)}
          placeholder="粘贴视频的iframe嵌入代码..."
          rows={6}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm font-mono"
        />
        
        {/* 验证状态 */}
        <div className="mt-2 flex items-center space-x-2">
          {iframeCode ? (
            isValid ? (
              <div className="flex items-center space-x-1 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">iframe代码有效</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )
          ) : (
            <span className="text-xs text-gray-500">粘贴来自 YouTube 的iframe代码</span>
          )}
        </div>
      </div>

      {/* 获取iframe代码的说明 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">📋 如何获取YouTube iframe代码</h4>
        
        <div className="space-y-4">
          {/* YouTube说明 */}
          <div>
            <h5 className="text-sm font-medium text-gray-800 mb-2 flex items-center space-x-2">
              <span>🎬</span>
              <span>YouTube</span>
            </h5>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 ml-6">
              <li>打开你想分享的YouTube视频</li>
              <li>点击视频下方的&quot;分享&quot;按钮</li>
              <li>选择&quot;嵌入&quot;</li>
              <li>复制提供的iframe代码</li>
              <li>粘贴到上方输入框中</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 示例代码 */}
      <details className="bg-gray-50 border border-gray-200 rounded-lg">
        <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
          查看示例代码 📝
        </summary>
        <div className="px-4 pb-4 space-y-4">
          <div>
            <h6 className="text-sm font-medium text-gray-800 mb-2">YouTube示例</h6>
            <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
              <code>{exampleIframes.youtube}</code>
            </pre>
          </div>
        </div>
      </details>

      {/* 视频预览 */}
      {showPreview && iframeCode && isValid && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b">
            <h4 className="text-sm font-medium text-gray-900">视频预览</h4>
          </div>
          <div className="p-4">
            <div 
              className="w-full"
              dangerouslySetInnerHTML={{ __html: iframeCode }}
            />
          </div>
        </div>
      )}

      {/* 安全提示 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">安全提示</p>
            <p className="mb-2">为了安全起见，我们只支持来自 YouTube 的官方iframe代码。请确保代码来源可靠，避免添加可疑的第三方链接。</p>
          </div>
        </div>
      </div>
    </div>
  );
} 