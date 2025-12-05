"use client";

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Copy, ExternalLink, CheckCircle } from 'lucide-react';

interface GoogleMapsEmbedTutorialProps {
  onEmbedCodeChange: (embedCode: string) => void;
  embedCode: string;
}

export default function GoogleMapsEmbedTutorial({ onEmbedCodeChange, embedCode }: GoogleMapsEmbedTutorialProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isValidEmbed, setIsValidEmbed] = useState(false);

  const steps = [
    {
      title: "打开 Google Map",
      content: "访问 maps.google.com",
      image: "🗺️"
    },
    {
      title: "搜索房源所在位置", 
      content: "在搜索框中输入您的房源地址，精确定位到您的房屋位置",
      image: "📍"
    },
    {
      title: "切换到街景模式",
      content: "找到地图右下角的街景小人图标，点击或拖拽到地图上您房源的位置",
      image: "👤"
    },
    {
      title: "获取嵌入代码",
      content: "在街景模式下，点击屏幕右上角的分享按钮，选择\"嵌入地图\"，复制完整的 HTML 代码",
      image: "📋"
    }
  ];

  const validateEmbedCode = (code: string) => {
    // 检查是否是有效的iframe嵌入代码
    const isValid = code.includes('<iframe') && 
                   code.includes('google.com/maps/embed') && 
                   code.includes('</iframe>');
    setIsValidEmbed(isValid);
    return isValid;
  };

  const handleEmbedCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const code = e.target.value;
    onEmbedCodeChange(code);
    validateEmbedCode(code);
  };

  const openGoogleMaps = () => {
    window.open('https://maps.google.com', '_blank');
  };

  return (
    <div className="p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">房屋街景展示</h3>
            <p className="text-blue-600">
              添加Google街景让租客更好了解房屋环境
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors px-4 py-2 rounded-lg hover:bg-blue-100"
        >
          <span className="font-medium">
            {isExpanded ? '收起教程' : '查看教程'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5" />
          ) : (
            <ChevronDown className="w-5 h-5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-8">
          {/* 快捷按钮 */}
          <div className="flex flex-wrap gap-4">
            <button
              onClick={openGoogleMaps}
              className="flex items-center space-x-3 bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors text-base font-medium"
            >
              <ExternalLink className="w-5 h-5" />
              <span>打开Google Maps</span>
            </button>
          </div>

          {/* 步骤说明 - 改为单列全宽布局 */}
          <div className="space-y-6">
            <h4 className="text-xl font-semibold text-gray-900 mb-4">操作步骤：</h4>
            
            {/* 步骤列表 - 全宽显示 */}
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-4 p-5 rounded-xl cursor-pointer transition-all ${
                    currentStep === index
                      ? 'bg-blue-100 border-2 border-blue-300 shadow-md'
                      : 'bg-white border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="text-3xl">{step.image}</div>
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">
                      {index + 1}. {step.title}
                    </h5>
                    <p className="text-gray-700 leading-relaxed">
                      {step.content}
                    </p>
                  </div>
                  {currentStep === index && (
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  )}
                </div>
              ))}
            </div>

            {/* 示例代码 - 全宽显示 */}
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">示例嵌入代码：</h4>
              <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
                <div className="text-blue-400">&lt;iframe</div>
                <div className="ml-4 text-yellow-300">src=&quot;https://www.google.com/maps/embed?pb=...&quot;</div>
                <div className="ml-4 text-yellow-300">width=&quot;600&quot;</div>
                <div className="ml-4 text-yellow-300">height=&quot;450&quot;</div>
                <div className="ml-4 text-yellow-300">style=&quot;border:0;&quot;</div>
                <div className="ml-4 text-yellow-300">allowfullscreen=&quot;&quot;</div>
                <div className="ml-4 text-yellow-300">loading=&quot;lazy&quot;</div>
                <div className="ml-4 text-yellow-300">referrerpolicy=&quot;no-referrer-when-downgrade&quot;</div>
                <div className="text-blue-400">&gt;&lt;/iframe&gt;</div>
              </div>
              
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>💡 提示：</strong> 确保复制完整的 &lt;iframe&gt; 标签，包括所有属性
                </p>
              </div>
            </div>
          </div>

          {/* 重要提示 */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
            <h4 className="text-lg font-semibold text-amber-900 mb-3">📋 重要提示：</h4>
            <ul className="text-amber-800 space-y-2">
              <li className="flex items-start space-x-2">
                <span className="text-amber-600">•</span>
                <span>确保选择房屋的最佳展示角度</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-600">•</span>
                <span>建议选择白天光线充足的街景</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-600">•</span>
                <span>可以多次调整角度直到满意</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-600">•</span>
                <span>嵌入代码完全免费，无需API密钥</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* 嵌入代码输入框 */}
      <div className="mt-6">
        <label className="block text-lg font-medium text-gray-700 mb-3">
          Google Maps 嵌入代码 *
        </label>
        <textarea
          value={embedCode}
          onChange={handleEmbedCodeChange}
          placeholder="请粘贴从Google Maps获取的完整 <iframe> 嵌入代码..."
          className={`w-full h-40 p-4 border-2 rounded-xl font-mono text-sm resize-none focus:outline-none focus:ring-2 transition-colors ${
            embedCode && isValidEmbed
              ? 'border-green-300 focus:ring-green-500 bg-green-50'
              : embedCode && !isValidEmbed
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        
        {/* 验证状态 */}
        {embedCode && (
          <div className={`mt-3 flex items-center space-x-2 ${
            isValidEmbed ? 'text-green-600' : 'text-red-600'
          }`}>
            {isValidEmbed ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">✓ 有效的Google Maps嵌入代码</span>
              </>
            ) : (
              <>
                <div className="w-5 h-5 border-2 border-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold">!</span>
                </div>
                <span className="font-medium">请粘贴有效的Google Maps &lt;iframe&gt; 嵌入代码</span>
              </>
            )}
          </div>
        )}

        {/* 预览 */}
        {embedCode && isValidEmbed && (
          <div className="mt-6 p-6 bg-gray-50 rounded-xl">
            <h4 className="text-lg font-medium text-gray-900 mb-4">预览效果：</h4>
            <div 
              className="w-full h-80 rounded-lg overflow-hidden border-2 border-gray-200"
              dangerouslySetInnerHTML={{ __html: embedCode }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 