import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  DocumentSnapshot,
  serverTimestamp
} from "firebase/firestore";
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./firebase";
import { User, Post, Comment, PostCategory } from "./types";

// 用户认证服务
export const authService = {
  // 注册
  async register(email: string, password: string, displayName: string) {
    try {
      console.log("Starting registration process...", { email, displayName });
      
      // 验证输入
      if (!email || !password || !displayName) {
        throw new Error("所有字段都是必填的");
      }
      
      if (password.length < 6) {
        throw new Error("密码至少需要6个字符");
      }
      
      // 创建用户账户
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("User created successfully:", user.uid);
      
      // 在 Firestore 中创建用户档案 - 使用用户UID作为文档ID
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email,
        displayName,
        university: "诺丁汉大学",
        // 用户名修改记录初始化
        usernameChangeCount: 0,
        usernameHistory: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      
      console.log("User document created with UID:", user.uid);
      
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName,
          docId: user.uid
        },
        message: "注册成功！"
      };
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // 处理常见的Firebase Auth错误
      let errorMessage = "注册失败，请重试";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "该邮箱已被注册";
          break;
        case "auth/invalid-email":
          errorMessage = "邮箱格式不正确";
          break;
        case "auth/weak-password":
          errorMessage = "密码强度不够，至少需要6个字符";
          break;
        case "auth/configuration-not-found":
          errorMessage = "Firebase配置错误，请检查项目设置";
          break;
        default:
          errorMessage = error.message || "注册失败，请重试";
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  },

  // 登录
  async login(email: string, password: string) {
    return await signInWithEmailAndPassword(auth, email, password);
  },

  // 登出
  async logout() {
    return await signOut(auth);
  },

  // 监听认证状态
  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
};

// 文章服务
export const postService = {
  // 获取所有文章
  async getPosts(category?: PostCategory, lastDoc?: DocumentSnapshot, limitCount = 10) {
    let q = query(
      collection(db, "posts"),
      where("isPublished", "==", true),
      orderBy("createdAt", "desc"),
      limit(limitCount)
    );

    if (category) {
      q = query(
        collection(db, "posts"),
        where("category", "==", category),
        where("isPublished", "==", true),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Post));
  },

  // 获取单篇文章
  async getPost(id: string) {
    const docRef = doc(db, "posts", id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Post;
    }
    return null;
  },

  // 创建文章
  async createPost(postData: Omit<Post, "id" | "createdAt" | "updatedAt">) {
    const docRef = await addDoc(collection(db, "posts"), {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return docRef.id;
  },

  // 更新文章
  async updatePost(id: string, updates: Partial<Post>) {
    const docRef = doc(db, "posts", id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  },

  // 点赞文章
  async likePost(postId: string, userId: string) {
    const postRef = doc(db, "posts", postId);
    const postDoc = await getDoc(postRef);
    
    if (postDoc.exists()) {
      const post = postDoc.data() as Post;
      const likedBy = post.likedBy || [];
      
      if (likedBy.includes(userId)) {
        // 取消点赞
        await updateDoc(postRef, {
          likes: post.likes - 1,
          likedBy: likedBy.filter(id => id !== userId)
        });
      } else {
        // 点赞
        await updateDoc(postRef, {
          likes: post.likes + 1,
          likedBy: [...likedBy, userId]
        });
      }
    }
  }
};

// 评论服务
export const commentService = {
  // 获取文章评论
  async getComments(postId: string) {
    const q = query(
      collection(db, "comments"),
      where("postId", "==", postId),
      orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Comment));
  },

  // 添加评论
  async addComment(commentData: Omit<Comment, "id" | "createdAt" | "updatedAt">) {
    const docRef = await addDoc(collection(db, "comments"), {
      ...commentData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // 更新文章评论数
    const postRef = doc(db, "posts", commentData.postId);
    const postDoc = await getDoc(postRef);
    if (postDoc.exists()) {
      const post = postDoc.data() as Post;
      await updateDoc(postRef, {
        comments: post.comments + 1
      });
    }
    
    return docRef.id;
  }
};

// 图片上传服务
export const uploadService = {
  async uploadImage(file: File, path: string) {
    const imageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(imageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  }
}; 