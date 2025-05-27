import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User } from './types';

// 用户名修改限制常量
const MAX_USERNAME_CHANGES = 3;
const COOLDOWN_DAYS = 30;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000; // 30天的毫秒数

// 用户名验证规则
const USERNAME_RULES = {
  minLength: 2,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, // 允许字母、数字、下划线、中文
  forbiddenWords: ['admin', 'root', 'system', 'null', 'undefined']
};

export interface UsernameChangeResult {
  success: boolean;
  message: string;
  remainingChanges?: number;
  nextChangeDate?: Date;
}

export interface UsernameStatus {
  canChange: boolean;
  remainingChanges: number;
  nextChangeDate?: Date;
  reason?: string;
}

// 验证用户名格式
export function validateUsername(username: string): { valid: boolean; message: string } {
  if (!username || username.trim().length === 0) {
    return { valid: false, message: '用户名不能为空' };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < USERNAME_RULES.minLength) {
    return { valid: false, message: `用户名至少需要${USERNAME_RULES.minLength}个字符` };
  }

  if (trimmedUsername.length > USERNAME_RULES.maxLength) {
    return { valid: false, message: `用户名不能超过${USERNAME_RULES.maxLength}个字符` };
  }

  if (!USERNAME_RULES.pattern.test(trimmedUsername)) {
    return { valid: false, message: '用户名只能包含字母、数字、下划线和中文字符' };
  }

  if (USERNAME_RULES.forbiddenWords.some(word => 
    trimmedUsername.toLowerCase().includes(word.toLowerCase())
  )) {
    return { valid: false, message: '用户名包含禁用词汇' };
  }

  return { valid: true, message: '用户名格式正确' };
}

// 检查用户名修改状态
export async function checkUsernameChangeStatus(userId: string): Promise<UsernameStatus> {
  try {
    console.log('checkUsernameChangeStatus - 开始检查用户:', userId);
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    console.log('checkUsernameChangeStatus - 文档存在:', userDoc.exists());
    
    if (!userDoc.exists()) {
      console.error('checkUsernameChangeStatus - 用户文档不存在:', userId);
      throw new Error('用户不存在');
    }

    const userData = userDoc.data();
    console.log('checkUsernameChangeStatus - 用户数据:', userData);
    
    const changeCount = userData.usernameChangeCount || 0;
    const lastChange = userData.lastUsernameChange?.toDate();

    console.log('checkUsernameChangeStatus - 修改次数:', changeCount, '最后修改:', lastChange);

    // 如果还没有达到最大修改次数
    if (changeCount < MAX_USERNAME_CHANGES) {
      const result = {
        canChange: true,
        remainingChanges: MAX_USERNAME_CHANGES - changeCount
      };
      console.log('checkUsernameChangeStatus - 结果:', result);
      return result;
    }

    // 如果已达到最大次数，检查冷却期
    if (lastChange) {
      const timeSinceLastChange = Date.now() - lastChange.getTime();
      
      if (timeSinceLastChange >= COOLDOWN_MS) {
        // 冷却期已过，重置计数
        const result = {
          canChange: true,
          remainingChanges: MAX_USERNAME_CHANGES
        };
        console.log('checkUsernameChangeStatus - 冷却期已过，结果:', result);
        return result;
      } else {
        // 还在冷却期内
        const nextChangeDate = new Date(lastChange.getTime() + COOLDOWN_MS);
        const result = {
          canChange: false,
          remainingChanges: 0,
          nextChangeDate,
          reason: `已达到修改次数上限，请等待至 ${nextChangeDate.toLocaleDateString()} 后再试`
        };
        console.log('checkUsernameChangeStatus - 冷却期内，结果:', result);
        return result;
      }
    }

    // 如果没有最后修改时间记录，但计数已满（异常情况）
    const result = {
      canChange: false,
      remainingChanges: 0,
      reason: '已达到修改次数上限'
    };
    console.log('checkUsernameChangeStatus - 异常情况，结果:', result);
    return result;

  } catch (error) {
    console.error('检查用户名修改状态失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      userId: userId
    });
    throw error;
  }
}

// 修改用户名
export async function changeUsername(
  userId: string, 
  newUsername: string
): Promise<UsernameChangeResult> {
  try {
    // 1. 验证用户名格式
    const validation = validateUsername(newUsername);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message
      };
    }

    // 2. 检查修改权限
    const status = await checkUsernameChangeStatus(userId);
    if (!status.canChange) {
      return {
        success: false,
        message: status.reason || '无法修改用户名',
        remainingChanges: status.remainingChanges,
        nextChangeDate: status.nextChangeDate
      };
    }

    // 3. 获取当前用户数据
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return {
        success: false,
        message: '用户不存在'
      };
    }

    const userData = userDoc.data();
    const currentUsername = userData.displayName;
    const currentHistory = userData.usernameHistory || [];
    const currentCount = userData.usernameChangeCount || 0;

    // 4. 检查是否与当前用户名相同
    if (currentUsername === newUsername.trim()) {
      return {
        success: false,
        message: '新用户名与当前用户名相同'
      };
    }

    // 5. 检查是否与历史用户名重复
    if (currentHistory.includes(newUsername.trim())) {
      return {
        success: false,
        message: '不能使用之前用过的用户名'
      };
    }

    // 6. 更新用户数据
    const updateData: any = {
      displayName: newUsername.trim(),
      usernameChangeCount: currentCount + 1,
      lastUsernameChange: serverTimestamp(),
      usernameHistory: [...currentHistory, currentUsername],
      updatedAt: serverTimestamp()
    };

    // 如果是重置后的第一次修改，清空历史记录
    if (currentCount >= MAX_USERNAME_CHANGES) {
      updateData.usernameChangeCount = 1;
      updateData.usernameHistory = [currentUsername];
    }

    await updateDoc(doc(db, 'users', userId), updateData);

    const newRemainingChanges = MAX_USERNAME_CHANGES - updateData.usernameChangeCount;

    return {
      success: true,
      message: '用户名修改成功',
      remainingChanges: newRemainingChanges
    };

  } catch (error) {
    console.error('修改用户名失败:', error);
    return {
      success: false,
      message: '修改用户名时发生错误，请重试'
    };
  }
}

// 获取用户名修改历史
export async function getUsernameHistory(userId: string): Promise<{
  current: string;
  history: string[];
  changeCount: number;
  lastChange?: Date;
}> {
  try {
    console.log('getUsernameHistory - 开始获取用户历史:', userId);
    
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    console.log('getUsernameHistory - 文档存在:', userDoc.exists());
    
    if (!userDoc.exists()) {
      console.error('getUsernameHistory - 用户文档不存在:', userId);
      throw new Error('用户不存在');
    }

    const userData = userDoc.data();
    console.log('getUsernameHistory - 用户数据:', userData);
    
    const result = {
      current: userData.displayName || '',
      history: userData.usernameHistory || [],
      changeCount: userData.usernameChangeCount || 0,
      lastChange: userData.lastUsernameChange?.toDate()
    };
    
    console.log('getUsernameHistory - 结果:', result);
    return result;

  } catch (error) {
    console.error('获取用户名历史失败:', error);
    console.error('错误详情:', {
      message: error.message,
      code: error.code,
      userId: userId
    });
    throw error;
  }
}

// 格式化剩余时间
export function formatTimeUntilNextChange(nextChangeDate: Date): string {
  const now = new Date();
  const diff = nextChangeDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return '现在可以修改';
  }

  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  
  if (days === 1) {
    return '明天可以修改';
  } else {
    return `还需等待 ${days} 天`;
  }
} 