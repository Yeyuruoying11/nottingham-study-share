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