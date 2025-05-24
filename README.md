# 诺丁汉留学圈 - Nottingham Study Share

一个专为诺丁汉大学留学生打造的社交分享平台，类似小红书的设计风格，让同学们可以分享留学攻略、生活经验、美食推荐等内容。

## ✨ 功能特色

### 🔐 登录界面
- 现代化的渐变背景设计
- 流畅的动画效果
- 支持邮箱登录和社交媒体登录
- 响应式设计，支持移动端

### 🏠 首页设计
- 类似小红书的瀑布流布局
- 智能分类系统（学习、生活、美食、旅行等）
- 实时搜索功能
- 无限滚动的用户评价展示
- 响应式网格布局

### 🎨 设计亮点
- 参考 [Awwwards](https://www.awwwards.com/) 的现代设计趋势
- 使用 [Aceternity UI](https://ui.aceternity.com/components/infinite-moving-cards) 的无限滚动卡片组件
- 诺丁汉大学品牌色彩（绿色和金色）
- 流畅的动画和过渡效果

## 🛠️ 技术栈

- **框架**: Next.js 14 (App Router)
- **UI库**: React 18 + TypeScript
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React
- **字体**: Inter (Google Fonts)

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

### 构建生产版本
```bash
npm run build
npm start
```

## 📱 页面结构

- `/` - 首页（瀑布流布局的内容展示）
- `/login` - 登录页面（现代化设计）
- 更多页面正在开发中...

## 🎯 设计理念

这个项目结合了：
1. **小红书的产品逻辑** - 以内容分享为核心的社交平台
2. **Awwwards的设计美学** - 现代、简洁、视觉冲击力强
3. **Aceternity UI的组件风格** - 高质量的UI组件和动画效果
4. **留学生的实际需求** - 专门针对诺丁汉留学生群体

## 🌟 特色功能

### 内容分类
- 📚 学习：论文写作、课程攻略、学习技巧
- 🏠 生活：租房指南、日常生活技巧
- 🍕 美食：餐厅推荐、美食探店
- ✈️ 旅行：景点推荐、旅行攻略
- 🛍️ 购物：购物中心、商品推荐
- 🏡 租房：房屋租赁、避坑指南

### 用户体验
- 响应式设计，完美适配移动端
- 流畅的加载动画
- 直观的操作界面
- 实时搜索和筛选

## 📦 项目结构

```
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── login/
│       └── page.tsx       # 登录页面
├── components/
│   └── ui/
│       └── infinite-moving-cards.tsx  # 无限滚动组件
├── lib/
│   └── utils.ts           # 工具函数
├── public/                # 静态资源
└── README.md
```

## 🎨 设计参考

- [Awwwards](https://www.awwwards.com/) - 网页设计灵感
- [Aceternity UI](https://ui.aceternity.com/components/infinite-moving-cards) - UI组件库
- 小红书 - 产品交互逻辑

## 📝 开发计划

- [x] 登录界面设计
- [x] 首页瀑布流布局
- [x] 响应式设计
- [x] 动画效果
- [ ] 用户注册功能
- [ ] 内容发布功能
- [ ] 用户个人页面
- [ ] 评论和点赞系统
- [ ] 搜索功能完善
- [ ] 后端API集成

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests 来改进这个项目！

## �� 许可证

MIT License 