import { NextRequest, NextResponse } from 'next/server';

// OpenAI API配置
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const { model, prompt, maxTokens = 1000, temperature = 0.7 } = await request.json();

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        stream: false
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate content', details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { error: 'Invalid response from OpenAI API' },
        { status: 500 }
      );
    }

    const generatedContent = data.choices[0].message.content;
    
    // 尝试解析JSON格式的内容
    try {
      const parsedContent = JSON.parse(generatedContent);
      return NextResponse.json({ success: true, content: parsedContent });
    } catch (parseError) {
      // 如果不是JSON格式，返回原始文本
      return NextResponse.json({ 
        success: true, 
        content: {
          title: "AI生成内容",
          content: generatedContent,
          excerpt: generatedContent.substring(0, 100) + "...",
          tags: ["AI生成", "内容分享"]
        }
      });
    }

  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 