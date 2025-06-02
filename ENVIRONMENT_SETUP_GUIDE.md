# 🔧 环境变量配置指南

## 概述

本指南将帮助您配置AI自动发帖功能所需的API密钥，包括本地开发环境和Vercel生产环境的配置。

## 🔑 所需API密钥

### 1. DeepSeek API Key
- **用途**：AI内容生成（推荐使用，成本较低）
- **获取地址**：[https://platform.deepseek.com](https://platform.deepseek.com)
- **环境变量名**：`DEEPSEEK_API_KEY`
- **是否必需**：是（用于AI自动发帖功能）

### 2. OpenAI API Key
- **用途**：GPT-4o模型支持（可选，成本较高）
- **获取地址**：[https://platform.openai.com](https://platform.openai.com)
- **环境变量名**：`OPENAI_API_KEY`
- **是否必需**：否（仅在使用GPT-4o模型时需要）

## 🏠 本地开发环境配置

### 步骤1：创建 `.env.local` 文件

在项目根目录创建 `.env.local` 文件：

```bash
# Firebase Configuration (已有)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Google Maps API Key (已有)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# AI API Keys for Auto-Posting Feature (新增)
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Development Settings
NODE_ENV=development
```

### 步骤2：获取DeepSeek API Key

1. 访问 [DeepSeek平台](https://platform.deepseek.com)
2. 注册账号并登录
3. 进入API Keys页面
4. 创建新的API Key
5. 复制API Key并添加到 `.env.local` 文件

### 步骤3：重启开发服务器

```bash
npm run dev
```

## ☁️ Vercel生产环境配置

### 方法1：通过Vercel仪表板配置

1. **登录Vercel**
   - 访问 [vercel.com](https://vercel.com)
   - 登录您的账号

2. **选择项目**
   - 在项目列表中找到您的项目
   - 点击项目名称进入项目详情

3. **进入设置页面**
   - 点击顶部的 "Settings" 标签
   - 在左侧菜单中选择 "Environment Variables"

4. **添加环境变量**
   
   添加以下环境变量：
   
   | Name | Value | Environment |
   |------|-------|-------------|
   | `DEEPSEEK_API_KEY` | `sk-your-deepseek-api-key` | Production, Preview, Development |
   | `OPENAI_API_KEY` | `sk-your-openai-api-key` | Production, Preview, Development |

5. **重新部署**
   - 返回项目仪表板
   - 点击 "Redeploy" 重新部署应用

### 方法2：通过Vercel CLI配置

```bash
# 安装Vercel CLI
npm i -g vercel

# 登录Vercel
vercel login

# 设置环境变量
vercel env add DEEPSEEK_API_KEY
vercel env add OPENAI_API_KEY

# 重新部署
vercel --prod
```

### 方法3：通过vercel.json配置

在项目根目录创建或更新 `vercel.json` 文件：

```json
{
  "env": {
    "DEEPSEEK_API_KEY": "@deepseek-api-key",
    "OPENAI_API_KEY": "@openai-api-key"
  },
  "build": {
    "env": {
      "DEEPSEEK_API_KEY": "@deepseek-api-key",
      "OPENAI_API_KEY": "@openai-api-key"
    }
  }
}
```

然后使用Vercel CLI添加秘密：

```bash
vercel secrets add deepseek-api-key sk-your-deepseek-api-key
vercel secrets add openai-api-key sk-your-openai-api-key
```

## 🔐 API Key获取详细步骤

### DeepSeek API Key获取

1. **注册账号**
   ```
   网址：https://platform.deepseek.com
   邮箱：您的邮箱地址
   密码：设置安全密码
   ```

2. **实名验证**
   - 完成手机号验证
   - 根据需要完成实名认证

3. **充值账户**
   - 进入充值页面
   - 选择合适的充值金额（建议先充值少量测试）
   - 完成支付

4. **创建API Key**
   - 进入 "API Keys" 页面
   - 点击 "Create API Key"
   - 设置Key名称（如：nottingham-platform）
   - 选择权限（Chat权限）
   - 复制生成的API Key

5. **测试API Key**
   ```bash
   curl -X POST "https://api.deepseek.com/chat/completions" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer YOUR_API_KEY" \
        -d '{
          "model": "deepseek-chat",
          "messages": [{"role": "user", "content": "Hello"}],
          "max_tokens": 100
        }'
   ```

### OpenAI API Key获取（可选）

1. **注册OpenAI账号**
   ```
   网址：https://platform.openai.com
   ```

2. **设置付费方式**
   - 进入Billing页面
   - 添加信用卡信息
   - 设置使用限额

3. **创建API Key**
   - 进入API Keys页面
   - 点击 "Create new secret key"
   - 设置名称和权限
   - 复制API Key

## ✅ 配置验证

### 本地环境验证

1. **启动开发服务器**
   ```bash
   npm run dev
   ```

2. **测试AI功能**
   - 登录管理员账号
   - 进入 系统设置 → AI配置
   - 创建AI角色并测试立即发帖

3. **检查控制台**
   - 打开浏览器开发者工具
   - 查看Console是否有API错误

### 生产环境验证

1. **检查环境变量**
   - 在Vercel仪表板确认环境变量已设置
   - 检查API Key格式是否正确

2. **部署后测试**
   - 访问生产环境URL
   - 测试AI发帖功能
   - 检查Vercel函数日志

## 🚨 常见问题

### DeepSeek API错误

**问题**：API返回401错误
```
解决方案：
1. 检查API Key是否正确复制
2. 确认账户余额是否充足
3. 验证API Key权限设置
```

**问题**：API返回429错误
```
解决方案：
1. 降低发帖频率
2. 检查API使用限额
3. 考虑升级账户套餐
```

### Vercel部署问题

**问题**：环境变量未生效
```
解决方案：
1. 确认环境变量名称正确
2. 重新部署应用
3. 检查Environment设置（Production/Preview/Development）
```

**问题**：函数超时
```
解决方案：
1. 减少maxTokens参数
2. 优化提示词长度
3. 考虑使用Vercel Pro套餐
```

## 💰 成本估算

### DeepSeek成本
- **模型**：deepseek-chat
- **价格**：约 ¥0.001 / 1K tokens
- **每篇文章**：约500-1000 tokens = ¥0.0005-0.001
- **每日6篇**：约 ¥0.003-0.006

### OpenAI成本（GPT-4o）
- **模型**：gpt-4o
- **价格**：$0.03 / 1K tokens
- **每篇文章**：约500-1000 tokens = $0.015-0.03
- **每日6篇**：约 $0.09-0.18

## 📞 技术支持

如果在配置过程中遇到问题：

1. **检查本指南**的常见问题部分
2. **查看应用日志**（Vercel函数日志）
3. **验证API Key**格式和权限
4. **联系技术支持**团队

---

**最后更新**：2024年12月  
**版本**：v1.0.0  
**适用环境**：Next.js 15 + Vercel 