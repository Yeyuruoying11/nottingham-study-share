# Google Maps 3D 地图功能配置指南

## 功能说明

在租房帖子中集成了 Google 3D 地图功能，用户可以：
- 查看房屋建筑的外观
- 360度旋转视角查看建筑各个角度
- 切换卫星视图和街景视图
- 全屏查看地图

## 配置步骤

### 1. 获取 Google Maps API Key

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用以下 APIs：
   - Maps JavaScript API
   - Geocoding API
   - Places API
   - Street View Static API

4. 创建 API 密钥：
   - 前往 "APIs & Services" > "Credentials"
   - 点击 "Create Credentials" > "API Key"
   - 复制生成的 API Key

### 2. 配置 API Key 限制（推荐）

为了安全，建议限制 API Key 的使用：

1. 在 API Key 设置中，添加应用限制：
   - 选择 "HTTP referrers (web sites)"
   - 添加你的网站域名：
     ```
     https://yourdomain.com/*
     http://localhost:3000/*
     ```

2. 限制 API 使用：
   - 仅选择需要的 APIs

### 3. 添加到环境变量

在项目根目录的 `.env.local` 文件中添加：

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的API密钥
```

### 4. 计费说明

Google Maps API 有免费配额：
- 每月 $200 的免费使用额度
- Maps JavaScript API: 28,000 次加载/月免费
- Geocoding API: 40,000 次请求/月免费

超出免费配额后会产生费用，请在 Google Cloud Console 中设置预算提醒。

## 使用方法

### 在租房帖子中使用

1. 创建帖子时选择"租房"分类
2. 在位置选择器中设置房屋位置
3. 发布后，用户可以在帖子详情页看到 3D 地图

### 地图交互

- **拖动**: 改变视角
- **滚轮**: 缩放
- **悬停**: 自动旋转
- **全屏按钮**: 全屏查看
- **街景按钮**: 切换到街景模式
- **重置按钮**: 恢复默认视角

## 故障排除

### 地图不显示

1. 检查 API Key 是否正确配置
2. 检查 APIs 是否已启用
3. 查看浏览器控制台错误信息

### "此页面无法正确加载 Google 地图"

- API Key 可能无效或受限
- 检查域名是否在允许列表中
- 确认计费账户正常

### 地理编码失败

- 确保 Geocoding API 已启用
- 检查地址格式是否正确
- 尝试更详细的地址描述

## 代码位置

- 3D 地图组件: `/components/Map/Google3DMapView.tsx`
- 帖子详情集成: `/app/post/[id]/page.tsx`
- 创建帖子集成: `/app/create/page.tsx` 