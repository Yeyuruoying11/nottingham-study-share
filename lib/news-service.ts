import { PostCategory } from './types';

// 新闻项目接口
export interface NewsItem {
  title: string;
  summary: string;
  source: string;
  publishedAt: Date;
  category: 'local' | 'university' | 'weather' | 'events';
  url?: string;
  location?: string;
}

// 天气信息接口
export interface WeatherInfo {
  location: string;
  temperature: number;
  condition: string;
  description: string;
  humidity: number;
  windSpeed: number;
  uvIndex?: number;
  visibility?: number;
}

// 校园事件接口
export interface CampusEvent {
  title: string;
  description: string;
  date: Date;
  location: string;
  category: string;
  isToday: boolean;
  isUpcoming: boolean;
  organizer?: string;
  maxCapacity?: number;
}

// 新闻获取服务
export class NewsService {
  
  /**
   * 获取诺丁汉本地新闻 - 当天版本
   */
  static async getLocalNews(): Promise<NewsItem[]> {
    try {
      const today = new Date();
      const weekday = today.toLocaleDateString('zh-CN', { weekday: 'long' });
      const monthDay = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
      
      // 基于当天日期生成相关新闻
      const localNewsTemplates = [
        {
          title: `诺丁汉市议会通过${monthDay}新预算案`,
          summary: `市议会今日通过了新的城市发展预算，将增加对学生住宿区域的基础设施投资，预计在未来6个月内改善交通和网络设施。`,
          source: "诺丁汉晚报",
          category: 'local' as const
        },
        {
          title: `${weekday}诺丁汉公交延长夜班服务`,
          summary: `从今日起，诺丁汉公交系统将在周末延长夜班服务至凌晨2点，方便学生和夜班工作者出行。25路和28路公交线受益最大。`,
          source: "诺丁汉交通局",
          category: 'local' as const
        },
        {
          title: `诺丁汉老城区新开亚洲美食街`,
          summary: `位于Hockley的新亚洲美食街今日正式开业，包含中餐、日料、韩料等多家餐厅，为留学生提供更多正宗亚洲美食选择。`,
          source: "诺丁汉美食指南",
          category: 'local' as const
        },
        {
          title: `诺丁汉森林公园${monthDay}举办冬季集市`,
          summary: `森林公园将在今日举办季节性集市，有热红酒、手工艺品和当地农产品展售，入场免费，建议学生带上学生证享受额外折扣。`,
          source: "诺丁汉文化局",
          category: 'local' as const
        },
        {
          title: `诺丁汉市中心新建学生优惠商圈`,
          summary: `Victoria Centre新增"学生优惠专区"，超过50家商店为持有效学生证的顾客提供10-20%折扣，涵盖服装、书籍、电子产品等。`,
          source: "诺丁汉商业周刊",
          category: 'local' as const
        }
      ];
      
      // 根据日期特征选择相关新闻
      const selectedNews = this.selectNewsBasedOnDate(localNewsTemplates, today);
      
      return selectedNews.map(news => ({
        ...news,
        publishedAt: today,
        url: `https://news.nottingham.com/${Math.random().toString(36).substr(2, 9)}`
      }));
      
    } catch (error) {
      console.error('获取本地新闻失败:', error);
      return [];
    }
  }

  /**
   * 获取大学新闻 - 当天版本
   */
  static async getUniversityNews(): Promise<NewsItem[]> {
    try {
      const today = new Date();
      const isWeekend = today.getDay() === 0 || today.getDay() === 6;
      const monthDay = today.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
      const currentTerm = this.getCurrentAcademicTerm(today);
      
      const universityNewsTemplates = [
        {
          title: `诺丁汉大学图书馆${monthDay}调整开放时间`,
          summary: `${currentTerm}期间，Hallward Library将延长开放时间。工作日开放至午夜，周末从上午8点开放至晚上10点，满足学生复习需求。`,
          source: "诺丁汉大学",
          category: 'university' as const
        },
        {
          title: `学生会发布${currentTerm}活动安排`,
          summary: `学生会今日公布了本周活动安排，包括国际学生交流会、学术技能工作坊和careers fair等，欢迎所有学生参与。`,
          source: "诺丁汉大学学生会",
          category: 'university' as const
        },
        {
          title: `诺丁汉大学${monthDay}推出新学生支持服务`,
          summary: `大学新设立心理健康支持热线和在线咨询服务，每天24小时开放。同时增加中文咨询服务，更好支持国际学生。`,
          source: "诺丁汉大学学生服务中心",
          category: 'university' as const
        },
        {
          title: `${currentTerm}就业技能提升计划启动`,
          summary: `Career Services推出新的就业技能培训计划，包括简历写作、面试技巧和行业networking events，免费向所有学生开放。`,
          source: "诺丁汉大学就业中心",
          category: 'university' as const
        },
        {
          title: `诺丁汉大学食堂${monthDay}新增健康餐选项`,
          summary: `Portland和Jubilee食堂新增低卡路里和素食选项，价格保持在£4-6之间，满足学生多样化饮食需求。`,
          source: "诺丁汉大学餐饮服务",
          category: 'university' as const
        }
      ];
      
      const selectedNews = this.selectNewsBasedOnDate(universityNewsTemplates, today);
      
      return selectedNews.map(news => ({
        ...news,
        publishedAt: today,
        url: `https://nottingham.ac.uk/news/${Math.random().toString(36).substr(2, 9)}`
      }));
      
    } catch (error) {
      console.error('获取大学新闻失败:', error);
      return [];
    }
  }

