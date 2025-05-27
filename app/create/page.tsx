"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Upload, X, Plus, Eye } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { addPostToFirestore } from "@/lib/firestore-posts";
import { uploadImageWithProgress, uploadImageSimple, uploadImageSmart, uploadImageTurbo, uploadImageUltimate, getImageInfo } from "@/lib/firebase-storage";
import { uploadImageSmart as uploadImageSmartCloud } from "@/lib/firebase-storage-cloud";
import { uploadImageSmart as uploadImageCORSFix } from "@/lib/firebase-storage-cors-fix";

const categories = [
  { name: "学习", icon: "📚", color: "bg-blue-100 text-blue-800" },
  { name: "生活", icon: "🏠", color: "bg-green-100 text-green-800" },
  { name: "美食", icon: "🍕", color: "bg-red-100 text-red-800" },
  { name: "旅行", icon: "✈️", color: "bg-purple-100 text-purple-800" },
  { name: "购物", icon: "🛍️", color: "bg-pink-100 text-pink-800" },
  { name: "租房", icon: "🏡", color: "bg-yellow-100 text-yellow-800" },
];

export default function CreatePostPage() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: [] as string[],
    image: ""
  });
  
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");

  // 如果用户未登录，重定向到登录页面
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">请先登录</h1>
          <p className="text-gray-600 mb-6">您需要登录后才能发布帖子</p>
          <Link 
            href="/login"
            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategorySelect = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      category: categoryName
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      // 验证文件大小
      if (file.size > 5 * 1024 * 1024) {
        alert('图片文件不能超过5MB');
        return;
      }

      // 获取图片信息
      const imageInfo = await getImageInfo(file);
      console.log('图片信息:', imageInfo);

      // 设置选中的文件和预览
      setSelectedFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // 清除之前的图片URL
      setFormData(prev => ({ ...prev, image: "" }));
      
    } catch (error) {
      console.error('处理图片失败:', error);
      alert('处理图片失败，请重试');
    }
  };

  const removeImage = () => {
    // 清理预览URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setSelectedFile(null);
    setImagePreview("");
    setFormData(prev => ({ ...prev, image: "" }));
    setUploadProgress(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category) {
      alert("请填写完整信息");
      return;
    }

    if (!user) {
      alert("请先登录");
      return;
    }

    setIsSubmitting(true);
    
    try {
      let imageUrl = "";
      
      // 如果有选中的图片文件，先上传图片
      if (selectedFile) {
        setIsUploading(true);
        setUploadProgress(0);
        
        try {
          console.log('开始上传图片...');
          
          // 优化的上传策略：优先使用CORS修复版本，然后是云端智能上传，最后是简化上传
          try {
            imageUrl = await uploadImageCORSFix(
              selectedFile,
              user.uid,
              (progress) => {
                setUploadProgress(progress);
              }
            );
            console.log('CORS修复上传成功:', imageUrl);
          } catch (corsError) {
            console.warn('CORS修复上传失败，尝试云端智能上传:', corsError);
            
            try {
              imageUrl = await uploadImageSmartCloud(
                selectedFile,
                user.uid,
                (progress) => {
                  setUploadProgress(progress);
                }
              );
              console.log('云端智能上传成功:', imageUrl);
            } catch (cloudError) {
              console.warn('云端智能上传失败，尝试简化上传:', cloudError);
              
              // 如果所有优化上传都失败，使用简化上传作为最后备选
              imageUrl = await uploadImageSimple(
                selectedFile,
                user.uid,
                (progress) => {
                  setUploadProgress(progress);
                }
              );
              console.log('简化上传成功:', imageUrl);
            }
          }
          
        } catch (uploadError) {
          console.error('图片上传失败:', uploadError);
          
          // 提供更详细的错误信息
          let errorMessage = '图片上传失败';
          if (uploadError instanceof Error) {
            if (uploadError.message.includes('unauthorized') || uploadError.message.includes('权限')) {
              errorMessage = '上传权限不足，请确保已登录并重试';
            } else if (uploadError.message.includes('network') || uploadError.message.includes('网络')) {
              errorMessage = '网络连接问题，请检查网络后重试';
            } else if (uploadError.message.includes('timeout') || uploadError.message.includes('超时')) {
              errorMessage = '上传超时，请尝试压缩图片或检查网络';
            } else if (uploadError.message.includes('size') || uploadError.message.includes('大小')) {
              errorMessage = '图片文件过大，请选择小于5MB的图片';
            } else {
              errorMessage = `上传失败: ${uploadError.message}`;
            }
          }
          
          alert(errorMessage);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // 添加新帖子到Firestore数据库
      const postId = await addPostToFirestore({
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        tags: formData.tags,
        image: imageUrl, // 使用上传后的永久URL
        author: {
          name: user.displayName || user.email || "匿名用户",
          avatar: user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
          university: "诺丁汉大学",
          year: "学生",
          uid: user.uid
        }
      });
      
      if (postId) {
        console.log("新帖子已添加到Firestore，ID:", postId);
        alert("帖子发布成功！");
        
        // 清理预览URL
        if (imagePreview && imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(imagePreview);
        }
        
        router.push("/");
      } else {
        alert("发布失败，请重试");
      }
    } catch (error) {
      console.error("发布失败:", error);
      alert("发布失败，请重试");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link 
              href="/"
              className="flex items-center space-x-3 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回</span>
            </Link>
            
            <h1 className="text-lg font-semibold text-gray-900">发布新帖子</h1>
            
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm">预览</span>
              </button>
              
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || isUploading || !formData.title.trim() || !formData.content.trim() || !formData.category}
                className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>上传图片中...</span>
                  </>
                ) : isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>发布中...</span>
                  </>
                ) : (
                  <span>发布</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 编辑区域 */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* 标题 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标题 *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="给你的帖子起个吸引人的标题..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    maxLength={100}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.title.length}/100
                  </div>
                </div>

                {/* 分类选择 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    分类 *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => handleCategorySelect(category.name)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all ${
                          formData.category === category.name
                            ? "border-green-500 bg-green-50 text-green-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <span>{category.icon}</span>
                        <span className="text-sm font-medium">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 图片上传 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    封面图片
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 transition-colors">
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="预览"
                          className="w-full h-48 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          disabled={isUploading}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        
                        {/* 上传进度显示 */}
                        {isUploading && (
                          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                            <div className="text-center text-white">
                              <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                              <p className="text-sm">上传中... {uploadProgress}%</p>
                              <div className="w-32 bg-gray-200 rounded-full h-2 mt-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${uploadProgress}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* 文件信息 */}
                        {selectedFile && !isUploading && (
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)}MB)
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 mb-2">点击上传图片或拖拽到此处</p>
                        <p className="text-xs text-gray-500 mb-3">支持 JPG、PNG、GIF 格式，最大 5MB</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                          disabled={isSubmitting}
                        />
                        <label
                          htmlFor="image-upload"
                          className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          选择文件
                        </label>
                      </div>
                    )}
                  </div>
                  
                  {/* 图片上传提示 */}
                  {selectedFile && !isUploading && (
                    <div className="mt-2 text-xs text-green-600">
                      ✓ 图片已选择，发布时将自动上传
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="mt-2 text-xs text-blue-600">
                      正在上传图片，请稍候...
                    </div>
                  )}
                </div>

                {/* 内容 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容 *
                  </label>
                  <textarea
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="分享你的经验、故事或建议..."
                    rows={12}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    支持换行，详细描述你的内容
                  </div>
                </div>

                {/* 标签 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    标签 (最多5个)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-green-600 hover:text-green-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  {formData.tags.length < 5 && (
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                        placeholder="添加标签..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                        maxLength={20}
                      />
                      <button
                        type="button"
                        onClick={handleAddTag}
                        disabled={!newTag.trim()}
                        className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </motion.div>
          </div>

          {/* 预览区域 */}
          {showPreview && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg overflow-hidden"
              >
                <div className="p-4 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900">预览效果</h3>
                </div>
                
                {imagePreview && (
                  <div className="relative h-48">
                    <img
                      src={imagePreview}
                      alt="预览"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-center space-x-2 mb-3">
                    {formData.category && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {categories.find(c => c.name === formData.category)?.icon} {formData.category}
                      </span>
                    )}
                  </div>
                  
                  <h1 className="text-xl font-bold text-gray-900 mb-3">
                    {formData.title || "标题预览"}
                  </h1>
                  
                  <div className="text-gray-700 mb-4 whitespace-pre-wrap">
                    {formData.content || "内容预览..."}
                  </div>
                  
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {formData.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <img
                        src={user.photoURL || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"}
                        alt={user.displayName || "用户"}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <span className="text-sm text-gray-600 font-medium">
                        {user.displayName || "用户"}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      刚刚
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 