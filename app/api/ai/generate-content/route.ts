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

    const { model, prompt, maxTokens = 2000, temperature = 0.7 } = await request.json();

    // 验证prompt参数
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      console.error('Invalid prompt parameter:', prompt);
      return NextResponse.json(
        { error: 'Prompt parameter is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // 确保prompt包含JSON格式要求
    let enhancedPrompt = prompt.trim();
    if (!enhancedPrompt.includes('JSON格式')) {
      enhancedPrompt += '\n\n请严格按照以下JSON格式返回，不要添加任何其他内容：\n{"title": "标题", "content": "内容", "excerpt": "摘要", "tags": ["标签1", "标签2"]}';
    }

    console.log('调用DeepSeek API，增强后的提示词:', enhancedPrompt.substring(0, 200) + '...');

    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
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
        { error: 'Failed to generate content', details: errorData },
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

    const generatedContent = data.choices[0].message.content;
    
    console.log('DeepSeek API 原始响应:', generatedContent);
    
    // 检查是否是纯文本回复（可能是聊天响应）
    if (!generatedContent.includes('{') && !generatedContent.includes('"title"')) {
      console.warn('检测到可能是聊天回复，不是内容生成:', generatedContent.substring(0, 100));
      return NextResponse.json(
        { error: '这似乎是聊天回复，请使用聊天API' },
        { status: 400 }
      );
    }
    
    // 清理并解析内容
    let cleanedContent = generatedContent;
    if (typeof generatedContent === 'string') {
      cleanedContent = generatedContent
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
    }
    
    console.log('清理后的内容:', cleanedContent);
    
    // 尝试解析JSON格式的内容
    try {
      // 先尝试直接解析
      let parsedContent;
      try {
        parsedContent = JSON.parse(cleanedContent);
        console.log('JSON解析成功:', parsedContent);
      } catch (firstParseError) {
        console.log('第一次JSON解析失败，尝试修复JSON格式:', firstParseError.message);
        
        // 尝试修复常见的JSON格式问题
        let fixedContent = cleanedContent;
        
        // 如果内容被截断，尝试补完
        if (!fixedContent.endsWith('}') && !fixedContent.endsWith(']')) {
          // 查找最后一个完整的字段
          const lastCompleteField = fixedContent.lastIndexOf('",');
          if (lastCompleteField > -1) {
            fixedContent = fixedContent.substring(0, lastCompleteField + 1) + '}';
          } else {
            // 尝试找到content字段的结束
            const contentStart = fixedContent.indexOf('"content"');
            if (contentStart > -1) {
              const afterContent = fixedContent.substring(contentStart);
              const firstQuote = afterContent.indexOf('"', afterContent.indexOf(':') + 1);
              if (firstQuote > -1) {
                let quoteCount = 1;
                let endIndex = firstQuote + 1;
                while (endIndex < afterContent.length && quoteCount % 2 !== 0) {
                  if (afterContent[endIndex] === '"' && afterContent[endIndex - 1] !== '\\') {
                    quoteCount++;
                  }
                  endIndex++;
                }
                if (quoteCount % 2 === 0) {
                  fixedContent = '{"title": "生活分享", ' + afterContent.substring(0, endIndex) + '}';
                }
              }
            }
          }
        }
        
        // 修复未闭合的大括号和引号
        const openBraces = (fixedContent.match(/{/g) || []).length;
        const closeBraces = (fixedContent.match(/}/g) || []).length;
        if (openBraces > closeBraces) {
          fixedContent += '}';
        }
        
        console.log('修复后的内容:', fixedContent);
        
        try {
          parsedContent = JSON.parse(fixedContent);
          console.log('JSON解析成功:', parsedContent);
        } catch (secondParseError) {
          console.log('第二次JSON解析也失败，尝试智能提取:', secondParseError.message);
          
          // 智能提取关键信息
          parsedContent = extractContentFromBrokenJSON(cleanedContent);
        }
      }
      
      // 验证必要字段
      if (!parsedContent.title || !parsedContent.content) {
        console.warn('缺少必要字段，使用备用格式');
        return NextResponse.json({
          success: true,
          content: {
            title: parsedContent.title || '生活分享',
            content: parsedContent.content || cleanedContent,
            excerpt: parsedContent.excerpt || cleanedContent.substring(0, 80) + '...',
            tags: parsedContent.tags || ['AI生成', '内容分享']
          }
        });
      }
      
      return NextResponse.json({
        success: true,
        content: parsedContent
      });
      
    } catch (error) {
      console.error('JSON解析完全失败，使用文本格式:', error);
      
      // 最终备用方案：使用原始文本内容
      return NextResponse.json({
        success: true,
        content: {
          title: '分享内容',
          content: cleanedContent,
          excerpt: cleanedContent.substring(0, 80) + '...',
          tags: ['AI生成', '内容分享']
        }
      });
    }

  } catch (error) {
    console.error('DeepSeek API调用失败:', error);
    return NextResponse.json(
      { success: false, error: '内容生成失败' },
      { status: 500 }
    );
  }
}

// 智能提取破损JSON中的内容
function extractContentFromBrokenJSON(brokenJSON: string) {
  try {
    // 使用正则表达式提取各个字段
    const titleMatch = brokenJSON.match(/"title"\s*:\s*"([^"]*?)"/);
    const contentMatch = brokenJSON.match(/"content"\s*:\s*"([\s\S]*?)"/);
    const excerptMatch = brokenJSON.match(/"excerpt"\s*:\s*"([^"]*?)"/);
    const tagsMatch = brokenJSON.match(/"tags"\s*:\s*\[(.*?)\]/);
    
    // 如果content匹配失败，尝试更宽松的匹配
    let extractedContent = '';
    if (contentMatch) {
      extractedContent = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    } else {
      // 尝试提取content后面的所有内容直到下一个字段或结束
      const contentStartMatch = brokenJSON.match(/"content"\s*:\s*"/);
      if (contentStartMatch) {
        const startIndex = (contentStartMatch.index || 0) + contentStartMatch[0].length;
        let endIndex = brokenJSON.length;
        
        // 查找下一个字段的开始位置
        const nextFieldMatch = brokenJSON.substring(startIndex).match(/",\s*"/);
        if (nextFieldMatch && nextFieldMatch.index !== undefined) {
          endIndex = startIndex + nextFieldMatch.index;
        }
        
        extractedContent = brokenJSON.substring(startIndex, endIndex);
      }
    }
    
    return {
      title: titleMatch ? titleMatch[1] : '内容分享',
      content: extractedContent || brokenJSON,
      excerpt: excerptMatch ? excerptMatch[1] : extractedContent.substring(0, 80) + '...',
      tags: tagsMatch ? 
        tagsMatch[1].split(',').map(tag => tag.trim().replace(/"/g, '').replace(/'/g, '')) : 
        ['AI生成', '内容分享']
    };
  } catch (error) {
    console.error('智能提取也失败:', error);
    return {
      title: '内容分享',
      content: brokenJSON,
      excerpt: brokenJSON.substring(0, 80) + '...',
      tags: ['AI生成', '内容分享']
    };
  }
} 