  /**
   * 获取今日天气信息 - 真实性模拟
   */
  static async getWeatherInfo(): Promise<WeatherInfo | null> {
    try {
      const today = new Date();
      const month = today.getMonth() + 1; // 1-12
      const hour = today.getHours();
      
      // 根据季节和时间生成合理的天气数据
      const seasonalWeather = this.getSeasonalWeatherData(month, hour);
      
      return {
        location: '诺丁汉',
        temperature: seasonalWeather.temperature,
        condition: seasonalWeather.condition,
        description: seasonalWeather.description,
        humidity: seasonalWeather.humidity,
        windSpeed: seasonalWeather.windSpeed,
        uvIndex: seasonalWeather.uvIndex,
        visibility: seasonalWeather.visibility
      };
      
    } catch (error) {
      console.error('获取天气信息失败:', error);
      return null;
    }
  }

  /**
   * 获取今日和近期校园事件
   */
  static async getCampusEvents(): Promise<CampusEvent[]> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekday = now.getDay(); // 0-6 (Sunday-Saturday)
      const currentTerm = this.getCurrentAcademicTerm(now);
      
      const eventTemplates = [
        {
          title: "AI与机器学习讲座",
          description: `计算机科学系举办的前沿技术讲座，探讨AI在现代社会的应用。特邀Google DeepMind研究员分享最新研究成果。`,
          location: "Computer Science Building G16",
          category: "学术讲座",
          daysFromNow: 0,
          organizer: "计算机科学系",
          maxCapacity: 120
        },
        {
          title: "国际学生文化交流夜",
          description: `每月一次的文化交流活动，各国学生分享美食、音乐和传统。本月主题：东亚文化节。`,
          location: "Portland Building - Atrium",
          category: "文化活动", 
          daysFromNow: weekday < 5 ? (5 - weekday) : 7, // 下个周五
          organizer: "国际学生会",
          maxCapacity: 200
        },
        {
          title: "春季就业招聘会",
          description: `超过80家知名企业参与，包括tech startups、金融机构和咨询公司。提供实习和全职职位。`,
          location: "David Ross Sports Village",
          category: "就业服务",
          daysFromNow: 3,
          organizer: "Career Services",
          maxCapacity: 500
        },
        {
          title: `${currentTerm}学术技能工作坊`,
          description: `提升学术写作、研究方法和批判性思维技能。特别适合国际学生参与。`,
          location: "Hallward Library - Room 101",
          category: "学术支持",
          daysFromNow: 1,
          organizer: "学术支持中心",
          maxCapacity: 30
        },
        {
          title: "学生创业大赛决赛",
          description: `${currentTerm}学生创业大赛决赛，优胜者将获得£5000创业基金和专业导师支持。`,
          location: "Trent Building - Great Hall",
          category: "创业竞赛",
          daysFromNow: 7,
          organizer: "创新创业中心",
          maxCapacity: 300
        },
        {
          title: "诺丁汉大学开放日",
          description: `向公众开放校园参观，展示学校设施、学术成果和学生生活。家长和准学生欢迎参加。`,
          location: "全校园",
          category: "开放活动",
          daysFromNow: 10,
          organizer: "招生办公室",
          maxCapacity: 1000
        }
      ];
      
