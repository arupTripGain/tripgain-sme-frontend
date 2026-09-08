"use client";

import React, { useState, useEffect } from 'react';
import { X, UserPlus, Trash2, Shield, User, Briefcase, Check, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  avatarUrl?: string | null;
}

export function TeamManagementModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'MEMBER'>('MEMBER');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:3001/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:3001/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add user');
        setSubmitting(false);
        return;
      }

      setSuccess(`User "${data.user.name}" created successfully!`);
      setName('');
      setEmail('');
      setPassword('password123');
      setRole('MEMBER');
      setShowAddForm(false);
      fetchUsers();
    } catch (err: any) {
      setError(err?.message || 'Error adding member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to remove ${userName} from this workspace?`)) return;

    try {
      const res = await fetch(`http://localhost:3001/api/auth/users/${userId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to remove user');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-card border border-border rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-secondary font-heading flex items-center gap-2">
              <User className="h-5 w-5 text-primary" /> Team Members & Roles
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage accounts, roles, and collaboration permissions in this workspace
            </p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:text-secondary hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-xs flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Action button to add user */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-secondary">
            {users.length} Active {users.length === 1 ? 'User' : 'Users'}
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-sm"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {showAddForm ? 'Cancel' : 'Add Team Member'}
          </button>
        </div>

        {/* Add User Form */}
        {showAddForm && (
          <form onSubmit={handleAddMember} className="bg-muted/40 border border-border rounded-xl p-4 mb-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">Create New Account</h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@tripgain.com"
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-lg bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="MEMBER">Member (Outreach & Leads)</option>
                  <option value="MANAGER">Manager (Campaigns & Analytics)</option>
                  <option value="ADMIN">Admin (Full Control)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-muted text-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {submitting ? 'Saving...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}

        {/* User List */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-xs animate-pulse">
              Loading team members...
            </div>
          ) : users.map((u) => {
            const initials = u.name
              ? u.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : u.email.slice(0, 2).toUpperCase();

            const isCurrent = currentUser?.email === u.email;

            return (
              <div 
                key={u.id}
                className="flex items-center justify-between p-3 rounded-xl border border-border bg-card/60 hover:bg-muted/30 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-inner
                    ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-200' : ''}
                    ${u.role === 'MANAGER' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-200' : ''}
                    ${u.role === 'MEMBER' ? 'bg-green-100 text-green-700 ring-2 ring-green-200' : ''}
                  `}>
                    {initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-secondary">{u.name}</span>
                      {isCurrent && (
                        <span className="text-[10px] bg-primary/10 text-primary font-bold px-1.5 py-0.5 rounded">
                          You
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider
                    ${u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' : ''}
                    ${u.role === 'MANAGER' ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
                    ${u.role === 'MEMBER' ? 'bg-green-50 text-green-700 border border-green-200' : ''}
                  `}>
                    <Shield className="h-3 w-3" />
                    {u.role}
                  </span>

                  {!isCurrent && (
                    <button
                      onClick={() => handleDeleteUser(u.id, u.name)}
                      title="Remove member"
                      className="p-1.5 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border pt-4 mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <span>All users share the current workspace with role-based access.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground hover:bg-secondary/90 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
