import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  FieldValue,
  getDoc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  where,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { deleteImageFromStorage } from './firebase-storage';
import { isAdmin } from './admin-config';
import { Location } from './types';

export interface FirestorePost {
  id?: string;
  title: string;
  content: string;
  fullContent: string;
  image: string; // 保留作为主图片（向后兼容）
  images?: string[]; // 新增：多图片数组
  author: {
    name: string;
    avatar: string;
    university?: string;
    year?: string;
    uid?: string; // 添加用户UID用于权限验证
  };
  likes: number;
  likedBy?: string[]; // 点赞用户的UID列表
  comments: number;
  tags: string[];
  createdAt: Timestamp | Date | FieldValue;
  category: string;
  location?: Location; // 新增：地理位置信息
  campus?: string; // 校区，如 'uk', 'china'
  school?: string; // 学院ID
  department?: string; // 专业ID
  course?: string; // 课程ID
  embedHtml?: string; // Google Maps嵌入HTML代码
}

export interface FirestoreComment {
  id?: string;
  postId: string;
  author: {
    name: string;
    avatar: string;
    uid?: string;
  };
  content: string;
  createdAt: Timestamp | Date | FieldValue;
  likes: number;
  likedBy?: string[]; // 点赞用户的UID列表
  parentId?: string; // 父评论ID，用于回复功能
  replies?: FirestoreComment[]; // 回复列表（客户端计算）
}

// 帖子相关操作
export const postsCollection = collection(db, 'posts');
export const commentsCollection = collection(db, 'comments');

// 获取所有帖子
export async function getAllPostsFromFirestore(): Promise<FirestorePost[]> {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const posts: FirestorePost[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        fullContent: data.fullContent || data.content,
        category: data.category,
        tags: data.tags || [],
        image: data.image || "",
        images: data.images || [], // 包含多图片
        author: data.author,
        likes: data.likes || 0, // 确保包含点赞数
        likedBy: data.likedBy || [], // 点赞用户列表
        comments: data.comments || 0,
        createdAt: data.createdAt,
        location: data.location, // 包含位置信息
        school: data.school,
        department: data.department,
        course: data.course,
        embedHtml: data.embedHtml // Google Maps嵌入HTML代码
      });
    });
    
    return posts;
  } catch (error) {
    console.error("获取帖子失败:", error);
    return [];
  }
}

// 按分类获取帖子
export async function getPostsByCategoryFromFirestore(category: string): Promise<FirestorePost[]> {
  try {
    console.log(`正在查询分类: ${category}`);
    const postsRef = collection(db, 'posts');
    
    // 先尝试简单查询，不使用orderBy避免索引问题
    const q = query(postsRef, where('category', '==', category));
    const querySnapshot = await getDocs(q);
    
    console.log(`分类 ${category} 查询结果: ${querySnapshot.size} 个帖子`);
    
    const posts: FirestorePost[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`找到帖子: ${data.title}, 分类: ${data.category}`);
      posts.push({
        id: doc.id,
        title: data.title,
        content: data.content,
        fullContent: data.fullContent || data.content,
        category: data.category,
        tags: data.tags || [],
        image: data.image || "",
        images: data.images || [], // 包含多图片
        author: data.author,
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        comments: data.comments || 0,
        createdAt: data.createdAt,
        location: data.location, // 包含位置信息
        school: data.school,
        department: data.department,
        course: data.course,
        embedHtml: data.embedHtml, // Google Maps嵌入HTML代码
        campus: data.campus // 新增：校区
      });
    });
    
    // 手动按时间排序
    posts.sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                   a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? 
                   (a.createdAt as any).toDate().getTime() : 0;
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                   b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? 
                   (b.createdAt as any).toDate().getTime() : 0;
      return timeB - timeA; // 降序排列
    });
    
    return posts;
  } catch (error) {
    console.error(`获取${category}分类帖子失败:`, error);
    return [];
  }
}

// 获取分类统计信息
export async function getCategoryStatsFromFirestore(): Promise<Record<string, number>> {
  try {
    const postsRef = collection(db, 'posts');
    const querySnapshot = await getDocs(postsRef);
    
    const stats: Record<string, number> = {};
    let totalCount = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const category = data.category || '其他';
      stats[category] = (stats[category] || 0) + 1;
      totalCount++;
    });
    
    stats['全部'] = totalCount;
    
    return stats;
  } catch (error) {
    console.error("获取分类统计失败:", error);
    return {};
  }
}

