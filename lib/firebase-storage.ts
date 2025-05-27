import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

// 图片压缩函数 - 优化版本
export function compressImage(
  file: File, 
  maxWidth: number = 600, // 降低到600px
  quality: number = 0.6   // 降低质量到60%
): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 计算新的尺寸 - 更激进的压缩
      let { width, height } = img;
      
      // 如果图片太大，进行更激进的缩放
      if (width > maxWidth || height > maxWidth) {
        const ratio = Math.min(maxWidth / width, maxWidth / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 绘制压缩后的图片
      ctx?.drawImage(img, 0, 0, width, height);
      
      // 转换为Blob - 使用更低的质量
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

// 超快速压缩函数
export function ultraCompressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // 超激进压缩：最大400px，质量40%
      const maxSize = 400;
      let { width, height } = img;
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
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
      }, 'image/jpeg', 0.4); // 40% 质量
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
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('开始上传图片:', { fileName: file.name, fileSize: file.size, userId });
  
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

    console.log('开始压缩图片...');
    const compressedFile = await compressImage(file);
    console.log('图片压缩完成:', { 
      originalSize: file.size, 
      compressedSize: compressedFile.size,
      compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(2) + '%'
    });
    
    const fileName = generateUniqueFileName(file.name, userId);
    console.log('生成文件名:', fileName);
    
    const storageRef = ref(storage, fileName);
    console.log('创建存储引用成功');
    
    // 使用可恢复上传
    const uploadTask = uploadBytesResumable(storageRef, compressedFile);
    console.log('开始上传任务...');
    
    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        console.error('上传超时');
        uploadTask.cancel();
        reject(new Error('上传超时，请检查网络连接'));
      }, 60000); // 60秒超时
      
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // 计算上传进度
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log('上传进度:', Math.round(progress) + '%', {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state
          });
          onProgress?.(Math.round(progress));
        },
        (error) => {
          clearTimeout(timeout);
          console.error('上传失败:', error);
          console.error('错误详情:', {
            code: error.code,
            message: error.message,
            serverResponse: error.serverResponse
          });
          
          // 根据错误类型提供更具体的错误信息
          let errorMessage = '上传失败';
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = '没有上传权限，请检查Firebase Storage安全规则';
              break;
            case 'storage/canceled':
              errorMessage = '上传被取消';
              break;
            case 'storage/unknown':
              errorMessage = '未知错误，请重试';
              break;
            case 'storage/invalid-format':
              errorMessage = '文件格式不支持';
              break;
            case 'storage/invalid-argument':
              errorMessage = '上传参数错误';
              break;
            default:
              errorMessage = error.message || '上传失败，请重试';
          }
          
          reject(new Error(errorMessage));
        },
        async () => {
          // 上传完成
          clearTimeout(timeout);
          try {
            console.log('上传完成，获取下载URL...');
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log('图片上传成功:', downloadURL);
            resolve(downloadURL);
          } catch (error) {
            console.error('获取下载URL失败:', error);
            reject(new Error('获取图片URL失败'));
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

// 简化的上传函数（不压缩，用于调试）
export async function uploadImageSimple(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('使用简化上传模式:', { fileName: file.name, fileSize: file.size, userId });
  
  try {
    // 基本验证
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件');
    }
    
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('图片文件不能超过5MB');
    }
    
    const fileName = generateUniqueFileName(file.name, userId);
    console.log('生成文件名:', fileName);
    
    const storageRef = ref(storage, fileName);
    console.log('创建存储引用成功');
    
    if (onProgress) onProgress(10);
    
    // 直接上传原文件，不压缩
    console.log('开始上传原文件...');
    const snapshot = await uploadBytes(storageRef, file);
    
    if (onProgress) onProgress(90);
    
    console.log('上传完成，获取下载URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    if (onProgress) onProgress(100);
    
    console.log('简化上传成功:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('简化上传失败:', error);
    throw error;
  }
}

// 超快速上传函数 - 最激进压缩
export async function uploadImageUltraFast(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('使用超快速上传模式:', { fileName: file.name, fileSize: file.size, userId });
  
  try {
    // 基本验证
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件');
    }
    
    if (onProgress) onProgress(5);
    
    // 超激进压缩
    console.log('开始超激进压缩...');
    const compressedFile = await ultraCompressImage(file);
    console.log('压缩完成:', { 
      originalSize: file.size, 
      compressedSize: compressedFile.size,
      compressionRatio: ((file.size - compressedFile.size) / file.size * 100).toFixed(2) + '%'
    });
    
    if (onProgress) onProgress(30);
    
    const fileName = generateUniqueFileName(file.name, userId);
    const storageRef = ref(storage, fileName);
    
    if (onProgress) onProgress(40);
    
    // 直接上传压缩后的文件
    console.log('开始上传压缩文件...');
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    if (onProgress) onProgress(80);
    
    console.log('上传完成，获取下载URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    if (onProgress) onProgress(100);
    
    console.log('超快速上传成功:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('超快速上传失败:', error);
    throw error;
  }
}

// 智能上传函数 - 根据文件大小选择策略
export async function uploadImageSmart(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('使用智能上传模式:', { fileName: file.name, fileSize: file.size, userId });
  
  const fileSizeMB = file.size / 1024 / 1024;
  
  // 根据文件大小选择上传策略
  if (fileSizeMB < 0.5) {
    // 小于500KB，直接上传
    console.log('文件较小，使用直接上传');
    return uploadImageSimple(file, userId, onProgress);
  } else if (fileSizeMB < 2) {
    // 500KB-2MB，标准压缩
    console.log('文件中等，使用标准压缩');
    return uploadImageWithProgress(file, userId, onProgress);
  } else {
    // 大于2MB，超激进压缩
    console.log('文件较大，使用超激进压缩');
    return uploadImageUltraFast(file, userId, onProgress);
  }
}

// 极速上传函数 - 专门解决上传慢问题
export async function uploadImageTurbo(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('🚀 使用极速上传模式:', { fileName: file.name, fileSize: file.size, userId });
  
  try {
    // 基本验证
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件');
    }
    
    if (onProgress) onProgress(5);
    
    let fileToUpload = file;
    
    // 只对大文件进行极简压缩
    if (file.size > 1024 * 1024) { // 大于1MB才压缩
      console.log('文件较大，进行极简压缩...');
      fileToUpload = await new Promise<File>((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // 极简压缩：只缩小尺寸，不降低质量
          const maxSize = 800;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
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
          }, 'image/jpeg', 0.85); // 85% 质量，保持较好画质
        };
        
        img.src = URL.createObjectURL(file);
      });
      
      console.log('极简压缩完成:', { 
        originalSize: file.size, 
        compressedSize: fileToUpload.size,
        compressionRatio: ((file.size - fileToUpload.size) / file.size * 100).toFixed(2) + '%'
      });
    }
    
    if (onProgress) onProgress(20);
    
    const fileName = generateUniqueFileName(file.name, userId);
    const storageRef = ref(storage, fileName);
    
    if (onProgress) onProgress(30);
    
    // 使用最简单的上传方式
    console.log('开始极速上传...');
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    
    if (onProgress) onProgress(90);
    
    console.log('上传完成，获取下载URL...');
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    if (onProgress) onProgress(100);
    
    console.log('🎉 极速上传成功:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('💥 极速上传失败:', error);
    throw error;
  }
}

