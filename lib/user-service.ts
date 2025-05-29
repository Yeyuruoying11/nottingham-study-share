import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  university: string;
  year: string;
  bio: string;
  createdAt?: any;
  updatedAt?: any;
}

// 获取用户资料
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    
    if (userDoc.exists()) {
      const data = userDoc.data();
      return {
        uid: userDoc.id,
        displayName: data.displayName || '',
        email: data.email || '',
        photoURL: data.photoURL || '',
        university: data.university || '诺丁汉大学',
        year: data.year || '学生',
        bio: data.bio || '',
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return null;
  }
}

// 创建或更新用户资料
export async function createOrUpdateUserProfile(profile: Partial<UserProfile> & { uid: string }): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', profile.uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      // 更新现有资料
      await updateDoc(userRef, {
        ...profile,
        updatedAt: serverTimestamp()
      });
    } else {
      // 创建新资料
      await setDoc(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    console.log('用户资料保存成功');
    return true;
  } catch (error) {
    console.error('保存用户资料失败:', error);
    return false;
  }
}

// 更新用户头像
export async function updateUserAvatar(uid: string, photoURL: string): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      photoURL: photoURL,
      updatedAt: serverTimestamp()
    });
    
    console.log('头像更新成功');
    return true;
  } catch (error) {
    console.error('更新头像失败:', error);
    return false;
  }
}

// 更新用户基本信息
export async function updateUserBasicInfo(uid: string, updates: {
  displayName?: string;
  university?: string;
  year?: string;
  bio?: string;
}): Promise<boolean> {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    
    console.log('用户信息更新成功');
    return true;
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return false;
  }
}

// 检查用户是否存在
export async function checkUserExists(uid: string): Promise<boolean> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists();
  } catch (error) {
    console.error('检查用户存在性失败:', error);
    return false;
  }
} 