// 根据ID获取单个帖子
export async function getPostByIdFromFirestore(id: string): Promise<FirestorePost | null> {
  try {
    const docRef = doc(db, 'posts', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Omit<FirestorePost, 'id'>;
      return {
        id: docSnap.id,
        ...data
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('获取帖子详情失败:', error);
    return null;
  }
}

// 添加新帖子
export async function addPostToFirestore(postData: {
  title: string;
  content: string;
  category: string;
  tags: string[];
  image?: string;
  images?: string[]; // 新增：多图片支持
  location?: Location; // 新增：位置信息
  campus?: string; // 新增：校区信息
  school?: string; // 新增：学院ID
  department?: string; // 新增：专业ID
  course?: string; // 新增：课程ID
  embedHtml?: string; // 新增：Google Maps嵌入HTML代码
  author: {
    name: string;
    avatar: string;
    university?: string;
    year?: string;
    uid?: string;
  };
}): Promise<string | null> {
  try {
    // 构建基础帖子对象，不包含可能为 undefined 的字段
    const newPost: any = {
      title: postData.title,
      content: postData.content.length > 100 ? postData.content.substring(0, 100) + "..." : postData.content,
      fullContent: postData.content,
      image: postData.image || (postData.images && postData.images.length > 0 ? postData.images[0] : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop"),
      images: postData.images || (postData.image ? [postData.image] : []), // 如果有多图片使用多图片，否则将单图片转为数组
      author: postData.author,
      likes: 0,
      comments: 0,
      tags: postData.tags,
      createdAt: serverTimestamp(),
      category: postData.category
    };
    
    // 只有当这些字段有值且不为 undefined 时才添加到对象中
    if (postData.location && postData.location !== undefined) {
      newPost.location = postData.location;
    }
    if (postData.school && postData.school !== undefined && postData.school !== '' && postData.school.trim() !== '') {
      newPost.school = postData.school;
    }
    if (postData.department && postData.department !== undefined && postData.department !== '' && postData.department.trim() !== '') {
      newPost.department = postData.department;
    }
    if (postData.course && postData.course !== undefined && postData.course !== '' && postData.course.trim() !== '') {
      newPost.course = postData.course;
    }
    if (postData.campus && postData.campus !== undefined && postData.campus !== '' && postData.campus.trim() !== '') {
      newPost.campus = postData.campus;
    }
    // 添加embedHtml字段的处理
    if (postData.embedHtml && postData.embedHtml !== undefined && postData.embedHtml.trim() !== '') {
      newPost.embedHtml = postData.embedHtml.trim();
      console.log('✅ embedHtml 已添加到帖子数据');
    }
    
    console.log('📝 准备添加的帖子数据:', JSON.stringify(newPost, null, 2));
    
    const docRef = await addDoc(postsCollection, newPost);
    console.log('帖子已添加到Firestore，ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('添加帖子到Firestore失败:', error);
    return null;
  }
}

// 删除帖子
export async function deletePostFromFirestore(postId: string, currentUserUid: string): Promise<boolean> {
  try {
    // 首先获取帖子信息验证权限
    const post = await getPostByIdFromFirestore(postId);
    
    if (!post) {
      console.error('帖子不存在');
      return false;
    }
    
    // 获取当前用户信息以检查管理员权限
    const userDoc = await getDoc(doc(db, 'users', currentUserUid));
    const userData = userDoc.exists() ? userDoc.data() : null;
    const isAdminUser = userData && userData.email && isAdmin(userData.email);
    
    // 验证是否是帖子作者或管理员
    if (post.author.uid !== currentUserUid && !isAdminUser) {
      console.error('无权限删除此帖子');
      return false;
    }
    
    console.log(isAdminUser ? '管理员删除帖子' : '作者删除帖子', postId);
    
    // 删除帖子关联的图片（如果存在）
    if (post.image && post.image.includes('firebase')) {
      try {
        await deleteImageFromStorage(post.image);
        console.log('帖子图片已删除');
      } catch (imageError) {
        console.warn('删除图片失败，但继续删除帖子:', imageError);
      }
    }
    
    // 删除帖子
    await deleteDoc(doc(db, 'posts', postId));
    
    // 删除相关评论
    const commentsQuery = query(commentsCollection);
    const commentsSnapshot = await getDocs(commentsQuery);
    
    const deletePromises: Promise<void>[] = [];
    commentsSnapshot.forEach((commentDoc) => {
      const commentData = commentDoc.data() as FirestoreComment;
      if (commentData.postId === postId) {
        deletePromises.push(deleteDoc(doc(db, 'comments', commentDoc.id)));
      }
    });
    
    await Promise.all(deletePromises);
    
    console.log('帖子和相关评论已从Firestore删除');
    return true;
  } catch (error) {
    console.error('从Firestore删除帖子失败:', error);
    return false;
  }
}

// 获取帖子的评论
export async function getCommentsByPostIdFromFirestore(postId: string): Promise<FirestoreComment[]> {
  try {
    const q = query(commentsCollection, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const comments: FirestoreComment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<FirestoreComment, 'id'>;
      if (data.postId === postId) {
        comments.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    return comments;
  } catch (error) {
    console.error('获取评论失败:', error);
    return [];
  }
}

// 添加评论
export async function addCommentToFirestore(commentData: {
  postId: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    uid?: string;
  };
}): Promise<string | null> {
  try {
    const newComment: Omit<FirestoreComment, 'id'> = {
      postId: commentData.postId,
      content: commentData.content,
      author: commentData.author,
      createdAt: serverTimestamp(),
      likes: 0
    };
    
    const docRef = await addDoc(commentsCollection, newComment);
    
    // 更新帖子的评论数量
    const postRef = doc(db, 'posts', commentData.postId);
    await updateDoc(postRef, {
      comments: increment(1)
    });
    
    console.log('评论已添加到Firestore，ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('添加评论到Firestore失败:', error);
    return null;
  }
}

// 点赞帖子
export async function likePostInFirestore(postId: string): Promise<boolean> {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: increment(1)
    });
    return true;
  } catch (error) {
    console.error('点赞失败:', error);
    return false;
  }
}

// 取消点赞帖子
export async function unlikePostInFirestore(postId: string): Promise<boolean> {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      likes: increment(-1)
    });
    return true;
  } catch (error) {
    console.error('取消点赞失败:', error);
    return false;
  }
}

