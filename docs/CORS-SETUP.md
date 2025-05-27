# Firebase Storage CORS 配置指南

## 🎯 问题描述

当应用部署到 Vercel 等云平台时，可能会遇到 CORS（跨域资源共享）错误，导致图片上传失败。本地开发环境正常，但远程环境出现问题。

## 🔍 错误表现

```
Access to XMLHttpRequest at 'https://firebasestorage.googleapis.com/...' 
from origin 'https://your-app.vercel.app' has been blocked by CORS policy
```

## 🛠️ 解决方案

### 方法一：使用 Google Cloud SDK 配置 CORS

#### 1. 安装 Google Cloud SDK

```bash
# macOS
brew install google-cloud-sdk

# Windows
# 下载并安装：https://cloud.google.com/sdk/docs/install

# Linux
curl https://sdk.cloud.google.com | bash
```

#### 2. 认证并设置项目

```bash
# 登录 Google Cloud
gcloud auth login

# 设置项目ID
gcloud config set project guidin-db601
```

#### 3. 应用 CORS 配置

```bash
# 使用项目中的 CORS 配置文件
gsutil cors set firebase-cors.json gs://guidin-db601.firebasestorage.app

# 验证配置
gsutil cors get gs://guidin-db601.firebasestorage.app
```

#### 4. 运行配置脚本

```bash
# 给脚本执行权限
chmod +x scripts/setup-cors.sh

# 运行脚本
./scripts/setup-cors.sh
```

### 方法二：通过 Firebase Console 配置

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择项目 `guidin-db601`
3. 进入 Storage 页面
4. 点击 "Rules" 标签
5. 确保规则允许读写操作

### 方法三：使用代码中的 CORS 修复

项目已经集成了 CORS 修复功能：

```typescript
// 自动检测环境并使用最佳上传策略
import { uploadImageSmart } from '@/lib/firebase-storage-cors-fix';

// 使用
const imageUrl = await uploadImageSmart(file, userId, onProgress);
```

## 📋 CORS 配置文件说明

`firebase-cors.json` 文件内容：

```json
[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```

### 配置参数说明：

- **origin**: 允许的源域名，`*` 表示允许所有域名
- **method**: 允许的 HTTP 方法
- **maxAgeSeconds**: 预检请求的缓存时间
- **responseHeader**: 允许的响应头

## 🔧 生产环境安全配置

对于生产环境，建议使用更严格的 CORS 配置：

```json
[
  {
    "origin": ["https://your-domain.vercel.app"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```

## 🧪 测试 CORS 配置

### 1. 使用 curl 测试

```bash
# 测试预检请求
curl -i -X OPTIONS https://firebasestorage.googleapis.com/v0/b/guidin-db601.firebasestorage.app/o \
  -H "Origin: https://your-domain.vercel.app" \
  -H "Access-Control-Request-Method: POST"

# 测试实际请求
curl -i https://firebasestorage.googleapis.com/v0/b/guidin-db601.firebasestorage.app/o \
  -H "Origin: https://your-domain.vercel.app"
```

### 2. 浏览器开发者工具

1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 尝试上传图片
4. 查看请求和响应头

## 🚨 常见问题

### 问题1：配置后仍然出现 CORS 错误

**解决方案：**
- 等待 5-10 分钟让配置生效
- 清除浏览器缓存
- 检查 Firebase Storage 安全规则

### 问题2：本地正常，部署后失败

**解决方案：**
- 确认部署域名在 CORS 配置中
- 检查环境变量是否正确设置
- 使用项目中的 CORS 修复函数

### 问题3：权限错误

**解决方案：**
- 确认 Firebase Storage 安全规则
- 检查用户认证状态
- 验证 Firebase 配置

## 📞 获取帮助

如果仍然遇到问题：

1. 检查浏览器控制台的详细错误信息
2. 验证 Firebase 项目配置
3. 确认网络连接正常
4. 联系技术支持

## 🔄 自动化脚本

项目包含自动化脚本：

- `scripts/setup-cors.sh` - 设置 CORS 配置
- `scripts/diagnose-upload.js` - 诊断上传问题
- `lib/firebase-storage-cors-fix.ts` - CORS 修复函数 