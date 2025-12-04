import { AICharacter, AIChatResponse, AIChatTask, AIInitiatedChat } from './types';
import { addDoc, collection, updateDoc, doc, getDocs, query, where, orderBy, limit, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// AI聊天服务
export class AIChatService {
  
  // 处理发送给AI角色的消息
  static async handleIncomingMessage(
    conversationId: string,
    messageId: string,
    userMessage: string,
    aiCharacterId: string
  ): Promise<void> {
    try {
      // 获取AI角色信息 - 通过 virtual_user.uid 查找
      const aiCharacterQuery = query(
        collection(db, 'ai_characters'),
        where('virtual_user.uid', '==', `ai_${aiCharacterId}`)
      );
      const aiCharacterSnapshot = await getDocs(aiCharacterQuery);
      
      if (aiCharacterSnapshot.empty) {
        console.error('AI角色不存在:', aiCharacterId);
        return;
      }

      const characterDoc = aiCharacterSnapshot.docs[0];
      const character = { id: characterDoc.id, ...characterDoc.data() } as AICharacter;
      
      console.log(`找到AI角色: ${character.displayName} (${character.id})`);
      
      // 检查AI聊天是否启用
      if (!character.settings.auto_chat.enabled) {
        console.log('AI聊天功能未启用:', character.displayName);
        return;
      }

      // 检查是否在活跃时间内
      if (!this.isInActiveHours(character)) {
        console.log('不在AI活跃时间内:', character.displayName);
        return;
      }

      // 计算响应延迟
      const delay = this.calculateResponseDelay(character);
      const scheduledTime = new Date(Date.now() + delay);

      // 创建AI聊天任务
      const chatTask: Omit<AIChatTask, 'id'> = {
        ai_character_id: character.id, // 使用真实的文档ID
        conversation_id: conversationId,
        message_id: messageId,
        user_message: userMessage,
        status: 'pending',
        scheduled_time: scheduledTime,
        created_at: new Date()
      };

      await addDoc(collection(db, 'ai_chat_tasks'), chatTask);
      console.log(`AI聊天任务已创建: ${character.displayName} 将在 ${delay}ms 后回复`);

    } catch (error) {
      console.error('处理AI聊天消息失败:', error);
    }
  }

  // 生成AI聊天响应
  static async generateChatResponse(
    character: AICharacter,
    userMessage: string,
    conversationHistory?: string[]
  ): Promise<AIChatResponse> {
    try {
      // 构建聊天提示词
      const prompt = this.buildChatPrompt(character, userMessage, conversationHistory);
      
      // 构造正确的聊天API端点
      const baseUrl = typeof window !== 'undefined' 
        ? window.location.origin 
        : 'http://localhost:3000';
      const apiEndpoint = `${baseUrl}/api/ai/chat`;
      
      console.log('调用AI聊天API:', apiEndpoint);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: character.model || 'deepseek',
          prompt: prompt,
          maxTokens: Math.min(character.settings.max_response_length, 500), // 聊天响应不需要太长
          temperature: Math.max(character.settings.temperature, 0.7) // 聊天需要更多创造性
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('AI聊天API调用失败:', response.status, errorData);
        
        // 如果API调用失败，使用备用响应
        return this.generateFallbackResponse(character, userMessage);
      }
      
      const result = await response.json();
      
      if (!result.success || !result.message) {
        console.error('AI聊天API返回无效响应:', result);
        return this.generateFallbackResponse(character, userMessage);
      }
      
      // AI聊天API直接返回消息文本
      const aiMessage = result.message;
      
      console.log('AI聊天响应成功:', aiMessage.substring(0, 50) + '...');
      
      return {
        message: aiMessage,
        emotion: this.determineEmotion(character, aiMessage),
        shouldContinue: this.shouldContinueConversation(aiMessage)
      };
      
    } catch (error) {
      console.error('生成AI聊天响应失败:', error);
      return this.generateFallbackResponse(character, userMessage);
    }
  }

  // 发送AI响应消息
  static async sendAIResponse(
    conversationId: string,
    aiCharacter: AICharacter,
    responseMessage: string
  ): Promise<string> {
    try {
      // 创建AI响应消息
      const messageData = {
        conversationId: conversationId,
        senderId: aiCharacter.virtual_user.uid,
        senderName: aiCharacter.displayName,
        senderAvatar: aiCharacter.avatar,
        content: responseMessage,
        timestamp: new Date(),
        type: 'text',
        isAIMessage: true,
        aiCharacterId: aiCharacter.id
      };

      const messageRef = await addDoc(collection(db, 'messages'), messageData);
      
      // 更新对话的最后消息时间
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: responseMessage,
        lastMessageTime: new Date(),
        updatedAt: new Date()
      });

      // 更新AI角色统计
      await this.updateChatStats(aiCharacter.id);
      
      console.log(`AI响应已发送: ${aiCharacter.displayName} -> ${responseMessage.substring(0, 50)}...`);
      return messageRef.id;

    } catch (error) {
      console.error('发送AI响应失败:', error);
      throw error;
    }
  }

  // 处理待处理的聊天任务
  static async processScheduledChatTasks(): Promise<void> {
    try {
      const now = new Date();
      const q = query(
        collection(db, 'ai_chat_tasks'),
        where('status', '==', 'pending'),
        where('scheduled_time', '<=', now),
        orderBy('scheduled_time'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      
      for (const taskDoc of snapshot.docs) {
        const task = { id: taskDoc.id, ...taskDoc.data() } as AIChatTask;
        await this.executeChatTask(task);
      }
    } catch (error) {
      console.error('处理AI聊天任务失败:', error);
    }
  }

  // 执行聊天任务
  private static async executeChatTask(task: AIChatTask): Promise<void> {
    try {
      // 更新任务状态为处理中
      await updateDoc(doc(db, 'ai_chat_tasks', task.id), {
        status: 'processing'
      });

      // 获取AI角色信息
      const characterDoc = await getDoc(doc(db, 'ai_characters', task.ai_character_id));
      if (!characterDoc.exists()) {
        throw new Error('AI角色不存在');
      }

      const character = { id: characterDoc.id, ...characterDoc.data() } as AICharacter;
      
      // 获取对话历史（最近10条消息）
      const historyQuery = query(
        collection(db, 'messages'),
        where('conversationId', '==', task.conversation_id),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const historySnapshot = await getDocs(historyQuery);
      const conversationHistory = historySnapshot.docs.map(doc => {
        const msg = doc.data();
        return `${msg.senderName}: ${msg.content}`;
      }).reverse();

      // 生成AI响应
      const response = await this.generateChatResponse(
        character, 
        task.user_message,
        conversationHistory
      );
      
      // 发送AI响应
      const messageId = await this.sendAIResponse(
        task.conversation_id,
        character,
        response.message
      );

      // 更新任务状态为完成
      await updateDoc(doc(db, 'ai_chat_tasks', task.id), {
        status: 'completed',
        completed_at: new Date(),
        ai_response: response.message
      });

      console.log(`AI聊天任务完成: ${character.displayName} -> ${task.user_message}`);

    } catch (error) {
      console.error('执行AI聊天任务失败:', error);
      
      // 更新任务状态为失败
      await updateDoc(doc(db, 'ai_chat_tasks', task.id), {
        status: 'failed',
        completed_at: new Date(),
        error_message: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  // 构建聊天提示词
  private static buildChatPrompt(
    character: AICharacter,
    userMessage: string,
    conversationHistory?: string[]
  ): string {
    let prompt = `${character.systemPrompt}\n\n`;
    
    prompt += `你是${character.displayName}，一个在诺丁汉大学的${character.virtual_user.profile.year}学生。\n`;
    prompt += `专业：${character.virtual_user.profile.major}\n`;
    prompt += `个人简介：${character.virtual_user.profile.bio}\n\n`;
    
    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `最近的对话：\n${conversationHistory.slice(-5).join('\n')}\n\n`;
    }
    
    prompt += `用户发送了消息："${userMessage}"\n\n`;
    
    prompt += `请以${character.displayName}的身份简短回复这条消息。要求：\n`;
    prompt += `1. 保持${this.getToneDescription(character.personality.tone)}的语调\n`;
    prompt += `2. 回复要自然、友好，就像普通的聊天对话\n`;
    prompt += `3. 长度控制在30-100字之间，简洁明了\n`;
    prompt += `4. 根据消息内容给出有用且相关的回复\n`;
    prompt += `5. 可以适当使用emoji表情，但不要过多\n`;
    prompt += `6. 如果是问候，要友好回应；如果是问题，要提供帮助\n\n`;
    
    prompt += `直接回复消息内容，不要包含任何标记或格式：`;

    return prompt;
  }

  // 生成备用响应
  private static generateFallbackResponse(
    character: AICharacter,
    userMessage: string
  ): AIChatResponse {
    const fallbackResponses = {
      'friendly': [
        '谢谢你的消息！我现在有点忙，稍后再详细回复你～',
        '哈哈，这个问题很有趣！让我想想怎么回答你',
        '你说得对！我也有类似的经历呢',
        '这确实是个好问题，我需要仔细考虑一下'
      ],
      'professional': [
        '感谢您的询问，我会尽快为您提供详细回复。',
        '这是一个很好的问题，需要我仔细分析后回答。',
        '我理解您的关注，请允许我稍后给您更完整的回复。'
      ],
      'casual': [
        '哎呀，刚看到你的消息！',
        '哈哈，你这么说还挺有道理的',
        '嗯嗯，我觉得也是这样的',
        '对哦，确实是这样呢'
      ],
      'formal': [
        '感谢您的来信，我会认真考虑您的问题。',
        '您的问题很有深度，我需要一些时间来整理回复。',
        '非常感谢您的耐心，我会尽快给您答复。'
      ],
      'humorous': [
        '哈哈哈，你这个想法太有趣了！',
        '我正在努力思考一个机智的回复... 🤔',
        '你成功地让我笑了，等我组织一下语言回复你！',
        '这个问题让我的大脑短路了一下，重启中...'
      ]
    };

    const responses = fallbackResponses[character.personality.tone] || fallbackResponses['friendly'];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      message: randomResponse,
      emotion: 'neutral',
      shouldContinue: true
    };
  }

  // 检查是否在活跃时间内
  private static isInActiveHours(character: AICharacter): boolean {
    const now = new Date();
    const currentHour = now.getHours();
    const { start, end } = character.settings.auto_chat.active_hours;
    
    if (start <= end) {
      return currentHour >= start && currentHour <= end;
    } else {
      // 跨午夜的情况，例如 22:00 到 06:00
      return currentHour >= start || currentHour <= end;
    }
  }

  // 计算响应延迟
  private static calculateResponseDelay(character: AICharacter): number {
    const { response_delay_min, response_delay_max } = character.settings.auto_chat;
    const minMs = response_delay_min * 1000;
    const maxMs = response_delay_max * 1000;
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }

  // 确定情绪
  private static determineEmotion(character: AICharacter, message: string): AIChatResponse['emotion'] {
    if (message.includes('哈哈') || message.includes('😄') || message.includes('😊')) {
      return 'happy';
    }
    if (message.includes('？') || message.includes('吗') || message.includes('怎么')) {
      return 'curious';
    }
    if (message.includes('帮助') || message.includes('建议') || message.includes('推荐')) {
      return 'helpful';
    }
    return 'neutral';
  }

  // 判断是否应该继续对话
  private static shouldContinueConversation(message: string): boolean {
    const continuationIndicators = ['问', '想知道', '还有', '另外', '对了', '?', '？'];
    return continuationIndicators.some(indicator => message.includes(indicator));
  }

  // 获取语调描述
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

  // 获取风格描述
  private static getStyleDescription(style: string): string {
    const styleMap: Record<string, string> = {
      'helpful': '乐于助人',
      'educational': '富有教育意义',
      'entertaining': '有趣生动',
      'supportive': '支持鼓励'
    };
    return styleMap[style] || '友好';
  }

  // 更新聊天统计
  private static async updateChatStats(characterId: string): Promise<void> {
    try {
      const characterRef = doc(db, 'ai_characters', characterId);
      
      // 获取今日聊天数
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const q = query(
        collection(db, 'messages'),
        where('aiCharacterId', '==', characterId),
        where('timestamp', '>=', today),
        where('timestamp', '<', tomorrow)
      );

      const snapshot = await getDocs(q);
      const chatsToday = snapshot.size;

      // 获取总聊天数
      const totalQuery = query(
        collection(db, 'messages'),
        where('aiCharacterId', '==', characterId)
      );
      const totalSnapshot = await getDocs(totalQuery);
      const totalChats = totalSnapshot.size;

      await updateDoc(characterRef, {
        'stats.total_chats': totalChats,
        'stats.chats_today': chatsToday,
        'stats.last_chat': new Date(),
        updated_at: new Date()
      });

    } catch (error) {
      console.error('更新聊天统计失败:', error);
    }
  }
} 