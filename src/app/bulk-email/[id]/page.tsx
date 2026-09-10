"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Send, 
  Pause, 
  Play, 
  RefreshCw, 
  Users, 
  Mail, 
  Eye, 
  MousePointer, 
  MessageSquare, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Loader2,
  ShieldCheck,
  UserX,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';

export default function BulkCampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params?.id as string;

  const [campaign, setCampaign] = useState<any | null>(null);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [recipientsData, setRecipientsData] = useState<{ recipients: any[]; total: number; page: number; limit: number }>({
    recipients: [],
    total: 0,
    page: 1,
    limit: 50
  });

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Test Email Drawer / Modal
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchAllData = async () => {
    if (!campaignId) return;
    try {
      const [campRes, anaRes, recRes] = await Promise.all([
        apiFetch(`/api/bulk-campaigns/${campaignId}`),
        apiFetch(`/api/bulk-campaigns/${campaignId}/analytics`),
        apiFetch(`/api/bulk-campaigns/${campaignId}/recipients?page=1&limit=50${statusFilter !== 'ALL' ? `&status=${statusFilter}` : ''}`)
      ]);

      if (campRes.ok) {
        const campData = await campRes.json();
        setCampaign(campData);
      }
      if (anaRes.ok) {
        const anaData = await anaRes.json();
        setAnalytics(anaData);
      }
      if (recRes.ok) {
        const rData = await recRes.json();
        setRecipientsData(rData);
      }
    } catch (err) {
      console.error('Error fetching campaign details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [campaignId, statusFilter]);

  const handlePause = async () => {
    if (!confirm('PAUSE this Bulk Campaign immediately? The scheduler will instantly stop picking up new pending recipients.')) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${campaignId}/pause`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to pause campaign');
      }
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to pause campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResume = async () => {
    if (!confirm('Resume this Bulk Campaign? Pending recipients will be processed according to scheduled sending windows and mailbox limits.')) return;
    setActionLoading(true);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${campaignId}/resume`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to resume campaign');
      }
      await fetchAllData();
    } catch (err: any) {
      alert(err.message || 'Failed to resume campaign');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim() || !testEmailAddress.includes('@')) {
      alert('Please enter a valid safe test email.');
      return;
    }

    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${campaignId}/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testEmail: testEmailAddress.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setTestResult({
        success: true,
        message: `Safe test email successfully sent to ${data.recipient}. Campaign enrollment state was not modified.`
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Error dispatching test email'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
        <p className="text-sm text-slate-500 mt-3">Loading campaign details & metrics...</p>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-16 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Campaign Not Found</h2>
        <Link href="/bulk-email" className="text-sm text-indigo-600 hover:underline">
          Return to Bulk Email dashboard
        </Link>
      </div>
    );
  }

  const metrics = analytics?.metrics || {
    totalEnrolled: 0,
    sent: 0,
    delivered: 0,
    uniqueOpens: 0,
    totalOpens: 0,
    uniqueClicks: 0,
    totalClicks: 0,
    replies: 0,
    hardBounces: 0,
    softBounces: 0,
    failures: 0,
    unsubscribes: 0,
    rates: {
      deliveryRate: 0,
      uniqueOpenRate: 0,
      uniqueClickRate: 0,
      replyRate: 0,
      bounceRate: 0
    }
  };

  const getRecipientBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Delivered</span>;
      case 'sent':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Sent (SMTP Accepted)</span>;
      case 'sending':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">Sending</span>;
      case 'pending':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Pending</span>;
      case 'soft_bounced':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200" title="Temporary deferral - no auto-retry">Soft Bounced</span>;
      case 'bounced':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200" title="Permanent failure - suppressed">Hard Bounced</span>;
      case 'replied':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">Replied</span>;
      case 'unsubscribed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-50 text-orange-700 border border-orange-200">Unsubscribed</span>;
      case 'failed':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">Failed (Stopped)</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">{status}</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/bulk-email"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{campaign.name}</h1>
              {campaign.status === 'active' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Sending Active
                </span>
              )}
              {campaign.status === 'paused' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                  <Pause className="w-3 h-3" />
                  Paused / Stopped
                </span>
              )}
              {campaign.status === 'queued' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                  <Clock className="w-3 h-3" />
                  Queued
                </span>
              )}
              {campaign.status === 'completed' && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  <CheckCircle2 className="w-3 h-3" />
                  Completed
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Audience: <strong className="text-slate-700">{campaign.list?.name || 'Manual List'}</strong> • Mailbox Pool: <strong className="text-slate-700">{campaign.senderMailboxes?.length || 0} mailboxes</strong> • Daily Limit: <strong className="text-slate-700">{campaign.dailySendLimit}/day</strong>
            </p>
          </div>
        </div>

        {/* Controls: STOP SENDING / PAUSE Kill switch */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllData}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowTestModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all shadow-sm"
          >
            <Mail className="w-3.5 h-3.5 text-indigo-600" />
            Send Test Email
          </button>

          {/* KILL SWITCH: STOP SENDING / PAUSE */}
          {campaign.status === 'active' && (
            <button
              onClick={handlePause}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-red-200"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
              STOP SENDING / PAUSE
            </button>
          )}

          {/* RESUME CONTROL */}
          {campaign.status === 'paused' && (
            <button
              onClick={handleResume}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-all shadow-md shadow-emerald-200"
            >
              {actionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Resume Sending
            </button>
          )}
        </div>
      </div>

      {/* Metrics Row 1: Core Lifecycle */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Enrolled</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.totalEnrolled.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Total eligible</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Dispatched</div>
          <div className="text-xl font-bold text-blue-600 mt-1">{metrics.sent.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">SMTP accepted</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Delivered</div>
          <div className="text-xl font-bold text-emerald-600 mt-1">{metrics.delivered.toLocaleString()}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">{metrics.rates.deliveryRate}% delivery</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unique Opens</div>
          <div className="text-xl font-bold text-indigo-600 mt-1">{metrics.uniqueOpens.toLocaleString()}</div>
          <div className="text-[10px] text-indigo-600 font-medium mt-0.5">{metrics.rates.uniqueOpenRate}% open rate</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unique Clicks</div>
          <div className="text-xl font-bold text-purple-600 mt-1">{metrics.uniqueClicks.toLocaleString()}</div>
          <div className="text-[10px] text-purple-600 font-medium mt-0.5">{metrics.rates.uniqueClickRate}% click rate</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Replies</div>
          <div className="text-xl font-bold text-slate-900 mt-1">{metrics.replies.toLocaleString()}</div>
          <div className="text-[10px] text-slate-600 font-medium mt-0.5">{metrics.rates.replyRate}% reply rate</div>
        </div>
      </div>

      {/* Metrics Row 2: Delivery Safety & Exceptions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Soft Bounces</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-600 mt-1">{metrics.softBounces.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Stopped (NO auto-retry)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hard Bounces</span>
            <XCircle className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-lg font-bold text-red-600 mt-1">{metrics.hardBounces.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Permanent & Suppressed</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Unsubscribes</span>
            <UserX className="w-3.5 h-3.5 text-orange-500" />
          </div>
          <div className="text-lg font-bold text-orange-600 mt-1">{metrics.unsubscribes.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Suppressed from future sends</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Send Failures</span>
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
          </div>
          <div className="text-lg font-bold text-red-600 mt-1">{metrics.failures.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Fail closed & stopped</div>
        </div>
      </div>

      {/* Recipients Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden space-y-0">
        {/* Table Header with Status Filters */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Recipient Delivery Lifecycle</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Auditable tracking of each contact's delivery state, assigned mailbox, and engagement
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'pending', label: 'Pending' },
              { id: 'sent', label: 'Sent' },
              { id: 'delivered', label: 'Delivered' },
              { id: 'soft_bounced', label: 'Soft Bounced' },
              { id: 'bounced', label: 'Hard Bounced' },
              { id: 'replied', label: 'Replied' },
              { id: 'unsubscribed', label: 'Unsubscribed' },
              { id: 'failed', label: 'Failed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-2.5 py-1 rounded-md transition-all border text-xs",
                  statusFilter === tab.id
                    ? "bg-white text-indigo-700 border-indigo-200 shadow-xs font-semibold"
                    : "bg-transparent text-slate-600 border-transparent hover:text-slate-900"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Content */}
        {recipientsData.recipients.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No recipients found matching status filter "{statusFilter}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Assigned Mailbox</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Dispatched At</th>
                  <th className="py-3 px-4">Engagement</th>
                  <th className="py-3 px-4">Notes / Failure Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recipientsData.recipients.map((r) => {
                  const contact = r.contact;
                  const primaryEmail = contact?.emails?.find((e: any) => e.isPrimary)?.email || contact?.emails?.[0]?.email || 'Unknown';
                  const company = contact?.organization?.name || '-';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">{contact?.firstName || ''} {contact?.lastName || ''}</div>
                        <div className="text-slate-500 text-[11px]">{primaryEmail}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{company}</td>
                      <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                        {r.mailbox?.email || 'Dynamic fair rotation'}
                      </td>
                      <td className="py-3 px-4">
                        {getRecipientBadge(r.status)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {r.lastSentAt ? new Date(r.lastSentAt).toLocaleString() : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 text-slate-600 text-[11px]">
                          <span title="Opens" className="flex items-center gap-1">
                            <Eye className="w-3 h-3 text-slate-400" />
                            {r.opensCount}
                          </span>
                          <span title="Clicks" className="flex items-center gap-1">
                            <MousePointer className="w-3 h-3 text-slate-400" />
                            {r.clicksCount}
                          </span>
                          {r.replied && (
                            <span title="Replied" className="text-purple-600 font-semibold flex items-center gap-0.5">
                              <MessageSquare className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] max-w-[200px] truncate">
                        {r.stopReason || r.lastError || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Send Safe Test Email</h3>
                <p className="text-xs text-slate-500">Dispatches rendered email to your safe test address.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Test Email Recipient
                </label>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={e => setTestEmailAddress(e.target.value)}
                  placeholder="e.g. yourname@domain.com"
                  className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {testResult && (
                <div className={cn(
                  "p-3 rounded-lg text-xs flex items-start gap-2.5 border",
                  testResult.success ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"
                )}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />}
                  <div>{testResult.message}</div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestResult(null);
                }}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleSendTestEmail}
                disabled={isSendingTest}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
              >
                {isSendingTest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
