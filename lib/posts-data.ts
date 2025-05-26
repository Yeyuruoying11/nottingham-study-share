export interface Post {
  id: number;
  title: string;
  content: string;
  fullContent: string;
  image: string;
  author: {
    name: string;
    avatar: string;
    university?: string;
    year?: string;
  };
  likes: number;
  comments: number;
  tags: string[];
  createdAt: string;
  category: string;
}

export interface Comment {
  id: number;
  postId: number;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  createdAt: string;
  likes: number;
}

export let postsData: Post[] = [
  {
    id: 1,
    title: "诺丁汉大学新生宿舍攻略",
    content: "刚到诺丁汉，住宿是个大问题。我整理了一份超全宿舍攻略，包括各个宿舍区的优缺点、价格对比...",
    fullContent: `诺丁汉大学新生宿舍攻略

刚到诺丁汉，住宿是个大问题。作为一个在诺丁汉生活了三年的老学长，我整理了一份超全宿舍攻略，希望能帮到即将到来的新同学们！

🏠 主要宿舍区域

1. University Park Campus 宿舍
优点：
- 距离主校区近，步行5-10分钟
- 设施相对较新
- 有24小时安保
- 社交氛围好

缺点：
- 价格较高（£150-200/周）
- 竞争激烈，需要早申请

推荐宿舍：
- Cripps Hall: 环境优美，有湖景
- Hugh Stewart Hall: 性价比高
- Rutland Hall: 设施最新

2. Jubilee Campus 宿舍
优点：
- 现代化设施
- 商学院学生首选
- 有超市和餐厅

缺点：
- 距离主校区较远
- 需要坐校车

3. 校外租房
优点：
- 价格相对便宜
- 更多选择和自由度
- 可以和朋友合租

缺点：
- 需要自己找房
- 可能距离学校较远

💰 价格对比

宿舍类型 | 价格范围(周) | 包含设施
校内标准间 | £120-150 | 网络、水电、清洁
校内套房 | £150-200 | 独立卫浴、厨房
校外合租 | £80-120 | 需自付水电网络

📝 申请建议

1. 提早申请: 最好在收到offer后立即申请
2. 多个选择: 填写多个志愿，增加成功率
3. 了解室友: 可以选择和朋友住在一起
4. 考虑预算: 根据自己的经济情况选择

🎯 生活小贴士

- 宿舍都有公共厨房，可以自己做饭
- 记得带转换插头
- 床上用品可以在当地购买
- 加入宿舍的社交群组，认识新朋友

希望这份攻略对大家有帮助！有任何问题欢迎私信我～`,
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop",
    author: {
      name: "小红同学",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
      university: "诺丁汉大学",
      year: "大三"
    },
    likes: 234,
    comments: 56,
    tags: ["宿舍", "新生", "攻略"],
    createdAt: "2024-01-15",
    category: "生活"
  },
  {
    id: 2,
    title: "诺丁汉周边美食探店",
    content: "在诺丁汉生活了两年，今天分享一些我发现的宝藏餐厅，有中餐、西餐、还有当地特色...",
    fullContent: `诺丁汉周边美食探店

在诺丁汉生活了两年，作为一个资深吃货，今天分享一些我发现的宝藏餐厅！从中餐到西餐，从平价到高档，应有尽有～

🍜 中餐推荐

1. 老北京炸酱面
地址: Maid Marian Way
推荐菜: 炸酱面、小笼包、麻辣烫
价格: £8-15
评分: ⭐⭐⭐⭐⭐

这家店的炸酱面真的太正宗了！老板是北京人，面条劲道，酱料香浓。小笼包也很不错，皮薄馅大。

2. 川味轩
地址: Derby Road
推荐菜: 水煮鱼、麻婆豆腐、回锅肉
价格: £12-20
评分: ⭐⭐⭐⭐

想吃辣的时候必去！水煮鱼分量很大，两个人吃绰绰有余。麻婆豆腐也很下饭。

🍕 西餐推荐

1. The Alchemist
地址: King Street
推荐: 创意鸡尾酒、牛排
价格: £20-35
评分: ⭐⭐⭐⭐⭐

环境很棒，适合约会或者庆祝。鸡尾酒很有创意，牛排也很嫩。

2. Turtle Bay
地址: Cornerhouse
推荐: 加勒比海料理、鸡尾酒
价格: £15-25
评分: ⭐⭐⭐⭐

异域风情浓厚，jerk chicken很好吃，鸡尾酒也很棒。

🍰 咖啡甜品

1. 200 Degrees Coffee
地址: Flying Horse Walk
推荐: 手冲咖啡、司康饼
价格: £3-8
评分: ⭐⭐⭐⭐

本地连锁咖啡店，咖啡豆很新鲜，环境也很适合学习。

2. Homemade
地址: Carlton Street
推荐: 芝士蛋糕、布朗尼
价格: £4-10
评分: ⭐⭐⭐⭐⭐

甜品控必去！所有甜品都是手工制作，芝士蛋糕入口即化。

💡 探店小贴士

1. 预约: 热门餐厅最好提前预约
2. 学生折扣: 很多餐厅对学生有折扣
3. Happy Hour: 酒吧通常有优惠时段
4. 外卖: 可以用Deliveroo、Uber Eats

希望大家都能找到自己喜欢的美食！有新发现也欢迎分享～`,
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=600&fit=crop",
    author: {
      name: "美食探索者",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      university: "诺丁汉大学",
      year: "研一"
    },
    likes: 189,
    comments: 42,
    tags: ["美食", "探店", "生活"],
    createdAt: "2024-01-10",
    category: "美食"
  },
  {
    id: 3,
    title: "论文季生存指南",
    content: "又到了论文季，图书馆里人满为患。分享一些我的论文写作技巧和时间管理方法...",
    fullContent: `论文季生存指南

又到了论文季，图书馆里人满为患，咖啡厅里都是埋头苦写的同学。作为一个刚刚熬过论文季的过来人，分享一些我的论文写作技巧和时间管理方法，希望能帮到正在奋斗的你们！

⏰ 时间管理

制定详细计划
- 8周前: 确定论文题目和大纲
- 6周前: 完成文献调研
- 4周前: 完成初稿
- 2周前: 修改和完善
- 1周前: 最终检查和格式调整

番茄工作法
- 25分钟专注写作
- 5分钟休息
- 每4个番茄休息15-30分钟

📚 写作技巧

1. 文献管理
推荐使用 Zotero 或 Mendeley：
- 自动生成引用格式
- 方便整理和搜索文献
- 支持多设备同步

2. 写作结构
1. Introduction (10%)
   - Background
   - Research question
   - Thesis statement

2. Literature Review (20%)
   - Current research
   - Research gap
   - Theoretical framework

3. Methodology (15%)
   - Research design
   - Data collection
   - Analysis methods

4. Results/Analysis (30%)
   - Findings
   - Data analysis
   - Discussion

5. Conclusion (15%)
   - Summary
   - Implications
   - Future research

6. References (10%)

3. 写作小贴士
- 每天写一点: 不要等到最后一刻
- 先写再改: 完美主义是效率杀手
- 大声朗读: 检查语言流畅性
- 寻求反馈: 让朋友或导师提意见

🏛️ 学习地点推荐

图书馆
- Hallward Library: 安静，适合深度思考
- Kings Meadow Campus Library: 人少，环境好
- Law Library: 24小时开放

咖啡厅
- 200 Degrees: 氛围好，咖啡棒
- Starbucks: 熟悉环境，长时间学习
- Costa: 相对安静

在家学习
- 创造专门的学习空间
- 远离干扰源（手机、电视）
- 保持良好的学习姿势

💪 保持健康

身体健康
- 规律作息，保证7-8小时睡眠
- 适量运动，哪怕只是散步
- 健康饮食，多吃蔬果

心理健康
- 适当休息，不要过度压力
- 和朋友聊天，分享压力
- 必要时寻求学校心理咨询

🛠️ 实用工具

写作工具
- Grammarly: 语法检查
- Hemingway Editor: 提高可读性
- Google Docs: 实时保存和协作

时间管理
- Forest: 专注力训练
- Todoist: 任务管理
- Google Calendar: 时间规划

🎯 最后的建议

1. 开始永远不嫌早: 越早开始压力越小
2. 质量胜过数量: 专注比时长更重要
3. 寻求帮助: 不要独自承受压力
4. 相信自己: 你比想象中更强大

记住，论文只是学习过程的一部分，不要让它成为你的全部。保持平衡，照顾好自己，你一定可以的！

加油！💪`,
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=500&fit=crop",
    author: {
      name: "学霸小王",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      university: "诺丁汉大学",
      year: "研二"
    },
    likes: 312,
    comments: 78,
    tags: ["学习", "论文", "技巧"],
    createdAt: "2024-01-08",
    category: "学习"
  }
];

