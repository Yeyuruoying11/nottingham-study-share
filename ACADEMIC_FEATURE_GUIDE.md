# 📚 学院专业课程分类功能指南

## 功能概述

为诺丁汉大学留学生分享平台添加了三级学术分类系统，让学生能够根据学院、专业和课程来组织和查找学习相关的内容。

## 🎯 主要功能

### 1. 三级分类系统
- **学院级别**: 6个主要学院（人文学院、工程学院、医学院、理学院、社会科学院、商学院）
- **专业级别**: 每个学院下的具体专业（如计算机科学、金融学、机械工程等）
- **课程级别**: 每个专业下的具体课程（如COMP1001、MATH1001等）

### 2. 学院浏览页面 (`/academic`)
- 📖 **学院概览**: 显示所有学院，包含专业数量统计
- 🏫 **专业列表**: 点击学院后显示该学院下的所有专业
- 📚 **课程列表**: 点击专业后显示该专业下的所有课程
- 🔙 **面包屑导航**: 支持层级返回，用户体验友好

### 3. 课程详细页面 (`/academic/course/[courseId]`)
- 📖 **课程信息**: 显示课程名称、代码、学分、级别等详细信息
- 📝 **相关讨论**: 自动筛选该课程相关的帖子和讨论
- 🔍 **搜索筛选**: 支持关键词搜索和分类筛选
- ➕ **快速发布**: 一键跳转发布相关帖子

### 4. 发布帖子学术分类
- 📚 **智能显示**: 仅在选择"学习"分类时显示学术分类选择器
- 🏫 **级联选择**: 学院 → 专业 → 课程的层级选择
- 🔄 **自动重置**: 上级选择改变时自动清空下级选择
- 📝 **可选字段**: 所有学术字段都是可选的，不强制填写

## 🗂️ 数据结构

### 学院 (School)
```typescript
interface School {
  id: string;        // 学院ID
  name: string;      // 中文名称
  nameEn: string;    // 英文名称
  description: string; // 描述
}
```

### 专业 (Department)
```typescript
interface Department {
  id: string;        // 专业ID
  name: string;      // 中文名称
  nameEn: string;    // 英文名称
  school: string;    // 所属学院ID
  description: string; // 描述
}
```

### 课程 (Course)
```typescript
interface Course {
  id: string;        // 课程ID
  name: string;      // 中文名称
  nameEn: string;    // 英文名称
  code: string;      // 课程代码 (如 COMP1001)
  departmentId: string; // 所属专业ID
  level: 'undergraduate' | 'postgraduate' | 'phd';
  year?: number;     // 年级
  credits?: number;  // 学分
  description: string; // 描述
}
```

## 🚀 使用流程

### 用户浏览课程内容
1. 在首页点击 **🎓 学院专业** 按钮
2. 选择感兴趣的学院（如理学院）
3. 浏览该学院下的专业列表
4. 点击具体专业查看课程列表
5. 点击课程查看相关讨论和帖子

### 发布学术相关帖子
1. 点击发布按钮，进入发布页面
2. 选择 **📚 学习** 分类
3. 依次选择学院、专业、课程（可选）
4. 完成帖子内容编写
5. 发布后自动关联学术分类

### 查找特定课程讨论
1. 进入学院页面 (`/academic`)
2. 导航到目标课程
3. 使用搜索功能查找具体内容
4. 查看相关帖子和讨论

## 📊 包含的学院和专业

### 🎨 人文学院 (Faculty of Arts)
- 英语语言文学 (English Language and Literature)
- 历史学 (History)
- 哲学 (Philosophy)

### ⚙️ 工程学院 (Faculty of Engineering)
- 机械工程 (Mechanical Engineering)
- 电气工程 (Electrical Engineering)
- 土木工程 (Civil Engineering)

### 🏥 医学院 (Faculty of Medicine & Health Sciences)
- 医学 (Medicine)
- 护理学 (Nursing)

### 🔬 理学院 (Faculty of Science)
- 计算机科学 (Computer Science)
- 软件工程 (Software Engineering)
- 数学 (Mathematics)
- 物理学 (Physics)
- 化学 (Chemistry)
- 生物学 (Biology)

### 👥 社会科学院 (Faculty of Social Sciences)
- 心理学 (Psychology)
- 经济学 (Economics)
- 教育学 (Education)

### 💼 商学院 (Nottingham University Business School)
- 商业管理 (Business Management)
- 金融学 (Finance)
- 会计学 (Accounting)
- 市场营销 (Marketing)

## 🛠️ 技术实现

### 文件结构
```
lib/
├── academic-data.ts          # 学院专业课程数据
├── types.ts                  # 类型定义扩展
└── firestore-posts.ts        # 数据库集成

app/
├── academic/
│   ├── page.tsx              # 学院浏览页面
│   └── course/
│       └── [courseId]/
│           └── page.tsx      # 课程详细页面
└── create/page.tsx           # 发布页面（添加学术分类）
```

### 数据库字段
帖子表新增字段：
- `school: string` - 学院ID
- `department: string` - 专业ID  
- `course: string` - 课程ID

### 主要组件
- **AcademicPage**: 学院浏览主页面
- **CoursePage**: 课程详细页面
- **AcademicSelector**: 发布页面的学术分类选择器

## 🎯 用户价值

### 🎓 学习效率提升
- **精准查找**: 快速找到特定课程的学习资源
- **同专业交流**: 与同专业同学建立联系
- **经验分享**: 分享课程学习心得和经验

### 📚 内容组织优化
- **分类明确**: 学习内容按学科清晰分类
- **层级清晰**: 三级分类便于内容组织
- **搜索便利**: 多维度搜索和筛选

### 🤝 社区建设
- **专业社群**: 形成专业内的学习小组
- **知识传承**: 学长学姐经验传递给新生
- **学术讨论**: 促进深度的学术交流

## 🔮 未来扩展

### 可能的增强功能
1. **教授信息**: 添加课程教授信息和评价
2. **选课指导**: 基于历史数据的选课建议
3. **成绩分析**: 课程难度和成绩分布统计
4. **学习小组**: 自动匹配同课程学习伙伴
5. **课程资源**: 整合课程资料和参考书目

### 数据扩展
1. **更多课程**: 持续完善课程数据库
2. **跨校园**: 支持诺丁汉其他校区
3. **研究生课程**: 添加更多研究生和博士课程
4. **交换生**: 支持交换生和访问学者

## 📝 使用建议

### 对学生的建议
1. **完整分类**: 发布学习相关帖子时尽量选择完整的学术分类
2. **有效标签**: 使用课程代码等作为标签便于搜索
3. **详细描述**: 在帖子中说明具体的课程内容和问题
4. **积极互动**: 关注同专业同学的分享并积极交流

### 对平台管理的建议
1. **数据维护**: 定期更新课程信息和学院变动
2. **质量控制**: 鼓励高质量的学术讨论内容
3. **功能优化**: 根据用户反馈不断优化分类和搜索功能
4. **社区引导**: 引导用户合理使用学术分类功能

---

🎉 通过这个学院专业课程分类系统，诺丁汉大学的留学生们现在可以更高效地分享和获取学习资源，建立更紧密的学术社区！ 