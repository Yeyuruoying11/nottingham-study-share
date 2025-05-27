"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService } from '@/lib/firebase-service';
import { User } from '@/lib/types';

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
      
      try {
      if (firebaseUser) {
        setUser(firebaseUser);
        // 这里可以获取用户详细信息
        // const profile = await getUserProfile(firebaseUser.uid);
        // setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      } catch (error) {
        console.error('Error handling auth state change:', error);
      } finally {
      setLoading(false);
        setInitialized(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      await authService.login(email, password);
      // 不需要手动设置loading，onAuthStateChange会处理
    } catch (error) {
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const result = await authService.register(email, password, displayName);
      if (!result.success) {
        throw new Error(result.error);
      }
      // 注册成功，Firebase会自动触发onAuthStateChange
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      // onAuthStateChange会处理状态清理
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading: loading || !initialized,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 