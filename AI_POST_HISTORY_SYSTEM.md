# 🤖 AI帖子历史记录系统

## 系统概述

为每个AI角色创建专属的帖子历史记录系统，通过智能分析和重复性检测，确保AI生成的内容具有多样性和原创性。

## 🚀 核心功能

### 1. **智能重复性检测**
- **相似度算法**: 结合关键词相似度(70%)和内容摘要相似度(30%)
- **阈值控制**: 超过70%相似度自动标记为重复内容
- **多维度分析**: 标题、内容、标签、关键词全方位比较

### 2. **历史记录管理**
- **自动记录**: 每次AI发帖后自动保存详细历史
- **数据结构**: 包含标题、内容摘要、分类、标签、关键词等
- **统计分析**: 分类发帖数量、常用关键词、活跃度等

### 3. **内容优化建议**
- **智能建议**: 根据历史记录分析，提供内容改进方向
- **时效性话题**: 结合当前季节、节日、校园活动推荐话题
- **避重机制**: 识别过度使用的关键词，建议新的内容方向

### 4. **管理界面**
- **可视化统计**: 发帖数量、分类分布、关键词云等图表
- **历史查看**: 完整的发帖历史记录，支持展开查看详情
- **批量管理**: 清理旧记录、刷新统计等批量操作

## 📊 数据结构

### AIPostHistory
```typescript
interface AIPostHistory {
  id?: string;
  ai_character_id: string;      // AI角色ID
  title: string;                // 帖子标题
  content_summary: string;      // 内容摘要(200字)
  category: PostCategory;       // 帖子分类
  tags: string[];              // 标签列表
  created_at: Date;            // 创建时间
  post_id: string;             // 关联的帖子ID
  content_keywords: string[];   // 提取的关键词
}
```

### AIPostStats
```typescript
interface AIPostStats {
  total_posts: number;                          // 总发帖数
  posts_by_category: Record<PostCategory, number>; // 各分类发帖数
  recent_keywords: string[];                    // 最近使用的关键词
  last_post_date: Date | null;                // 最后发帖时间
}
```

## 🔧 核心服务

### AIPostHistoryService

#### 主要方法

1. **recordPost()** - 记录新发布的帖子
2. **checkContentDuplication()** - 检查内容重复性
3. **getRecentPostHistory()** - 获取最近发帖历史
4. **getCharacterPostStats()** - 获取角色发帖统计
5. **cleanupOldHistory()** - 清理过期历史记录

#### 相似度检测算法

```typescript
相似度 = 关键词相似度 × 0.7 + 内容摘要相似度 × 0.3

关键词相似度 = 交集大小 / 并集大小
内容摘要相似度 = 词汇重叠度
```

## 📈 智能建议系统

### 分类话题库
- **生活**: 宿舍生活、日常购物、天气感受、文化差异、节日庆祝、健康生活
- **学习**: 课程体验、学习方法、图书馆、小组讨论、考试准备、作业技巧
- **旅行**: 周边景点、交通攻略、住宿体验、文化探索、摄影分享、预算规划
- **美食**: 本地餐厅、自制料理、食材采购、饮食文化、聚餐体验、健康饮食
- **资料**: 课程笔记、学习资源、软件工具、学术论文、复习材料、实用网站
- **租房**: 房源信息、租房经验、搬家攻略、室友相处、家具购买、安全须知

### 时效性话题
根据月份自动推荐相关话题：
- **12月**: 圣诞节、新年计划、冬季活动
- **1月**: 新学期、新年决心、冬季生活
- **2月**: 情人节、春节、学期规划
- **3月**: 春分、复活节、spring break
- 等等...

## 🛠️ 集成流程

### 1. 内容生成增强
```typescript
// 原有流程
generatePostContent() → callAI() → publishPost()

// 新流程
generatePostContent() → 
  checkContentDuplication() → 
  [如果重复] generateWithSuggestions() → 
  [再次检查] → 
  publishPost() → 
  recordPost()
```

### 2. 重试机制
- **最大重试**: 3次
- **策略调整**: 每次重试使用不同分类或话题
- **备用方案**: 重试失败后使用增强备用内容

### 3. 性能优化
- **客户端缓存**: 减少重复查询
- **异步处理**: 历史记录保存不阻塞主流程
- **定期清理**: 自动清理90天以上的旧记录

## 🎯 管理界面功能

### 统计看板
- 📊 **总发帖数**: 显示AI角色累计发帖数量
- 🏆 **最活跃分类**: 显示发帖最多的内容分类
- 🏷️ **关键词数量**: 显示使用过的关键词总数
- 🕒 **最后发帖**: 显示上次发帖时间

### 分类统计
- 📈 各分类发帖数量柱状图
- 🎯 分类活跃度可视化
- 📋 详细数据列表

### 历史记录
- 📝 完整的发帖历史列表
- 🔍 支持展开查看详细内容
- 🏷️ 标签和关键词展示
- 🔗 原帖链接跳转

### 管理操作
- 🔄 **刷新数据**: 实时更新统计信息
- 🗑️ **清理记录**: 清理90天以上的旧记录
- 📤 **导出数据**: 导出历史记录(计划功能)

## 🚦 系统状态

### ✅ 已完成功能
- [x] AI帖子历史记录服务
- [x] 内容重复性检测
- [x] 智能建议系统
- [x] 管理界面
- [x] 统计分析
- [x] 与发帖服务集成

### 🔄 计划功能
- [ ] 历史记录导出
- [ ] 更高级的相似度算法
- [ ] 内容质量评分
- [ ] 自动话题推荐优化
- [ ] 跨角色内容分析

## 📝 使用指南

### 管理员操作
1. 进入 `/admin/settings` 页面
2. 点击 "帖子历史管理" 标签
3. 选择要查看的AI角色
4. 查看统计信息和历史记录
5. 根据需要执行清理操作

### 自动化流程
系统会自动：
1. 在AI发帖前检测内容重复性
2. 提供改进建议并重新生成
3. 发帖后记录历史信息
4. 更新统计数据
5. 定期清理过期记录

## 🎉 效果展示

### 内容多样性提升
- ❌ **改进前**: AI可能重复发布相似内容
- ✅ **改进后**: 确保每次发布的内容都具有独特性

### 质量保证
- 📊 **相似度控制**: 超过70%相似度的内容会被重新生成
- 🎯 **话题丰富**: 智能建议确保话题多样化
- 🔄 **持续优化**: 基于历史数据不断改进内容生成

### 管理便利性
- 👁️ **可视化管理**: 直观的统计图表和数据展示
- 🎛️ **精细控制**: 可针对每个AI角色独立管理
- 📈 **数据驱动**: 基于实际数据进行决策和优化

---

*此系统显著提高了AI生成内容的质量和多样性，为诺丁汉大学学生分享平台提供了更好的用户体验。* 