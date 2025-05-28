# 诺丁汉留学圈 - 分享你的留学故事

专为诺丁汉大学留学生打造的社交分享平台，分享留学攻略、生活经验、美食推荐等内容。

## ✨ 最新功能
- 🔐 **用户认证系统** - 完整的注册、登录、登出功能
- 🎨 **现代化UI设计** - 基于Aceternity UI和Tailwind CSS
- 📱 **响应式设计** - 完美支持移动端和桌面端
- 🔥 **实时数据** - Firebase集成，支持实时数据同步
- 🌐 **自定义域名** - 支持绑定自定义域名

## 🚀 技术栈

- **前端框架**: Next.js 14 + React 18 + TypeScript
- **样式**: Tailwind CSS + Framer Motion
- **后端服务**: Firebase (Auth + Firestore + Storage)
- **部署**: Vercel
- **UI组件**: Aceternity UI + Lucide Icons

## 📱 功能特性

### 🏠 首页
- Pinterest风格的瀑布流布局
- 分类筛选（学习、生活、美食、旅行、购物、租房）
- 搜索功能
- 用户评价滚动展示

### 🔐 用户系统
- 邮箱注册/登录
- 用户状态管理
- 个人资料管理
- 安全登出

### 📝 内容管理
- 发布攻略和经验分享
- 图片上传
- 点赞和评论系统
- 内容分类管理

## 🎨 设计特色

- **诺丁汉大学品牌色** - 绿色主题配色
- **玻璃拟态效果** - 现代化的视觉设计
- **流畅动画** - Framer Motion驱动的交互动画
- **移动优先** - 响应式设计，完美适配各种设备

## 🌐 在线访问

**网站地址**: [https://www.newbiemap.com](https://www.newbiemap.com)
**备用地址**: [https://nottingham-study-share.vercel.app](https://nottingham-study-share.vercel.app)

## 🔧 自定义域名配置

如果你有自己的域名，可以按照以下步骤配置：

### 1. 在Vercel中添加域名
1. 登录 [Vercel控制台](https://vercel.com)
2. 进入项目设置 → Domains
3. 添加你的域名

### 2. 配置DNS记录
在你的域名提供商（如LCN）控制面板中添加以下DNS记录：

```
类型: A
名称: @
值: 76.76.19.61
TTL: 3600

类型: A  
名称: www
值: 76.76.19.61
TTL: 3600
```

### 3. 等待DNS传播
DNS更改通常需要几分钟到24小时生效。可以使用 [whatsmydns.net](https://www.whatsmydns.net) 检查传播状态。

### 4. SSL证书
Vercel会自动为你的域名生成SSL证书，无需额外配置。

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 访问 http://localhost:3000
```

## 📄 许可证

MIT License

---

**让留学生活更精彩，让经验分享更简单！** 🎓✨

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

### 🎯 帖子分类筛选
- **智能分类系统**：支持学习、生活、美食、旅行、购物、租房等6大分类
- **实时筛选**：点击分类标签即可筛选对应类型的帖子
- **分类统计**：显示每个分类的帖子数量
- **组合筛选**：支持分类和搜索的组合筛选
- **性能优化**：使用 Firestore 查询优化，按需加载数据

### 📝 内容管理
- 发布帖子（支持图片上传）
- 分类标签系统
- 搜索功能（标题、内容、标签）
- 点赞和评论
- 帖子删除（仅作者可删除）

### 👤 用户系统
- Firebase 身份验证
- 用户名设置（限制修改次数）
- 个人资料管理
- 权限控制

### 🎨 用户体验
- 响应式设计
- 流畅的动画效果
- 现代化 UI 界面
- 移动端适配

## 🛠️ 技术栈

- **前端**: Next.js 14, React, TypeScript, Tailwind CSS
- **后端**: Firebase (Firestore, Authentication, Storage)
- **动画**: Framer Motion
- **图标**: Lucide React
- **部署**: Vercel

## 🚀 快速开始

### 分类筛选功能

1. **查看所有帖子**：点击"全部"标签
2. **按分类筛选**：点击任意分类标签（学习、生活、美食等）
3. **搜索筛选**：在搜索框输入关键词
4. **组合筛选**：选择分类后再搜索，可以在特定分类中搜索
5. **清除筛选**：点击筛选提示条中的"清除筛选"按钮

### 发布帖子

1. 点击右上角"发布"按钮
2. 填写标题和内容
3. 选择合适的分类
4. 添加标签（可选）
5. 上传图片（可选）
6. 点击发布

## 🛠️ 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 类型检查
npx tsc --noEmit
```

## 📄 许可证

MIT License

## 环境配置

创建 `.env.local` 文件并配置 Firebase：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 更新日志

### v2.1.0 - 分类筛选功能
- ✨ 新增帖子分类筛选功能
- 🚀 优化数据库查询性能
- 📊 添加分类统计显示
- 🎨 改进用户界面和交互体验
- 🔍 增强搜索和筛选组合功能

### v2.0.0 - 用户名管理系统
- ✨ 新增用户名设置功能
- 🔒 实现修改次数限制（3次/30天）
- 📝 添加用户名历史记录
- ✅ 完善验证规则和安全检查

### v1.0.0 - 基础功能
- 🎉 初始版本发布
- 📝 帖子发布和管理
- 👤 用户认证系统
- 💾 Firebase 集成 