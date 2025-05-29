# 🔧 部署错误修复指南

## 问题总结
1. **Firestore 错误**：`undefined` 值在 `school` 字段
2. **Firebase Storage CORS 错误**：图片无法加载

## 立即修复步骤

### 1. 更新 Firebase Console 中的 Storage 规则

登录 [Firebase Console](https://console.firebase.google.com/project/guidin-db601/storage/rules) 并更新规则：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 通用图片上传路径 - 用于帖子图片等
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null 
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
    
    // 其他规则保持不变...
  }
}
```

点击"发布"按钮应用更改。

### 2. 应用 CORS 配置

#### 方法 1：使用 gsutil（推荐）
```bash
# 如果还没有安装 gsutil，请先安装 Google Cloud SDK
# https://cloud.google.com/sdk/docs/install

# 登录 Google Cloud
gcloud auth login

# 应用 CORS 配置
gsutil cors set firebase-cors.json gs://guidin-db601.firebasestorage.app

# 验证配置
gsutil cors get gs://guidin-db601.firebasestorage.app
```

#### 方法 2：使用我们创建的脚本
```bash
./fix-firebase-cors.sh
```

### 3. 触发 Vercel 重新部署

由于我们已经推送了代码到 GitHub，Vercel 应该会自动部署。检查部署状态：

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的项目
3. 检查最新部署是否包含我们的修复

如果没有自动部署，可以手动触发：
- 在 Vercel Dashboard 中点击 "Redeploy"
- 或者在 GitHub 中创建一个空提交：
  ```bash
  git commit --allow-empty -m "Trigger Vercel deployment"
  git push origin main
  ```

### 4. 验证修复

部署完成后，测试以下功能：
1. 创建新帖子（不选择学院）
2. 上传图片
3. 查看已有帖子的图片是否正常显示

## 临时解决方案

如果 CORS 问题仍然存在，可以在 `lib/firestore-posts.ts` 中添加更严格的验证：

```typescript
// 在 addPostToFirestore 函数中
const newPost: any = {
  title: postData.title,
  content: postData.content.length > 100 ? postData.content.substring(0, 100) + "..." : postData.content,
  fullContent: postData.content,
  image: postData.image || (postData.images && postData.images.length > 0 ? postData.images[0] : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop"),
  images: postData.images || (postData.image ? [postData.image] : []),
  author: postData.author,
  likes: 0,
  comments: 0,
  tags: postData.tags,
  createdAt: serverTimestamp(),
  category: postData.category
};

// 只添加非空的可选字段
if (postData.location) newPost.location = postData.location;
if (postData.school && postData.school !== '') newPost.school = postData.school;
if (postData.department && postData.department !== '') newPost.department = postData.department;
if (postData.course && postData.course !== '') newPost.course = postData.course;
```

## 长期解决方案

1. **环境变量检查**：确保 Vercel 中配置了正确的 Firebase 环境变量
2. **错误监控**：考虑添加 Sentry 或类似的错误监控服务
3. **测试覆盖**：添加单元测试和集成测试 