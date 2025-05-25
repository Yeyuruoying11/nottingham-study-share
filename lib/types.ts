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
  createdAt: Date;
  updatedAt: Date;
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
  tags: string[];
  likes: number;
  likedBy: string[];
  comments: number;
  views: number;
  isPublished: boolean;
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
  userId: string;
  type: "like" | "comment" | "follow" | "mention";
  message: string;
  read: boolean;
  relatedPostId?: string;
  relatedUserId?: string;
  createdAt: Date;
} 