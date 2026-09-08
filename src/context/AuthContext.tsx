"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER' | string;
  avatarUrl?: string | null;
  workspaceId?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchUser: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check localStorage and cookies on mount
    const savedToken = localStorage.getItem('tg_auth_token');
    const savedUser = localStorage.getItem('tg_auth_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        document.cookie = `auth_session=${savedToken}; max-age=${7 * 86400}; path=/; SameSite=Lax`;
      } catch (e) {
        localStorage.removeItem('tg_auth_token');
        localStorage.removeItem('tg_auth_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('tg_auth_token', data.token);
      localStorage.setItem('tg_auth_user', JSON.stringify(data.user));
      document.cookie = `auth_session=${data.token}; max-age=${7 * 86400}; path=/; SameSite=Lax`;

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during login' };
    }
  };

  const switchUser = async (email: string, password = 'password123') => {
    return login(email, password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tg_auth_token');
    localStorage.removeItem('tg_auth_user');
    document.cookie = 'auth_session=; max-age=0; path=/; SameSite=Lax';
    router.push('/login');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await apiFetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('tg_auth_user', JSON.stringify(data.user));
      }
    } catch (e) {
      console.error('Failed to refresh user profile:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, switchUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
