"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

import { Users, Send, Reply, CheckCircle, UserPlus, UserMinus } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err);
        setLoading(false);
      });
  }, [user?.id]);

  const firstName = user?.name ? user.name.split(' ')[0] : 'there';

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading Dashboard...</div>;

  const stats = [
    { label: 'Total Leads', value: data?.stats?.totalLeads || 0, icon: Users },
    { label: 'Emails Sent', value: data?.stats?.emailsSent || 0, icon: Send },
    { label: 'Replies', value: data?.stats?.replies || 0, icon: Reply },
    { label: 'Interested', value: data?.stats?.interested || 0, icon: CheckCircle },
    { label: 'Registered', value: data?.stats?.registered || 0, icon: UserPlus },
    { label: 'Unsubscribed', value: data?.stats?.unsubscribed || 0, icon: UserMinus },
  ];

  return (
    <div className="flex-1 p-8 w-full max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-secondary">Good morning, {firstName}</h1>
        <p className="text-muted-foreground mt-1">Your outreach overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border border-border bg-card p-4 shadow-sm flex flex-col justify-between h-28">
            <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
              <stat.icon className="w-4 h-4" />
              {stat.label}
            </div>
            <div className="font-heading text-2xl font-bold text-foreground">
              {stat.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="rounded-lg border border-border bg-card shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-lg font-bold text-secondary">Today's Activity</h2>
            {data?.recentActivity?.length > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {data.recentActivity.length} event{data.recentActivity.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="space-y-3">
            {data?.recentActivity?.length === 0 ? (
              <div className="text-sm text-muted-foreground">No recent activity today.</div>
            ) : (
              data.recentActivity.map((act: any, i: number) => {
                const getBadgeStyle = (action: string) => {
                  switch (action) {
                    case 'Email Opened':
                      return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'Link Clicked':
                      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
                    case 'Reply Received':
                      return 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold';
                    case 'Email Sent':
                      return 'bg-purple-50 text-purple-700 border-purple-200';
                    case 'Lead Enrolled':
                      return 'bg-amber-50 text-amber-700 border-amber-200';
                    case 'Email Bounced':
                      return 'bg-rose-50 text-rose-700 border-rose-200';
                    default:
                      return 'bg-muted text-muted-foreground border-border';
                  }
                };

                return (
                  <div key={i} className="text-sm border-b border-border pb-2.5 last:border-0 last:pb-0 flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getBadgeStyle(act.action)}`}>
                        {act.action}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground break-words leading-relaxed">{act.description}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card shadow-sm p-6">
          <h2 className="font-heading text-lg font-bold text-secondary mb-4">Upcoming Sends</h2>
          <div className="space-y-4">
            {data?.upcomingSends?.length === 0 ? (
              <div className="text-sm text-muted-foreground">No upcoming scheduled emails.</div>
            ) : (
              data.upcomingSends.map((s: any, i: number) => (
                <div key={i} className="text-sm border-b border-border pb-2 last:border-0 last:pb-0 flex flex-col">
                  <span className="font-medium text-secondary">{s.contact.email}</span>
                  <span className="text-muted-foreground">{s.campaign.name} (Step {s.currentStep})</span>
                  <span className="text-xs text-blue-600 mt-1 font-medium">Due at: {new Date(s.nextSendAt).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      
      <div className="rounded-lg border border-border bg-card shadow-sm p-6 mb-8">
        <h2 className="font-heading text-lg font-bold text-secondary mb-4">Campaign Performance</h2>
        <div className="w-full overflow-auto">
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border text-muted-foreground">
              <tr>
                <th className="pb-3 font-medium">Campaign</th>
                <th className="pb-3 font-medium text-right">Leads</th>
                <th className="pb-3 font-medium text-right">Sent</th>
                <th className="pb-3 font-medium text-right">Replies</th>
                <th className="pb-3 font-medium text-right">Interested</th>
                <th className="pb-3 font-medium text-right">Registered</th>
              </tr>
            </thead>
            <tbody>
              {data?.campaigns?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pt-4 text-center text-muted-foreground">No active campaigns.</td>
                </tr>
              ) : (
                data.campaigns.map((c: any, i: number) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="py-3 font-medium">{c.name}</td>
                    <td className="py-3 text-right">{c.leads}</td>
                    <td className="py-3 text-right">{c.sent}</td>
                    <td className="py-3 text-right text-blue-600 font-medium">{c.replies}</td>
                    <td className="py-3 text-right text-green-600 font-medium">{c.interested}</td>
                    <td className="py-3 text-right text-purple-600 font-medium">{c.registered}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
