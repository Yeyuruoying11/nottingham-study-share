# Firebase 配置指南

## 🚨 当前问题
您看到了 "API key not valid" 错误，这意味着需要配置正确的Firebase API密钥。

## 📋 解决步骤

### 方法1：使用现有项目 (推荐)

1. **访问Firebase控制台**
   - 打开：https://console.firebase.google.com/
   - 登录您的Google账户

2. **选择或创建项目**
   - 如果已有 `guidin-db601` 项目，直接选择
   - 如果没有，点击"创建项目"

3. **获取Web应用配置**
   - 点击项目设置（齿轮图标）
   - 选择"常规"标签
   - 滚动到"您的应用"部分
   - 选择Web应用（</>图标）
   - 点击"配置"

4. **复制配置代码**
   - 复制 `firebaseConfig` 对象中的值
   - 替换 `lib/firebase.ts` 中的对应值

### 方法2：使用环境变量 (更安全)

创建 `.env.local` 文件在项目根目录：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=你的API密钥
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=你的项目ID.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=你的项目ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=你的项目ID.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=你的发送者ID
NEXT_PUBLIC_FIREBASE_APP_ID=你的应用ID
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=你的测量ID
```

## ⚠️ 重要注意事项

1. **安全性**：API密钥是公开的，但Firebase有内置的安全规则
2. **域名限制**：在Firebase控制台设置授权域名
3. **数据库规则**：配置Firestore和Storage的安全规则

## 🔧 如果仍然有问题

1. **检查项目状态**：确保Firebase项目处于活跃状态
2. **验证配置**：确保所有字段都正确填写
3. **清除缓存**：删除 `.next` 文件夹并重新启动

## 📞 需要帮助？

如果您需要帮助：
1. 在Firebase控制台截图您的项目配置
2. 分享错误信息
3. 我可以帮您检查配置是否正确

# Firebase 索引设置指南

## 🚨 索引错误解决方案

如果您看到 "FirebaseError: The query requires an index" 错误，请按照以下步骤解决：

## 方法1：自动创建索引（推荐）

当您看到控制台错误时，Firebase会提供创建索引的直接链接：

1. **复制控制台中的索引链接**
   ```
   https://console.firebase.google.com/v1/r/project/YOUR_PROJECT_ID/firestore/indexes...
   ```

2. **点击链接并登录** Firebase Console

3. **点击"创建索引"按钮**

4. **等待索引创建完成**（通常需要几分钟）

## 方法2：手动在 Firebase Console 创建

访问 [Firebase Console](https://console.firebase.google.com/)：

1. **选择您的项目**
2. **进入 Firestore Database**
3. **点击"索引"标签**
4. **点击"添加索引"**

### 需要创建的索引：

#### 通知相关索引：
```
集合：notifications
字段：userId (升序) + createdAt (降序)
```

```
集合：notifications  
字段：userId (升序) + read (升序)
```

```
集合：notifications
字段：adminId (升序) + type (升序) + createdAt (降序)
```

#### 帖子相关索引：
```
集合：posts
字段：category (升序) + createdAt (降序)
```

## 方法3：使用 Firebase CLI（高级用户）

如果您安装了 Firebase CLI：

```bash
# 部署索引配置
firebase deploy --only firestore:indexes
```

## 🔄 临时解决方案

在索引创建之前，系统仍然可以正常工作，只是某些查询可能较慢或失败。主要功能不受影响：

- ✅ 帖子显示正常
- ✅ 用户登录正常  
- ✅ 发布帖子正常
- ⚠️ 通知功能可能需要索引

## 📞 需要帮助？

如果遇到问题，请：
1. 确保 Firebase 项目配置正确
2. 检查 Firebase 规则设置
3. 验证项目权限

索引创建完成后，刷新页面即可正常使用所有功能。 