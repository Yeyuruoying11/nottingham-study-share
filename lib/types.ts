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
  | "学习"
  | "生活" 
  | "美食"
  | "旅行"
  | "购物"
  | "租房"
  | "其他";

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