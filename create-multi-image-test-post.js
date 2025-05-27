const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: "AIzaSyBJJXPq0x0hT-6B-GwpVu5YmwPFKNjkJz0",
  authDomain: "guidin-db601.firebaseapp.com",
  projectId: "guidin-db601",
  storageBucket: "guidin-db601.firebasestorage.app",
  messagingSenderId: "843377802440",
  appId: "1:843377802440:web:c3778b2a4a01e08f1c416f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function createMultiImageTestPost() {
  try {
    console.log('📝 创建多图片测试帖子...\\n');
    
    // 旅游帖子 - 多张美景图片
    const travelPost = {
      title: "英国湖区三日游 - 绝美风景分享",
      content: "刚从湖区回来，风景真的太美了！分享一些拍的照片，每一张都是手机随手拍的，完全不需要滤镜。",
      fullContent: `刚从英国湖区（Lake District）三日游回来，真的被这里的自然风光震撼到了！

🏔️ **第一天：温德米尔湖**
早上从曼彻斯特出发，大概2小时车程就到了。湖水清澈见底，远山如黛，完全就是明信片里的风景。坐了游船环湖一圈，船上还有讲解员介绍湖区的历史。

🌸 **第二天：格拉斯米尔村**
这个小村庄简直就是童话世界！石头房子配上花园，每家每户都把自己的小花园打理得特别精致。在这里还参观了诗人华兹华斯的故居，文艺气息满满。

⛰️ **第三天：斯卡费尔峰**
虽然爬山很累，但是山顶的景色真的值得！360度无死角的湖区全景，那种震撼感只有亲眼看到才能体会。

💡 **小贴士：**
- 建议住在Windermere或者Ambleside，交通方便
- 一定要带防雨衣，湖区天气变化很快
- 推荐买National Trust的年卡，很多景点都能用

总之这次旅行太满足了，已经在计划下次去苏格兰高地了！有想一起的小伙伴吗？`,
      category: "旅行",
      tags: ["湖区", "旅游", "风景", "英国", "自然"],
      image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop", // 主图
      images: [
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop", // 湖景
        "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&h=600&fit=crop", // 山景
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop", // 森林
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=600&fit=crop", // 小径
        "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop", // 湖边小屋
        "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&h=600&fit=crop", // 日落
      ],
      author: {
        name: "旅行达人小李",
        avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face",
        university: "诺丁汉大学",
        year: "研究生",
        uid: "test-user-travel"
      },
      likes: 15,
      comments: 8,
      createdAt: serverTimestamp()
    };

    // 美食帖子 - 多道菜品图片
    const foodPost = {
      title: "在家做了一桌中式大餐，想家的味道",
      content: "周末在家做了好多菜，红烧肉、糖醋里脊、蒸蛋羹...每一道都是妈妈的味道。",
      fullContent: `周末闲在家里，突然特别想念家里的味道，于是决定自己动手做一桌中式大餐！

🥩 **红烧肉**
用的是五花肉，先焯水去腥，然后炒糖色，最后小火慢炖一个小时。肥而不腻，入口即化，简直和妈妈做的一模一样！

🍤 **糖醋里脊**
这道菜最考验火候，里脊肉要炸得外酥内嫩，糖醋汁的比例也很关键。我用的是2勺醋、3勺糖、4勺生抽、5勺水的比例，酸甜适中。

🥚 **水蒸蛋**
看起来简单，其实很考验技巧。蛋液和温水1:1.5的比例，一定要过筛去泡沫，蒸的时候盖上保鲜膜，这样蒸出来才嫩滑。

🥬 **清炒小白菜**
最简单的一道菜，但是要炒得好看也不容易。大火爆炒，下盐要晚一点，这样菜叶才不会出太多水。

🍲 **冬瓜排骨汤**
排骨先焯水，然后和冬瓜一起炖，清淡鲜美，特别适合现在的天气。

做完这一桌菜花了我整整一个下午，但是吃的时候真的太满足了！在异国他乡能吃到家的味道，瞬间就不想家了。

有没有同样爱做饭的小伙伴？可以一起交流厨艺哦！`,
      category: "美食",
      tags: ["中餐", "家常菜", "做饭", "想家", "美食"],
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop", // 主图
      images: [
        "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop", // 红烧肉
        "https://images.unsplash.com/photo-1563379091339-03246963d96c?w=800&h=600&fit=crop", // 糖醋里脊
        "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop", // 蒸蛋
        "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&h=600&fit=crop", // 青菜
        "https://images.unsplash.com/photo-1547592180-85f173990554?w=800&h=600&fit=crop", // 汤
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop", // 整桌菜
      ],
      author: {
        name: "厨艺小达人",
        avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=40&h=40&fit=crop&crop=face",
        university: "诺丁汉大学",
        year: "本科生",
        uid: "test-user-food"
      },
      likes: 23,
      comments: 12,
      createdAt: serverTimestamp()
    };

    // 学习帖子 - 多张学习资料图片
    const studyPost = {
      title: "期末复习资料整理 - 计算机科学专业",
      content: "期末考试快到了，整理了一些复习资料和笔记，希望对同专业的同学有帮助。",
      fullContent: `期末考试季又到了！作为一个即将毕业的计算机科学专业学生，想把这几年积累的学习资料和经验分享给大家。

📚 **数据结构与算法**
这门课是CS专业的核心，我把所有的算法都用Python重新实现了一遍，还画了很多图解。特别是动态规划和图算法，一定要多练习。

💻 **操作系统**
这门课理论性比较强，我做了很多思维导图来梳理知识点。进程、线程、内存管理这些概念一定要理解透彻。

🌐 **计算机网络**
OSI七层模型、TCP/IP协议栈，这些都是重点。我整理了一份网络协议的对比表格，复习的时候特别有用。

🔢 **数据库系统**
SQL语句的练习很重要，我收集了很多经典的查询题目。还有数据库设计的范式，考试经常考。

🤖 **人工智能**
这门课涉及的算法很多，机器学习、深度学习的基础概念都要掌握。我用Jupyter Notebook做了很多实验。

📝 **复习建议：**
1. 提前2-3周开始复习，不要临时抱佛脚
2. 多做past papers，了解考试题型
3. 组建学习小组，互相讨论问题
4. 理论和实践结合，光看书不够

资料我都整理成PDF了，需要的同学可以私信我。大家一起加油，期末顺利通过！`,
      category: "学习",
      tags: ["期末复习", "计算机科学", "学习资料", "考试", "笔记"],
      image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop", // 主图
      images: [
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&h=600&fit=crop", // 笔记本
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop", // 代码
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop", // 图表
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop", // 书籍
        "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&h=600&fit=crop", // 思维导图
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=600&fit=crop", // 学习环境
      ],
      author: {
        name: "CS学霸",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face",
        university: "诺丁汉大学",
        year: "本科四年级",
        uid: "test-user-study"
      },
      likes: 31,
      comments: 15,
      createdAt: serverTimestamp()
    };

    // 添加帖子到Firestore
    const posts = [travelPost, foodPost, studyPost];
    
    for (let i = 0; i < posts.length; i++) {
      const post = posts[i];
      console.log(`正在添加第${i+1}个帖子: ${post.title}`);
      
      const docRef = await addDoc(collection(db, 'posts'), post);
      console.log(`✅ 帖子已添加，ID: ${docRef.id}`);
    }
    
    console.log('\\n🎉 所有多图片测试帖子创建完成！');
    console.log('现在可以在网站上查看3D轮播效果了。');
    
  } catch (error) {
    console.error('❌ 创建测试帖子失败:', error);
  }
}

createMultiImageTestPost(); 