// 超级稳定上传函数 - 解决卡住问题
export async function uploadImageRobust(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('🛡️ 使用超级稳定上传模式:', { fileName: file.name, fileSize: file.size, userId });
  
  try {
    // 基本验证
    if (!file.type.startsWith('image/')) {
      throw new Error('只能上传图片文件');
    }
    
    if (onProgress) onProgress(5);
    
    let fileToUpload = file;
    
    // 对所有文件进行轻度压缩，确保上传速度
    console.log('开始轻度压缩...');
    fileToUpload = await new Promise<File>((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // 设置压缩超时
      const timeout = setTimeout(() => {
        reject(new Error('压缩超时'));
      }, 10000); // 10秒超时
      
      img.onload = () => {
        clearTimeout(timeout);
        try {
          // 轻度压缩：最大1000px，质量90%
          const maxSize = 1000;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            const ratio = Math.min(maxSize / width, maxSize / height);
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
          }, 'image/jpeg', 0.9); // 90% 质量
        } catch (error) {
          resolve(file); // 压缩失败就用原文件
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeout);
        resolve(file); // 加载失败就用原文件
      };
      
      img.src = URL.createObjectURL(file);
    });
    
    console.log('轻度压缩完成:', { 
      originalSize: file.size, 
      compressedSize: fileToUpload.size,
      compressionRatio: ((file.size - fileToUpload.size) / file.size * 100).toFixed(2) + '%'
    });
    
    if (onProgress) onProgress(15);
    
    const fileName = generateUniqueFileName(file.name, userId);
    const storageRef = ref(storage, fileName);
    
    if (onProgress) onProgress(20);
    
    // 使用带超时的上传
    console.log('开始稳定上传...');
    
    const uploadPromise = uploadBytes(storageRef, fileToUpload);
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('上传超时 - 网络可能有问题'));
      }, 30000); // 30秒超时
    });
    
    if (onProgress) onProgress(30);
    
    // 竞速：上传 vs 超时
    const snapshot = await Promise.race([uploadPromise, timeoutPromise]);
    
    if (onProgress) onProgress(80);
    
    console.log('上传完成，获取下载URL...');
    
    const urlPromise = getDownloadURL(snapshot.ref);
    const urlTimeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('获取URL超时'));
      }, 10000); // 10秒超时
    });
    
    const downloadURL = await Promise.race([urlPromise, urlTimeoutPromise]);
    
    if (onProgress) onProgress(100);
    
    console.log('🎉 稳定上传成功:', downloadURL);
    return downloadURL;
    
  } catch (error) {
    console.error('💥 稳定上传失败:', error);
    throw error;
  }
}

// 终极上传函数 - 多重策略自动重试
export async function uploadImageUltimate(
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  console.log('⚡ 使用终极上传模式:', { fileName: file.name, fileSize: file.size, userId });
  
  const strategies = [
    { name: '稳定上传', func: uploadImageRobust },
    { name: '极速上传', func: uploadImageTurbo },
    { name: '简化上传', func: uploadImageSimple },
    { name: '超快速上传', func: uploadImageUltraFast }
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    try {
      console.log(`尝试策略 ${i + 1}/${strategies.length}: ${strategy.name}`);
      
      const result = await strategy.func(file, userId, (progress) => {
        // 调整进度，为每个策略分配25%的进度空间
        const adjustedProgress = Math.floor((i * 25) + (progress * 0.25));
        if (onProgress) onProgress(Math.min(adjustedProgress, 95));
      });
      
      if (onProgress) onProgress(100);
      console.log(`✅ ${strategy.name}成功!`);
      return result;
      
    } catch (error) {
      console.warn(`❌ ${strategy.name}失败:`, error);
      
      if (i === strategies.length - 1) {
        // 所有策略都失败了
        throw new Error(`所有上传策略都失败了。最后错误: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      // 等待1秒后尝试下一个策略
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  throw new Error('上传失败');
} 