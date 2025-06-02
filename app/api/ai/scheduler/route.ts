import { NextRequest, NextResponse } from 'next/server';
import { aiScheduler } from '@/lib/ai-scheduler';
import { AIChatService } from '@/lib/ai-chat-service';

// 获取调度器状态和控制
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = aiScheduler.getStatus();
        return NextResponse.json({
          success: true,
          ...status,
          message: status.isRunning ? 'AI调度器正在运行' : 'AI调度器已停止'
        });

      case 'start':
        if (!aiScheduler.isRunning) {
          aiScheduler.start();
        }
        return NextResponse.json({
          success: true,
          message: 'AI调度器已启动'
        });

      case 'stop':
        if (aiScheduler.isRunning) {
          aiScheduler.stop();
        }
        return NextResponse.json({
          success: true,
          message: 'AI调度器已停止'
        });

      case 'trigger':
        // 手动触发任务处理
        await aiScheduler.triggerNow();
        return NextResponse.json({
          success: true,
          message: '手动任务处理完成'
        });

      default:
        return NextResponse.json({
          success: false,
          message: '未知操作'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('调度器API错误:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '调度器操作失败',
        success: false 
      },
      { status: 500 }
    );
  }
}

// 启动调度器和处理任务
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'start') {
      if (!aiScheduler.isRunning) {
        aiScheduler.start();
        
        return NextResponse.json({
          success: true,
          message: 'AI调度器启动成功'
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'AI调度器已在运行'
        });
      }
    }

    if (action === 'process_chat_tasks') {
      // 立即处理聊天任务
      await AIChatService.processScheduledChatTasks();
      
      return NextResponse.json({
        success: true,
        message: 'AI聊天任务处理完成'
      });
    }

    return NextResponse.json({
      success: false,
      message: '未知操作'
    }, { status: 400 });

  } catch (error) {
    console.error('启动调度器失败:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '启动失败',
        success: false 
      },
      { status: 500 }
    );
  }
}

// 自动启动调度器（应用启动时）
if (typeof window === 'undefined') {
  // 仅在服务器端执行
  setTimeout(() => {
    if (!aiScheduler.isRunning) {
      aiScheduler.start();
      console.log('🚀 AI调度器自动启动');
    }
  }, 3000); // 延迟3秒启动，确保应用完全加载
} 