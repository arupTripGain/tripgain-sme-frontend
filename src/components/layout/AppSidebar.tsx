"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import logoImg from '@/app/Tripgain Kinetic.png';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  Send,
  Inbox, 
  Mail, 
  BarChart, 
  Settings, 
  LogOut, 
  ChevronUp, 
  UserCheck, 
  Shield, 
  PanelLeftClose, 
  PanelLeftOpen 
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { TeamManagementModal } from '@/components/team/TeamManagementModal';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, switchUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [teamUsers, setTeamUsers] = useState<Array<{ id: string; name: string; email: string; role: string }>>([
    { id: '1', name: 'Arup Nirala', email: 'admin@tripgain.com', role: 'ADMIN' },
    { id: '2', name: 'Sarah Jenkins', email: 'sarah.jenkins@tripgain.com', role: 'MEMBER' },
    { id: '3', name: 'Vikram Malhotra', email: 'vikram.malhotra@tripgain.com', role: 'MANAGER' },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved !== null) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    apiFetch('/api/auth/users')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTeamUsers(data);
        }
      })
      .catch(() => {});
  }, [isTeamModalOpen, showUserMenu]);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
    { label: 'Leads', icon: Users, href: '/leads' },
    { label: 'Campaigns', icon: Megaphone, href: '/campaigns' },
    { label: 'Bulk Email', icon: Send, href: '/bulk-email' },
    { label: 'Unibox', icon: Inbox, href: '/unibox' },
    { label: 'Mailboxes', icon: Mail, href: '/mailboxes' },
    { label: 'Analytics', icon: BarChart, href: '/analytics' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  const displayName = user?.name || user?.email?.split('@')[0] || 'User';
  const displayEmail = user?.email || '';
  const displayRole = user?.role || 'MEMBER';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  const handleQuickSwitch = async (email: string) => {
    setShowUserMenu(false);
    await switchUser(email, 'password123');
  };

  return (
    <div className={cn(
      "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground select-none transition-all duration-200 ease-in-out shrink-0 relative z-30",
      isCollapsed ? "w-16" : "w-60"
    )}>
      {/* Brand Header */}
      <div className={cn(
        "flex h-20 items-center border-b border-sidebar-border transition-all",
        isCollapsed ? "justify-center px-2" : "justify-between px-4"
      )}>
        {!isCollapsed ? (
          <>
            <Link href="/" className="flex items-center min-w-0">
              <Image 
                src={logoImg} 
                alt="TripGain Kinetic" 
                className="h-9 w-auto object-contain max-w-[160px]" 
                priority 
              />
            </Link>
            <button
              onClick={toggleCollapse}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent rounded-lg transition-colors shrink-0"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={toggleCollapse}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-sidebar-accent rounded-xl transition-all flex items-center justify-center group"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-5 w-5 transition-transform group-hover:scale-110" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className={cn("flex-1 space-y-1.5 py-4", isCollapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href)) || (item.label === 'Mailboxes' && pathname?.includes('mailboxes'));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-xl text-sm font-medium transition-all group relative",
                isCollapsed ? "justify-center h-10 w-10 mx-auto" : "gap-3 px-3 py-2.5",
                isActive 
                  ? "bg-sidebar-accent text-sidebar-primary font-semibold shadow-xs" 
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn(
                "h-5 w-5 shrink-0 transition-transform group-hover:scale-105", 
                isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
              )} />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isActive && isCollapsed && (
                <span className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Interactive User Profile & Multi-User Switcher */}
      <div className={cn("border-t border-sidebar-border relative", isCollapsed ? "p-2" : "p-3")}>
        {showUserMenu && (
          <div 
            className={cn(
              "bg-card border border-border rounded-xl shadow-xl p-3 z-50 text-xs space-y-3 animate-in fade-in duration-150",
              isCollapsed 
                ? "absolute bottom-2 left-full ml-3 w-64 slide-in-from-left-2" 
                : "absolute bottom-full left-3 right-3 mb-2 slide-in-from-bottom-2"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Active User Info */}
            <div className="border-b border-border pb-2.5">
              <div className="font-semibold text-secondary text-sm">{displayName}</div>
              <div className="text-muted-foreground truncate">{displayEmail}</div>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                  ${displayRole === 'ADMIN' ? 'bg-purple-100 text-purple-700' : ''}
                  ${displayRole === 'MANAGER' ? 'bg-blue-100 text-blue-700' : ''}
                  ${displayRole === 'MEMBER' ? 'bg-green-100 text-green-700' : ''}
                `}>
                  {displayRole}
                </span>
                <span className="text-[10px] text-muted-foreground">TripGain Workspace</span>
              </div>
            </div>

            {/* Quick Switch Accounts */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center justify-between">
                <span>Switch Account</span>
                <UserCheck className="h-3 w-3" />
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {teamUsers
                  .filter((u) => u.email !== displayEmail)
                  .map((u) => (
                    <button
                      key={u.email}
                      onClick={() => handleQuickSwitch(u.email)}
                      className="w-full text-left p-1.5 rounded-lg hover:bg-muted/70 transition-colors flex items-center justify-between group"
                    >
                      <div className="truncate pr-2">
                        <div className="font-medium text-secondary truncate">{u.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase
                        ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700' : ''}
                        ${u.role === 'MANAGER' ? 'bg-blue-50 text-blue-700' : ''}
                        ${u.role === 'MEMBER' ? 'bg-green-50 text-green-700' : ''}
                      `}>
                        {u.role}
                      </span>
                    </button>
                  ))}
              </div>
            </div>

            {/* Role-based Settings Options */}
            <div className="border-t border-border pt-2 space-y-1">
              {displayRole === 'ADMIN' && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsTeamModalOpen(true);
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-purple-50 text-purple-700 transition-colors flex items-center justify-between font-medium group"
                >
                  <div className="flex items-center gap-2">
                    <Shield className="h-3.5 w-3.5 text-purple-600" />
                    <span>Manage Workspace</span>
                  </div>
                  <span className="text-[10px] bg-purple-100 px-1.5 py-0.5 rounded font-bold uppercase">
                    Admin
                  </span>
                </button>
              )}

              {/* Sign Out */}
              <button
                onClick={() => {
                  setShowUserMenu(false);
                  logout();
                }}
                className="w-full text-left p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2 font-medium"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        )}

        {/* User Card Trigger */}
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          title={isCollapsed ? `${displayName} (${displayRole})` : undefined}
          className={cn(
            "w-full flex items-center rounded-xl hover:bg-sidebar-accent transition-all text-left group",
            isCollapsed ? "justify-center p-1.5" : "justify-between p-2"
          )}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-inner
              ${displayRole === 'ADMIN' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-300' : ''}
              ${displayRole === 'MANAGER' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300' : ''}
              ${displayRole === 'MEMBER' ? 'bg-green-100 text-green-700 ring-2 ring-green-300' : ''}
            `}>
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-semibold text-secondary truncate group-hover:text-primary transition-colors">
                  {displayName}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                  {displayRole}
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <ChevronUp className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
          )}
        </button>
      </div>

      {/* Team Management Modal */}
      <TeamManagementModal 
        isOpen={isTeamModalOpen} 
        onClose={() => setIsTeamModalOpen(false)} 
      />
    </div>
  );
}
