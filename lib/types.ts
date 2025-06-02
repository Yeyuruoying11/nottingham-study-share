// 用户类型
export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  university: string;
  major?: string;
  year?: number;
  bio?: string;
  // 用户名修改记录
  usernameChangeCount: number; // 已修改次数
  lastUsernameChange?: Date; // 最后一次修改时间
  usernameHistory: string[]; // 历史用户名记录
  createdAt: Date;
  updatedAt: Date;
}

// 地理位置类型
export interface Location {
  latitude: number;
  longitude: number;
  address?: string; // 地址描述，如 "西班牙巴塞罗那"
  country?: string; // 国家
  city?: string; // 城市
  placeId?: string; // 地点ID，用于唯一标识
}

// 文章类型
export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  images: string[];
  authorId: string;
  author: {
    displayName: string;
    avatar?: string;
  };
  category: PostCategory;
  // 新增：学术分类
  campus?: string; // 校区，如 'uk', 'china'
  department?: Department;
  course?: Course;
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: number;
  views: number;
  isPublished: boolean;
  // 地理位置信息（主要用于旅行帖子）
  location?: Location;
  // Google Maps嵌入HTML代码（主要用于租房帖子）
  embedHtml?: string;
  // 视频iframe代码（用于学习、美食、资料、生活帖子）
  videoIframe?: string;
  // AI生成相关字段
  isAIGenerated?: boolean; // 是否为AI生成的帖子
  aiCharacterId?: string; // 生成此帖子的AI角色ID
  createdAt: Date;
  updatedAt: Date;
}

// 评论类型
export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author: {
    displayName: string;
    avatar?: string;
  };
  content: string;
  likes: number;
  likedBy: string[];
  parentId?: string; // 用于回复
  replies?: Comment[];
  createdAt: Date;
  updatedAt: Date;
}

// 文章分类
export type PostCategory = 
  | "生活" 
  | "美食" 
  | "学习" 
  | "旅行" 
  | "资料"
  | "租房";

// 通知类型
export interface Notification {
  id: string;
  userId?: string; // 如果为空表示系统通知（所有用户）
  type: "like" | "comment" | "follow" | "mention" | "system" | "admin";
  title: string;
  message: string;
  read: boolean;
  relatedPostId?: string;
  relatedUserId?: string;
  createdAt: Date;
  updatedAt?: Date;
  // 系统通知特有字段
  isSystemNotification?: boolean;
  adminId?: string; // 发送通知的管理员ID
}

// 聊天会话类型
export interface Conversation {
  id?: string;
  participants: string[]; // 参与者的 UID 数组
  participantNames: { [uid: string]: string }; // 参与者姓名映射
  participantAvatars: { [uid: string]: string }; // 参与者头像映射
  lastMessage?: {
    content: string;
    senderId: string;
    timestamp: Date;
    type: 'text' | 'image';
  };
  unreadCount: { [uid: string]: number }; // 每个用户的未读消息数
  createdAt: Date;
  updatedAt: Date;
}

// 聊天消息类型
export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  type: 'text' | 'image';
  timestamp: Date;
  readBy: string[]; // 已读用户的 UID 数组
  editedAt?: Date;
  isEdited: boolean;
}

// 在线状态类型
export interface UserOnlineStatus {
  uid: string;
  isOnline: boolean;
  lastSeen: Date;
}

// 新增：专业/学院类型
export interface Department {
  id: string;
  name: string;
  nameEn: string;
  school: string; // 所属学院
  description?: string;
}

// 新增：课程类型
export interface Course {
  id: string;
  name: string;
  nameEn: string;
  code: string; // 课程代码，如 COMP1001
  departmentId: string;
  level: 'undergraduate' | 'postgraduate' | 'phd';
  year?: number; // 年级，如 1, 2, 3
  credits?: number;
  description?: string;
}

// 新增：大学类型
export interface University {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  logo?: string;
  website?: string;
}

