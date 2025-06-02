import { AIChatService } from './ai-chat-service';
import { AIPostingScheduler } from './ai-posting-service';

export class AIScheduler {
  private chatInterval: NodeJS.Timeout | null = null;
  private postingInterval: NodeJS.Timeout | null = null;
  private _isRunning = false;

  // 获取运行状态
  get isRunning(): boolean {
    return this._isRunning;
  }

  // 获取状态信息
  getStatus() {
    return {
      isRunning: this._isRunning,
      chatInterval: !!this.chatInterval,
      postingInterval: !!this.postingInterval
    };
  }

  // 启动调度器
  start() {
    if (this._isRunning) {
      console.log('AI调度器已在运行');
      return;
    }

    console.log('🚀 启动AI调度器...');
    this._isRunning = true;

    // 每30秒检查一次聊天任务
    this.chatInterval = setInterval(async () => {
      try {
        console.log('🔄 处理AI聊天任务...');
        await AIChatService.processScheduledChatTasks();
      } catch (error) {
        console.error('处理AI聊天任务失败:', error);
      }
    }, 30 * 1000);

    // 每5分钟检查一次发帖任务
    this.postingInterval = setInterval(async () => {
      try {
        console.log('🔄 处理AI发帖任务...');
        await AIPostingScheduler.processScheduledTasks();
        await AIPostingScheduler.scheduleNextPosts();
      } catch (error) {
        console.error('处理AI发帖任务失败:', error);
      }
    }, 5 * 60 * 1000);

    console.log('✅ AI调度器启动完成');
  }

  // 停止调度器
  stop() {
    if (!this._isRunning) {
      console.log('AI调度器未在运行');
      return;
    }

    console.log('🛑 停止AI调度器...');
    
    if (this.chatInterval) {
      clearInterval(this.chatInterval);
      this.chatInterval = null;
    }

    if (this.postingInterval) {
      clearInterval(this.postingInterval);
      this.postingInterval = null;
    }

    this._isRunning = false;
    console.log('✅ AI调度器已停止');
  }

  // 手动触发聊天任务处理
  async triggerChatTasks() {
    try {
      console.log('🔄 手动触发AI聊天任务...');
      await AIChatService.processScheduledChatTasks();
      console.log('✅ 聊天任务处理完成');
    } catch (error) {
      console.error('手动处理聊天任务失败:', error);
      throw error;
    }
  }

  // 手动触发发帖任务处理
  async triggerPostingTasks() {
    try {
      console.log('🔄 手动触发AI发帖任务...');
      await AIPostingScheduler.processScheduledTasks();
      await AIPostingScheduler.scheduleNextPosts();
      console.log('✅ 发帖任务处理完成');
    } catch (error) {
      console.error('手动处理发帖任务失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
export const aiScheduler = new AIScheduler();

// 同时支持默认导出
export default aiScheduler; 