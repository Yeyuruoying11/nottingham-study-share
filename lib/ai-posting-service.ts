import { AICharacter, AIGeneratedPost, PostCategory } from './types';
import { addDoc, collection, updateDoc, doc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from './firebase';
import { ImageStorageService } from './image-storage-service';
import { NewsService } from './news-service';
import { AIPostHistoryService } from './ai-post-history-service';

// AI内容生成服务
export class AIPostingService {
  
  // 生成AI帖子内容 - 增强版本，包含重复性检测
  static async generatePostContent(
    character: AICharacter, 
    category?: PostCategory,
    topic?: string,
    isNewsPost: boolean = false,
    maxRetries: number = 3
  ): Promise<AIGeneratedPost> {
    try {
      if (isNewsPost && character.settings.news_posting?.enabled) {
        // 生成新闻类型的帖子
        return await this.generateNewsPost(character);
      } else {
        // 确定分类
        const selectedCategory = category || this.getRandomCategory(character.settings.auto_posting.categories);
        
        let attempt = 0;
        let lastError: Error | null = null;

        // 重试机制，确保生成不重复的内容
        while (attempt < maxRetries) {
          try {
            // 调用AI生成内容
            const aiContent = await this.callAIToGenerateContent(character, selectedCategory, topic);
            console.log('AI生成内容成功:', aiContent.title);

            // 检查内容重复性
            console.log(`检查AI角色 ${character.displayName} 的内容重复性...`);
            const duplicationCheck = await AIPostHistoryService.checkContentDuplication(
              character.id,
              aiContent.title,
              aiContent.content,
              selectedCategory
            );

            if (duplicationCheck.isDuplicate) {
              console.log(`内容重复度: ${(duplicationCheck.similarity * 100).toFixed(1)}%`);
              console.log('相似帖子:', duplicationCheck.similarPost?.title);
              
              if (duplicationCheck.suggestions) {
                console.log('改进建议:', duplicationCheck.suggestions);
                
                // 使用改进建议重新生成内容
                const enhancedTopic = duplicationCheck.suggestions[0] || topic || selectedCategory;
                console.log(`根据建议重新生成内容: ${enhancedTopic}`);
                
                const enhancedContent = await this.callAIToGenerateContentWithSuggestions(
                  character, 
                  selectedCategory, 
                  enhancedTopic,
                  duplicationCheck.suggestions
                );
                
                // 再次检查新内容的重复性
                const secondCheck = await AIPostHistoryService.checkContentDuplication(
                  character.id,
                  enhancedContent.title,
                  enhancedContent.content,
                  selectedCategory
                );
                
                if (!secondCheck.isDuplicate) {
                  console.log('重新生成的内容通过重复性检测');
                  return await this.finalizePostContent(character, enhancedContent, selectedCategory);
                }
              }
              
              // 如果仍然重复，尝试不同的分类或话题
              attempt++;
              if (attempt < maxRetries) {
                console.log(`第${attempt}次尝试，使用不同策略重新生成...`);
                
                // 使用其他分类
                const alternativeCategories = character.settings.auto_posting.categories.filter(
                  cat => cat !== selectedCategory
                );
                if (alternativeCategories.length > 0) {
                  const newCategory = this.getRandomCategory(alternativeCategories);
                  console.log(`尝试使用不同分类: ${newCategory}`);
                  category = newCategory;
                }
                
                continue;
              }
            } else {
              console.log('内容通过重复性检测，相似度:', (duplicationCheck.similarity * 100).toFixed(1) + '%');
              return await this.finalizePostContent(character, aiContent, selectedCategory);
            }
            
          } catch (apiError) {
            console.error(`第${attempt + 1}次生成失败:`, apiError);
            lastError = apiError as Error;
            attempt++;
            
            if (attempt < maxRetries) {
              console.log(`等待${2000 * attempt}ms后重试...`);
              await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
            }
          }
        }
        
        // 所有重试都失败，使用增强备用内容
        console.error('AI内容生成和重复性检测失败，使用增强备用内容:', lastError);
        return this.generateEnhancedFallbackContent(character, selectedCategory, topic);
      }
    } catch (error) {
      console.error('生成帖子内容失败:', error);
      // 最终备用方案
      const fallbackCategory = category || '生活';
      return this.generateEnhancedFallbackContent(character, fallbackCategory, topic);
    }
  }

  // 生成新闻类型的帖子
  static async generateNewsPost(character: AICharacter): Promise<AIGeneratedPost> {
    try {
      console.log('开始生成新闻帖子，角色:', character.displayName);
      
      const newsSettings = character.settings.news_posting;
      if (!newsSettings || !newsSettings.enabled) {
        throw new Error('新闻发布功能未启用');
      }

      // 获取新闻摘要
      const newsDigest = await NewsService.getNewsDigest(
        newsSettings.news_sources,
        newsSettings.include_weather,
        newsSettings.include_events
      );

      console.log('获取到新闻摘要:', {
        newsCount: newsDigest.news.length,
        hasWeather: !!newsDigest.weather,
        eventsCount: newsDigest.events.length
      });

      if (newsDigest.news.length === 0 && !newsDigest.weather && newsDigest.events.length === 0) {
        throw new Error('暂无可用的新闻信息');
      }

      // 格式化新闻内容
      const formattedContent = NewsService.formatNewsContent(newsDigest);
      
      // 使用AI优化新闻内容
      const optimizedContent = await this.optimizeNewsContent(character, formattedContent, newsDigest);
      
      // 确定帖子分类
      const category = NewsService.getPostCategoryForNews(newsDigest);
      
      // 生成标签
      const tags = this.generateNewsPostTags(newsDigest);
      
      // 生成摘要
      const excerpt = this.generateNewsExcerpt(newsDigest);

      const newsPost: AIGeneratedPost = {
        title: optimizedContent.title,
        content: optimizedContent.content,
        category: category,
        tags: tags,
        excerpt: excerpt,
        images: character.settings.auto_posting.include_images ? [] : undefined
      };

      console.log('新闻帖子生成成功:', newsPost.title);
      return newsPost;

    } catch (error) {
      console.error('生成新闻帖子失败:', error);
      throw error;
    }
  }

  // 使用AI优化新闻内容
  private static async optimizeNewsContent(
    character: AICharacter,
    rawContent: string,
    newsDigest: { news: any[]; weather: any; events: any[] }
  ): Promise<{ title: string; content: string }> {
    try {
      // 构建优化提示词
      const prompt = this.buildNewsOptimizationPrompt(character, rawContent, newsDigest);
      
      const apiEndpoint = character.model === 'gpt4o' 
        ? '/api/ai/generate-content-gpt' 
        : '/api/ai/generate-content';
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: character.model,
          prompt: prompt,
          maxTokens: character.settings.max_response_length * 2,
          temperature: character.settings.temperature
        })
      });
      
      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.content) {
        throw new Error('API返回内容为空');
      }
      
      // 解析AI生成的内容
      let aiContent = result.content;
      console.log('AI优化的新闻内容:', aiContent);
      
      if (typeof aiContent === 'string') {
        aiContent = aiContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
        
        try {
          const parsedContent = JSON.parse(aiContent);
          return {
            title: parsedContent.title || '📰 今日资讯速递',
            content: parsedContent.content || rawContent
          };
        } catch (parseError) {
          console.warn('解析AI优化内容失败，使用默认格式');
          return {
            title: '📰 今日资讯速递',
            content: rawContent
          };
        }
      }
      
      return {
        title: aiContent.title || '📰 今日资讯速递',
        content: aiContent.content || rawContent
      };
      
    } catch (error) {
      console.error('AI优化新闻内容失败:', error);
      // 失败时返回原始内容
      return {
        title: '📰 今日资讯速递',
        content: rawContent
      };
    }
  }

  // 构建新闻优化提示词
  private static buildNewsOptimizationPrompt(
    character: AICharacter,
    rawContent: string,
    newsDigest: { news: any[]; weather: any; events: any[] }
  ): string {
    const virtualUser = character.virtual_user || {};
    const profile = virtualUser.profile || {};
    
    let prompt = `${character.systemPrompt}\n\n`;
    prompt += `你是${character.displayName}，一个在${profile.university || '诺丁汉大学'}学习的${profile.year || '学生'}。\n`;
    prompt += `现在需要你将以下新闻信息整理成一篇适合学生社交平台的帖子。\n\n`;
    
    prompt += `原始新闻内容：\n${rawContent}\n\n`;
    
    prompt += `要求：\n`;
    prompt += `1. 保持${this.getToneDescription(character.personality?.tone || 'friendly')}的语调\n`;
    prompt += `2. 内容要实用且与学生生活相关\n`;
    prompt += `3. 适当添加emoji让内容更生动\n`;
    prompt += `4. 突出对学生有用的信息\n`;
    prompt += `5. 保持信息的准确性\n\n`;
    
    if (newsDigest.weather) {
      prompt += `特别注意：包含天气信息，请提醒学生根据天气情况做好准备。\n`;
    }
    
    if (newsDigest.events.length > 0) {
      prompt += `特别注意：包含校园活动信息，请鼓励学生参与。\n`;
    }
    
    prompt += `请用JSON格式返回，包含以下字段：\n`;
    prompt += `{\n`;
    prompt += `  "title": "吸引人的标题（20字以内）",\n`;
    prompt += `  "content": "优化后的帖子内容"\n`;
    prompt += `}`;

    return prompt;
  }

  // 生成新闻帖子标签
  private static generateNewsPostTags(newsDigest: { news: any[]; weather: any; events: any[] }): string[] {
    const tags = ['诺丁汉资讯'];
    
    if (newsDigest.weather) {
      tags.push('天气提醒');
    }
    
    if (newsDigest.news.some(news => news.category === 'university')) {
      tags.push('校园新闻');
    }
    
    if (newsDigest.news.some(news => news.category === 'local')) {
      tags.push('本地新闻');
    }
    
    if (newsDigest.events.length > 0) {
      tags.push('校园活动');
    }
    
    tags.push('今日速递');
    
    return tags.slice(0, 5); // 最多5个标签
  }

  // 生成新闻摘要
  private static generateNewsExcerpt(newsDigest: { news: any[]; weather: any; events: any[] }): string {
    let excerpt = '';
    
    if (newsDigest.weather) {
      excerpt += `今日天气：${newsDigest.weather.condition} ${newsDigest.weather.temperature}°C`;
    }
    
    if (newsDigest.news.length > 0) {
      if (excerpt) excerpt += ' | ';
      excerpt += `${newsDigest.news.length}条重要资讯`;
    }
    
    if (newsDigest.events.length > 0) {
      if (excerpt) excerpt += ' | ';
      const todayEvents = newsDigest.events.filter(event => event.isToday);
      if (todayEvents.length > 0) {
        excerpt += `今日${todayEvents.length}个校园活动`;
      } else {
        excerpt += `${newsDigest.events.length}个近期活动`;
      }
    }
    
    return excerpt || '今日诺丁汉资讯速递';
  }

  // 检查今日新闻发布限制
  static async checkDailyNewsPostLimit(characterId: string, maxNewsPerDay: number): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = query(
        collection(db, 'posts'),
        where('aiCharacterId', '==', characterId),
        where('createdAt', '>=', today),
        where('createdAt', '<', tomorrow),
        where('tags', 'array-contains', '今日速递') // 通过标签识别新闻帖子
      );

      const snapshot = await getDocs(q);
      const todayNewsPostCount = snapshot.size;

      console.log(`AI角色 ${characterId} 今日新闻发帖数: ${todayNewsPostCount}/${maxNewsPerDay}`);
      
      return todayNewsPostCount < maxNewsPerDay;
    } catch (error) {
      console.error('检查新闻发帖限制失败:', error);
      return false;
    }
  }

  // 检查是否在新闻发送时间范围内
  static isInNewsPostTimeRange(timeRange: { start: number; end: number }): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    
    // 处理跨天的情况
    if (timeRange.start <= timeRange.end) {
      return currentHour >= timeRange.start && currentHour <= timeRange.end;
    } else {
      return currentHour >= timeRange.start || currentHour <= timeRange.end;
    }
  }

  // 发布AI生成的帖子
  static async publishAIPost(character: AICharacter, generatedPost: AIGeneratedPost): Promise<string> {
    try {
      // 确保头像URL不为空
      const avatarUrl = character.avatar || 'https://images.unsplash.com/photo-1635776062043-223faf322b1d?w=40&h=40&fit=crop&crop=face';
      
      // 安全获取虚拟用户信息
      const virtualUser = character.virtual_user || {};
      const profile = virtualUser.profile || {};
      
      // 准备帖子数据
      const postData = {
        title: generatedPost.title,
        content: generatedPost.content,
        excerpt: generatedPost.excerpt,
        images: [], // 先为空，后续更新
        authorId: virtualUser.uid || `ai_${character.id}`,
        author: {
          uid: virtualUser.uid || `ai_${character.id}`,
          name: character.displayName,
          displayName: character.displayName,
          avatar: avatarUrl,
          university: profile.university || '诺丁汉大学',
          year: profile.year || '在读学生',
          major: profile.major || '未指定专业'
        },
        category: generatedPost.category,
        tags: generatedPost.tags,
        likes: 0,
        likedBy: [],
        comments: 0,
        views: 0,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        isAIGenerated: true,
        aiCharacterId: character.id,
        fullContent: generatedPost.content
      };

      // 先创建帖子记录获得ID
      const docRef = await addDoc(collection(db, 'posts'), postData);
      const postId = docRef.id;
      console.log('AI帖子记录创建成功，ID:', postId);

      // 🆕 记录AI帖子历史
      try {
        await AIPostHistoryService.recordPost(
          character.id,
          generatedPost.title,
          generatedPost.content,
          generatedPost.category,
          generatedPost.tags,
          postId
        );
        console.log(`AI帖子历史记录成功: ${character.displayName} - ${generatedPost.title}`);
      } catch (historyError) {
        console.error('记录AI帖子历史失败:', historyError);
        // 不影响主流程，继续执行
      }

      // 异步处理图片生成和保存（不阻塞帖子发布）
      this.processAndSavePostImage(postId, character, generatedPost)
        .then((finalImages) => {
          if (finalImages.length > 0) {
            console.log('帖子图片处理完成:', finalImages);
          }
        })
        .catch((error) => {
          console.error('帖子图片处理失败:', error);
        });

      console.log('AI帖子发布成功:', postId, '作者:', character.displayName);
      
      // 更新AI角色统计
      await this.updateCharacterStats(character.id);
      
      return postId;
    } catch (error) {
      console.error('发布AI帖子失败:', error);
      throw error;
    }
  }

  // 处理并保存帖子图片（异步执行）
  private static async processAndSavePostImage(
    postId: string, 
    character: AICharacter, 
    generatedPost: AIGeneratedPost
  ): Promise<string[]> {
    try {
      console.log('开始处理帖子图片，帖子ID:', postId);
      
      // 生成临时图片
      const tempImageUrl = await this.generateRelatedImage(generatedPost.title, generatedPost.category);
      
      if (!tempImageUrl) {
        console.log('图片生成失败，帖子将无图片');
        return [];
      }

      console.log('临时图片生成成功:', tempImageUrl);

      // 如果已经是Firebase Storage URL，直接使用
      if (ImageStorageService.isFirebaseStorageUrl(tempImageUrl)) {
        const finalImages = [tempImageUrl];
        
        // 更新帖子图片信息
        await updateDoc(doc(db, 'posts', postId), {
          images: finalImages,
          updatedAt: new Date()
        });
        
        console.log('使用现有Firebase图片URL');
        return finalImages;
      }

      // 保存图片到Firebase Storage
      console.log('开始将图片保存到Firebase Storage...');
      const permanentImageUrl = await ImageStorageService.saveAIPostImage(
        tempImageUrl,
        postId,
        character.id
      );

      const finalImages = [permanentImageUrl];

      // 更新帖子的图片信息
      await updateDoc(doc(db, 'posts', postId), {
        images: finalImages,
        updatedAt: new Date()
      });
      
      console.log('图片保存并更新成功，永久URL:', permanentImageUrl);
      return finalImages;
      
    } catch (error) {
      console.error('处理帖子图片失败:', error);
      return [];
    }
  }

  // 生成相关图片
  static async generateRelatedImage(title: string, category: PostCategory): Promise<string | null> {
    try {
      // 根据标题和分类生成相关的关键词
      const keywords = this.generateImageKeywords(title, category);
      
      // 使用多种方法确保图片多样性
      const imageUrl = await this.getContentSpecificImage(title, keywords, category);
      
      if (imageUrl) {
        console.log('成功生成内容相关图片:', imageUrl);
        return imageUrl;
      }
      
      return null;
    } catch (error) {
      console.error('生成图片失败:', error);
      return null;
    }
  }

  // 基于内容生成特定图片
  private static async getContentSpecificImage(title: string, keywords: string[], category: PostCategory): Promise<string | null> {
    try {
      // 方法1: 基于标题关键词生成唯一图片
      const titleKeywords = this.extractKeywordsFromTitle(title);
      const combinedKeywords = [...titleKeywords, ...keywords].slice(0, 3);
      
      // 使用时间戳和内容hash确保图片唯一性
      const contentHash = this.generateContentHash(title + category);
      const timeStamp = Date.now();
      
      console.log('为帖子生成图片，标题:', title);
      console.log('提取的关键词:', combinedKeywords);
      
      // 方法1: 使用Unsplash的搜索API风格URL
      const searchQuery = combinedKeywords.join(',');
      const unsplashUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(searchQuery)}&sig=${contentHash}&t=${timeStamp}`;
      
      // 测试URL可用性 - 移除timeout属性
      try {
        const testResponse = await fetch(unsplashUrl, { method: 'HEAD' });
        if (testResponse.ok) {
          console.log('Unsplash图片生成成功，关键词:', searchQuery);
          return unsplashUrl;
        }
      } catch (unsplashError) {
        console.warn('Unsplash服务检测失败，使用备用方案');
      }
      
      // 方法2: 基于内容的智能图片选择
      const smartImageUrl = this.getSmartContentImage(title, category, contentHash);
      if (smartImageUrl) {
        console.log('使用智能内容图片选择');
        return smartImageUrl;
      }
      
      // 方法3: 分类相关的动态图片池
      const dynamicImageUrl = this.getDynamicCategoryImage(category, contentHash);
      console.log('使用动态分类图片:', dynamicImageUrl);
      return dynamicImageUrl;
      
    } catch (error) {
      console.error('获取内容特定图片失败:', error);
      return this.getFallbackImage(category);
    }
  }

  // 从标题中提取关键词
  private static extractKeywordsFromTitle(title: string): string[] {
    // 移除特殊符号和表情
    const cleanTitle = title.replace(/[【】\[\]()（）🎯📰💡✨🔥👍❤️]/g, '').trim();
    
    // 分词并过滤
    const words = cleanTitle.split(/[\s\-_,，。！？、]+/)
      .filter(word => word.length > 1)
      .filter(word => !['的', '和', '与', '或', '但', '在', '了', '吗', '呢', '啊', '哦', '嗯'].includes(word))
      .slice(0, 3);
    
    console.log('从标题提取关键词:', words);
    return words;
  }

  // 生成内容哈希
  private static generateContentHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  // 智能内容图片选择
  private static getSmartContentImage(title: string, category: PostCategory, hash: string): string | null {
    const titleLower = title.toLowerCase();
    
    // 基于标题内容的智能匹配
    const contentMappings = {
      // 旅行相关
      travel: {
        keywords: ['旅行', '欧洲', '周末', '景点', '巴黎', '伦敦', '爱丁堡', '约克', '峰区'],
        images: [
          'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1539650116574-75c0c6d45d3b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=600&fit=crop'
        ]
      },
      // 美食相关
      food: {
        keywords: ['美食', '餐厅', '菜', '吃', '火锅', 'meal deal', '超市', '烹饪'],
        images: [
          'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop'
        ]
      },
      // 学习相关
      study: {
        keywords: ['学习', '图书馆', '作业', 'deadline', '复习', '考试', '课程'],
        images: [
          'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop'
        ]
      },
      // 生活相关
      life: {
        keywords: ['生活', '宿舍', '校园', '诺丁汉', '朋友', '活动'],
        images: [
          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop'
        ]
      }
    };
    
    // 查找匹配的内容类型
    for (const [type, mapping] of Object.entries(contentMappings)) {
      if (mapping.keywords.some(keyword => titleLower.includes(keyword))) {
        const imageIndex = parseInt(hash, 36) % mapping.images.length;
        console.log(`智能匹配到${type}类型，选择图片索引:`, imageIndex);
        return mapping.images[imageIndex];
      }
    }
    
    return null;
  }

  // 动态分类图片池
  private static getDynamicCategoryImage(category: PostCategory, hash: string): string {
    const categoryImagePools = {
      '旅行': [
        'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1539650116574-75c0c6d45d3b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1528181304800-259b08848526?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop'
      ],
      '美食': [
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop'
      ],
      '学习': [
        'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=600&fit=crop'
      ],
      '生活': [
        'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1517048676732-d65bc937f952?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=800&h=600&fit=crop'
      ],
      '租房': [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1493663284031-b7e3aaa4cab7?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop'
      ],
      '资料': [
        'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop'
      ]
    };
    
    const imagePool = categoryImagePools[category] || categoryImagePools['生活'];
    const imageIndex = parseInt(hash, 36) % imagePool.length;
    
    console.log(`从${category}分类图片池选择图片，索引:`, imageIndex);
    return imagePool[imageIndex];
  }

  // 获取备用图片
  private static getFallbackImage(category: PostCategory): string {
    const fallbackImages = {
      '旅行': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=600&fit=crop',
      '美食': 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
      '学习': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop',
      '生活': 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop',
      '租房': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop',
      '资料': 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=800&h=600&fit=crop'
    };
    
    return fallbackImages[category] || fallbackImages['生活'];
  }

  // 生成图片关键词
  private static generateImageKeywords(title: string, category: PostCategory): string[] {
    const categoryKeywords = {
      '生活': ['lifestyle', 'daily life', 'student life', 'university', 'dormitory', 'campus'],
      '美食': ['food', 'cooking', 'restaurant', 'meal', 'cuisine', 'dining'],
      '学习': ['study', 'education', 'books', 'library', 'classroom', 'student'],
      '旅行': ['travel', 'adventure', 'landscape', 'city', 'journey', 'exploration'],
      '资料': ['documents', 'study materials', 'notebook', 'computer', 'desk', 'workspace'],
      '租房': ['apartment', 'housing', 'room', 'building', 'home', 'interior']
    };

    // 基础关键词
    let keywords = categoryKeywords[category] || ['university', 'student'];
    
    // 从标题中提取关键词
    const titleWords = title.toLowerCase().split(/\s+/);
    const relevantWords = titleWords.filter(word => 
      word.length > 2 && 
      !['的', '是', '在', '有', '和', '或', '但', '这', '那', '了', '吗', '呢', 'the', 'is', 'and', 'or', 'but'].includes(word)
    );
    
    // 合并关键词并去重 - 修复Set迭代问题
    keywords = Array.from(new Set([...keywords, ...relevantWords]));
    
    return keywords.slice(0, 3); // 最多3个关键词
  }

  // 检查今日发帖限制
  static async checkDailyPostLimit(characterId: string, maxPostsPerDay: number): Promise<boolean> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = query(
        collection(db, 'posts'),
        where('aiCharacterId', '==', characterId),
        where('createdAt', '>=', today),
        where('createdAt', '<', tomorrow)
      );

      const snapshot = await getDocs(q);
      const todayPostCount = snapshot.size;

      console.log(`AI角色 ${characterId} 今日发帖数: ${todayPostCount}/${maxPostsPerDay}`);
      
      return todayPostCount < maxPostsPerDay;
    } catch (error) {
      console.error('检查发帖限制失败:', error);
      return false;
    }
  }

  // 调用AI生成内容
  private static async callAIToGenerateContent(character: AICharacter, category?: PostCategory, topic?: string): Promise<any> {
    try {
      // 构造完整的API端点URL - 修复URL构造问题
      let baseUrl: string;
      if (typeof window !== 'undefined') {
        // 客户端环境
        baseUrl = window.location.origin;
      } else {
        // 服务器端环境 - 确保有完整的URL
        baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        
        // 确保URL格式正确
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          // 如果是localhost，使用http，否则使用https
          const protocol = baseUrl.includes('localhost') ? 'http://' : 'https://';
          baseUrl = protocol + baseUrl;
        }
        
        // 移除尾部斜杠
        baseUrl = baseUrl.replace(/\/$/, '');
      }
      
      const apiEndpoint = character.model === 'gpt4o' 
        ? `${baseUrl}/api/ai/generate-content-gpt` 
        : `${baseUrl}/api/ai/generate-content`;
      
      // 构建提示词
      const prompt = this.buildContentPrompt(character, category || '生活', topic);
      
      console.log('调用AI生成内容API:', apiEndpoint);
      console.log('Base URL:', baseUrl);
      console.log('请求参数:', {
        model: character.model || 'deepseek',
        prompt: prompt.substring(0, 100) + '...',
        maxTokens: character.settings.max_response_length,
        temperature: character.settings.temperature
      });
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: character.model || 'deepseek',
          prompt: prompt,
          maxTokens: Math.max(character.settings.max_response_length || 2000, 2000), // 确保至少2000 tokens
          temperature: character.settings.temperature
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API调用失败:', response.status, errorText);
        throw new Error(`AI API调用失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('AI内容生成成功:', data.success);
      
      if (data.success && data.content) {
        return data.content;
      } else {
        throw new Error('AI API返回格式错误');
      }
      
    } catch (error) {
      console.error('AI内容生成失败:', error);
      throw error;
    }
  }

  // 构建内容生成提示词
  private static buildContentPrompt(character: AICharacter, category: PostCategory, topic?: string): string {
    let prompt = `${character.systemPrompt}\n\n`;
    
    // 安全获取虚拟用户信息，提供默认值
    const virtualUser = character.virtual_user || {};
    const profile = virtualUser.profile || {};
    const university = profile.university || '诺丁汉大学';
    const major = profile.major || '未指定专业';
    const year = profile.year || '在读学生';
    const bio = profile.bio || '诺丁汉大学留学生';
    
    prompt += `你是${character.displayName}，一个在${university}学习${major}的${year}学生。\n`;
    prompt += `个人简介：${bio}\n\n`;
    
    prompt += `请为诺丁汉大学留学生社交平台创作一篇关于"${category}"的帖子。\n`;
    
    if (topic) {
      prompt += `具体主题：${topic}\n`;
    }
    
    prompt += `要求：\n`;
    prompt += `1. 以${this.getToneDescription(character.personality?.tone || 'friendly')}的语调写作\n`;
    prompt += `2. 体现${this.getStyleDescription(character.personality?.style || 'helpful')}的风格\n`;
    prompt += `3. 内容要实用、有趣，符合留学生需求\n`;
    prompt += `4. 字数控制在200-500字之间\n`;
    prompt += `5. 包含3-5个相关标签\n`;
    prompt += `6. 提供80字以内的摘要\n\n`;
    
    prompt += `请用JSON格式返回，包含以下字段：\n`;
    prompt += `{\n`;
    prompt += `  "title": "帖子标题（吸引人且相关）",\n`;
    prompt += `  "content": "帖子正文内容",\n`;
    prompt += `  "excerpt": "80字以内的摘要",\n`;
    prompt += `  "tags": ["标签1", "标签2", "标签3"]\n`;
    prompt += `}`;

    return prompt;
  }

  // 生成备用内容
  private static generateMockContent(
    character: AICharacter, 
    category: PostCategory,
    topic?: string
  ): AIGeneratedPost {
    const contentTemplates = {
      '生活': [
        '在诺丁汉的留学生活真的很充实！今天想和大家分享一些日常生活的小贴士。',
        '诺丁汉的秋天真美，今天在校园里走走，感受到了浓浓的学术氛围。',
        '留学生活不易，但每一天都是新的体验和成长。'
      ],
      '美食': [
        '今天发现了一家超棒的中餐厅，想推荐给大家！',
        '自己动手做了家乡菜，虽然简单但味道很正宗。',
        '诺丁汉的美食文化真的很丰富，今天来分享我的发现。'
      ],
      '学习': [
        '期末考试季来了，分享一些高效的学习方法给大家。',
        '图书馆是我最喜欢的学习地点，今天来聊聊学习心得。',
        '刚完成了一个重要的课程项目，想分享一些学习经验。'
      ],
      '旅行': [
        '周末去了附近的小镇，风景真的太美了！',
        '英国的自然风光让人心旷神怡，今天分享我的旅行见闻。',
        '利用假期时间探索了英国的历史文化，收获满满。'
      ],
      '资料': [
        '整理了一些课程资料，希望对同专业的同学有帮助。',
        '发现了一些很有用的学习资源，分享给需要的同学。',
        '期末复习资料整理，大家一起加油！'
      ],
      '租房': [
        '租房经验分享：在诺丁汉找到满意住所的一些小贴士。',
        '学生公寓vs私人租房，来聊聊各自的优缺点。',
        '房屋租赁注意事项，避免踩坑的实用建议。'
      ]
    };

    const templates = contentTemplates[category] || contentTemplates['生活'];
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    let title = topic || `${category}分享 - ${character.displayName}的经验`;
    let content = randomTemplate;
    
    // 根据主题调整内容
    if (topic) {
      content = `关于"${topic}"，${content}`;
      title = `${topic} - ${category}分享`;
    }
    
    // 扩展内容
    const expansions = [
      '作为留学生，我觉得这个话题很值得和大家讨论。',
      '希望我的分享能对刚来诺丁汉的同学有所帮助。',
      '如果大家有类似的经历或想法，欢迎在评论区交流！',
      '留学路上我们互相帮助，共同成长。',
      '期待听到大家的想法和建议。'
    ];
    
    content += '\n\n' + expansions[Math.floor(Math.random() * expansions.length)];
    
    // 添加AI角色的个性化结尾
    const personalizedEndingMap = {
      'friendly': '希望这个分享对大家有用！有什么想法欢迎在评论区交流～ 😊',
      'professional': '以上就是我的经验分享，希望能为大家提供参考。',
      'casual': '就分享到这里啦！大家有什么问题随时问我～',
      'formal': '感谢大家阅读，期待与各位同学进一步交流。',
      'humorous': '哈哈，说了这么多，希望没有把大家说困～有用的话记得点赞哦！'
    };
    
    const personalizedEnding = personalizedEndingMap[character.personality.tone] || personalizedEndingMap['friendly'];
    
    return {
      title: title,
      content: content + '\n\n' + personalizedEnding,
      category: category,
      tags: this.generateTags(category),
      excerpt: content.substring(0, 80) + '...',
      images: character.settings.auto_posting.include_images ? [] : undefined
    };
  }

  // 生成标签
  private static generateTags(category: PostCategory): string[] {
    const tagMap = {
      '生活': ['诺丁汉生活', '留学日常', '校园生活', '生活分享'],
      '美食': ['美食推荐', '诺丁汉美食', '留学生美食', '餐厅推荐'],
      '学习': ['学习方法', '学术分享', '课程心得', '考试技巧'],
      '旅行': ['英国旅行', '周末出游', '景点推荐', '旅行攻略'],
      '资料': ['学习资料', '课程资源', '学术资料', '资料分享'],
      '租房': ['租房攻略', '住宿指南', '诺丁汉租房', '学生公寓']
    };

    const tags = tagMap[category] || ['留学生活', '诺丁汉大学'];
    return tags.slice(0, Math.floor(Math.random() * 2) + 3); // 随机选择3-4个标签
  }

  // 随机选择分类
  private static getRandomCategory(categories: PostCategory[]): PostCategory {
    return categories[Math.floor(Math.random() * categories.length)];
  }

  // 获取语调描述 - 修复类型索引问题
  private static getToneDescription(tone: string): string {
    const toneMap: Record<string, string> = {
      'friendly': '友好亲切',
      'professional': '专业严谨',
      'casual': '轻松随意',
      'formal': '正式得体',
      'humorous': '幽默风趣'
    };
    return toneMap[tone] || '自然';
  }

  // 获取风格描述 - 修复类型索引问题
  private static getStyleDescription(style: string): string {
    const styleMap: Record<string, string> = {
      'helpful': '乐于助人',
      'educational': '富有教育意义',
      'entertaining': '有趣生动',
      'supportive': '支持鼓励'
    };
    return styleMap[style] || '友好';
  }

  // 更新AI角色统计
  private static async updateCharacterStats(characterId: string): Promise<void> {
    try {
      const characterRef = doc(db, 'ai_characters', characterId);
      
      // 获取今日发帖数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = query(
        collection(db, 'posts'),
        where('aiCharacterId', '==', characterId),
        where('createdAt', '>=', today),
        where('createdAt', '<', tomorrow)
      );

      const snapshot = await getDocs(q);
      const postsToday = snapshot.size;

      // 获取总发帖数
      const totalQuery = query(
        collection(db, 'posts'),
        where('aiCharacterId', '==', characterId)
      );
      const totalSnapshot = await getDocs(totalQuery);
      const totalPosts = totalSnapshot.size;

      await updateDoc(characterRef, {
        'stats.total_posts': totalPosts,
        'stats.posts_today': postsToday,
        'stats.last_post': new Date(),
        updated_at: new Date()
      });

    } catch (error) {
      console.error('更新AI角色统计失败:', error);
    }
  }

  // 生成增强的备用内容
  private static generateEnhancedFallbackContent(
    character: AICharacter, 
    category: PostCategory, 
    topic?: string
  ): AIGeneratedPost {
    const templates = this.getFallbackTemplates(character, category);
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    // 生成标签
    const tags = this.generateTags(category);
    
    return {
      title: selectedTemplate.title,
      content: selectedTemplate.content,
      category: category,
      tags: tags,
      excerpt: selectedTemplate.excerpt,
      images: character.settings.auto_posting.include_images ? [] : undefined
    };
  }

  // 获取备用内容模板 - 修复分类缺失问题
  private static getFallbackTemplates(character: AICharacter, category: PostCategory) {
    const characterName = character.displayName || character.name;
    
    const templates: Record<PostCategory, any[]> = {
      '生活': [
        {
          title: `${characterName}的日常分享`,
          content: `今天想和大家聊聊最近的一些生活感悟。\n\n作为一名${character.virtual_user?.profile?.university}的学生，每天都在体验着不同的生活节奏。无论是在图书馆熬夜复习，还是和朋友们一起探索诺丁汉的街头小巷，每一天都充满了新的发现。\n\n生活就是这样，简单而美好。希望和大家分享更多有趣的内容！`,
          excerpt: `${characterName}分享日常生活感悟，记录在${character.virtual_user?.profile?.university}的学习生活点滴。`
        },
        {
          title: `关于诺丁汉生活的一些思考`,
          content: `最近在思考在诺丁汉生活的这段时间里学到了什么。\n\n这座城市给了我很多惊喜，从Trent Building的现代化设施到Market Square的历史韵味，每个角落都有自己的故事。\n\n特别是图书馆里那些认真学习的同学们，总是让我觉得很有动力。学习之余，偶尔去Peak District走走，感受英国乡村的宁静，也是很不错的体验。\n\n希望能继续在这里发现更多美好的事物！`,
          excerpt: `分享在诺丁汉的生活感悟，从校园学习到户外探索的点点滴滴。`
        }
      ],
      '学习': [
        {
          title: `${characterName}的学习心得分享`,
          content: `最近的学习状态还不错，想和大家分享一些学习方法。\n\n在${character.virtual_user?.profile?.university}学习期间，我发现最重要的是找到适合自己的学习节奏。图书馆是个很好的学习场所，特别是考试周的时候，大家一起努力的氛围很棒。\n\n另外，参加study group也很有帮助，和同学们讨论问题总能获得新的思路。当然，适当的休息也很重要，劳逸结合才能保持高效。\n\n希望这些经验对大家有帮助！`,
          excerpt: `${characterName}分享在${character.virtual_user?.profile?.university}的学习心得和方法。`
        }
      ],
      '旅行': [
        {
          title: `${characterName}的旅行经验分享`,
          content: `最近有机会到周边几个城市走了走，想和大家分享一些旅行心得。\n\n英国的交通还是很方便的，火车网络覆盖很广。学生证在很多地方都有折扣，这点真的很实用。住宿的话，青旅是不错的选择，既经济又能遇到有趣的人。\n\n记得随身带着雨伞，英国的天气确实变化多端。还有就是提前做好攻略，这样能节省不少时间和金钱。\n\n希望大家都能有愉快的旅行体验！`,
          excerpt: `${characterName}分享英国旅行经验，从交通住宿到实用贴士一应俱全。`
        }
      ],
      '美食': [
        {
          title: `${characterName}的美食发现`,
          content: `今天想和大家分享一些在诺丁汉发现的美食。\n\n作为留学生，找到好吃又实惠的餐厅真的很重要。这段时间探索了不少地方，从正宗的中餐厅到英式传统菜，每一次尝试都是新的体验。\n\n特别推荐那些隐藏在小巷里的本地餐厅，价格合理味道也很棒。当然，偶尔自己下厨也是很有趣的体验。\n\n希望这些美食分享能帮到大家！`,
          excerpt: `${characterName}分享诺丁汉美食发现，从餐厅推荐到烹饪心得。`
        }
      ],
      '资料': [
        {
          title: `${characterName}的学习资料整理`,
          content: `最近整理了一些学习资料，想和同专业的同学分享。\n\n好的学习资料对提高学习效率真的很重要。这些资料包括课程笔记、参考书籍推荐，还有一些实用的学习工具。\n\n希望这些资源能对大家的学习有所帮助。如果有什么问题随时可以交流讨论。\n\n一起加油，努力学习！`,
          excerpt: `${characterName}分享学习资料和学习工具，助力同学们提高学习效率。`
        }
      ],
      '租房': [
        {
          title: `${characterName}的租房经验`,
          content: `作为过来人，想和大家分享一些在诺丁汉租房的经验。\n\n找房子确实是留学生活中的一大挑战。从选择地段到看房签约，每个环节都有需要注意的地方。\n\n建议大家提前开始准备，多比较几个选择。安全性和交通便利性都很重要，当然价格也要在预算范围内。\n\n希望这些经验能帮到准备租房的同学！`,
          excerpt: `${characterName}分享诺丁汉租房经验，从选房到签约的实用建议。`
        }
      ]
    };

    return templates[category] || templates['生活'];
  }

  // 生成摘要
  private static generateExcerptFromContent(content: string): string {
    // 实现摘要生成逻辑
    return content.substring(0, 80) + '...';
  }

  // 根据改进建议生成内容
  private static async callAIToGenerateContentWithSuggestions(
    character: AICharacter,
    category: PostCategory,
    topic: string,
    suggestions: string[]
  ): Promise<any> {
    try {
      // 构建带有建议的提示词
      const enhancedPrompt = this.buildEnhancedContentPrompt(character, category, topic, suggestions);
      
      let baseUrl: string;
      if (typeof window !== 'undefined') {
        // 客户端环境
        baseUrl = window.location.origin;
      } else {
        // 服务器端环境 - 确保有完整的URL
        baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        
        // 确保URL格式正确
        if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
          // 如果是localhost，使用http，否则使用https
          const protocol = baseUrl.includes('localhost') ? 'http://' : 'https://';
          baseUrl = protocol + baseUrl;
        }
        
        // 移除尾部斜杠
        baseUrl = baseUrl.replace(/\/$/, '');
      }
      
      const apiEndpoint = character.model === 'gpt4o' 
        ? `${baseUrl}/api/ai/generate-content-gpt` 
        : `${baseUrl}/api/ai/generate-content`;
      
      console.log('调用增强AI内容生成API:', apiEndpoint);
      console.log('Base URL:', baseUrl);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: character.model || 'deepseek',
          prompt: enhancedPrompt,
          maxTokens: Math.max(character.settings.max_response_length || 2000, 2000), // 确保至少2000 tokens
          temperature: Math.min(character.settings.temperature + 0.2, 1.0) // 增加随机性
        })
      });

      if (!response.ok) {
        throw new Error(`增强AI API调用失败: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.content) {
        return data.content;
      } else {
        throw new Error('增强AI API返回格式错误');
      }
      
    } catch (error) {
      console.error('增强AI内容生成失败:', error);
      throw error;
    }
  }

  // 构建增强的内容生成提示词
  private static buildEnhancedContentPrompt(
    character: AICharacter,
    category: PostCategory,
    topic: string,
    suggestions: string[]
  ): string {
    let prompt = `${character.systemPrompt}\n\n`;
    
    const virtualUser = character.virtual_user || {};
    const profile = virtualUser.profile || {};
    
    prompt += `你是${character.displayName}，一个在${profile.university || '诺丁汉大学'}学习的${profile.year || '学生'}。\n`;
    prompt += `专业：${profile.major || '未指定专业'}，个人简介：${profile.bio || '诺丁汉大学留学生'}\n\n`;
    
    prompt += `请为诺丁汉大学留学生社交平台创作一篇关于"${category}"的帖子。\n`;
    prompt += `主题建议：${topic}\n\n`;
    
    prompt += `⚠️ 重要要求 - 避免内容重复：\n`;
    prompt += `为了保持内容新颖性，请重点关注以下建议主题：\n`;
    suggestions.forEach((suggestion, index) => {
      prompt += `${index + 1}. ${suggestion}\n`;
    });
    prompt += `\n`;
    
    prompt += `创作要求：\n`;
    prompt += `1. 以${this.getToneDescription(character.personality?.tone || 'friendly')}的语调写作\n`;
    prompt += `2. 体现${this.getStyleDescription(character.personality?.style || 'helpful')}的风格\n`;
    prompt += `3. 内容要实用、有趣，符合留学生需求\n`;
    prompt += `4. 字数控制在200-500字之间\n`;
    prompt += `5. 包含3-5个相关标签\n`;
    prompt += `6. 提供80字以内的摘要\n`;
    prompt += `7. 🔥 特别重要：确保内容独特新颖，避免老生常谈的话题\n`;
    prompt += `8. 可以结合当前时间、季节、校园活动等时效性内容\n\n`;
    
    prompt += `请用JSON格式返回，包含以下字段：\n`;
    prompt += `{\n`;
    prompt += `  "title": "帖子标题（吸引人且独特）",\n`;
    prompt += `  "content": "帖子正文内容（原创且实用）",\n`;
    prompt += `  "excerpt": "80字以内的摘要",\n`;
    prompt += `  "tags": ["标签1", "标签2", "标签3"]\n`;
    prompt += `}`;

    return prompt;
  }

  // 完成帖子内容生成
  private static async finalizePostContent(
    character: AICharacter,
    aiContent: any,
    category: PostCategory
  ): Promise<AIGeneratedPost> {
    // 生成标签
    const tags = this.generateTags(category);
    
    // 生成摘要
    const excerpt = aiContent.excerpt || this.generateExcerptFromContent(aiContent.content);
    
    // 生成相关图片
    const relatedImage = character.settings.auto_posting.include_images 
      ? await this.generateRelatedImage(aiContent.title, category)
      : null;
    
    const post: AIGeneratedPost = {
      title: aiContent.title,
      content: aiContent.content,
      category: category,
      tags: tags,
      excerpt: excerpt,
      images: relatedImage ? [relatedImage] : undefined
    };

    return post;
  }
}

// AI发帖调度器
export class AIPostingScheduler {
  
  // 检查并处理待发布的任务
  static async processScheduledTasks(): Promise<void> {
    try {
      console.log('开始处理AI发帖任务...');
      
      // 使用更简单的查询避免索引问题
      const allTasksQuery = query(
        collection(db, 'ai_posting_tasks'),
        where('status', '==', 'pending'),
        limit(10) // 限制查询数量
      );

      const snapshot = await getDocs(allTasksQuery);
      
      if (snapshot.empty) {
        console.log('没有待处理的发帖任务');
        return;
      }
      
      // 在客户端过滤和排序
      const now = new Date();
      const dueTasks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((task: any) => {
          const scheduledTime = task.scheduled_time?.toDate() || new Date(0);
          return scheduledTime <= now;
        })
        .sort((a: any, b: any) => {
          const timeA = a.scheduled_time?.toDate() || new Date(0);
          const timeB = b.scheduled_time?.toDate() || new Date(0);
          return timeA.getTime() - timeB.getTime();
        })
        .slice(0, 5); // 每次最多处理5个任务
      
      console.log(`找到 ${dueTasks.length} 个待处理的任务`);
      
      for (const task of dueTasks) {
        try {
          await this.executePostingTask(task);
        } catch (taskError) {
          console.error(`处理任务 ${task.id} 失败:`, taskError);
          // 继续处理其他任务
        }
      }
    } catch (error) {
      console.error('处理发帖任务失败:', error);
    }
  }

  // 执行发帖任务
  private static async executePostingTask(task: any): Promise<void> {
    try {
      // 获取AI角色信息
      const characterDoc = await getDocs(
        query(collection(db, 'ai_characters'), where('id', '==', task.ai_character_id))
      );
      
      if (characterDoc.empty) {
        throw new Error('AI角色不存在');
      }

      const character = characterDoc.docs[0].data() as AICharacter;
      
      // 检查发帖限制
      const canPost = await AIPostingService.checkDailyPostLimit(
        character.id, 
        character.settings.auto_posting.max_posts_per_day
      );

      if (!canPost) {
        throw new Error('已达到今日发帖上限');
      }

      // 生成并发布内容
      const generatedPost = await AIPostingService.generatePostContent(
        character, 
        task.category,
        task.topic
      );
      
      const postId = await AIPostingService.publishAIPost(character, generatedPost);

      // 更新任务状态
      await updateDoc(doc(db, 'ai_posting_tasks', task.id), {
        status: 'completed',
        completed_at: new Date(),
        post_id: postId
      });

      console.log(`AI发帖任务完成: ${task.ai_character_name} -> ${postId}`);

    } catch (error) {
      console.error('执行发帖任务失败:', error);
      
      // 更新任务状态为失败
      await updateDoc(doc(db, 'ai_posting_tasks', task.id), {
        status: 'failed',
        completed_at: new Date(),
        error_message: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 为启用自动发帖的AI角色创建定时任务
  static async scheduleNextPosts(): Promise<void> {
    try {
      console.log('开始安排下次发帖任务...');
      
      // 使用简单查询获取所有AI角色
      const allCharactersQuery = query(
        collection(db, 'ai_characters'),
        limit(20) // 限制查询数量
      );

      const snapshot = await getDocs(allCharactersQuery);
      
      if (snapshot.empty) {
        console.log('没有找到AI角色');
        return;
      }
      
      // 在客户端过滤启用自动发帖的角色
      const activeCharacters = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((character: any) => {
          return character.status === 'active' && 
                 character.settings?.auto_posting?.enabled === true;
        });
      
      console.log(`找到 ${activeCharacters.length} 个启用自动发帖的AI角色`);
      
      for (const character of activeCharacters) {
        try {
          await this.scheduleNextPostForCharacter(character as AICharacter);
        } catch (scheduleError) {
          console.error(`为角色 ${(character as any).displayName || character.id} 安排任务失败:`, scheduleError);
          // 继续处理其他角色
        }
      }
    } catch (error) {
      console.error('创建定时任务失败:', error);
    }
  }

  // 为特定AI角色安排下一次发帖 - 修复Firebase Timestamp类型问题
  private static async scheduleNextPostForCharacter(character: AICharacter): Promise<void> {
    try {
      // 安全地处理时间戳，可能来自Firebase的Timestamp对象
      let lastPostTime: Date;
      const lastPost = character.stats?.last_post;
      
      if (lastPost) {
        // 如果是Firebase Timestamp对象，转换为Date
        if (lastPost && typeof lastPost === 'object' && 'toDate' in lastPost && typeof (lastPost as any).toDate === 'function') {
          lastPostTime = (lastPost as any).toDate();
        } 
        // 如果已经是Date对象
        else if (lastPost instanceof Date) {
          lastPostTime = lastPost;
        }
        // 如果是字符串，转换为Date
        else if (typeof lastPost === 'string') {
          lastPostTime = new Date(lastPost);
        }
        // 如果是数字（时间戳），转换为Date
        else if (typeof lastPost === 'number') {
          lastPostTime = new Date(lastPost);
        }
        // 其他情况使用默认值
        else {
          lastPostTime = new Date(0);
        }
      } else {
        lastPostTime = new Date(0);
      }
      
      // 确保lastPostTime是有效的Date对象
      if (!(lastPostTime instanceof Date) || isNaN(lastPostTime.getTime())) {
        console.warn('无效的lastPostTime，使用默认值');
        lastPostTime = new Date(0);
      }
      
      const intervalMs = character.settings.auto_posting.interval_hours * 60 * 60 * 1000;
      const nextPostTime = new Date(lastPostTime.getTime() + intervalMs);

      // 如果下一次发帖时间还没到，就创建任务
      if (nextPostTime > new Date()) {
        const taskData = {
          ai_character_id: character.id,
          ai_character_name: character.displayName,
          scheduled_time: nextPostTime,
          status: 'pending',
          created_at: new Date()
        };

        await addDoc(collection(db, 'ai_posting_tasks'), taskData);
        console.log(`为 ${character.displayName} 安排下次发帖: ${nextPostTime}`);
      }
    } catch (error) {
      console.error('安排发帖任务失败:', error);
    }
  }
} 