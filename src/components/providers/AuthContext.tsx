'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status?: string;
  username?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  bio?: string | null;
  membershipTier: string;
  membershipExpiry?: Date | string | null;
  gender?: string | null;
  dateOfBirth?: Date | string | null;
  country?: string | null;
  division?: string | null;
  city?: string | null;
  area?: string | null;
  postalCode?: string | null;
  fullAddress?: string | null;
  isVerified?: boolean;
  isPhoneVerified?: boolean;
  isStaff?: boolean;
  isPublisher?: boolean;
  isAdvertiser?: boolean;
  isVendor?: boolean;
  workspaces?: any[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
    portal?: string,
    redirectUrl?: string
  ) => Promise<{
    success: boolean;
    user?: AuthUser;
    redirectTo?: string;
    workspaces?: any[];
    error?: string;
  }>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  syncUser: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (
    email: string,
    password: string,
    portal?: string,
    redirectUrl?: string
  ) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, portal, redirect: redirectUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'লগইন ব্যর্থ হয়েছে।' };
      }
      setUser(data.user);
      router.refresh();
      return {
        success: true,
        user: data.user,
        redirectTo: data.redirectTo,
        workspaces: data.workspaces,
      };
    } catch (e) {
      return { success: false, error: 'সার্ভার যোগাযোগে সমস্যা হয়েছে।' };
    }
  };

  const register = async (name: string, email: string, password: string, phone?: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'নিবন্ধন ব্যর্থ হয়েছে।' };
      }
      setUser(data.user);
      router.refresh();
      return { success: true, user: data.user };
    } catch (e) {
      return { success: false, error: 'সার্ভার ত্রুটি।' };
    }
  };

  const syncUser = (updates: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setUser(null);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.clear();
          localStorage.removeItem('shubban_wishlist');
          localStorage.removeItem('shubban_cart_v2');
        }
      } catch (err) {
        // ignore storage errors
      }
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      } else {
        router.push('/login');
        router.refresh();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        refreshUser: fetchCurrentUser,
        syncUser,
      }}
    >
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
