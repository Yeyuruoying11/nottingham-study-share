#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 API配置验证脚本');
console.log('='.repeat(50));
console.log('');

// 检查本地环境变量
function checkLocalConfig() {
  console.log('📋 检查本地环境变量配置:');
  
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local 文件不存在');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const hasDeepSeek = envContent.includes('DEEPSEEK_API_KEY=sk-');
  const hasOpenAI = envContent.includes('OPENAI_API_KEY=sk-');
  
  console.log(`${hasDeepSeek ? '✅' : '❌'} DeepSeek API Key: ${hasDeepSeek ? '已配置' : '未配置'}`);
  console.log(`${hasOpenAI ? '✅' : '❌'} OpenAI API Key: ${hasOpenAI ? '已配置' : '未配置'}`);
  
  return hasDeepSeek || hasOpenAI;
}

// 检查运行时环境变量
function checkRuntimeConfig() {
  console.log('');
  console.log('🚀 检查运行时环境变量:');
  
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  console.log(`${deepseekKey ? '✅' : '❌'} DEEPSEEK_API_KEY: ${deepseekKey ? `${deepseekKey.substring(0, 10)}...` : '未设置'}`);
  console.log(`${openaiKey ? '✅' : '❌'} OPENAI_API_KEY: ${openaiKey ? `${openaiKey.substring(0, 10)}...` : '未设置'}`);
  
  return deepseekKey || openaiKey;
}

// 提供配置建议
function provideConfigAdvice() {
  console.log('');
  console.log('💡 配置建议:');
  console.log('');
  console.log('本地开发环境:');
  console.log('- 运行 `npm run setup-api` 配置本地API keys');
  console.log('- 确保 .env.local 文件包含正确的API keys');
  console.log('');
  console.log('Vercel生产环境:');
  console.log('- 访问 https://vercel.com/dashboard');
  console.log('- 进入项目 Settings → Environment Variables');
  console.log('- 添加 DEEPSEEK_API_KEY 和 OPENAI_API_KEY');
  console.log('- 重新部署应用');
  console.log('');
  console.log('成本参考:');
  console.log('- DeepSeek: ~¥0.001/文章 (推荐)');
  console.log('- OpenAI GPT-4o: ~$0.03/文章');
}

// 主函数
function main() {
  console.log('正在检查AI自动发帖功能的API配置...');
  console.log('');
  
  const localConfigOk = checkLocalConfig();
  const runtimeConfigOk = checkRuntimeConfig();
  
  console.log('');
  console.log('📊 配置状态总结:');
  console.log(`本地配置: ${localConfigOk ? '✅ 正常' : '❌ 需要配置'}`);
  console.log(`运行时配置: ${runtimeConfigOk ? '✅ 正常' : '❌ 需要配置'}`);
  
  if (localConfigOk && runtimeConfigOk) {
    console.log('');
    console.log('🎉 配置完成！您可以开始使用AI自动发帖功能了！');
    console.log('');
    console.log('下一步:');
    console.log('1. 访问 http://localhost:3000/admin/settings');
    console.log('2. 进入 "AI配置" 标签');
    console.log('3. 创建AI角色并测试发帖功能');
  } else {
    console.log('');
    console.log('⚠️  需要完成配置才能使用AI功能');
    provideConfigAdvice();
  }
  
  console.log('');
  console.log('📚 详细文档:');
  console.log('- ./QUICKSTART_AI_SETUP.md');
  console.log('- ./ENVIRONMENT_SETUP_GUIDE.md');
}

main(); 