#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ENV_FILE_PATH = path.join(process.cwd(), '.env.local');

console.log('🤖 AI API Keys 配置脚本');
console.log('='.repeat(50));
console.log('');

async function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  console.log('此脚本将帮助您配置AI自动发帖功能所需的API密钥。');
  console.log('');

  // 检查现有的 .env.local 文件
  let existingEnv = '';
  if (fs.existsSync(ENV_FILE_PATH)) {
    existingEnv = fs.readFileSync(ENV_FILE_PATH, 'utf8');
    console.log('✅ 找到现有的 .env.local 文件');
  } else {
    console.log('📝 将创建新的 .env.local 文件');
  }
  console.log('');

  // 询问DeepSeek API Key
  console.log('🧠 DeepSeek API Key 配置（推荐）');
  console.log('获取地址: https://platform.deepseek.com');
  console.log('成本: 约 ¥0.001/1K tokens（非常便宜）');
  const deepseekKey = await question('请输入您的 DeepSeek API Key (或按回车跳过): ');
  console.log('');

  // 询问OpenAI API Key
  console.log('🚀 OpenAI API Key 配置（可选）');
  console.log('获取地址: https://platform.openai.com');
  console.log('成本: $0.03/1K tokens（较贵，建议仅在需要时使用）');
  const openaiKey = await question('请输入您的 OpenAI API Key (或按回车跳过): ');
  console.log('');

  // 构建新的环境变量内容
  let newEnvContent = existingEnv;

  // 添加或更新DeepSeek API Key
  if (deepseekKey.trim()) {
    if (newEnvContent.includes('DEEPSEEK_API_KEY=')) {
      newEnvContent = newEnvContent.replace(
        /DEEPSEEK_API_KEY=.*/,
        `DEEPSEEK_API_KEY=${deepseekKey.trim()}`
      );
    } else {
      newEnvContent += `\n# DeepSeek API Key\nDEEPSEEK_API_KEY=${deepseekKey.trim()}\n`;
    }
  }

  // 添加或更新OpenAI API Key
  if (openaiKey.trim()) {
    if (newEnvContent.includes('OPENAI_API_KEY=')) {
      newEnvContent = newEnvContent.replace(
        /OPENAI_API_KEY=.*/,
        `OPENAI_API_KEY=${openaiKey.trim()}`
      );
    } else {
      newEnvContent += `\n# OpenAI API Key\nOPENAI_API_KEY=${openaiKey.trim()}\n`;
    }
  }

  // 保存文件
  if (deepseekKey.trim() || openaiKey.trim()) {
    fs.writeFileSync(ENV_FILE_PATH, newEnvContent);
    console.log('✅ API Keys 已保存到 .env.local 文件');
    console.log('');

    // 显示配置摘要
    console.log('📋 配置摘要:');
    if (deepseekKey.trim()) {
      console.log(`✅ DeepSeek API Key: ${deepseekKey.substring(0, 10)}...`);
    }
    if (openaiKey.trim()) {
      console.log(`✅ OpenAI API Key: ${openaiKey.substring(0, 10)}...`);
    }
    console.log('');

    console.log('🚀 下一步:');
    console.log('1. 重启开发服务器: npm run dev');
    console.log('2. 登录管理员账号');
    console.log('3. 进入 "管理员面板" → "系统设置" → "AI配置"');
    console.log('4. 创建AI角色并测试自动发帖功能');
    console.log('');

    console.log('📖 详细文档:');
    console.log('- AI配置指南: ./AI_CONFIG_FEATURE_GUIDE.md');
    console.log('- 自动发帖指南: ./AI_AUTO_POSTING_GUIDE.md');
    console.log('- 环境配置指南: ./ENVIRONMENT_SETUP_GUIDE.md');
  } else {
    console.log('❌ 未输入任何API Key，配置已取消');
  }

  rl.close();
}

main().catch((error) => {
  console.error('❌ 配置过程中出现错误:', error);
  rl.close();
}); 