// 点赞相关功能
export async function toggleLike(postId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      throw new Error('帖子不存在');
    }
    
    const postData = postDoc.data();
    const likedBy = postData.likedBy || [];
    const isLiked = likedBy.includes(userId);
    
    if (isLiked) {
      // 取消点赞
      await updateDoc(postRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId)
      });
      
      return {
        liked: false,
        likesCount: (postData.likes || 0) - 1
      };
    } else {
      // 添加点赞
      await updateDoc(postRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
      
      return {
        liked: true,
        likesCount: (postData.likes || 0) + 1
      };
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    throw error;
  }
}

// 获取用户对特定帖子的点赞状态
export async function getUserLikeStatus(postId: string, userId: string): Promise<boolean> {
  try {
    const postRef = doc(db, 'posts', postId);
    const postDoc = await getDoc(postRef);
    
    if (!postDoc.exists()) {
      return false;
    }
    
    const postData = postDoc.data();
    const likedBy = postData.likedBy || [];
    return likedBy.includes(userId);
  } catch (error) {
    console.error('获取点赞状态失败:', error);
    return false;
  }
}

// 批量获取用户对多个帖子的点赞状态
export async function getUserLikeStatuses(postIds: string[], userId: string): Promise<Record<string, boolean>> {
  try {
    const statuses: Record<string, boolean> = {};
    
    // 并行获取所有帖子的点赞状态
    const promises = postIds.map(async (postId) => {
      const status = await getUserLikeStatus(postId, userId);
      return { postId, status };
    });
    
    const results = await Promise.all(promises);
    
    results.forEach(({ postId, status }) => {
      statuses[postId] = status;
    });
    
    return statuses;
  } catch (error) {
    console.error('批量获取点赞状态失败:', error);
    return {};
  }
}

// 格式化时间戳为字符串
export function formatTimestamp(timestamp: Timestamp | Date | FieldValue): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toLocaleDateString('zh-CN');
  } else if (timestamp instanceof Date) {
    return timestamp.toLocaleDateString('zh-CN');
  } else {
    // 如果是FieldValue（如serverTimestamp），返回当前时间
    return new Date().toLocaleDateString('zh-CN');
  }
}

