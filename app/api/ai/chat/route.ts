import { NextRequest, NextResponse } from 'next/server';

// DeepSeek API配置
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json(
        { error: 'DeepSeek API key not configured' },
        { status: 500 }
      );
    }

    const { model, prompt, maxTokens = 500, temperature = 0.8 } = await request.json();

    // 验证prompt参数
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('Invalid prompt parameter:', prompt);
      return NextResponse.json(
        { error: 'Prompt parameter is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    console.log('AI聊天API调用:', { model, prompt: prompt.substring(0, 100) + '...', maxTokens, temperature });

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: model === 'deepseek' ? 'deepseek-chat' : 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: prompt.trim()
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DeepSeek API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate chat response', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response from DeepSeek API' },
        { status: 500 }
      );
    }

    const chatMessage = data.choices[0].message.content;
    
    console.log('AI聊天响应成功:', chatMessage.substring(0, 100) + '...');
    
    // 返回纯文本响应
    return NextResponse.json({
      success: true,
      message: chatMessage.trim()
    });

  } catch (error) {
    console.error('AI聊天API调用失败:', error);
    return NextResponse.json(
      { success: false, error: '聊天响应生成失败' },
      { status: 500 }
    );
  }
} 