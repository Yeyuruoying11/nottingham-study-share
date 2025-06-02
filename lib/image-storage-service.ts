import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export class ImageStorageService {
  
  /**
   * 将外部图片URL下载并保存到Firebase Storage
   * @param imageUrl 外部图片URL
   * @param folderPath 存储文件夹路径
   * @param fileName 文件名（不包含扩展名）
   * @returns Firebase Storage中的永久URL
   */
  static async saveImageToStorage(
    imageUrl: string, 
    folderPath: string = 'ai_post_images',
    fileName?: string
  ): Promise<string> {
    try {
      console.log('开始下载并保存图片:', imageUrl);
      
      // 下载图片
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`图片下载失败: ${response.status}`);
      }
      
      // 获取图片数据
      const imageBlob = await response.blob();
      console.log('图片下载成功，大小:', imageBlob.size, 'bytes');
      
      // 确定文件扩展名
      const contentType = imageBlob.type || 'image/jpeg';
      const extension = this.getExtensionFromContentType(contentType);
      
      // 生成文件名
      const finalFileName = fileName 
        ? `${fileName}.${extension}`
        : `ai_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${extension}`;
      
      // 创建Storage引用
      const storageRef = ref(storage, `${folderPath}/${finalFileName}`);
      
      // 上传到Firebase Storage
      console.log('开始上传到Firebase Storage:', finalFileName);
      const uploadTask = await uploadBytes(storageRef, imageBlob, {
        contentType: contentType,
        customMetadata: {
          'originalUrl': imageUrl,
          'uploadedAt': new Date().toISOString(),
          'source': 'ai_post_generation'
        }
      });
      
      // 获取下载URL
      const downloadURL = await getDownloadURL(uploadTask.ref);
      console.log('图片保存成功，Firebase URL:', downloadURL);
      
      return downloadURL;
      
    } catch (error) {
      console.error('保存图片到Storage失败:', error);
      
      // 如果保存失败，返回原始URL（备用方案）
      console.warn('使用原始URL作为备用方案:', imageUrl);
      return imageUrl;
    }
  }

  /**
   * 为AI帖子保存图片
   * @param imageUrl 外部图片URL
   * @param postId 帖子ID
   * @param characterId AI角色ID
   * @returns Firebase Storage中的永久URL
   */
  static async saveAIPostImage(
    imageUrl: string,
    postId: string,
    characterId: string
  ): Promise<string> {
    try {
      console.log('开始处理帖子图片，帖子ID:', postId);
      console.log('图片URL:', imageUrl);
      
      // 验证URL是否有效
      if (!imageUrl || imageUrl.trim() === '') {
        console.error('图片URL为空');
        throw new Error('图片URL不能为空');
      }
      
      // 如果是相对路径，直接返回错误
      if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
        console.error('检测到相对路径URL:', imageUrl);
        console.log('无法在服务端环境处理相对路径，返回空字符串');
        return '';
      }
      
      // 如果已经是Firebase Storage URL，直接返回
      if (this.isFirebaseStorageUrl(imageUrl)) {
        console.log('图片已在Firebase Storage中，直接返回URL');
        return imageUrl;
      }

      // 验证是否是有效的HTTP/HTTPS URL
      try {
        const url = new URL(imageUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
          console.error('不支持的协议:', url.protocol);
          return imageUrl; // 返回原始URL作为备用
        }
      } catch (urlError) {
        console.error('无效的URL格式:', imageUrl, urlError);
        return imageUrl; // 返回原始URL作为备用
      }

      console.log('开始下载图片...');
      // 下载图片
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`下载图片失败: ${response.status} ${response.statusText}`);
      }

      const imageBuffer = await response.arrayBuffer();
      const imageBlob = new Blob([imageBuffer]);
      console.log('图片下载成功，大小:', imageBuffer.byteLength, 'bytes');

      // 生成文件名
      const timestamp = Date.now();
      const fileName = `ai_${characterId}_post_${postId}_${timestamp}.jpg`;
      const storagePath = `ai_post_images/${fileName}`;
      console.log('开始上传到Firebase Storage:', fileName);

      try {
        // 尝试上传到Firebase Storage
        const storageRef = ref(storage, storagePath);
        const uploadResult = await uploadBytes(storageRef, imageBlob);
        const downloadURL = await getDownloadURL(uploadResult.ref);
        
        console.log('图片成功保存到Firebase Storage:', downloadURL);
        return downloadURL;
        
      } catch (uploadError) {
        console.error('保存图片到Storage失败:', uploadError);
        console.log('使用原始URL作为备用方案:', imageUrl);
        
        // 如果是权限错误或其他Storage错误，使用原始URL作为备用方案
        return imageUrl;
      }

    } catch (error) {
      console.error('处理图片时发生错误:', error);
      // 返回原始URL作为最终备用方案
      console.log('使用原始URL作为最终备用方案:', imageUrl);
      return imageUrl;
    }
  }

  /**
   * 批量保存多张图片
   * @param imageUrls 图片URL数组
   * @param folderPath 存储文件夹路径
   * @param fileNamePrefix 文件名前缀
   * @returns Firebase Storage URL数组
   */
  static async saveMultipleImages(
    imageUrls: string[],
    folderPath: string = 'ai_post_images',
    fileNamePrefix: string = 'ai_image'
  ): Promise<string[]> {
    const savedUrls: string[] = [];
    
    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const fileName = `${fileNamePrefix}_${i + 1}_${Date.now()}`;
        const savedUrl = await this.saveImageToStorage(imageUrls[i], folderPath, fileName);
        savedUrls.push(savedUrl);
      } catch (error) {
        console.error(`保存第${i + 1}张图片失败:`, error);
        // 保存失败时使用原始URL
        savedUrls.push(imageUrls[i]);
      }
    }
    
    return savedUrls;
  }

  /**
   * 检查图片是否已经是Firebase Storage URL
   * @param imageUrl 图片URL
   * @returns 是否为Firebase Storage URL
   */
  static isFirebaseStorageUrl(imageUrl: string): boolean {
    return imageUrl.includes('firebasestorage.googleapis.com') || 
           imageUrl.includes('storage.googleapis.com');
  }

  /**
   * 根据Content-Type获取文件扩展名
   * @param contentType MIME类型
   * @returns 文件扩展名
   */
  private static getExtensionFromContentType(contentType: string): string {
    const typeMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
      'image/svg+xml': 'svg'
    };
    
    return typeMap[contentType] || 'jpg';
  }

  /**
   * 压缩图片（如果需要）
   * @param imageBlob 原始图片Blob
   * @param maxWidth 最大宽度
   * @param maxHeight 最大高度
   * @param quality 压缩质量 (0-1)
   * @returns 压缩后的Blob
   */
  static async compressImage(
    imageBlob: Blob,
    maxWidth: number = 1200,
    maxHeight: number = 800,
    quality: number = 0.8
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // 计算新尺寸
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        // 设置canvas尺寸
        canvas.width = width;
        canvas.height = height;
        
        // 绘制并压缩
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (compressedBlob) => {
            resolve(compressedBlob || imageBlob);
          },
          'image/jpeg',
          quality
        );
      };
      
      img.onerror = () => {
        resolve(imageBlob); // 如果处理失败，返回原始blob
      };
      
      img.src = URL.createObjectURL(imageBlob);
    });
  }

  /**
   * 删除Storage中的图片
   * @param imageUrl Firebase Storage URL
   * @returns 是否删除成功
   */
  static async deleteImage(imageUrl: string): Promise<boolean> {
    try {
      if (!this.isFirebaseStorageUrl(imageUrl)) {
        console.warn('不是Firebase Storage URL，跳过删除:', imageUrl);
        return false;
      }
      
      // 从URL中提取文件路径
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)$/);
      
      if (!pathMatch) {
        console.warn('无法解析Firebase Storage路径:', imageUrl);
        return false;
      }
      
      const filePath = decodeURIComponent(pathMatch[1]);
      const fileRef = ref(storage, filePath);
      
      // 删除文件
      const { deleteObject } = await import('firebase/storage');
      await deleteObject(fileRef);
      
      console.log('成功删除Storage中的图片:', filePath);
      return true;
      
    } catch (error) {
      console.error('删除Storage图片失败:', error);
      return false;
    }
  }

  /**
   * 获取图片的元数据
   * @param imageUrl Firebase Storage URL
   * @returns 图片元数据
   */
  static async getImageMetadata(imageUrl: string): Promise<any> {
    try {
      if (!this.isFirebaseStorageUrl(imageUrl)) {
        return null;
      }
      
      const url = new URL(imageUrl);
      const pathMatch = url.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.+)$/);
      
      if (!pathMatch) {
        return null;
      }
      
      const filePath = decodeURIComponent(pathMatch[1]);
      const fileRef = ref(storage, filePath);
      
      const { getMetadata } = await import('firebase/storage');
      const metadata = await getMetadata(fileRef);
      
      return metadata;
      
    } catch (error) {
      console.error('获取图片元数据失败:', error);
      return null;
    }
  }
} 