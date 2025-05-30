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
      title: "打开Google Maps",
      content: "访问 maps.google.com 并搜索您的房屋地址",
      image: "🗺️"
    },
    {
      title: "切换到街景模式", 
      content: "点击左下角的街景小人图标，拖拽到您想要展示的位置",
      image: "👤"
    },
    {
      title: "调整最佳角度",
      content: "在街景模式中拖动调整到最佳的房屋展示角度",
      image: "🔄"
    },
    {
      title: "获取嵌入代码",
      content: "点击左上角菜单 → 分享或嵌入地图 → 嵌入地图",
      image: "📋"
    },
    {
      title: "复制HTML代码",
      content: "复制完整的 <iframe> 代码并粘贴到下方输入框",
      image: "✂️"
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
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <MapPin className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">房屋街景展示</h3>
            <p className="text-sm text-blue-600">
              添加Google街景让租客更好了解房屋环境
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
        >
          <span className="text-sm font-medium">
            {isExpanded ? '收起教程' : '查看教程'}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-6 space-y-6">
          {/* 快捷按钮 */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={openGoogleMaps}
              className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>打开Google Maps</span>
            </button>
          </div>

          {/* 步骤说明 */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-900 mb-3">操作步骤：</h4>
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    currentStep === index
                      ? 'bg-blue-100 border border-blue-300'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div className="text-2xl">{step.image}</div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900 text-sm">
                      {index + 1}. {step.title}
                    </h5>
                    <p className="text-xs text-gray-600 mt-1">
                      {step.content}
                    </p>
                  </div>
                  {currentStep === index && (
                    <CheckCircle className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              ))}
            </div>

            {/* 示例代码 */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">示例嵌入代码：</h4>
              <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-700 overflow-x-auto">
                <div className="text-green-600">&lt;iframe</div>
                <div className="ml-2">src="https://www.google.com/maps/embed?pb=..."</div>
                <div className="ml-2">width="600"</div>
                <div className="ml-2">height="450"</div>
                <div className="ml-2">style="border:0;"</div>
                <div className="ml-2">allowfullscreen=""</div>
                <div className="ml-2">loading="lazy"</div>
                <div className="ml-2">referrerpolicy="no-referrer-when-downgrade"</div>
                <div className="text-green-600">&gt;&lt;/iframe&gt;</div>
              </div>
              
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  <strong>提示：</strong> 确保复制完整的 &lt;iframe&gt; 标签，包括所有属性
                </p>
              </div>
            </div>
          </div>

          {/* 重要提示 */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 mb-2">📋 重要提示：</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• 确保选择房屋的最佳展示角度</li>
              <li>• 建议选择白天光线充足的街景</li>
              <li>• 可以多次调整角度直到满意</li>
              <li>• 嵌入代码完全免费，无需API密钥</li>
            </ul>
          </div>
        </div>
      )}

      {/* 嵌入代码输入框 */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Google Maps 嵌入代码 *
        </label>
        <textarea
          value={embedCode}
          onChange={handleEmbedCodeChange}
          placeholder="请粘贴从Google Maps获取的完整 <iframe> 嵌入代码..."
          className={`w-full h-32 p-3 border rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 transition-colors ${
            embedCode && isValidEmbed
              ? 'border-green-300 focus:ring-green-500 bg-green-50'
              : embedCode && !isValidEmbed
              ? 'border-red-300 focus:ring-red-500 bg-red-50'
              : 'border-gray-300 focus:ring-blue-500'
          }`}
        />
        
        {/* 验证状态 */}
        {embedCode && (
          <div className={`mt-2 flex items-center space-x-2 text-sm ${
            isValidEmbed ? 'text-green-600' : 'text-red-600'
          }`}>
            {isValidEmbed ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>✓ 有效的Google Maps嵌入代码</span>
              </>
            ) : (
              <>
                <div className="w-4 h-4 border-2 border-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs">!</span>
                </div>
                <span>请粘贴有效的Google Maps &lt;iframe&gt; 嵌入代码</span>
              </>
            )}
          </div>
        )}

        {/* 预览 */}
        {embedCode && isValidEmbed && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">预览效果：</h4>
            <div 
              className="w-full h-64 rounded-lg overflow-hidden"
              dangerouslySetInnerHTML={{ __html: embedCode }}
            />
          </div>
        )}
      </div>
    </div>
  );
} 