"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/context/AuthContext';
import { AppSidebar } from '@/components/layout/AppSidebar';

export function AppLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname?.startsWith('/login');

  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
