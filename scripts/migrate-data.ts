import { addPostToFirestore } from '../lib/firestore-posts';

// 测试数据
const testPosts = [
  {
    title: "测试帖子 - 可以删除",
    content: `测试帖子 - 可以删除

这是一个测试帖子，专门用于测试删除功能。

如果你已经登录，并且你的用户名或邮箱与帖子作者匹配，你应该能够：

1. 在首页帖子卡片上看到三个点菜单
2. 点击三个点，看到删除选项
3. 在帖子详情页面也能看到删除选项

测试步骤：
- 悬停在帖子卡片上
- 点击右上角的三个点
- 查看是否有删除选项

如果看不到删除选项，请检查：
- 是否已经登录
- 用户名是否匹配

这个帖子的作者设置为 "测试用户"，你可以尝试用这个名字登录来测试删除功能。`,
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
    author: {
      name: "测试用户",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face",
      university: "诺丁汉大学",
      year: "测试",
      uid: "test-user-uid" // 测试用户UID
    },
    tags: ["测试", "删除", "功能"],
    category: "学习"
  },
  {
    title: "诺丁汉大学新生宿舍攻略",
    content: `诺丁汉大学新生宿舍攻略

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
      year: "大三",
      uid: "user-xiaohong"
    },
    tags: ["宿舍", "新生", "攻略"],
    category: "生活"
  },
  {
    title: "诺丁汉周边美食探店",
    content: `诺丁汉周边美食探店

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
      year: "研一",
      uid: "user-foodie"
    },
    tags: ["美食", "探店", "生活"],
    category: "美食"
  },
  {
    title: "论文季生存指南",
    content: `论文季生存指南

又到了论文季，图书馆里人满为患，咖啡厅里都是埋头苦写的同学。作为一个刚刚熬过论文季的过来人，分享一些我的论文写作技巧和时间管理方法，希望能帮到正在奋斗的你们！

⏰ 时间管理

制定详细的时间表是关键。我建议把整个论文写作过程分成几个阶段：
1. 文献调研（2-3周）
2. 大纲制定（1周）
3. 初稿写作（4-5周）
4. 修改完善（2-3周）

每天设定具体的目标，比如"今天要读完5篇文献"或"今天要写完第二章的第一节"。

📚 写作技巧

- 先写大纲，再填充内容
- 每天写一点，不要拖到最后
- 使用番茄工作法，25分钟专注写作，5分钟休息
- 找一个安静的环境，关掉手机通知

💡 实用工具

推荐几个我用过的工具：
- Zotero：文献管理神器
- Grammarly：语法检查
- Forest：专注力APP
- Google Docs：实时保存，不怕丢失

记住，论文写作是一个过程，不要给自己太大压力。相信自己，你一定可以的！`,
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop",
    author: {
      name: "学霸小王",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
      university: "诺丁汉大学",
      year: "研二学生",
      uid: "test-user-1"
    },
    tags: ["论文", "学习技巧", "时间管理"],
    category: "学习",
    likes: 15,
    likedBy: ["test-user-2", "test-user-3"],
    comments: 8
  }
];

export async function migrateTestData() {
  console.log('开始迁移测试数据到Firestore...');
  
  for (const post of testPosts) {
    try {
      const postId = await addPostToFirestore(post);
      if (postId) {
        console.log(`✅ 成功添加帖子: ${post.title} (ID: ${postId})`);
      } else {
        console.log(`❌ 添加帖子失败: ${post.title}`);
      }
    } catch (error) {
      console.error(`❌ 添加帖子失败: ${post.title}`, error);
    }
  }
  
  console.log('数据迁移完成！');
}

// 如果直接运行此脚本
if (require.main === module) {
  migrateTestData().catch(console.error);
} 