# Firestore 索引配置

## 需要创建的复合索引

### 1. conversations 集合索引

用于聊天会话列表查询：

- **集合ID**: `conversations`
- **字段**:
  - `participants` - 数组包含 (Arrays)
  - `updatedAt` - 降序 (Descending)
- **查询范围**: 集合

这个索引支持以下查询：
```javascript
query(
  conversationsCollection,
  where('participants', 'array-contains', userId),
  orderBy('updatedAt', 'desc')
)
```

### 2. messages 集合索引

用于聊天消息查询：

- **集合ID**: `messages`
- **字段**:
  - `conversationId` - 升序 (Ascending)
  - `timestamp` - 降序 (Descending)
- **查询范围**: 集合

这个索引支持以下查询：
```javascript
query(
  messagesCollection,
  where('conversationId', '==', conversationId),
  orderBy('timestamp', 'desc')
)
```

## 如何创建索引

### 方法一：通过错误链接（推荐）
1. 在浏览器控制台中找到错误信息
2. 点击错误信息中的 Firebase Console 链接
3. Firebase 会自动填充索引配置
4. 点击"创建索引"按钮

### 方法二：手动创建
1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目 (guidin-db601)
3. 进入 Firestore Database
4. 点击"索引"标签
5. 点击"创建索引"
6. 按照上述配置填写字段

## 注意事项

- 索引创建需要几分钟时间
- 创建过程中查询可能会失败
- 索引创建完成后，查询会自动恢复正常
- 索引是免费的，不会产生额外费用 