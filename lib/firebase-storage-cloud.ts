import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

// 云端优化的图片压缩函数
export function compressImageForCloud(
  file: File, 
  maxWidth: number = 400, // 更小的尺寸
  quality: number = 0.5   // 更低的质量
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      let { width, height } = img;
      
      // 更激进的压缩策略
      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// 生成文件名
export function generateFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop() || 'jpg';
  return `posts/${userId}/${timestamp}_${randomString}.${extension}`;
}

// 云端优化的上传函数
export async function uploadImageForCloud(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('🌐 使用云端优化上传:', { fileName: file.name, fileSize: file.size });
  
  try {
    // 1. 基本验证
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件');
    }
    
    const maxSize = 3 * 1024 * 1024; // 降低到3MB
    if (file.size > maxSize) {
      throw new Error('图片文件不能超过3MB');
    }
    
    onProgress?.(5);
    
    // 2. 激进压缩
    console.log('开始激进压缩...');
    const compressedFile = await compressImageForCloud(file);
    console.log('压缩完成:', { 
      originalSize: file.size, 
      compressedSize: compressedFile.size,
      ratio: ((file.size - compressedFile.size) / file.size * 100).toFixed(1) + '%'
    });
    
    onProgress?.(20);
    
    // 3. 生成文件名和引用
    const fileName = generateFileName(file.name, userId);
    const storageRef = ref(storage, fileName);
    
    onProgress?.(25);
    
    // 4. 使用可恢复上传，设置较短超时
    const uploadTask = uploadBytesResumable(storageRef, compressedFile);
    
    return new Promise((resolve, reject) => {
      // 设置30秒超时（适合云端环境）
      const timeout = setTimeout(() => {
        console.error('上传超时');
        uploadTask.cancel();
        reject(new Error('上传超时，请重试'));
      }, 30000);
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          const adjustedProgress = 25 + (progress * 0.7); // 25-95%
          onProgress?.(Math.min(adjustedProgress, 95));
        },
        (error) => {
          clearTimeout(timeout);
          console.error('上传失败:', error);
          
          let errorMessage = '上传失败';
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = '上传权限不足';
              break;
            case 'storage/canceled':
              errorMessage = '上传被取消';
              break;
            case 'storage/retry-limit-exceeded':
              errorMessage = '网络不稳定，请重试';
              break;
            default:
              errorMessage = '上传失败，请重试';
          }
          
          reject(new Error(errorMessage));
        },
        async () => {
          clearTimeout(timeout);
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            onProgress?.(100);
            console.log('云端上传成功:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            reject(new Error('获取图片URL失败'));
          }
        }
      );
    });
    
  } catch (error) {
    console.error('云端上传失败:', error);
    throw error;
  }
}

// 快速上传函数（最小压缩）
export async function uploadImageQuick(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('⚡ 使用快速上传模式');
  
  try {
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件');
    }
    
    // 更严格的大小限制
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      throw new Error('快速模式下图片不能超过1MB');
    }
    
    onProgress?.(10);
    
    // 最小压缩
    const compressedFile = await compressImageForCloud(file, 300, 0.6);
    
    onProgress?.(30);
    
    const fileName = generateFileName(file.name, userId);
    const storageRef = ref(storage, fileName);
    
    // 使用简单上传
    const { uploadBytes } = await import('firebase/storage');
    
    onProgress?.(50);
    
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    onProgress?.(80);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    onProgress?.(100);
    
    console.log('快速上传成功:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('快速上传失败:', error);
    throw error;
  }
}

// 智能上传函数（根据环境自动选择）
export async function uploadImageSmart(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('🧠 使用智能上传模式');
  
  // 检测是否在云端环境
  const isCloudEnvironment = typeof window !== 'undefined' && 
    (window.location.hostname.includes('vercel.app') || 
     window.location.hostname.includes('netlify.app'));
  
  const fileSizeMB = file.size / 1024 / 1024;
  
  if (isCloudEnvironment) {
    console.log('检测到云端环境，使用优化策略');
    
    if (fileSizeMB < 0.5) {
      return uploadImageQuick(file, userId, onProgress);
    } else {
      return uploadImageForCloud(file, userId, onProgress);
    }
  } else {
    console.log('检测到本地环境，使用标准策略');
    
    // 本地环境使用原有的上传函数
    const { uploadImageWithProgress } = await import('./firebase-storage');
    return uploadImageWithProgress(file, userId, onProgress);
  }
} 