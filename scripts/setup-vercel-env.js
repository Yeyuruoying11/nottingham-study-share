#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Vercel环境变量配置脚本');
console.log('='.repeat(50));
console.log('');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('此脚本将帮助您在Vercel上配置AI功能所需的环境变量。');
  console.log('');
  
  try {
    // 检查是否已登录Vercel
    console.log('📋 检查Vercel登录状态...');
    execSync('vercel whoami', { stdio: 'pipe' });
    console.log('✅ 已登录Vercel');
  } catch (error) {
    console.log('❌ 未登录Vercel，正在打开登录...');
    try {
      execSync('vercel login', { stdio: 'inherit' });
    } catch (loginError) {
      console.error('❌ Vercel登录失败，请手动运行: vercel login');
      process.exit(1);
    }
  }
  
  console.log('');
  console.log('🔑 环境变量配置');
  console.log('注意：您的API key只会发送到Vercel，不会显示在终端或被记录');
  console.log('');
  
  // 配置DeepSeek API Key
  const setupDeepSeek = await question('是否要配置DeepSeek API Key? (y/n): ');
  if (setupDeepSeek.toLowerCase() === 'y') {
    console.log('');
    console.log('请在接下来的提示中输入您的DeepSeek API Key:');
    try {
      execSync('vercel env add DEEPSEEK_API_KEY production', { stdio: 'inherit' });
      execSync('vercel env add DEEPSEEK_API_KEY preview', { stdio: 'inherit' });
      console.log('✅ DeepSeek API Key 配置完成');
    } catch (error) {
      console.error('❌ DeepSeek API Key 配置失败');
    }
  }
  
  console.log('');
  
  // 配置OpenAI API Key (可选)
  const setupOpenAI = await question('是否要配置OpenAI API Key? (可选，y/n): ');
  if (setupOpenAI.toLowerCase() === 'y') {
    console.log('');
    console.log('请在接下来的提示中输入您的OpenAI API Key:');
    try {
      execSync('vercel env add OPENAI_API_KEY production', { stdio: 'inherit' });
      execSync('vercel env add OPENAI_API_KEY preview', { stdio: 'inherit' });
      console.log('✅ OpenAI API Key 配置完成');
    } catch (error) {
      console.error('❌ OpenAI API Key 配置失败');
    }
  }
  
  console.log('');
  console.log('🚀 重新部署应用以应用新的环境变量...');
  try {
    execSync('vercel --prod', { stdio: 'inherit' });
    console.log('✅ 应用部署完成！');
  } catch (error) {
    console.error('❌ 部署失败，请手动运行: vercel --prod');
  }
  
  console.log('');
  console.log('🎉 配置完成！');
  console.log('您可以在 https://vercel.com/dashboard 查看配置的环境变量');
  console.log('');
  
  rl.close();
}

main().catch((error) => {
  console.error('❌ 配置过程中出现错误:', error.message);
  rl.close();
}); 