// 删除评论
export async function deleteCommentFromFirestore(commentId: string, currentUserUid: string): Promise<boolean> {
  try {
    // 首先获取评论信息验证权限
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      console.error('评论不存在');
      return false;
    }
    
    const commentData = commentDoc.data() as FirestoreComment;
    
    // 获取当前用户信息以检查管理员权限
    const userDoc = await getDoc(doc(db, 'users', currentUserUid));
    const userData = userDoc.exists() ? userDoc.data() : null;
    const isAdminUser = userData && userData.email && isAdmin(userData.email);
    
    // 验证是否是评论作者或管理员
    if (commentData.author.uid !== currentUserUid && !isAdminUser) {
      console.error('无权限删除此评论');
      return false;
    }
    
    console.log(isAdminUser ? '管理员删除评论' : '作者删除评论', commentId);
    
    // 删除评论
    await deleteDoc(commentRef);
    
    // 更新帖子的评论数量（减1）
    const postRef = doc(db, 'posts', commentData.postId);
    await updateDoc(postRef, {
      comments: increment(-1)
    });
    
    // 如果有回复，也要删除所有回复
    const repliesQuery = query(commentsCollection, where('parentId', '==', commentId));
    const repliesSnapshot = await getDocs(repliesQuery);
    
    const deleteRepliesPromises: Promise<void>[] = [];
    repliesSnapshot.forEach((replyDoc) => {
      deleteRepliesPromises.push(deleteDoc(doc(db, 'comments', replyDoc.id)));
    });
    
    await Promise.all(deleteRepliesPromises);
    
    // 更新帖子评论数（减去回复数）
    if (repliesSnapshot.size > 0) {
      await updateDoc(postRef, {
        comments: increment(-repliesSnapshot.size)
      });
    }
    
    console.log('评论及其回复已删除');
    return true;
  } catch (error) {
    console.error('删除评论失败:', error);
    return false;
  }
}

// 点赞评论
export async function toggleCommentLike(commentId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
  try {
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      throw new Error('评论不存在');
    }
    
    const commentData = commentDoc.data();
    const likedBy = commentData.likedBy || [];
    const isLiked = likedBy.includes(userId);
    
    if (isLiked) {
      // 取消点赞
      await updateDoc(commentRef, {
        likes: increment(-1),
        likedBy: arrayRemove(userId)
      });
      
      return {
        liked: false,
        likesCount: (commentData.likes || 0) - 1
      };
    } else {
      // 添加点赞
      await updateDoc(commentRef, {
        likes: increment(1),
        likedBy: arrayUnion(userId)
      });
      
      return {
        liked: true,
        likesCount: (commentData.likes || 0) + 1
      };
    }
  } catch (error) {
    console.error('评论点赞操作失败:', error);
    throw error;
  }
}

// 获取用户对评论的点赞状态
export async function getUserCommentLikeStatus(commentId: string, userId: string): Promise<boolean> {
  try {
    const commentRef = doc(db, 'comments', commentId);
    const commentDoc = await getDoc(commentRef);
    
    if (!commentDoc.exists()) {
      return false;
    }
    
    const commentData = commentDoc.data();
    const likedBy = commentData.likedBy || [];
    return likedBy.includes(userId);
  } catch (error) {
    console.error('获取评论点赞状态失败:', error);
    return false;
  }
}

