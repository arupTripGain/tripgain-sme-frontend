"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  Plus, 
  Users, 
  Mail, 
  Play, 
  Pause, 
  Trash2, 
  AlertTriangle, 
  Loader2, 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function BulkEmailDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCampaigns = () => {
    setLoading(true);
    apiFetch(`/api/bulk-campaigns?scope=${scope}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch bulk campaigns:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, [scope, user]);

  const handlePause = async (e: React.MouseEvent, campaignId: string) => {
    e.stopPropagation();
    if (!confirm('PAUSE this Bulk Campaign immediately? The scheduler will cease dispatching new pending recipients.')) return;
    setActionLoadingId(campaignId);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${campaignId}/pause`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to pause campaign');
      }
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to pause campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleResume = async (e: React.MouseEvent, campaignId: string) => {
    e.stopPropagation();
    if (!confirm('Resume dispatching for this Bulk Campaign? Pending recipients will be processed according to sending window and mailbox limits.')) return;
    setActionLoadingId(campaignId);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${campaignId}/resume`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to resume campaign');
      }
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to resume campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete campaign');
      }
      setDeleteTarget(null);
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to delete campaign');
    } finally {
      setIsDeleting(false);
    }
  };

  // Aggregated quick stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const queuedCampaigns = campaigns.filter(c => c.status === 'queued').length;
  const totalEnrolled = campaigns.reduce((sum, c) => sum + (c._count?.enrollments || 0), 0);
  const totalDispatched = campaigns.reduce((sum, c) => sum + (c._count?.messages || 0), 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sending Active
          </span>
        );
      case 'paused':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Pause className="w-3 h-3" />
            Paused / Stopped
          </span>
        );
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3 h-3" />
            Queued (Ready to Launch)
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-sm">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Bulk Email</h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Controlled, reputation-safe 1-step outreach with mailbox pooling and automated hygiene
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setScope('my')}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all",
                scope === 'my' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              My Bulk Sends
            </button>
            <button
              onClick={() => setScope('all')}
              className={cn(
                "px-3 py-1.5 rounded-md transition-all",
                scope === 'all' ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              )}
            >
              All Team
            </button>
          </div>

          <button
            onClick={fetchCampaigns}
            className="p-2 text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <Link
            href="/bulk-email/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            New Bulk Campaign
          </Link>
        </div>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl p-4 flex items-start gap-3.5 shadow-sm">
        <ShieldCheck className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed space-y-1">
          <p className="font-semibold text-slate-900">Enterprise Sender Reputation Protection Active</p>
          <p>
            Bulk campaigns enforce multi-mailbox rotation, strict daily/hourly throttling, suppression lists, automatic bounce classification, and an authoritative server-side kill switch. No uncontrolled blast sending is permitted.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bulk Campaigns</span>
            <Send className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalCampaigns}</p>
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className="text-emerald-600 font-semibold">{activeCampaigns} active</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">{queuedCampaigns} queued</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Enrolled</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalEnrolled.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">Verified audience contacts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Dispatched Messages</span>
            <Mail className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">{totalDispatched.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">SMTP accepted messages</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Delivery Architecture</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-2">Reputation-Safe</p>
          <p className="text-xs text-slate-500 mt-1">Fail-closed & suppression checks</p>
        </div>
      </div>

      {/* Campaigns Table / Cards */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">All Bulk Campaigns</h2>
          <span className="text-xs text-slate-500">{campaigns.length} campaigns found</span>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-sm text-slate-500 mt-3">Loading bulk campaigns...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
              <Send className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">No Bulk Campaigns Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
                Create a high-deliverability bulk email campaign to send single-step announcements or updates to a verified contact list.
              </p>
            </div>
            <Link
              href="/bulk-email/new"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all shadow-sm shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Create First Bulk Campaign
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {campaigns.map((camp) => {
              const enrolled = camp._count?.enrollments || 0;
              const dispatched = camp._count?.messages || 0;
              const mailboxesCount = camp.senderMailboxes?.length || 0;
              const isLoading = actionLoadingId === camp.id;

              return (
                <div
                  key={camp.id}
                  onClick={() => router.push(`/bulk-email/${camp.id}`)}
                  className="p-5 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-bold text-slate-900 hover:text-indigo-600 transition-colors truncate">
                        {camp.name}
                      </h3>
                      {getStatusBadge(camp.status)}
                    </div>
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                      <span>Audience List: <strong className="text-slate-700">{camp.list?.name || 'Manual / None'}</strong></span>
                      <span>•</span>
                      <span>Mailbox Pool: <strong className="text-slate-700">{mailboxesCount} {mailboxesCount === 1 ? 'mailbox' : 'mailboxes'}</strong></span>
                      <span>•</span>
                      <span>Daily Limit: <strong className="text-slate-700">{camp.dailySendLimit} / day</strong></span>
                      <span>•</span>
                      <span>Created: <strong className="text-slate-700">{new Date(camp.createdAt).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  {/* Progress & Actions */}
                  <div className="flex items-center gap-6 self-end lg:self-center">
                    <div className="text-right min-w-[120px]">
                      <div className="text-xs text-slate-500">Recipients</div>
                      <div className="text-sm font-semibold text-slate-800">
                        {dispatched} <span className="text-slate-400 font-normal">/ {enrolled}</span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {camp.status === 'active' && (
                        <button
                          onClick={(e) => handlePause(e, camp.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-300 hover:bg-amber-100 transition-colors shadow-sm"
                          title="STOP SENDING / PAUSE"
                        >
                          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Pause className="w-3.5 h-3.5" />}
                          Stop Sending
                        </button>
                      )}

                      {camp.status === 'paused' && (
                        <button
                          onClick={(e) => handleResume(e, camp.id)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 transition-colors shadow-sm"
                          title="Resume Sending"
                        >
                          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                          Resume
                        </button>
                      )}

                      <Link
                        href={`/bulk-email/${camp.id}`}
                        className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
                        title="View Details & Analytics"
                      >
                        <BarChart2 className="w-4 h-4" />
                      </Link>

                      {(camp.status === 'draft' || camp.status === 'completed' || camp.status === 'paused') && (
                        <button
                          onClick={() => setDeleteTarget(camp)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2 bg-red-50 rounded-full border border-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Bulk Campaign</h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to delete <strong className="text-slate-900">"{deleteTarget.name}"</strong>? 
              This will remove campaign configurations. Already delivered emails remain recorded in history.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Campaign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
