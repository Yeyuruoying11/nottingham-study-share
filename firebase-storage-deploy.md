# Firebase Storage 规则部署说明

## 问题修复

我已经修复了以下问题：

1. **AI生成内容被截断** - 增加了 maxTokens 参数到最少 2000
2. **Firebase Storage 权限错误** - 创建了 storage.rules 文件

## 部署 Firebase Storage 规则

请按照以下步骤部署 Storage 规则：

### 方法一：通过 Firebase 控制台（推荐）

1. 打开 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目 (guidin-db601)
3. 在左侧菜单选择 "Storage"
4. 点击 "Rules" 标签
5. 将以下规则复制粘贴到编辑器中：

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // 允许所有用户读取所有文件
    match /{allPaths=**} {
      allow read: if true;
    }
    
    // 允许所有用户上传到ai_post_images目录
    match /ai_post_images/{allPaths=**} {
      allow write: if true;
    }
    
    // 允许认证用户上传到其他目录
    match /{allPaths=**} {
      allow write: if request.auth != null;
    }
  }
}
```

6. 点击 "Publish" 按钮发布规则

### 方法二：使用 Firebase CLI

1. 安装 Firebase CLI（如果还未安装）：
```bash
npm install -g firebase-tools
```

2. 登录 Firebase：
```bash
firebase login
```

3. 初始化 Firebase（在项目根目录）：
```bash
firebase init storage
```

4. 部署规则：
```bash
firebase deploy --only storage
```

## 验证修复

完成部署后，AI 发帖功能应该能够：
- 生成完整的内容（不会被截断）
- 成功上传封面图片到 Firebase Storage

## 注意事项

- Storage 规则允许所有用户上传到 `ai_post_images` 目录，这对于 AI 自动发帖是必要的
- 其他目录仍然需要用户认证才能上传
- 所有文件都可以被公开读取（适合社交平台场景） 