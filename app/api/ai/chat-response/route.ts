import { NextRequest, NextResponse } from 'next/server';
import { AIChatService } from '@/lib/ai-chat-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { conversationId, messageId, userMessage, aiCharacterId } = body;

    // 验证必要参数
    if (!conversationId || !messageId || !userMessage || !aiCharacterId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // 处理AI聊天消息
    await AIChatService.handleIncomingMessage(
      conversationId,
      messageId,
      userMessage,
      aiCharacterId
    );

    return NextResponse.json({ 
      success: true,
      message: 'AI chat task created successfully'
    });

  } catch (error) {
    console.error('AI聊天响应API错误:', error);
    return NextResponse.json(
      { error: 'Failed to process AI chat message' },
      { status: 500 }
    );
  }
}

// 处理AI聊天任务调度
export async function GET(request: NextRequest) {
  try {
    // 处理待处理的聊天任务
    await AIChatService.processScheduledChatTasks();

    return NextResponse.json({
      success: true,
      message: 'AI chat tasks processed successfully'
    });

  } catch (error) {
    console.error('AI聊天任务处理错误:', error);
    return NextResponse.json(
      { error: 'Failed to process AI chat tasks' },
      { status: 500 }
    );
  }
} 