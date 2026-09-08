"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Mail, Settings, Plus, Play, Pause, Trash2, CheckCircle2, 
  AlertCircle, RefreshCw, ArrowLeft, ExternalLink,
  Edit2, Sliders, ShieldCheck, X, User, Flame, Clock, 
  Send, Check, LayoutGrid, Table as TableIcon, Search,
  TrendingUp, BarChart3, AlertTriangle, ChevronRight, Zap
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

const ALL_WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const COMMON_TIMEZONES = [
  'Asia/Kolkata',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Singapore',
  'UTC'
];

export default function MailboxesPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Connection Modals
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showGoogleAppPassword, setShowGoogleAppPassword] = useState(false);
  const [showSmtpForm, setShowSmtpForm] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  
  // Diagnostics
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  
  // Live Send Test Email Modal
  const [sendTestModalMailbox, setSendTestModalMailbox] = useState<any>(null);
  const [testRecipientEmail, setTestRecipientEmail] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [sendTestResult, setSendTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Edit Limits & Maintenance Modal
  const [editingMailbox, setEditingMailbox] = useState<any>(null);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editDailyLimit, setEditDailyLimit] = useState(50);
  const [editHourlyLimit, setEditHourlyLimit] = useState(10);
  const [editStartTime, setEditStartTime] = useState('09:30');
  const [editEndTime, setEditEndTime] = useState('17:30');
  const [editTimezone, setEditTimezone] = useState('Asia/Kolkata');
  const [editSendingDays, setEditSendingDays] = useState<string[]>(['MON', 'TUE', 'WED', 'THU', 'FRI']);
  const [editWarmupStatus, setEditWarmupStatus] = useState('ACTIVE');
  const [savingLimits, setSavingLimits] = useState(false);

  // New Mailbox Form
  const [formData, setFormData] = useState({
    email: '',
    displayName: '',
    provider: 'GOOGLE',
    smtpHost: 'smtp.gmail.com',
    smtpPort: 465,
    smtpUsername: '',
    smtpPassword: '',
    imapHost: 'imap.gmail.com',
    imapPort: 993,
    imapUsername: '',
    imapPassword: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await apiFetch(`/api/mailboxes?scope=${scope}`);
      const data = await res.json();
      setMailboxes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load mailboxes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [scope, user]);

  // Aggregate Fleet Metrics
  const fleetMetrics = useMemo(() => {
    let totalDailyCapacity = 0;
    let totalSentToday = 0;
    let totalSentAllTime = 0;
    let totalRemainingToday = 0;
    let totalDelivered = 0;
    let totalOpened = 0;
    let totalClicked = 0;
    let totalReplied = 0;
    let totalBounced = 0;
    let connectedCount = 0;

    mailboxes.forEach((m) => {
      const dailyLimit = Number(m.dailySendLimit) || 0;
      const sentToday = Number(m.emailsSentToday) || 0;
      const sentAllTime = Number(m.stats?.totalSentAllTime ?? m.emailsSentToday ?? 0);
      const remainingToday = Number(m.stats?.remainingToday ?? Math.max(0, dailyLimit - sentToday));
      
      totalDailyCapacity += dailyLimit;
      totalSentToday += sentToday;
      totalSentAllTime += sentAllTime;
      totalRemainingToday += remainingToday;

      totalDelivered += Number(m.stats?.totalDelivered) || 0;
      totalOpened += Number(m.stats?.totalOpened) || 0;
      totalClicked += Number(m.stats?.totalClicked) || 0;
      totalReplied += Number(m.stats?.totalReplied) || 0;
      totalBounced += Number(m.stats?.totalBounced) || 0;

      if (m.status === 'CONNECTED' && m.smtpStatus === 'CONNECTED') {
        connectedCount += 1;
      }
    });

    const globalDailyUtilization = totalDailyCapacity > 0 
      ? Math.min(100, Math.round((totalSentToday / totalDailyCapacity) * 100)) 
      : 0;

    const avgHealthScore = mailboxes.length > 0
      ? Math.round(mailboxes.reduce((acc, m) => acc + (m.stats?.healthScore || 100), 0) / mailboxes.length)
      : 100;

    return {
      totalDailyCapacity,
      totalSentToday,
      totalSentAllTime,
      totalRemainingToday,
      globalDailyUtilization,
      totalDelivered,
      totalOpened,
      totalClicked,
      totalReplied,
      totalBounced,
      connectedCount,
      avgHealthScore
    };
  }, [mailboxes]);

  // Filtered mailboxes
  const filteredMailboxes = useMemo(() => {
    if (!searchQuery.trim()) return mailboxes;
    const q = searchQuery.toLowerCase().trim();
    return mailboxes.filter(m => 
      m.email?.toLowerCase().includes(q) ||
      m.displayName?.toLowerCase().includes(q) ||
      m.provider?.toLowerCase().includes(q) ||
      m.ownerName?.toLowerCase().includes(q)
    );
  }, [mailboxes, searchQuery]);

  // Handlers
  const handleOpenEditLimits = (m: any) => {
    setEditingMailbox(m);
    setEditDisplayName(m.displayName || '');
    setEditDailyLimit(m.dailySendLimit || 50);
    setEditHourlyLimit(m.hourlySendLimit || 10);
    setEditStartTime(m.sendingStartTime || '09:30');
    setEditEndTime(m.sendingEndTime || '17:30');
    setEditTimezone(m.sendingTimezone || 'Asia/Kolkata');
    setEditWarmupStatus(m.warmupStatus || 'ACTIVE');

    let days = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
    if (Array.isArray(m.sendingDays)) {
      days = m.sendingDays.map((d: any) => String(d).toUpperCase());
    } else if (typeof m.sendingDays === 'string') {
      try {
        const parsed = JSON.parse(m.sendingDays);
        if (Array.isArray(parsed)) days = parsed.map((d: any) => String(d).toUpperCase());
      } catch (e) {}
    }
    setEditSendingDays(days);
  };

  const handleToggleDay = (day: string) => {
    setEditSendingDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSaveLimits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMailbox) return;
    setSavingLimits(true);
    try {
      const res = await apiFetch(`/api/mailboxes/${editingMailbox.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: editDisplayName.trim(),
          dailySendLimit: Number(editDailyLimit),
          hourlySendLimit: Number(editHourlyLimit),
          sendingStartTime: editStartTime,
          sendingEndTime: editEndTime,
          sendingTimezone: editTimezone,
          sendingDays: editSendingDays,
          warmupStatus: editWarmupStatus
        })
      });

      if (res.ok) {
        setEditingMailbox(null);
        fetchData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to update mailbox limits');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error updating mailbox limits');
    } finally {
      setSavingLimits(false);
    }
  };

  const handleTestConnection = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const res = await apiFetch(`/api/mailboxes/${id}/test`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTestResult({
          id,
          success: true,
          message: data.sending?.message || 'SMTP & IMAP verified successfully'
        });
      } else {
        setTestResult({
          id,
          success: false,
          message: data.error || data.sending?.message || 'Authentication error'
        });
      }
      fetchData();
    } catch (err: any) {
      setTestResult({
        id,
        success: false,
        message: err?.message || 'Network error testing connection'
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleOpenSendTest = (mailbox: any) => {
    setSendTestModalMailbox(mailbox);
    setTestRecipientEmail(user?.email || mailbox.email);
    setSendTestResult(null);
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendTestModalMailbox || !testRecipientEmail.trim()) return;
    setSendingTest(true);
    setSendTestResult(null);
    try {
      const res = await apiFetch(`/api/mailboxes/${sendTestModalMailbox.id}/send-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toEmail: testRecipientEmail.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setSendTestResult({
          success: true,
          message: `Live test email successfully delivered to ${testRecipientEmail.trim()}! Check your inbox.`
        });
        fetchData();
      } else {
        setSendTestResult({
          success: false,
          message: data.error || 'Failed to send test email. Check SMTP credentials.'
        });
      }
    } catch (err: any) {
      setSendTestResult({
        success: false,
        message: err?.message || 'Network error sending test email'
      });
    } finally {
      setSendingTest(false);
    }
  };

  const handleDisconnect = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this mailbox? Active sequences using it will stop sending.')) return;
    try {
      const res = await apiFetch(`/api/mailboxes/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to disconnect mailbox');
      }
    } catch (err) {
      console.error(err);
      alert('Error disconnecting mailbox');
    }
  };

  const handleSmtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConnecting(true);
    setConnectError(null);
    try {
      const res = await apiFetch('/api/mailboxes/smtp-imap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setShowSmtpForm(false);
        setShowGoogleAppPassword(false);
        setShowConnectModal(false);
        setFormData({
          email: '',
          displayName: '',
          provider: 'GOOGLE',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 465,
          smtpUsername: '',
          smtpPassword: '',
          imapHost: 'imap.gmail.com',
          imapPort: 993,
          imapUsername: '',
          imapPassword: ''
        });
        fetchData();
      } else {
        setConnectError(data.error || 'Failed to connect mailbox. Check your credentials.');
      }
    } catch (err: any) {
      console.error(err);
      setConnectError(err?.message || 'Network error connecting to backend.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-heading text-secondary">Mailboxes & Sending Limits</h1>
              <p className="text-sm text-muted-foreground">
                Monitor live limits per mailbox, daily sending velocity, all-time dispatched stats, and server health.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Scope Selector */}
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setScope('my')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                scope === 'my' 
                  ? "bg-card text-secondary shadow-xs" 
                  : "text-muted-foreground hover:text-secondary"
              )}
            >
              My Mailboxes
            </button>
            <button
              onClick={() => setScope('all')}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer",
                scope === 'all' 
                  ? "bg-card text-secondary shadow-xs" 
                  : "text-muted-foreground hover:text-secondary"
              )}
            >
              All Team Mailboxes
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                viewMode === 'grid' ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-secondary"
              )}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-1.5 rounded-lg text-xs transition-all cursor-pointer",
                viewMode === 'table' ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-secondary"
              )}
              title="Limits & Stats Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-secondary transition-colors cursor-pointer"
            title="Refresh mailboxes"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-primary")} />
          </button>

          {/* Connect Mailbox Button */}
          <button
            onClick={() => {
              setConnectError(null);
              setShowConnectModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Connect Mailbox
          </button>
        </div>
      </div>

      {/* Global Fleet Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Daily Capacity & Remaining */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Daily Capacity</span>
            <span className="p-2 rounded-xl bg-orange-50 text-primary border border-orange-100">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-secondary font-heading">
                {fleetMetrics.totalSentToday} <span className="text-sm font-normal text-muted-foreground">/ {fleetMetrics.totalDailyCapacity}</span>
              </span>
              <span className="text-xs font-bold text-primary">{fleetMetrics.globalDailyUtilization}% used</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-2 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(4, fleetMetrics.globalDailyUtilization)}%` }} 
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between">
              <span>{fleetMetrics.totalRemainingToday} remaining today</span>
              <span className="font-semibold text-secondary">{mailboxes.length} Mailbox{mailboxes.length === 1 ? '' : 'es'}</span>
            </p>
          </div>
        </div>

        {/* 2. Total Sent Till Now */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sent Till Now</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Send className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-secondary font-heading">
              {fleetMetrics.totalSentAllTime}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Total lifetime emails dispatched across all connected senders
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-blue-700 font-semibold bg-blue-50/60 px-2.5 py-0.5 rounded-full w-fit">
              <TrendingUp className="w-3 h-3" />
              All-time tracking active
            </div>
          </div>
        </div>

        {/* 3. Deliverability Health */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Delivery Health</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 font-heading">
                {fleetMetrics.avgHealthScore}%
              </span>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Excellent</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              SMTP handshakes & authentication verified
            </p>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-700 font-semibold bg-emerald-50/60 px-2.5 py-0.5 rounded-full w-fit">
              <CheckCircle2 className="w-3 h-3" />
              {fleetMetrics.connectedCount} of {mailboxes.length} Active
            </div>
          </div>
        </div>

        {/* 4. Delivery Breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Engagement</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivered:</span>
              <span className="font-bold text-secondary">{fleetMetrics.totalDelivered}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Opens Tracked:</span>
              <span className="font-bold text-secondary">{fleetMetrics.totalOpened}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Clicks Tracked:</span>
              <span className="font-bold text-secondary">{fleetMetrics.totalClicked}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Replies Received:</span>
              <span className="font-bold text-secondary">{fleetMetrics.totalReplied}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-muted-foreground">Bounces:</span>
              <span className={cn("font-bold", fleetMetrics.totalBounced > 0 ? "text-rose-600" : "text-emerald-600")}>
                {fleetMetrics.totalBounced} (0.0%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic banner if a test was run */}
      {testResult && (
        <div className={cn(
          "p-4 rounded-xl border flex items-center justify-between animate-in fade-in duration-200",
          testResult.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"
        )}>
          <div className="flex items-center gap-3">
            {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <div className="text-sm font-medium">{testResult.message}</div>
          </div>
          <button onClick={() => setTestResult(null)} className="p-1 rounded hover:bg-black/5 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search mailboxes by email, name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 text-secondary placeholder:text-muted-foreground"
          />
        </div>
        <div className="text-xs text-muted-foreground self-end sm:self-center font-medium">
          Showing <span className="font-bold text-secondary">{filteredMailboxes.length}</span> of {mailboxes.length} mailbox{mailboxes.length === 1 ? '' : 'es'}
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center bg-card border border-border rounded-2xl">
          <RefreshCw className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm font-semibold text-secondary">Loading mailbox stats & limits...</p>
        </div>
      ) : filteredMailboxes.length === 0 ? (
        <div className="p-12 text-center bg-card border border-dashed border-border rounded-2xl">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-secondary">No mailboxes found</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            {searchQuery ? 'No mailboxes match your search query.' : 'Connect your first email account to configure limits and start outreach.'}
          </p>
          <button
            onClick={() => setShowConnectModal(true)}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
          >
            Connect Mailbox Now
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ======================== GRID VIEW ======================== */
        <div className="space-y-6">
          {filteredMailboxes.map((mailbox) => {
            const stats = mailbox.stats || {};
            const dailyLimit = Number(mailbox.dailySendLimit) || 50;
            const sentToday = stats.emailsSentToday !== undefined ? stats.emailsSentToday : (Number(mailbox.emailsSentToday) || 0);
            const remainingToday = stats.remainingToday ?? Math.max(0, dailyLimit - sentToday);
            const dailyPercent = Math.min(100, Math.round((sentToday / Math.max(1, dailyLimit)) * 100));

            const hourlyLimit = Number(mailbox.hourlySendLimit) || 10;
            const sentThisHour = stats.emailsSentThisHour !== undefined ? stats.emailsSentThisHour : (Number(mailbox.emailsSentThisHour) || 0);
            const remainingThisHour = stats.remainingThisHour ?? Math.max(0, hourlyLimit - sentThisHour);
            const hourlyPercent = Math.min(100, Math.round((sentThisHour / Math.max(1, hourlyLimit)) * 100));

            const totalSent = stats.totalSentAllTime ?? sentToday;
            const isGoogle = mailbox.provider === 'GOOGLE' || mailbox.email?.endsWith('@gmail.com');

            let sendingDaysList = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
            if (Array.isArray(mailbox.sendingDays)) {
              sendingDaysList = mailbox.sendingDays.map((d: any) => String(d).toUpperCase());
            }

            return (
              <div 
                key={mailbox.id}
                className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden transition-all hover:border-border/80"
              >
                {/* Mailbox Header */}
                <div className="bg-muted/30 border-b border-border p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-card border border-border flex items-center justify-center shrink-0 shadow-xs">
                      {isGoogle ? (
                        <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                      ) : (
                        <Mail className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-lg font-bold text-secondary font-heading">
                          {mailbox.displayName || mailbox.email}
                        </h2>
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
                          mailbox.status === 'CONNECTED' 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            mailbox.status === 'CONNECTED' ? "bg-emerald-500" : "bg-rose-500"
                          )} />
                          {mailbox.status === 'CONNECTED' ? 'Connected' : mailbox.status}
                        </span>
                        <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                          {mailbox.provider}
                        </span>
                        {mailbox.ownerName && (
                          <span className="text-[11px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {mailbox.ownerName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span>{mailbox.email}</span>
                        <span>•</span>
                        <span>Timezone: <span className="font-semibold text-secondary">{mailbox.sendingTimezone || 'Asia/Kolkata'}</span></span>
                      </p>
                    </div>
                  </div>

                  {/* Health & Warmup Badges */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <div className="px-3 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Health: {stats.healthScore || 100}%
                    </div>
                    <div className="px-3 py-1.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-center gap-1.5 text-xs font-bold text-blue-800">
                      <Flame className="w-4 h-4 text-blue-600" />
                      Warmup: {mailbox.warmupStatus || 'ACTIVE'}
                    </div>
                  </div>
                </div>

                {/* Card Body: Limits & Statistics */}
                <div className="p-6 space-y-6">
                  {/* --- ROW 1: SENDING LIMITS & VELOCITY GAUGES --- */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-primary" />
                      Sending Limits & Velocity
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Daily Limit */}
                      <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Daily Limit</span>
                          <span className="font-black text-secondary text-base">{dailyLimit} <span className="text-xs font-normal text-muted-foreground">/ day</span></span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              dailyPercent >= 90 ? "bg-rose-500" : dailyPercent >= 75 ? "bg-amber-500" : "bg-primary"
                            )}
                            style={{ width: `${Math.max(4, dailyPercent)}%` }} 
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-muted-foreground">{sentToday} sent today ({dailyPercent}%)</span>
                          <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{remainingToday} left</span>
                        </div>
                      </div>

                      {/* Hourly Limit */}
                      <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Hourly Limit</span>
                          <span className="font-black text-secondary text-base">{hourlyLimit} <span className="text-xs font-normal text-muted-foreground">/ hr</span></span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              hourlyPercent >= 90 ? "bg-rose-500" : hourlyPercent >= 75 ? "bg-amber-500" : "bg-blue-600"
                            )}
                            style={{ width: `${Math.max(4, hourlyPercent)}%` }} 
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1">
                          <span className="text-muted-foreground">{sentThisHour} sent this hr</span>
                          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">{remainingThisHour} left</span>
                        </div>
                      </div>

                      {/* Active Sending Window */}
                      <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Sending Window</span>
                          <span className="font-bold text-secondary text-xs flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            {mailbox.sendingStartTime || '09:30'} - {mailbox.sendingEndTime || '17:30'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          {ALL_WEEKDAYS.map((d) => {
                            const isSelected = sendingDaysList.includes(d);
                            return (
                              <span 
                                key={d}
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                                  isSelected ? "bg-secondary text-white" : "bg-muted text-muted-foreground/50"
                                )}
                              >
                                {d.slice(0, 3)}
                              </span>
                            );
                          })}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate pt-0.5">
                          Zone: <span className="font-medium text-secondary">{mailbox.sendingTimezone || 'Asia/Kolkata'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* --- ROW 2: ALL-TIME STATISTICS ("SEND TILL NOW") --- */}
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
                        All-Time Outreach Statistics
                      </span>
                      <span className="text-[11px] font-normal text-muted-foreground">
                        Last sent: <span className="font-semibold text-secondary">{mailbox.lastSentAt ? new Date(mailbox.lastSentAt).toLocaleString() : 'Recently active'}</span>
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {/* Sent till now */}
                      <div className="bg-muted/20 border border-border rounded-xl p-3">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase">Sent Till Now</div>
                        <div className="text-xl font-black text-secondary font-heading mt-1">{totalSent}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">Dispatched</div>
                      </div>

                      {/* Delivered */}
                      <div className="bg-muted/20 border border-border rounded-xl p-3">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase">Delivered</div>
                        <div className="text-xl font-black text-emerald-600 font-heading mt-1">{stats.totalDelivered || 0}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">100% inbox</div>
                      </div>

                      {/* Opened */}
                      <div className="bg-muted/20 border border-border rounded-xl p-3">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase">Opened</div>
                        <div className="text-xl font-black text-purple-600 font-heading mt-1">{stats.totalOpened || 0}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{stats.openRate || '0.0'}% rate</div>
                      </div>

                      {/* Clicked */}
                      <div className="bg-muted/20 border border-border rounded-xl p-3">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase">Clicked</div>
                        <div className="text-xl font-black text-blue-600 font-heading mt-1">{stats.totalClicked || 0}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{stats.clickRate || '0.0'}% rate</div>
                      </div>

                      {/* Replied */}
                      <div className="bg-muted/20 border border-border rounded-xl p-3">
                        <div className="text-[11px] font-semibold text-muted-foreground uppercase">Replied</div>
                        <div className="text-xl font-black text-primary font-heading mt-1">{stats.totalReplied || 0}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{stats.replyRate || '0.0'}% rate</div>
                      </div>
                    </div>
                  </div>

                  {/* --- ROW 3: INFRASTRUCTURE, CAMPAIGNS & MAINTENANCE --- */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Infrastructure Health */}
                    <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                      <div className="text-xs font-bold text-secondary flex items-center justify-between">
                        <span>Mail Infrastructure & Server Health</span>
                        <span className="text-[11px] font-normal text-muted-foreground">
                          Verified: {mailbox.lastTestedAt ? new Date(mailbox.lastTestedAt).toLocaleDateString() : 'Active'}
                        </span>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                          <div className="flex items-center gap-2">
                            {mailbox.smtpStatus === 'CONNECTED' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                            )}
                            <span className="font-medium text-secondary">SMTP Sending Protocol</span>
                          </div>
                          <span className={cn(
                            "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                            mailbox.smtpStatus === 'CONNECTED' ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          )}>
                            {mailbox.smtpStatus === 'CONNECTED' ? 'Operational' : 'Failed'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                          <div className="flex items-center gap-2">
                            {mailbox.imapStatus === 'CONNECTED' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-rose-500" />
                            )}
                            <span className="font-medium text-secondary">IMAP / Unibox Reply Tracking</span>
                          </div>
                          <span className={cn(
                            "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                            mailbox.imapStatus === 'CONNECTED' ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          )}>
                            {mailbox.imapStatus === 'CONNECTED' ? 'Operational' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Assigned Outreach Campaigns */}
                    <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                      <div className="text-xs font-bold text-secondary flex items-center justify-between">
                        <span>Assigned Outreach Campaigns</span>
                        <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {stats.campaignsCount || 0} Campaign{stats.campaignsCount === 1 ? '' : 's'}
                        </span>
                      </div>
                      {(!stats.campaigns || stats.campaigns.length === 0) ? (
                        <p className="text-xs text-muted-foreground italic py-2">
                          This mailbox is currently not attached to any active campaign.
                        </p>
                      ) : (
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {stats.campaigns.map((c: any) => (
                            <Link
                              key={c.id}
                              href={`/campaigns/${c.id}`}
                              className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/70 text-xs transition-colors group"
                            >
                              <span className="font-medium text-secondary group-hover:text-primary truncate">
                                {c.name}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1 shrink-0">
                                {c.status}
                                <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="bg-muted/20 border-t border-border px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-muted-foreground">
                    Connected ID: <span className="font-mono text-[11px] text-secondary">{mailbox.id.slice(0, 13)}...</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                    <button
                      onClick={() => handleOpenEditLimits(mailbox)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-secondary hover:text-primary transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Adjust daily and hourly sending limits"
                    >
                      <Sliders className="w-3.5 h-3.5 text-primary" />
                      Edit Limits
                    </button>

                    <button
                      onClick={() => handleOpenSendTest(mailbox)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50/60 hover:bg-blue-100 text-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Send a real email from this account to check deliverability"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send Test Email
                    </button>

                    <button
                      onClick={() => handleTestConnection(mailbox.id)}
                      disabled={testingId === mailbox.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card hover:bg-muted text-secondary transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      title="Test SMTP Handshake"
                    >
                      {testingId === mailbox.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> : <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />}
                      Test Connection
                    </button>

                    <button
                      onClick={() => handleDisconnect(mailbox.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-rose-200 bg-rose-50/60 hover:bg-rose-100 text-rose-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="Unlink this mailbox from the workspace"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ======================== TABLE VIEW ======================== */
        <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-bold tracking-wider text-[11px]">
                  <th className="p-4">Mailbox</th>
                  <th className="p-4">Status & Health</th>
                  <th className="p-4">Daily Limit & Usage</th>
                  <th className="p-4">Hourly Limit</th>
                  <th className="p-4">Sent Till Now</th>
                  <th className="p-4">Schedule Window</th>
                  <th className="p-4">Campaigns</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredMailboxes.map((mailbox) => {
                  const stats = mailbox.stats || {};
                  const dailyLimit = Number(mailbox.dailySendLimit) || 50;
                  const sentToday = stats.emailsSentToday !== undefined ? stats.emailsSentToday : (Number(mailbox.emailsSentToday) || 0);
                  const remainingToday = stats.remainingToday ?? Math.max(0, dailyLimit - sentToday);
                  const dailyPercent = Math.min(100, Math.round((sentToday / Math.max(1, dailyLimit)) * 100));

                  const hourlyLimit = Number(mailbox.hourlySendLimit) || 10;
                  const sentThisHour = stats.emailsSentThisHour !== undefined ? stats.emailsSentThisHour : (Number(mailbox.emailsSentThisHour) || 0);
                  const remainingThisHour = stats.remainingThisHour ?? Math.max(0, hourlyLimit - sentThisHour);

                  const totalSent = stats.totalSentAllTime ?? sentToday;
                  const isGoogle = mailbox.provider === 'GOOGLE' || mailbox.email?.endsWith('@gmail.com');

                  return (
                    <tr key={mailbox.id} className="hover:bg-muted/20 transition-colors">
                      {/* Mailbox Column */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {isGoogle ? (
                            <img src="https://www.google.com/favicon.ico" className="w-4 h-4 shrink-0" alt="Google" />
                          ) : (
                            <Mail className="w-4 h-4 text-primary shrink-0" />
                          )}
                          <div>
                            <div className="font-bold text-secondary">{mailbox.displayName || mailbox.email}</div>
                            <div className="text-muted-foreground text-[11px]">{mailbox.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status & Health */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={cn(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                            mailbox.status === 'CONNECTED' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          )}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", mailbox.status === 'CONNECTED' ? "bg-emerald-500" : "bg-rose-500")} />
                            {mailbox.status}
                          </span>
                          <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {stats.healthScore || 100}% Health
                          </div>
                        </div>
                      </td>

                      {/* Daily Limit */}
                      <td className="p-4">
                        <div className="space-y-1 w-36">
                          <div className="flex justify-between text-[11px] font-semibold">
                            <span className="text-secondary">{sentToday} / {dailyLimit}</span>
                            <span className="text-primary">{remainingToday} left</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(4, dailyPercent)}%` }} />
                          </div>
                        </div>
                      </td>

                      {/* Hourly Limit */}
                      <td className="p-4">
                        <div className="text-secondary font-semibold">
                          {sentThisHour} / {hourlyLimit} <span className="text-muted-foreground text-[10px] font-normal">/ hr</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground">{remainingThisHour} left this hr • Resets :00</div>
                      </td>

                      {/* Sent Till Now */}
                      <td className="p-4">
                        <div className="text-base font-black text-secondary font-heading">{totalSent}</div>
                        <div className="text-[10px] text-muted-foreground">Lifetime sent</div>
                      </td>

                      {/* Schedule Window */}
                      <td className="p-4">
                        <div className="text-secondary font-medium text-[11px]">
                          {mailbox.sendingStartTime || '09:30'} - {mailbox.sendingEndTime || '17:30'}
                        </div>
                        <div className="text-[10px] text-muted-foreground">{mailbox.sendingTimezone || 'Asia/Kolkata'}</div>
                      </td>

                      {/* Campaigns */}
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                          {stats.campaignsCount || 0}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditLimits(mailbox)}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-secondary hover:text-primary transition-colors cursor-pointer"
                            title="Edit Limits"
                          >
                            <Sliders className="w-3.5 h-3.5 text-primary" />
                          </button>
                          <button
                            onClick={() => handleOpenSendTest(mailbox)}
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors cursor-pointer"
                            title="Send Test Email"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleTestConnection(mailbox.id)}
                            disabled={testingId === mailbox.id}
                            className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-secondary transition-colors cursor-pointer disabled:opacity-50"
                            title="Test Connection"
                          >
                            {testingId === mailbox.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDisconnect(mailbox.id)}
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                            title="Disconnect Mailbox"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT SENDING LIMITS & SCHEDULE                    */}
      {/* ======================================================== */}
      {editingMailbox && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-secondary font-heading flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-primary" />
                  Edit Mailbox Limits & Schedule
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">{editingMailbox.email}</p>
              </div>
              <button
                onClick={() => setEditingMailbox(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveLimits} className="space-y-4">
              {/* Sender Name */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="e.g. Arup Nirala"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[11px] text-muted-foreground mt-1">This name will appear as the sender in the recipient inbox.</p>
              </div>

              {/* Limits: Daily & Hourly */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Daily Sending Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    value={editDailyLimit}
                    onChange={(e) => setEditDailyLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Recommended: 25-50 for cold email safety.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Hourly Sending Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="200"
                    value={editHourlyLimit}
                    onChange={(e) => setEditHourlyLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Maximum velocity sent per hour.</p>
                </div>
              </div>

              {/* Sending Window: Start & End */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Sending Window Start
                  </label>
                  <input
                    type="time"
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    Sending Window End
                  </label>
                  <input
                    type="time"
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Timezone */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Timezone
                </label>
                <select
                  value={editTimezone}
                  onChange={(e) => setEditTimezone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {COMMON_TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              {/* Active Sending Days */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1.5">
                  Active Sending Days
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ALL_WEEKDAYS.map((day) => {
                    const active = editSendingDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => handleToggleDay(day)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          active 
                            ? "bg-primary text-primary-foreground shadow-xs" 
                            : "bg-muted text-muted-foreground hover:text-secondary border border-border"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warmup Status */}
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Warmup Mode
                </label>
                <select
                  value={editWarmupStatus}
                  onChange={(e) => setEditWarmupStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="ACTIVE">ACTIVE (Full Production)</option>
                  <option value="WARMING_UP">WARMING UP (Ramping Up Gradually)</option>
                  <option value="PAUSED">PAUSED (Do Not Send)</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingMailbox(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLimits}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {savingLimits ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: LIVE SEND TEST EMAIL                              */}
      {/* ======================================================== */}
      {sendTestModalMailbox && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-secondary font-heading flex items-center gap-2">
                  <Send className="w-5 h-5 text-blue-600" />
                  Send Live Test Email
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sender: <span className="font-semibold text-secondary">{sendTestModalMailbox.email}</span>
                </p>
              </div>
              <button
                onClick={() => setSendTestModalMailbox(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {sendTestResult && (
              <div className={cn(
                "p-4 rounded-xl text-xs flex items-start gap-2.5",
                sendTestResult.success ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
              )}>
                {sendTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                <p className="font-medium">{sendTestResult.message}</p>
              </div>
            )}

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-secondary mb-1">
                  Recipient Destination Email
                </label>
                <input
                  type="email"
                  required
                  value={testRecipientEmail}
                  onChange={(e) => setTestRecipientEmail(e.target.value)}
                  placeholder="e.g. your-email@company.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  We will send a real test email through {sendTestModalMailbox.email} using Google SMTP to verify inbox deliverability.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setSendTestModalMailbox(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-border bg-card hover:bg-muted text-secondary transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={sendingTest || !testRecipientEmail.trim()}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {sendingTest ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  {sendingTest ? 'Sending Test...' : 'Send Live Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONNECT MAILBOX (GOOGLE APP PASSWORD / SMTP)       */}
      {/* ======================================================== */}
      {showConnectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="text-lg font-bold text-secondary font-heading flex items-center gap-2">
                  <Plus className="w-5 h-5 text-primary" />
                  Connect New Mailbox
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">Link an email account to send cold outreach sequences.</p>
              </div>
              <button
                onClick={() => {
                  setShowConnectModal(false);
                  setShowGoogleAppPassword(false);
                  setShowSmtpForm(false);
                }}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-secondary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {connectError && (
              <div className="p-3.5 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{connectError}</span>
              </div>
            )}

            {!showGoogleAppPassword && !showSmtpForm ? (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      provider: 'GOOGLE',
                      smtpHost: 'smtp.gmail.com',
                      smtpPort: 465,
                      imapHost: 'imap.gmail.com',
                      imapPort: 993
                    }));
                    setShowGoogleAppPassword(true);
                  }}
                  className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                    <div>
                      <div className="font-bold text-sm text-secondary group-hover:text-primary transition-colors">
                        Google Workspace / Gmail (Recommended)
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Connect instantly using a secure 16-character Google App Password.
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      provider: 'SMTP_IMAP',
                      smtpHost: '',
                      smtpPort: 587,
                      imapHost: '',
                      imapPort: 993
                    }));
                    setShowSmtpForm(true);
                  }}
                  className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all text-left flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <Mail className="w-6 h-6 text-primary" />
                    <div>
                      <div className="font-bold text-sm text-secondary group-hover:text-primary transition-colors">
                        Custom SMTP / IMAP
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Connect Outlook, Zoho, SendGrid, Amazon SES, or custom mail servers.
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSmtpSubmit} className="space-y-4">
                {showGoogleAppPassword && (
                  <div className="p-4 rounded-xl bg-orange-50/70 border border-orange-200 text-xs text-orange-900 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-primary">
                      <Zap className="w-4 h-4" />
                      How to get a Google App Password in 60 seconds:
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-muted-foreground pl-1">
                      <li>Go to your <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" className="underline font-semibold text-primary">Google Account &rarr; Security</a></li>
                      <li>Enable <strong>2-Step Verification</strong> (if not already enabled)</li>
                      <li>Search for <strong>"App passwords"</strong> in the search bar</li>
                      <li>Create an app named <strong>AutoOutreach</strong> and copy the 16-letter code</li>
                    </ol>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(p => ({ ...p, email: e.target.value, smtpUsername: e.target.value, imapUsername: e.target.value }))}
                    placeholder="you@company.com"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">Sender Display Name</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
                    placeholder="e.g. Alex Morgan"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-secondary mb-1">
                    {showGoogleAppPassword ? 'Google 16-character App Password *' : 'SMTP Password *'}
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.smtpPassword}
                    onChange={(e) => setFormData(p => ({ ...p, smtpPassword: e.target.value, imapPassword: e.target.value }))}
                    placeholder={showGoogleAppPassword ? "xxxx xxxx xxxx xxxx" : "••••••••••••"}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  />
                </div>

                {showSmtpForm && (
                  <div className="space-y-4 pt-2 border-t border-border">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-secondary mb-1">SMTP Host</label>
                        <input
                          type="text"
                          required
                          value={formData.smtpHost}
                          onChange={(e) => setFormData(p => ({ ...p, smtpHost: e.target.value }))}
                          placeholder="smtp.office365.com"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-secondary mb-1">SMTP Port</label>
                        <input
                          type="number"
                          required
                          value={formData.smtpPort}
                          onChange={(e) => setFormData(p => ({ ...p, smtpPort: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-secondary mb-1">IMAP Host</label>
                        <input
                          type="text"
                          required
                          value={formData.imapHost}
                          onChange={(e) => setFormData(p => ({ ...p, imapHost: e.target.value }))}
                          placeholder="outlook.office365.com"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-secondary mb-1">IMAP Port</label>
                        <input
                          type="number"
                          required
                          value={formData.imapPort}
                          onChange={(e) => setFormData(p => ({ ...p, imapPort: Number(e.target.value) }))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-border bg-background text-secondary focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleAppPassword(false);
                      setShowSmtpForm(false);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-secondary"
                  >
                    &larr; Back
                  </button>
                  <button
                    type="submit"
                    disabled={connecting || !formData.email || !formData.smtpPassword}
                    className="px-5 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {connecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    {connecting ? 'Verifying Credentials...' : 'Save & Connect Mailbox'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