// 新增：学院类型
export interface School {
  id: string;
  name: string;
  nameEn: string;
  description?: string;
  universityId: string; // 所属大学
}

// AI相关类型定义
export interface AICharacter {
  id: string;
  name: string; // 系统内部名称
  displayName: string; // 显示名称
  model: 'deepseek' | 'gpt4o';
  avatar: string;
  description: string;
  systemPrompt: string;
  personality: {
    tone: 'friendly' | 'professional' | 'casual' | 'formal' | 'humorous';
    style: 'helpful' | 'educational' | 'entertaining' | 'supportive';
    interests: string[];
  };
  settings: {
    max_response_length: number;
    temperature: number;
    auto_posting: {
      enabled: boolean;
      interval_hours: number;
      categories: PostCategory[];
      post_style: 'educational' | 'casual' | 'informative' | 'entertaining';
      max_posts_per_day: number;
      include_images: boolean;
    };
    auto_chat: {
      enabled: boolean;
      response_delay_min: number; // 最小回复延迟（秒）
      response_delay_max: number; // 最大回复延迟（秒）
      active_hours: {
        start: number; // 0-23 小时
        end: number;   // 0-23 小时
      };
      auto_initiate: boolean; // 是否主动发起对话
    };
    news_posting: {
      enabled: boolean;
      interval_hours: number; // 新闻发送间隔
      max_news_per_day: number; // 每天最大新闻发送数
      news_sources: ('local' | 'university' | 'weather' | 'events')[]; // 新闻来源
      post_time_range: {
        start: number; // 发送时间开始（小时）
        end: number;   // 发送时间结束（小时）
      };
      include_weather: boolean; // 是否包含天气信息
      include_events: boolean; // 是否包含校园事件
    };
  };
  virtual_user: {
    uid: string; // Firebase Auth UID (ai_角色ID)
    email: string; // AI角色的虚拟邮箱
    profile: {
      major: string;
      year: string;
      bio: string;
      university: string;
    };
  };
  status: 'active' | 'inactive';
  stats: {
    total_posts: number;
    posts_today: number;
    total_chats: number;
    chats_today: number;
    last_post?: Date;
    last_chat?: Date;
  };
  created_at: Date;
  updated_at: Date;
}

export interface AIModelConfig {
  model_id: 'deepseek' | 'gpt4o';
  display_name: string;
  api_endpoint?: string;
  api_key?: string;
  max_tokens: number;
  temperature: number;
  available: boolean;
  cost_per_token?: number;
}

// 新增：AI发帖任务类型
export interface AIPostingTask {
  id: string;
  ai_character_id: string;
  ai_character_name: string;
  scheduled_time: Date;
  category?: PostCategory; // 如果指定了分类
  topic?: string; // 如果指定了主题
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
  post_id?: string; // 生成的帖子ID
  error_message?: string;
}

// 新增：AI生成的帖子内容类型
export interface AIGeneratedPost {
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  excerpt: string;
  images?: string[]; // 可选的图片URL
}

// AI聊天响应接口
export interface AIChatResponse {
  message: string;
  delay?: number; // 响应延迟（毫秒）
  emotion?: 'happy' | 'neutral' | 'excited' | 'helpful' | 'curious';
  shouldContinue?: boolean; // 是否继续对话
}

// AI聊天任务接口
export interface AIChatTask {
  id: string;
  ai_character_id: string;
  conversation_id: string;
  message_id: string;
  user_message: string;
  ai_response?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduled_time: Date;
  completed_at?: Date;
  error_message?: string;
  created_at: Date;
}

// AI主动聊天任务
export interface AIInitiatedChat {
  id: string;
  ai_character_id: string;
  target_user_id: string;
  message: string;
  conversation_id?: string;
  status: 'pending' | 'sent' | 'failed';
  scheduled_time: Date;
  sent_at?: Date;
  created_at: Date;
} 