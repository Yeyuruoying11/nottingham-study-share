import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// 图片压缩函数
export function compressImage(file: File, maxWidth: number = 800, quality: number = 0.8): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算新的尺寸
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      
      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // 转换为Blob
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve(compressedFile);
        } else {
          resolve(file); // 如果压缩失败，返回原文件
        }
      }, 'image/jpeg', quality);
    };
    
    img.src = URL.createObjectURL(file);
  });
}

// 生成唯一的文件名
export function generateUniqueFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop() || 'jpg';
  return `posts/${userId}/${timestamp}_${randomString}.${extension}`;
}

// 上传图片到Firebase Storage
export async function uploadImageToStorage(
  file: File, 
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件');
    }
    
    // 验证文件大小（最大5MB）
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('图片文件不能超过5MB');
    }
    
    // 压缩图片
    const compressedFile = await compressImage(file);
    
    // 生成唯一文件名
    const fileName = generateUniqueFileName(file.name, userId);
    
    // 创建存储引用
    const storageRef = ref(storage, fileName);
    
    // 上传文件
    const uploadTask = uploadBytes(storageRef, compressedFile);
    
    // 监听上传进度（如果提供了回调函数）
    if (onProgress) {
      // 模拟进度更新（uploadBytes不支持进度监听，需要使用uploadBytesResumable）
      onProgress(50);
    }
    
    // 等待上传完成
    const snapshot = await uploadTask;
    
    if (onProgress) {
      onProgress(100);
    }
    
    // 获取下载URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('图片上传成功:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('图片上传失败:', error);
    throw error;
  }
}

// 带进度监听的上传函数
export async function uploadImageWithProgress(
  file: File,
  userId: string,
  onProgress: (progress: number) => void
): Promise<string> {
  const { uploadBytesResumable } = await import('firebase/storage');
  
  try {
    // 验证和压缩
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件');
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('图片文件不能超过5MB');
    }
    
    const compressedFile = await compressImage(file);
    const fileName = generateUniqueFileName(file.name, userId);
    const storageRef = ref(storage, fileName);
    
    // 使用可恢复上传
    const uploadTask = uploadBytesResumable(storageRef, compressedFile);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // 计算上传进度
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(Math.round(progress));
        },
        (error) => {
          console.error('上传失败:', error);
          reject(error);
        },
        async () => {
          // 上传完成
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('图片上传成功:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
    
  } catch (error) {
    console.error('图片上传失败:', error);
    throw error;
  }
}

// 删除图片
export async function deleteImageFromStorage(imageUrl: string): Promise<boolean> {
  try {
    // 从URL中提取文件路径
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/o\/(.+)\?/);
    
    if (!pathMatch) {
      console.error('无法解析图片URL');
      return false;
    }
    
    const filePath = decodeURIComponent(pathMatch[1]);
    const imageRef = ref(storage, filePath);
    
    await deleteObject(imageRef);
    console.log('图片删除成功:', filePath);
    return true;
    
  } catch (error) {
    console.error('图片删除失败:', error);
    return false;
  }
}

// 验证图片URL是否有效
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

// 获取图片信息
export function getImageInfo(file: File): Promise<{width: number, height: number, size: number}> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size
      });
    };
    img.src = URL.createObjectURL(file);
  });
} 