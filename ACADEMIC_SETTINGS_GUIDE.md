# 学术设置功能使用指南

## 功能概述

新添加的学术设置功能允许用户在个人资料页面设置自己的学校和专业信息，并可以开启智能跳转功能，实现访问学习页面时的个性化体验。

## 主要功能

### 1. 学校选择
用户可以在个人资料页面选择以下四个选项：
- 🇬🇧 **诺丁汉大学 - 英国校区**
- 🇨🇳 **诺丁汉大学 - 中国校区** 
- 🏛️ **诺丁汉特伦特大学**
- 🔒 **保密**

### 2. 学院和专业选择
- 根据选择的学校，系统会自动显示对应的学院列表
- 选择学院后，会显示该学院下的专业列表
- 支持级联选择，确保数据的一致性

### 3. 智能跳转功能
- **开关控制**：用户可以开启或关闭智能跳转功能
- **功能介绍**：开关旁边有详细的功能说明提示
- **自动跳转**：开启后，访问"学习"页面时会自动跳转到用户设置的学校和专业对应页面
- **个性化体验**：关闭后显示完整的学校选择页面

## 使用步骤

### 设置学术信息
1. 登录账户后，点击右上角的"设置"按钮进入个人资料页面
2. 在"学术设置"区域：
   - 选择所在学校
   - 选择所在学院（根据学校自动显示）
   - 选择所学专业（根据学院自动显示）
3. 点击"保存设置"按钮

### 开启智能跳转
1. 在学术设置区域找到"智能跳转到我的专业"开关
2. 点击开关开启功能
3. 鼠标悬停在 ℹ️ 图标上查看详细功能介绍
4. 点击"保存设置"

### 使用智能跳转
1. 开启智能跳转后，点击网站顶部的"学习"按钮
2. 系统会显示加载状态："正在跳转到您的专业页面..."
3. 自动跳转到对应的学校、学院、专业页面
4. 页面顶部会显示绿色提示条，说明当前是智能跳转模式
5. 可以点击提示条中的"修改设置"返回个人资料页面调整设置

## 技术特性

### 数据持久化
- 使用 localStorage 保存用户设置
- 设置在浏览器刷新后保持不变
- 跨页面访问保持一致性

### 实时更新
- 学院列表根据学校选择实时更新
- 专业列表根据学院选择实时更新
- 无效选择自动清除（如学校变更后，之前的学院选择会被重置）

### 用户体验优化
- 加载状态显示
- 保存成功提示
- 智能跳转状态提示
- 详细的功能说明工具提示

## 界面元素说明

### 个人资料页面
- **学术设置卡片**：包含所有设置选项的白色卡片
- **下拉选择框**：带有 chevron 图标的选择器
- **Toggle 开关**：iOS 风格的绿色开关
- **保存按钮**：带加载状态的绿色按钮

### 学习页面
- **加载遮罩**：全屏半透明加载状态
- **智能跳转提示条**：绿色背景的顶部提示条
- **修改设置链接**：提示条右侧的设置链接

## 数据结构

```typescript
interface UserAcademicSettings {
  university?: string;    // 'uon-uk' | 'uon-china' | 'ntu' | 'private'
  school?: string;       // 学院ID
  department?: string;   // 专业ID
  autoRedirect: boolean; // 是否开启自动跳转
}
```

## 支持的学校和专业

### 诺丁汉大学英国校区
- Faculty of Arts
- Faculty of Engineering  
- Faculty of Medicine & Health Sciences
- Faculty of Science
- Faculty of Social Sciences
- Nottingham University Business School

### 诺丁汉大学中国校区（UNNC）
- School of Humanities and Social Sciences
- Faculty of Science and Engineering
- Nottingham University Business School China

### 诺丁汉特伦特大学
- School of Art & Design
- Nottingham Business School
- School of Science and Technology
- School of Social Sciences
- School of Education
- Nottingham Law School

## 故障排除

### 设置无法保存
- 检查浏览器是否允许 localStorage
- 确保已选择学校信息
- 尝试刷新页面重新设置

### 智能跳转不工作
- 确认已开启智能跳转开关
- 确认已保存设置
- 检查学校选择不是"保密"选项

### 页面显示异常
- 检查网络连接
- 尝试清除浏览器缓存
- 刷新页面重新加载 