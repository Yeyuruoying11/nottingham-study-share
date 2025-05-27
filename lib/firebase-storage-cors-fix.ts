import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// 处理CORS问题的上传函数
export async function uploadImageWithCORSFix(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('🚀 开始CORS优化上传...');
  
  try {
    // 1. 压缩图片
    const compressedFile = await compressImageForCORS(file);
    console.log('✅ 图片压缩完成');
    
    // 2. 创建存储引用
    const timestamp = Date.now();
    const fileName = `${userId}_${timestamp}_${compressedFile.name}`;
    const storageRef = ref(storage, `images/${fileName}`);
    
    // 3. 配置上传任务
    const uploadTask = uploadBytesResumable(storageRef, compressedFile, {
      contentType: compressedFile.type,
      customMetadata: {
        'uploadedBy': userId,
        'originalName': file.name,
        'uploadTime': new Date().toISOString()
      }
    });
    
    // 4. 监听上传进度
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`📊 上传进度: ${progress.toFixed(1)}%`);
          onProgress?.(progress);
        },
        (error) => {
          console.error('❌ 上传失败:', error);
          
          // 处理常见的CORS错误
          if (error.code === 'storage/unauthorized') {
            reject(new Error('权限错误：请检查Firebase Storage安全规则'));
          } else if (error.message.includes('CORS')) {
            reject(new Error('CORS错误：请配置Firebase Storage CORS规则'));
          } else {
            reject(error);
          }
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('✅ 上传成功:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('❌ 获取下载链接失败:', error);
            reject(error);
          }
        }
      );
    });
    
  } catch (error) {
    console.error('❌ 上传过程出错:', error);
    throw error;
  }
}

// CORS优化的图片压缩
function compressImageForCORS(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // 计算新尺寸
      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制图片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 转换为Blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        },
        file.type,
        quality
      );
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// 检测环境并选择最佳上传策略
export async function uploadImageSmart(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const isProduction = window.location.hostname !== 'localhost';
  
  if (isProduction) {
    console.log('🌐 生产环境：使用CORS优化上传');
    return uploadImageWithCORSFix(file, userId, onProgress);
  } else {
    console.log('🏠 本地环境：使用标准上传');
    // 使用原有的上传函数
    const { uploadImageWithProgress } = await import('./firebase-storage');
    return uploadImageWithProgress(file, userId, onProgress);
  }
} 