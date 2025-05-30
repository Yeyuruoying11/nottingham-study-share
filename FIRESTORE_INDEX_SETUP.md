# Firestore 索引设置指南

## 问题说明

当你在控制台看到 "The query requires an index" 错误时，这是因为 Firestore 需要为复合查询创建索引。

## 解决方案

### 方法一：自动部署索引（推荐）

1. **确保已安装 Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **登录 Firebase**
   ```bash
   firebase login
   ```

3. **运行部署脚本**
   ```bash
   ./scripts/deploy-indexes.sh
   ```

### 方法二：手动创建索引

1. 当你在控制台看到索引错误时，点击错误信息中的链接
2. 这会自动跳转到 Firebase Console 的索引创建页面
3. 点击 "创建索引" 按钮
4. 等待索引构建完成（通常需要几分钟）

### 方法三：通过 Firebase Console

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 选择你的项目
3. 进入 Firestore Database
4. 点击 "索引" 标签
5. 点击 "添加索引" 创建所需的复合索引

## 所需索引列表

项目中需要以下索引：

### 1. 会话查询索引
- **集合**: `conversations`
- **字段**: 
  - `participants` (array-contains)
  - `updatedAt` (descending)

### 2. 消息查询索引
- **集合**: `messages`
- **字段**:
  - `conversationId` (ascending)
  - `timestamp` (descending)

### 3. 帖子分类索引
- **集合**: `posts`
- **字段**:
  - `category` (ascending)
  - `createdAt` (descending)

### 4. 用户帖子索引
- **集合**: `posts`
- **字段**:
  - `author.uid` (ascending)
  - `createdAt` (descending)

## 索引构建状态

索引构建完成后，你会在 Firebase Console 中看到状态变为 "已启用"。在构建期间，相关查询可能会失败或返回不完整的结果。

## 故障排除

### 如果索引构建失败：
1. 检查 Firestore 规则是否正确
2. 确保有足够的权限
3. 检查字段名是否正确

### 如果查询仍然失败：
1. 清除浏览器缓存
2. 重新部署应用
3. 检查控制台是否有其他错误

## 性能优化

- 索引会提高查询性能，但也会增加写入成本
- 定期检查和清理不需要的索引
- 监控 Firestore 使用量和成本 