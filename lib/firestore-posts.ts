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
  where
} from 'firebase/firestore';
import { db } from './firebase';
import { deleteImageFromStorage } from './firebase-storage';
import { isAdmin } from './admin-config';

export interface FirestorePost {
  id?: string;
  title: string;
  content: string;
  fullContent: string;
  image: string;
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
        author: data.author,
        likes: data.likes || 0, // 确保包含点赞数
        likedBy: data.likedBy || [], // 点赞用户列表
        comments: data.comments || 0,
        createdAt: data.createdAt
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
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef, 
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
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
        author: data.author,
        likes: data.likes || 0,
        likedBy: data.likedBy || [],
        comments: data.comments || 0,
        createdAt: data.createdAt
      });
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
  author: {
    name: string;
    avatar: string;
    university?: string;
    year?: string;
    uid?: string;
  };
}): Promise<string | null> {
  try {
    const newPost: Omit<FirestorePost, 'id'> = {
      title: postData.title,
      content: postData.content.length > 100 ? postData.content.substring(0, 100) + "..." : postData.content,
      fullContent: postData.content,
      image: postData.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
      author: postData.author,
      likes: 0,
      comments: 0,
      tags: postData.tags,
      createdAt: serverTimestamp(),
      category: postData.category
    };
    
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