export const commentsData: Comment[] = [
  {
    id: 1,
    postId: 1,
    author: {
      name: "新生小李",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face"
    },
    content: "太有用了！正好在纠结选哪个宿舍，这个攻略解决了我的困惑。请问Cripps Hall现在还有位置吗？",
    createdAt: "2024-01-16",
    likes: 12
  },
  {
    id: 2,
    postId: 1,
    author: {
      name: "学长张三",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
    },
    content: "补充一点：Hugh Stewart Hall的网络信号不太好，需要自己买路由器。其他都很不错！",
    createdAt: "2024-01-16",
    likes: 8
  },
  {
    id: 3,
    postId: 2,
    author: {
      name: "吃货小美",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
    },
    content: "川味轩真的很棒！上次和朋友去吃，水煮鱼超级香。老板人也很好，还送了小菜。",
    createdAt: "2024-01-11",
    likes: 15
  },
  {
    id: 4,
    postId: 3,
    author: {
      name: "论文苦手",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face"
    },
    content: "番茄工作法真的有效！之前总是拖延，现在每天都能完成计划的写作量。谢谢分享！",
    createdAt: "2024-01-09",
    likes: 23
  }
];

export function getPostById(id: number): Post | undefined {
  return postsData.find(post => post.id === id);
}

export function getCommentsByPostId(postId: number): Comment[] {
  return commentsData.filter(comment => comment.postId === postId);
}

export function getAllPosts(): Post[] {
  return [...postsData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addNewPost(postData: {
  title: string;
  content: string;
  category: string;
  tags: string[];
  image?: string;
  author: {
    name: string;
    avatar: string;
    university?: string;
    year?: string;
  };
}): Post {
  const newId = Math.max(...postsData.map(p => p.id), 0) + 1;
  
  const now = new Date();
  const createdAt = now.toISOString().split('T')[0];
  
  const newPost: Post = {
    id: newId,
    title: postData.title,
    content: postData.content.length > 100 ? postData.content.substring(0, 100) + "..." : postData.content,
    fullContent: postData.content,
    image: postData.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
    author: postData.author,
    likes: 0,
    comments: 0,
    tags: postData.tags,
    createdAt,
    category: postData.category
  };
  
  postsData.unshift(newPost);
  
  return newPost;
} 