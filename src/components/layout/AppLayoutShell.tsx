"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname?.startsWith('/login');

  useEffect(() => {
    if (loading) return;

    if (!user && !isLoginPage) {
      router.replace('/login');
    } else if (user && isLoginPage) {
      router.replace('/');
    }
  }, [user, loading, isLoginPage, router]);

  // While restoring session from localStorage, do not render or flash anything
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Prevent flashing protected content while redirecting to login
  if (!user && !isLoginPage) {
    return null;
  }

  // Prevent flashing login page while redirecting to home
  if (user && isLoginPage) {
    return null;
  }

  return (
    <>
      {isLoginPage ? (
        <main className="min-h-screen w-full bg-background overflow-y-auto">
          {children}
        </main>
      ) : (
        <div className="flex h-screen overflow-hidden">
          <AppSidebar />
          <main className={`flex-1 min-w-0 bg-background ${pathname?.startsWith('/unibox') ? 'h-full overflow-hidden' : 'overflow-y-auto'}`}>
            {children}
          </main>
        </div>
      )}
    </>
  );
}

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuard>
        {children}
      </AuthGuard>
    </AuthProvider>
  );
}
