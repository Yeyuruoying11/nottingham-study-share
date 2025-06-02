import { 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  updateDoc,
  doc,
  getDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { AICharacter, PostCategory } from './types';

// AI帖子历史记录接口
export interface AIPostHistory {
  id?: string;
  ai_character_id: string;
  title: string;
  content_summary: string; // 内容摘要，用于重复检测
  category: PostCategory;
  tags: string[];
  created_at: Date;
  post_id: string;
  content_keywords: string[]; // 关键词提取，用于相似度检测
}

// AI帖子历史统计
export interface AIPostStats {
  total_posts: number;
  posts_by_category: Record<PostCategory, number>;
  recent_keywords: string[];
  last_post_date: Date | null;
}

export class AIPostHistoryService {
  
  // 记录AI角色发布的帖子
  static async recordPost(
    characterId: string,
    title: string,
    content: string,
    category: PostCategory,
    tags: string[],
    postId: string
  ): Promise<void> {
    try {
      const contentSummary = this.generateContentSummary(content);
      const keywords = this.extractKeywords(title, content, tags);
      
      const historyRecord: AIPostHistory = {
        ai_character_id: characterId,
        title,
        content_summary: contentSummary,
        category,
        tags,
        created_at: new Date(),
        post_id: postId,
        content_keywords: keywords
      };

      await addDoc(collection(db, 'ai_post_history'), historyRecord);
      console.log(`AI帖子历史已记录: ${characterId} - ${title}`);
      
      // 更新AI角色的帖子统计
      await this.updateCharacterPostStats(characterId);
      
    } catch (error) {
      console.error('记录AI帖子历史失败:', error);
    }
  }

  // 检查内容是否与历史帖子重复
  static async checkContentDuplication(
    characterId: string,
    title: string,
    content: string,
    category: PostCategory
  ): Promise<{
    isDuplicate: boolean;
    similarity: number;
    similarPost?: AIPostHistory;
    suggestions?: string[];
  }> {
    try {
      // 获取该AI角色最近的帖子历史
      const recentHistory = await this.getRecentPostHistory(characterId, 20);
      
      if (recentHistory.length === 0) {
        return { isDuplicate: false, similarity: 0 };
      }

      const newKeywords = this.extractKeywords(title, content, []);
      const newSummary = this.generateContentSummary(content);
      
      let maxSimilarity = 0;
      let mostSimilarPost: AIPostHistory | undefined;

      // 检查与历史帖子的相似度
      for (const historyPost of recentHistory) {
        const similarity = this.calculateSimilarity(
          newKeywords,
          newSummary,
          historyPost.content_keywords,
          historyPost.content_summary
        );

        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          mostSimilarPost = historyPost;
        }
      }

      // 如果相似度超过70%认为是重复
      const isDuplicate = maxSimilarity > 0.7;
      
      // 生成改进建议
      const suggestions = isDuplicate ? this.generateContentSuggestions(
        characterId,
        category,
        recentHistory
      ) : undefined;

      return {
        isDuplicate,
        similarity: maxSimilarity,
        similarPost: mostSimilarPost,
        suggestions
      };

    } catch (error) {
      console.error('检查内容重复性失败:', error);
      return { isDuplicate: false, similarity: 0 };
    }
  }

  // 获取AI角色最近的帖子历史
  static async getRecentPostHistory(
    characterId: string,
    limitCount: number = 10
  ): Promise<AIPostHistory[]> {
    try {
      const q = query(
        collection(db, 'ai_post_history'),
        where('ai_character_id', '==', characterId),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AIPostHistory));

    } catch (error) {
      console.error('获取帖子历史失败:', error);
      return [];
    }
  }

  // 获取AI角色帖子统计信息
  static async getCharacterPostStats(characterId: string): Promise<AIPostStats> {
    try {
      const history = await this.getAllPostHistory(characterId);
      
      const stats: AIPostStats = {
        total_posts: history.length,
        posts_by_category: {} as Record<PostCategory, number>,
        recent_keywords: [],
        last_post_date: null
      };

      // 统计各分类帖子数量
      const categories: PostCategory[] = ['生活', '学习', '旅行', '美食', '资料', '租房'];
      categories.forEach(category => {
        stats.posts_by_category[category] = history.filter(
          post => post.category === category
        ).length;
      });

      // 提取最近的关键词
      const recentPosts = history.slice(0, 10);
      const allKeywords = recentPosts.flatMap(post => post.content_keywords);
      stats.recent_keywords = [...new Set(allKeywords)].slice(0, 20);

      // 最后发帖时间
      if (history.length > 0) {
        stats.last_post_date = history[0].created_at;
      }

      return stats;

    } catch (error) {
      console.error('获取AI帖子统计失败:', error);
      return {
        total_posts: 0,
        posts_by_category: {} as Record<PostCategory, number>,
        recent_keywords: [],
        last_post_date: null
      };
    }
  }

  // 获取所有帖子历史
  private static async getAllPostHistory(characterId: string): Promise<AIPostHistory[]> {
    try {
      const q = query(
        collection(db, 'ai_post_history'),
        where('ai_character_id', '==', characterId),
        orderBy('created_at', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AIPostHistory));

    } catch (error) {
      console.error('获取所有帖子历史失败:', error);
      return [];
    }
  }

  // 生成内容摘要
  private static generateContentSummary(content: string): string {
    // 移除HTML标签和特殊字符
    const cleanContent = content.replace(/<[^>]*>/g, '').replace(/[^\w\s\u4e00-\u9fff]/g, '');
    
    // 提取关键句子（前200字符）
    const summary = cleanContent.substring(0, 200);
    
    return summary;
  }

  // 提取关键词
  private static extractKeywords(title: string, content: string, tags: string[]): string[] {
    const text = `${title} ${content}`.toLowerCase();
    
    // 中文分词（简单实现）
    const chineseWords = text.match(/[\u4e00-\u9fff]+/g) || [];
    const englishWords = text.match(/[a-z]+/g) || [];
    
    // 过滤停用词
    const stopWords = new Set([
      '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should'
    ]);

    const allWords = [...chineseWords, ...englishWords, ...tags]
      .filter(word => word.length > 1 && !stopWords.has(word))
      .slice(0, 15);

    return [...new Set(allWords)];
  }

  // 计算相似度
  private static calculateSimilarity(
    keywords1: string[],
    summary1: string,
    keywords2: string[],
    summary2: string
  ): number {
    // 关键词相似度（权重70%）
    const keywordSimilarity = this.calculateKeywordSimilarity(keywords1, keywords2);
    
    // 内容摘要相似度（权重30%）
    const summarySimilarity = this.calculateTextSimilarity(summary1, summary2);
    
    return keywordSimilarity * 0.7 + summarySimilarity * 0.3;
  }

  // 计算关键词相似度
  private static calculateKeywordSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.max(set1.size, set2.size);
  }

  // 计算文本相似度（简单字符重叠）
  private static calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    
    return intersection.size / Math.max(set1.size, set2.size);
  }

  // 生成内容改进建议
  private static generateContentSuggestions(
    characterId: string,
    category: PostCategory,
    recentHistory: AIPostHistory[]
  ): string[] {
    const suggestions: string[] = [];
    
    // 分析最近使用的关键词
    const recentKeywords = new Set(
      recentHistory.flatMap(post => post.content_keywords)
    );
    
    // 根据分类提供建议
    const categoryTopics = {
      '生活': ['宿舍生活', '日常购物', '天气感受', '文化差异', '节日庆祝', '健康生活'],
      '学习': ['课程体验', '学习方法', '图书馆', '小组讨论', '考试准备', '作业技巧'],
      '旅行': ['周边景点', '交通攻略', '住宿体验', '文化探索', '摄影分享', '预算规划'],
      '美食': ['本地餐厅', '自制料理', '食材采购', '饮食文化', '聚餐体验', '健康饮食'],
      '资料': ['课程笔记', '学习资源', '软件工具', '学术论文', '复习材料', '实用网站'],
      '租房': ['房源信息', '租房经验', '搬家攻略', '室友相处', '家具购买', '安全须知']
    };

    const topics = categoryTopics[category] || [];
    const unusedTopics = topics.filter(topic => 
      !Array.from(recentKeywords).some(keyword => 
        topic.includes(keyword) || keyword.includes(topic)
      )
    );

    if (unusedTopics.length > 0) {
      suggestions.push(`尝试写关于"${unusedTopics[0]}"的内容`);
      suggestions.push(`可以分享"${unusedTopics[1] || unusedTopics[0]}"相关的经验`);
    }

    // 添加时效性建议
    const now = new Date();
    const month = now.getMonth() + 1;
    const seasonalTopics = {
      12: ['圣诞节', '新年计划', '冬季活动'],
      1: ['新学期', '新年决心', '冬季生活'],
      2: ['情人节', '春节', '学期规划'],
      3: ['春分', '复活节', 'spring break'],
      4: ['春季', '考试季', '求职准备'],
      5: ['毕业季', '夏季计划', '实习申请'],
      6: ['暑假', '旅行计划', '回国准备'],
      7: ['暑假生活', '实习体验', '夏季活动'],
      8: ['开学准备', '新生入学', '课程选择'],
      9: ['秋季学期', '社团活动', '适应生活'],
      10: ['万圣节', '秋季景色', '期中考试'],
      11: ['感恩节', '黑五购物', '期末准备']
    };

    const currentTopics = seasonalTopics[month as keyof typeof seasonalTopics] || [];
    if (currentTopics.length > 0) {
      suggestions.push(`结合当前时节，可以写"${currentTopics[0]}"相关内容`);
    }

    return suggestions.slice(0, 3);
  }

  // 更新AI角色帖子统计
  private static async updateCharacterPostStats(characterId: string): Promise<void> {
    try {
      const stats = await this.getCharacterPostStats(characterId);
      
      // 更新AI角色文档中的统计信息
      const characterRef = doc(db, 'ai_characters', characterId);
      await updateDoc(characterRef, {
        'stats.post_history': {
          total_posts: stats.total_posts,
          posts_by_category: stats.posts_by_category,
          recent_keywords: stats.recent_keywords,
          last_updated: new Date()
        }
      });

    } catch (error) {
      console.error('更新AI角色统计失败:', error);
    }
  }

  // 清理过期历史记录（保留最近100条）
  static async cleanupOldHistory(characterId: string): Promise<void> {
    try {
      const allHistory = await this.getAllPostHistory(characterId);
      
      if (allHistory.length > 100) {
        const toDelete = allHistory.slice(100);
        
        for (const record of toDelete) {
          if (record.id) {
            await updateDoc(doc(db, 'ai_post_history', record.id), {
              deleted: true,
              deleted_at: new Date()
            });
          }
        }
        
        console.log(`清理了AI角色 ${characterId} 的 ${toDelete.length} 条历史记录`);
      }

    } catch (error) {
      console.error('清理历史记录失败:', error);
    }
  }
} 