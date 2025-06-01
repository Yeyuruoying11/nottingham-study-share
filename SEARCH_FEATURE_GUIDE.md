# 学术页面搜索功能 & 课程名称英文化

## 🎯 功能概述

本次更新为学术页面添加了强大的搜索功能，并将所有课程名称统一为英文，提升了用户体验和国际化水平。

## ✨ 新增功能

### 1. 🔍 智能搜索功能

#### 搜索入口
- **位置**: 学术页面顶部导航栏右侧
- **样式**: 现代化搜索框，带搜索图标和清除按钮
- **占位符**: "搜索课程名称或代码..."

#### 搜索范围
搜索功能支持多字段匹配：
- ✅ **课程英文名称** (name字段)
- ✅ **课程代码** (code字段，如COMP1001)  
- ✅ **课程ID** (id字段，如comp1001)

#### 搜索特性
- **实时搜索**: 输入时即时显示结果
- **模糊匹配**: 支持部分关键字搜索
- **大小写不敏感**: 自动处理大小写
- **结果限制**: 最多显示10个相关结果

#### 搜索结果界面
```
┌─────────────────────────────────────────┐
│ [搜索框: "machine learning"     ] [×]   │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│ Machine Learning                    [>] │
│ COMP3009                               │
│ 监督学习、无监督学习、深度学习应用        │
├─────────────────────────────────────────┤
│ Advanced Topics in Machine Learning [>] │
│ COMP4132                               │
│ 深度学习、强化学习、生成模型等...        │
└─────────────────────────────────────────┘
```

### 2. 🚀 智能导航功能

#### 自动层级导航
当用户选择搜索结果中的课程时，系统会：

1. **智能定位**: 自动找到课程所属的大学、学院、专业
2. **校区识别**: 自动识别UNNC课程并选择中国校区
3. **层级展开**: 依次展开 大学 → 校区 → 学院 → 专业 → 课程
4. **直达目标**: 最终显示该专业的所有课程列表

#### 导航路径示例
```
搜索"COMP1039" → 自动导航至：
诺丁汉大学 → 中国校区 → 理工学院 → 计算机科学 → 课程列表
```

### 3. 💡 用户体验优化

#### 交互优化
- **点击外部关闭**: 点击搜索框外部自动关闭搜索结果
- **清除按钮**: 快速清空搜索内容
- **悬停效果**: 搜索结果支持悬停高亮
- **键盘友好**: 支持键盘操作

#### 视觉反馈
- **加载状态**: 优雅的搜索状态提示
- **无结果提示**: 友好的无结果状态
- **结果计数**: 清晰的结果数量显示

## 📝 课程名称英文化

### 🔄 更新内容
- **全面英文化**: 所有2700+门课程名称统一使用英文
- **保持一致性**: name字段与nameEn字段内容一致
- **语法修复**: 自动修复了批量替换产生的语法错误

### 📊 更新统计
- **处理课程数**: 2700+ 门课程
- **涉及大学**: 诺丁汉大学、诺丁汉特伦特大学、宁波诺丁汉大学
- **覆盖专业**: 40+ 个专业领域

### 🔧 技术实现
使用Node.js脚本批量处理：
```javascript
// 1. 课程名称英文化
content = content.replace(
  /(\s+id:\s*'[^']+',\s*\n\s*)name:\s*'[^']*',(\s*\n\s*)nameEn:\s*('([^']*)',)/g,
  '$1name: $3,$2nameEn: $3'
);

// 2. 语法错误修复  
content = content.replace(/name: '([^']*)',,/g, "name: '$1',");
```

## 🧪 使用指南

### 基础搜索
1. 访问学术页面: `http://localhost:3001/academic`
2. 点击顶部搜索框
3. 输入课程关键字（英文名称或代码）
4. 从下拉结果中选择目标课程

### 搜索技巧
- **按代码搜索**: 输入"COMP1001"快速找到特定课程
- **按名称搜索**: 输入"machine learning"找到相关课程
- **模糊搜索**: 输入"artificial"找到AI相关课程
- **专业搜索**: 输入"UNNC"找到宁波诺丁汉大学课程

### 搜索示例
```
搜索词                    → 预期结果
"COMP4136"               → 计算机科学硕士强化研究项目
"machine learning"       → 机器学习相关课程
"programming"            → 编程相关课程
"artificial"             → 人工智能相关课程
"UNNC"                   → 宁波诺丁汉大学课程
```

## 🔍 技术架构

### 搜索实现
```typescript
// 搜索函数
const handleSearch = (query: string) => {
  const results = courses.filter((course: Course) => 
    course.name.toLowerCase().includes(query.toLowerCase()) ||
    course.nameEn.toLowerCase().includes(query.toLowerCase()) ||
    course.code.toLowerCase().includes(query.toLowerCase()) ||
    course.id.toLowerCase().includes(query.toLowerCase())
  );
  setSearchResults(results.slice(0, 10));
};
```

### 智能导航
```typescript
// 自动导航到课程所属层级
const handleSearchResultSelect = (course: Course) => {
  const department = departments.find(d => d.id === course.departmentId);
  const school = schools.find(s => s.id === department.school);
  const university = universities.find(u => u.id === school.universityId);
  
  // 自动设置导航状态
  setSelectedUniversity(university);
  if (university.id === 'uon') {
    const campusId = school.id.startsWith('unnc-') ? 'china' : 'uk';
    setSelectedCampus(campusId);
  }
  setSelectedSchool(school);
  setSelectedDepartment(department);
};
```

## 🎉 优势总结

### 用户体验
- ⚡ **快速定位**: 几秒钟内找到目标课程
- 🎯 **精确搜索**: 支持多字段匹配
- 🔄 **智能导航**: 自动展开完整层级结构
- 💡 **直观界面**: 现代化搜索体验

### 国际化
- 🌍 **统一英文**: 提升国际化程度
- 📚 **标准化**: 课程名称规范统一
- 🔤 **易搜索**: 英文搜索更加精确

### 技术优势
- 🚀 **高性能**: 客户端实时搜索
- 📱 **响应式**: 移动端友好
- 🔧 **可扩展**: 易于添加新搜索字段

---

**🎓 现在您可以通过搜索框快速找到任何课程，享受更加便捷的学术信息浏览体验！** 