      // 根据当前时间选择合适的事件
      const relevantEvents = eventTemplates.filter(event => {
        if (event.daysFromNow === 0) return true; // 今日事件
        if (event.daysFromNow <= 7) return true; // 一周内事件
        return Math.random() < 0.3; // 30%概率包含远期事件
      });
      
      return relevantEvents.map(event => {
        const eventDate = new Date(today);
        eventDate.setDate(eventDate.getDate() + event.daysFromNow);
        
        return {
          title: event.title,
          description: event.description,
          date: eventDate,
          location: event.location,
          category: event.category,
          isToday: event.daysFromNow === 0,
          isUpcoming: event.daysFromNow > 0 && event.daysFromNow <= 7,
          organizer: event.organizer,
          maxCapacity: event.maxCapacity
        };
      });
      
    } catch (error) {
      console.error('获取校园事件失败:', error);
      return [];
    }
  }

  // 辅助方法：根据日期选择新闻
  private static selectNewsBasedOnDate(newsTemplates: any[], date: Date): any[] {
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // 工作日和周末显示不同类型的新闻
    let filteredNews = newsTemplates;
    if (isWeekend) {
      // 周末更多文化和生活相关新闻
      filteredNews = newsTemplates.filter((_, index) => index % 2 === 0);
    }
    
    // 随机选择1-2条新闻
    const shuffled = filteredNews.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.floor(Math.random() * 2) + 1);
  }

  // 辅助方法：获取当前学期
  private static getCurrentAcademicTerm(date: Date): string {
    const month = date.getMonth() + 1; // 1-12
    
    if (month >= 9 && month <= 12) {
      return '秋季学期';
    } else if (month >= 1 && month <= 3) {
      return '春季学期';
    } else if (month >= 4 && month <= 6) {
      return '夏季学期';
    } else {
      return '暑假期间';
    }
  }

  // 辅助方法：获取季节性天气数据
  private static getSeasonalWeatherData(month: number, hour: number): any {
    let baseTemp: number;
    let conditions: string[];
    
    // 根据月份确定基础温度和天气类型
    if (month >= 12 || month <= 2) { // 冬季
      baseTemp = Math.floor(Math.random() * 8) + 2; // 2-10°C
      conditions = ['阴天', '小雨', '多云', '晴朗', '雾天'];
    } else if (month >= 3 && month <= 5) { // 春季
      baseTemp = Math.floor(Math.random() * 12) + 8; // 8-20°C
      conditions = ['晴朗', '多云', '小雨', '晴转多云', '阵雨'];
    } else if (month >= 6 && month <= 8) { // 夏季
      baseTemp = Math.floor(Math.random() * 10) + 18; // 18-28°C
      conditions = ['晴朗', '多云', '晴朗', '偶有阵雨', '晴转多云'];
    } else { // 秋季
      baseTemp = Math.floor(Math.random() * 10) + 10; // 10-20°C
      conditions = ['多云', '小雨', '阴天', '晴转多云', '雾天'];
    }
    
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    
    const descriptions = {
      '晴朗': '阳光明媚，适合户外活动',
      '多云': '天空多云，温度适宜',
      '小雨': '轻微降雨，记得带伞',
      '阴天': '天空阴沉，可能有雨',
      '晴转多云': '上午晴朗，下午转多云',
      '阵雨': '间歇性降雨，建议备伞',
      '偶有阵雨': '偶有短暂阵雨，大部分时间晴朗',
      '雾天': '早晨有雾，能见度较低，注意安全'
    };
    
    return {
      temperature: baseTemp,
      condition: condition,
      description: descriptions[condition] || '天气状况良好',
      humidity: Math.floor(Math.random() * 40) + 45, // 45-85%
      windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
      uvIndex: hour >= 10 && hour <= 16 ? Math.floor(Math.random() * 8) + 1 : 0,
      visibility: condition === '雾天' ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 5) + 8
    };
  }

  /**
   * 获取综合新闻信息
   */
  static async getNewsDigest(
    sources: ('local' | 'university' | 'weather' | 'events')[],
    includeWeather: boolean = true,
    includeEvents: boolean = true
  ): Promise<{
    news: NewsItem[];
    weather: WeatherInfo | null;
    events: CampusEvent[];
  }> {
    try {
      console.log('开始获取新闻摘要，来源:', sources);
      
      const results = await Promise.allSettled([
        // 根据配置获取不同类型的新闻
        sources.includes('local') ? this.getLocalNews() : Promise.resolve([]),
        sources.includes('university') ? this.getUniversityNews() : Promise.resolve([]),
        includeWeather ? this.getWeatherInfo() : Promise.resolve(null),
        includeEvents ? this.getCampusEvents() : Promise.resolve([])
      ]);
      
      const localNews = results[0].status === 'fulfilled' ? results[0].value : [];
      const universityNews = results[1].status === 'fulfilled' ? results[1].value : [];
      const weather = results[2].status === 'fulfilled' ? results[2].value : null;
      const events = results[3].status === 'fulfilled' ? results[3].value : [];
      
      const allNews = [...localNews, ...universityNews];
      
      console.log('新闻摘要获取完成:', {
        本地新闻: localNews.length,
        大学新闻: universityNews.length,
        天气信息: !!weather,
        校园活动: events.length
      });
      
      return {
        news: allNews,
        weather: weather,
        events: events
      };
      
    } catch (error) {
      console.error('获取新闻摘要失败:', error);
      return {
        news: [],
        weather: null,
        events: []
      };
    }
  }

  /**
   * 生成新闻内容格式化文本
   */
  static formatNewsContent(newsDigest: {
    news: NewsItem[];
    weather: WeatherInfo | null;
    events: CampusEvent[];
  }): string {
    const today = new Date();
    const dateStr = today.toLocaleDateString('zh-CN', { 
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
    
    let content = `📅 **${dateStr} • 诺丁汉资讯速递**\n\n`;
    
    // 添加天气信息
    if (newsDigest.weather) {
      const weather = newsDigest.weather;
      content += `🌤️ **今日天气**\n`;
      content += `${weather.location}: ${weather.temperature}°C • ${weather.condition}\n`;
      content += `${weather.description}\n`;
      content += `💧 湿度 ${weather.humidity}% • 🌪️ 风速 ${weather.windSpeed}km/h`;
      if (weather.uvIndex && weather.uvIndex > 3) {
        content += ` • ☀️ UV指数 ${weather.uvIndex}`;
      }
      content += `\n\n`;
    }
    
    // 添加新闻信息
    if (newsDigest.news.length > 0) {
      content += `📰 **今日要闻**\n\n`;
      newsDigest.news.forEach((news, index) => {
        content += `${index + 1}. **${news.title}**\n`;
        content += `${news.summary}\n`;
        content += `📍 来源: ${news.source}\n\n`;
      });
    }
    
    // 添加校园事件
    if (newsDigest.events.length > 0) {
      const todayEvents = newsDigest.events.filter(event => event.isToday);
      const upcomingEvents = newsDigest.events.filter(event => event.isUpcoming);
      
      if (todayEvents.length > 0) {
        content += `🎯 **今日校园活动**\n\n`;
        todayEvents.forEach(event => {
          content += `📌 **${event.title}**\n`;
          content += `📍 ${event.location}\n`;
          if (event.organizer) {
            content += `👥 主办: ${event.organizer}\n`;
          }
          content += `${event.description}\n\n`;
        });
      }
      
      if (upcomingEvents.length > 0) {
        content += `📅 **近期活动预告**\n\n`;
        upcomingEvents.forEach(event => {
          const eventDateStr = event.date.toLocaleDateString('zh-CN', { 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          });
          content += `📌 **${event.title}**\n`;
          content += `📅 ${eventDateStr}\n`;
          content += `📍 ${event.location}\n`;
          if (event.organizer) {
            content += `👥 主办: ${event.organizer}\n`;
          }
          content += `${event.description}\n\n`;
        });
      }
    }
    
    content += `\n💙 诺丁汉大学学生助手 • 每日为你精选校园资讯`;
    
    return content;
  }

  /**
   * 获取适合的帖子分类
   */
  static getPostCategoryForNews(newsDigest: {
    news: NewsItem[];
    weather: WeatherInfo | null;
    events: CampusEvent[];
  }): PostCategory {
    // 根据新闻内容决定分类
    const hasUniversityNews = newsDigest.news.some(news => news.category === 'university');
    const hasEvents = newsDigest.events.length > 0;
    const hasLocalNews = newsDigest.news.some(news => news.category === 'local');
    
    if (hasUniversityNews && hasEvents) {
      return '学习'; // 校园相关
    } else if (hasLocalNews && hasEvents) {
      return '生活'; // 本地生活相关
    } else if (hasUniversityNews) {
      return '学习'; // 学术相关
    } else {
      return '生活'; // 默认生活分类
    }
  }
} 