// 添加回复评论
export async function addReplyToCommentFirestore(replyData: {
  postId: string;
  parentId: string;
  content: string;
  author: {
    name: string;
    avatar: string;
    uid?: string;
  };
}): Promise<string | null> {
  try {
    const newReply: Omit<FirestoreComment, 'id'> = {
      postId: replyData.postId,
      parentId: replyData.parentId,
      content: replyData.content,
      author: replyData.author,
      createdAt: serverTimestamp(),
      likes: 0,
      likedBy: []
    };
    
    const docRef = await addDoc(commentsCollection, newReply);
    
    // 更新帖子的评论数量
    const postRef = doc(db, 'posts', replyData.postId);
    await updateDoc(postRef, {
      comments: increment(1)
    });
    
    console.log('回复已添加到Firestore，ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('添加回复到Firestore失败:', error);
    return null;
  }
}

// 获取帖子的评论（包括回复，组织成树形结构）
export async function getCommentsWithRepliesFromFirestore(postId: string): Promise<FirestoreComment[]> {
  try {
    const q = query(commentsCollection, orderBy('createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const allComments: FirestoreComment[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<FirestoreComment, 'id'>;
      if (data.postId === postId) {
        allComments.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // 组织成树形结构：将回复放到父评论的replies数组中
    const commentsMap = new Map<string, FirestoreComment>();
    const rootComments: FirestoreComment[] = [];
    
    // 先处理所有评论
    allComments.forEach(comment => {
      comment.replies = [];
      commentsMap.set(comment.id!, comment);
      
      if (!comment.parentId) {
        // 这是顶级评论
        rootComments.push(comment);
      }
    });
    
    // 然后处理回复关系
    allComments.forEach(comment => {
      if (comment.parentId) {
        const parent = commentsMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(comment);
        }
      }
    });
    
    return rootComments;
  } catch (error) {
    console.error('获取评论失败:', error);
    return [];
  }
} 

// 根据用户ID获取用户发布的帖子
export async function getUserPostsFromFirestore(userId: string): Promise<FirestorePost[]> {
  try {
    console.log(`🔍 正在获取用户 ${userId} 的帖子...`);
    
    // 方法1：暂时跳过索引查询，直接使用备用方案
    // 索引正在构建中，为了立即显示结果，我们使用手动过滤方案
    console.log('🔄 使用备用方案：获取所有帖子然后手动过滤（索引构建中）...');
    const postsRef = collection(db, 'posts');
    const querySnapshot = await getDocs(postsRef);
    
    console.log(`📊 总共获取到 ${querySnapshot.size} 个帖子，开始手动过滤...`);
    
    const filteredPosts: FirestorePost[] = [];
    let matchedCount = 0;
    let noUidCount = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      
      // 调试每个帖子的作者信息
      if (!data.author?.uid) {
        noUidCount++;
        if (noUidCount <= 5) { // 只打印前5个没有uid的帖子，避免日志过多
          console.log(`❌ 帖子 "${data.title}" 缺少 author.uid 字段:`, {
            title: data.title,
            authorName: data.author?.name,
            authorUid: data.author?.uid,
            hasAuthor: !!data.author
          });
        }
      } else if (data.author.uid === userId) {
        matchedCount++;
        console.log(`✅ 找到匹配帖子 "${data.title}"`);
        
        filteredPosts.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          fullContent: data.fullContent || data.content,
          category: data.category,
          tags: data.tags || [],
          image: data.image || "",
          images: data.images || [],
          author: data.author,
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          comments: data.comments || 0,
          createdAt: data.createdAt,
          location: data.location,
          school: data.school,
          department: data.department,
          course: data.course,
          embedHtml: data.embedHtml, // Google Maps嵌入HTML代码
          campus: data.campus, // 新增：校区
        });
      }
    });
    
    console.log(`📈 过滤结果:`);
    console.log(`   - 总帖子数: ${querySnapshot.size}`);
    console.log(`   - 缺少 author.uid 的帖子: ${noUidCount}`);
    console.log(`   - 匹配的帖子: ${matchedCount}`);
    
    // 手动按时间排序
    filteredPosts.sort((a, b) => {
      const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                   a.createdAt && typeof a.createdAt === 'object' && 'toDate' in a.createdAt ? 
                   (a.createdAt as any).toDate().getTime() : 0;
      const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                   b.createdAt && typeof b.createdAt === 'object' && 'toDate' in b.createdAt ? 
                   (b.createdAt as any).toDate().getTime() : 0;
      return timeB - timeA; // 降序排列
    });
    
    return filteredPosts;

    // 原始索引查询代码（在索引构建完成后可以恢复）
    /*
    // 方法1：尝试使用where查询（需要复合索引）
    try {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, where('author.uid', '==', userId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      console.log(`📊 where查询结果: ${querySnapshot.size} 个帖子`);
      
      const posts: FirestorePost[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`📝 找到用户帖子: ${data.title}, 作者UID: ${data.author?.uid}`);
        posts.push({
          id: doc.id,
          title: data.title,
          content: data.content,
          fullContent: data.fullContent || data.content,
          category: data.category,
          tags: data.tags || [],
          image: data.image || "",
          images: data.images || [],
          author: data.author,
          likes: data.likes || 0,
          likedBy: data.likedBy || [],
          comments: data.comments || 0,
          createdAt: data.createdAt,
          location: data.location,
          school: data.school,
          department: data.department,
          course: data.course
        });
      });
      
      return posts;
    } catch (indexError) {
      console.warn('⚠️ where查询失败，可能需要索引，尝试备用方案:', indexError);
      // ... 备用方案代码
    }
    */
  } catch (error) {
    console.error(`❌ 获取用户${userId}的帖子失败:`, error);
    return [];
  }
} 

// 新增：测试Firebase连接
export const testFirebaseConnection = async () => {
  try {
    console.log('=== Firebase连接测试开始 ===');
    
    // 测试数据库连接
    const testQuery = query(
      collection(db, 'posts'),
      limit(1)
    );
    
    const snapshot = await getDocs(testQuery);
    console.log('Firebase连接成功');
    console.log('查询结果:', snapshot.size, '个文档');
    console.log('Firebase项目ID:', db.app.options.projectId);
    
    return {
      success: true,
      docsCount: snapshot.size,
      projectId: db.app.options.projectId
    };
  } catch (error) {
    console.error('Firebase连接测试失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 