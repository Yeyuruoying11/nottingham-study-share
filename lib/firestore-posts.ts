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
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { deleteImageFromStorage } from './firebase-storage';

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
    const q = query(postsCollection, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const posts: FirestorePost[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Omit<FirestorePost, 'id'>;
      posts.push({
        id: doc.id,
        ...data
      });
    });
    
    return posts;
  } catch (error) {
    console.error('获取帖子失败:', error);
    return [];
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
    
    // 验证是否是帖子作者
    if (post.author.uid !== currentUserUid) {
      console.error('无权限删除此帖子');
      return false;
    }
    
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