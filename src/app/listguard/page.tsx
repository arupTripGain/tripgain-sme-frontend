"use client";

import React, { useEffect, useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import {
  Shield,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Download,
  PlusCircle,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  Clock,
  X,
  Check,
  Building2,
  UserCheck,
  Mail
} from 'lucide-react';
import Link from 'next/link';

interface VerificationJobSummary {
  jobId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  total: number;
  processed: number;
  deliverable: number;
  undeliverable: number;
  catchAll: number;
  unknown: number;
  reusedFromCache: number;
  verifiedAt: string;
}

interface ListCardItem {
  id: string;
  name: string;
  description: string | null;
  contactCount: number;
  listType: string;
  createdAt: string;
  updatedAt: string;
  latestVerification: VerificationJobSummary | null;
}

interface VerificationResultItem {
  id: string;
  email: string;
  normalizedEmail: string;
  result: 'DELIVERABLE' | 'UNDELIVERABLE' | 'CATCH_ALL' | 'UNKNOWN';
  verificationReason?: string;
  syntaxStatus: string;
  domainStatus: string;
  mxStatus: string;
  smtpStatus: string;
  isCatchAll: boolean;
  isDisposable: boolean;
  isRole: boolean;
  suppressionStatus: string | null;
  bounceStatus: string | null;
  smtpResponseCode: string | null;
  smtpResponse: string | null;
  verifiedAt: string;
  contact: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    fullName: string | null;
    jobTitle: string | null;
    companyName: string | null;
    industry: string | null;
    city: string | null;
    phone: string | null;
  } | null;
}

export default function ListGuardPage() {
  const { user } = useAuth();

  // View mode: 'dashboard' | 'results'
  const [viewMode, setViewMode] = useState<'dashboard' | 'results'>('dashboard');

  // Dashboard state
  const [lists, setLists] = useState<ListCardItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(true);
  const [listSearch, setListSearch] = useState('');

  // Active job & polling
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [activeJob, setActiveJob] = useState<any | null>(null);
  const [isStartingJob, setIsStartingJob] = useState(false);
  const [jobStartError, setJobStartError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Selected job results state
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedList, setSelectedList] = useState<{ id: string; name: string } | null>(null);
  const [results, setResults] = useState<VerificationResultItem[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);
  const [resultFilter, setResultFilter] = useState<string>('ALL');
  const [resultSearch, setResultSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('verifiedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalResultCount, setTotalResultCount] = useState<number>(0);

  // Modals & Drawers
  const [detailItem, setDetailItem] = useState<VerificationResultItem | null>(null);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isCleanListModalOpen, setIsCleanListModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [jobHistory, setJobHistory] = useState<any[]>([]);

  // Download form state
  const [downloadDeliverable, setDownloadDeliverable] = useState(true);
  const [downloadCatchAll, setDownloadCatchAll] = useState(false);
  const [downloadUnknown, setDownloadUnknown] = useState(false);
  const [downloadUndeliverable, setDownloadUndeliverable] = useState(false);
  const [downloadIncludeDetails, setDownloadIncludeDetails] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Clean List form state
  const [cleanIncludeDeliverable, setCleanIncludeDeliverable] = useState(true);
  const [cleanIncludeCatchAll, setCleanIncludeCatchAll] = useState(false);
  const [cleanIncludeUnknown, setCleanIncludeUnknown] = useState(false);
  const [cleanIncludeUndeliverable, setCleanIncludeUndeliverable] = useState(false);
  const [cleanListName, setCleanListName] = useState('');
  const [isCreatingCleanList, setIsCreatingCleanList] = useState(false);
  const [cleanListSuccessMsg, setCleanListSuccessMsg] = useState<string | null>(null);

  // Update List form state
  const [isUpdateListModalOpen, setIsUpdateListModalOpen] = useState(false);
  const [updateIncludeDeliverable, setUpdateIncludeDeliverable] = useState(true);
  const [updateIncludeCatchAll, setUpdateIncludeCatchAll] = useState(false);
  const [updateIncludeUnknown, setUpdateIncludeUnknown] = useState(false);
  const [updateIncludeUndeliverable, setUpdateIncludeUndeliverable] = useState(false);
  const [isUpdatingList, setIsUpdatingList] = useState(false);
  const [updateListSuccessMsg, setUpdateListSuccessMsg] = useState<string | null>(null);
  const [updateListErrorMsg, setUpdateListErrorMsg] = useState<string | null>(null);

  // Worker Health State
  const [workerHealth, setWorkerHealth] = useState<{
    available: boolean;
    status: string;
    activeWorkerCount: number;
  } | null>(null);

  const fetchWorkerStatus = async () => {
    try {
      const res = await apiFetch('/api/listguard/worker-status');
      if (res.ok) {
        const data = await res.json();
        setWorkerHealth(data);
      }
    } catch (e) {
      console.error('Failed to fetch worker status:', e);
    }
  };

  useEffect(() => {
    fetchWorkerStatus();
    const interval = setInterval(fetchWorkerStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDashboard();
  }, [user?.id]);

  const fetchDashboard = async () => {
    setLoadingLists(true);
    try {
      const res = await apiFetch(`/api/listguard/dashboard${listSearch ? `?search=${encodeURIComponent(listSearch)}` : ''}`);
      if (res.ok) {
        const data = await res.json();
        setLists(data.lists || []);
      }
    } catch (err) {
      console.error('Failed to fetch ListGuard dashboard:', err);
    } finally {
      setLoadingLists(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboard();
    }, 300);
    return () => clearTimeout(timer);
  }, [listSearch]);

  // Polling active job
  useEffect(() => {
    if (!activeJobId) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkJob = async () => {
      try {
        const res = await apiFetch(`/api/listguard/jobs/${activeJobId}`);
        if (res.ok) {
          const jobData = await res.json();
          setActiveJob(jobData);

          if (jobData.status === 'COMPLETED' || jobData.status === 'FAILED' || jobData.status === 'CANCELLED') {
            if (pollingRef.current) clearInterval(pollingRef.current);
            fetchDashboard(); // Refresh background list cards
          }
        }
      } catch (e) {
        console.error('Error polling job status:', e);
      }
    };

    checkJob();
    pollingRef.current = setInterval(checkJob, 1500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [activeJobId]);

  // Fetch results when viewing results mode
  useEffect(() => {
    if (viewMode === 'results' && selectedJobId) {
      fetchResults();
    }
  }, [viewMode, selectedJobId, resultFilter, sortBy, sortOrder, currentPage]);

  useEffect(() => {
    if (viewMode === 'results' && selectedJobId) {
      const timer = setTimeout(() => {
        setCurrentPage(1);
        fetchResults();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [resultSearch]);

  const fetchResults = async () => {
    if (!selectedJobId) return;
    setLoadingResults(true);
    try {
      const queryParams = new URLSearchParams({
        filter: resultFilter,
        search: resultSearch,
        sortBy,
        sortOrder,
        page: String(currentPage),
        pageSize: '50'
      });

      const res = await apiFetch(`/api/listguard/jobs/${selectedJobId}/results?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        setTotalResultCount(data.totalCount || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch job results:', err);
    } finally {
      setLoadingResults(false);
    }
  };

  const handleStartVerification = async (list: ListCardItem, forceReverify: boolean = false) => {
    setIsStartingJob(true);
    setJobStartError(null);
    try {
      const res = await apiFetch('/api/listguard/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: list.id, forceReverify })
      });

      if (res.ok) {
        const jobData = await res.json();
        if (jobData && jobData.jobId) {
          setActiveJobId(jobData.jobId);
          setActiveJob({
            id: jobData.jobId,
            listId: list.id,
            listName: list.name,
            status: jobData.status,
            total: jobData.total,
            processed: 0,
            deliverable: 0,
            undeliverable: 0,
            catchAll: 0,
            unknown: 0,
            reusedFromCache: 0
          });
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Failed to start verification' }));
        const errMsg = errorData.error || `Server responded with status ${res.status}`;
        console.error('Failed to start verification:', errMsg);
        setJobStartError(`Could not start verification for "${list.name}": ${errMsg}`);
        setActiveJob(null);
        setActiveJobId(null);
      }
    } catch (err: any) {
      console.error('Failed to start verification:', err);
      setJobStartError(`Network error starting verification for "${list.name}": ${err?.message || 'Check your connection'}`);
      setActiveJob(null);
      setActiveJobId(null);
    } finally {
      setIsStartingJob(false);
    }
  };

  const handleCancelJob = async () => {
    if (!activeJobId) return;
    try {
      await apiFetch(`/api/listguard/jobs/${activeJobId}/cancel`, { method: 'POST' });
      setActiveJob((prev: any) => prev ? { ...prev, status: 'CANCELLED' } : null);
      fetchDashboard();
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };

  const handleOpenResults = async (jobId: string, list: { id: string; name: string }) => {
    setSelectedJobId(jobId);
    setSelectedList(list);
    setViewMode('results');
    setResultFilter('ALL');
    setResultSearch('');
    setCurrentPage(1);

    // Fetch active job metadata for the KPI header
    try {
      const res = await apiFetch(`/api/listguard/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setActiveJob(data);
      }
    } catch {}
  };

  const handleOpenHistory = async (listId: string, listName: string) => {
    setSelectedList({ id: listId, name: listName });
    setIsHistoryModalOpen(true);
    try {
      const res = await apiFetch(`/api/listguard/lists/${listId}/history`);
      if (res.ok) {
        const data = await res.json();
        setJobHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch list history:', err);
    }
  };

  const handleDownloadCsv = async () => {
    if (!selectedJobId) return;
    setIsExporting(true);

    const statuses: string[] = [];
    if (downloadDeliverable) statuses.push('DELIVERABLE');
    if (downloadCatchAll) statuses.push('CATCH_ALL');
    if (downloadUnknown) statuses.push('UNKNOWN');
    if (downloadUndeliverable) statuses.push('UNDELIVERABLE');

    if (statuses.length === 0) {
      alert('Please select at least one result category to download.');
      setIsExporting(false);
      return;
    }

    try {
      const queryParams = new URLSearchParams({
        results: statuses.join(','),
        includeDetails: String(downloadIncludeDetails)
      });

      const res = await apiFetch(`/api/listguard/jobs/${selectedJobId}/export?${queryParams.toString()}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ListGuard_${selectedList?.name || 'List'}_export.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setIsDownloadModalOpen(false);
      } else {
        alert('Failed to export CSV. Please try again.');
      }
    } catch (err) {
      console.error('Download export failed:', err);
      alert('Download export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateCleanList = async () => {
    if (!selectedJobId) return;
    if (!cleanListName.trim()) {
      alert('Please enter a name for the new clean list.');
      return;
    }

    const statuses: string[] = [];
    if (cleanIncludeDeliverable) statuses.push('DELIVERABLE');
    if (cleanIncludeCatchAll) statuses.push('CATCH_ALL');
    if (cleanIncludeUnknown) statuses.push('UNKNOWN');
    if (cleanIncludeUndeliverable) statuses.push('UNDELIVERABLE');

    if (statuses.length === 0) {
      alert('Please select at least one category to include in the clean list.');
      return;
    }

    setIsCreatingCleanList(true);
    try {
      const res = await apiFetch(`/api/listguard/jobs/${selectedJobId}/create-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanListName.trim(),
          statuses
        })
      });

      if (res.ok) {
        const data = await res.json();
        setCleanListSuccessMsg(data.message || `Clean list created successfully with ${data.contactCount} contacts!`);
        fetchDashboard();
      } else {
        const errData = await res.json();
        alert(errData.error || 'Failed to create clean list.');
      }
    } catch (err) {
      console.error('Clean list creation failed:', err);
      alert('Failed to create clean list.');
    } finally {
      setIsCreatingCleanList(false);
    }
  };

  const handleUpdateList = async () => {
    if (!selectedJobId || !selectedList) return;

    const statuses: string[] = [];
    if (updateIncludeDeliverable) statuses.push('DELIVERABLE');
    if (updateIncludeCatchAll) statuses.push('CATCH_ALL');
    if (updateIncludeUnknown) statuses.push('UNKNOWN');
    if (updateIncludeUndeliverable) statuses.push('UNDELIVERABLE');

    if (statuses.length === 0) {
      alert('Please select at least one category to keep in the list.');
      return;
    }

    setIsUpdatingList(true);
    setUpdateListErrorMsg(null);
    try {
      const res = await apiFetch(`/api/listguard/jobs/${selectedJobId}/update-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statuses
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUpdateListSuccessMsg(data.message || `List updated! ${data.keptCount} contacts kept, ${data.removedCount} removed.`);
        fetchDashboard();
      } else {
        const errData = await res.json();
        setUpdateListErrorMsg(errData.error || 'Failed to update list.');
      }
    } catch (err) {
      console.error('List update failed:', err);
      setUpdateListErrorMsg('Failed to update list.');
    } finally {
      setIsUpdatingList(false);
    }
  };

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'DELIVERABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Deliverable
          </span>
        );
      case 'UNDELIVERABLE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Undeliverable
          </span>
        );
      case 'CATCH_ALL':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Catch-all
          </span>
        );
      case 'UNKNOWN':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
            Unknown
          </span>
        );
    }
  };

  // Helper for progress percentage
  const progressPct = activeJob?.total && activeJob.total > 0
    ? Math.round((activeJob.processed / activeJob.total) * 100)
    : 0;

  return (
    <div className="flex-1 overflow-y-auto bg-[#fff8f4] min-h-screen text-[#201b14] p-6 lg:p-8">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e0c0b2] pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#14385f] text-white shadow-sm">
              <Shield className="w-6 h-6 text-[#f16f21]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#14385f] flex items-center gap-2">
                ListGuard
                <span className="text-xs uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-[#f9ece1] text-[#f16f21] border border-[#e0c0b2]">
                  Deliverability Signals
                </span>
              </h1>
              <p className="text-sm text-[#584238] mt-0.5">
                Verify and clean your email lists before outreach.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Worker Health Status Badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border shadow-2xs transition-all"
            style={{
              backgroundColor: workerHealth?.available ? '#ecfdf5' : '#fef2f2',
              borderColor: workerHealth?.available ? '#a7f3d0' : '#fecaca',
              color: workerHealth?.available ? '#065f46' : '#991b1b'
            }}
          >
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: workerHealth?.available ? '#10b981' : '#ef4444' }}
            />
            Worker: {workerHealth?.available ? 'Online' : 'Unavailable'}
          </div>

          <button
            onClick={() => setIsGuideModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#e0c0b2] bg-white text-sm font-medium text-[#14385f] hover:bg-[#f9ece1] transition-colors shadow-xs"
          >
            <Info className="w-4 h-4 text-[#f16f21]" />
            Result Guide
          </button>

          {viewMode === 'results' && (
            <button
              onClick={() => {
                setViewMode('dashboard');
                fetchDashboard();
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#14385f] text-sm font-medium text-white hover:bg-[#1c4e85] transition-colors shadow-xs"
            >
              Back to Lists
            </button>
          )}
        </div>
      </div>

      {/* Job Start Error Banner */}
      {jobStartError && (
        <div className="mb-6 p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 text-sm flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-950">Failed to Start Verification</p>
              <p className="text-xs text-rose-800 mt-1">{jobStartError}</p>
            </div>
          </div>
          <button
            onClick={() => setJobStartError(null)}
            className="text-xs text-rose-600 hover:text-rose-900 font-bold px-2 py-1 rounded"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* ACTIVE VERIFICATION MODAL / BANNER (IF JOB RUNNING)       */}
      {/* ========================================================= */}
      {activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'QUEUED') && (
        <div className="mb-6 rounded-xl border-2 border-[#f16f21]/40 bg-white p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="animate-spin text-[#f16f21]">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-base text-[#14385f]">
                  Verifying Emails: {activeJob.listName}
                </h3>
                <p className="text-xs text-[#584238]">
                  Verification is running asynchronously in the background. You can leave this page anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-[#14385f]">
                {activeJob.processed} / {activeJob.total} ({progressPct}%)
              </span>
              <button
                onClick={handleCancelJob}
                className="text-xs px-2.5 py-1.5 rounded font-medium text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
              >
                Cancel Verification
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#f9ece1] rounded-full h-3 overflow-hidden border border-[#e0c0b2] mb-3">
            <div
              className="bg-linear-to-r from-[#f16f21] to-[#14385f] h-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Real-time counters */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1 text-center">
            <div className="p-2 rounded bg-emerald-50 border border-emerald-200">
              <span className="block text-xs text-emerald-700 font-medium">Deliverable</span>
              <span className="text-base font-bold text-emerald-900">{activeJob.deliverable}</span>
            </div>
            <div className="p-2 rounded bg-amber-50 border border-amber-200">
              <span className="block text-xs text-amber-700 font-medium">Catch-all</span>
              <span className="text-base font-bold text-amber-900">{activeJob.catchAll}</span>
            </div>
            <div className="p-2 rounded bg-slate-50 border border-slate-200">
              <span className="block text-xs text-slate-700 font-medium">Unknown</span>
              <span className="text-base font-bold text-slate-900">{activeJob.unknown}</span>
            </div>
            <div className="p-2 rounded bg-rose-50 border border-rose-200">
              <span className="block text-xs text-rose-700 font-medium">Undeliverable</span>
              <span className="text-base font-bold text-rose-900">{activeJob.undeliverable}</span>
            </div>
            <div className="p-2 rounded bg-[#f9ece1] border border-[#e0c0b2]">
              <span className="block text-xs text-[#584238] font-medium">Reused Cache</span>
              <span className="text-base font-bold text-[#201b14]">{activeJob.reusedFromCache}</span>
            </div>
          </div>

          {/* Unknown Reason Distribution */}
          {activeJob.unknownReasons && Object.keys(activeJob.unknownReasons).length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-[#e0c0b2]/50 text-xs">
              <span className="text-[#584238] font-medium">Unknown Reason Breakdown:</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {Object.entries(activeJob.unknownReasons).map(([reason, count]) => (
                  <span
                    key={reason}
                    className="px-2 py-0.5 rounded bg-[#f9ece1] text-[#201b14] font-mono text-[11px] border border-[#e0c0b2]"
                  >
                    {reason}: <strong className="text-[#f16f21]">{count as number}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 1: DASHBOARD / LISTS VIEW                            */}
      {/* ========================================================= */}
      {viewMode === 'dashboard' && (
        <div className="space-y-6">
          {/* Search bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#584238]" />
              <input
                type="text"
                placeholder="Search lists..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#e0c0b2] bg-white text-sm text-[#201b14] placeholder-[#584238]/60 focus:outline-none focus:ring-2 focus:ring-[#f16f21] focus:border-transparent"
              />
            </div>
            <span className="text-xs text-[#584238]">
              {lists.length} lists available
            </span>
          </div>

          {/* List Cards Grid */}
          {loadingLists ? (
            <div className="py-16 text-center text-[#584238]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#f16f21]" />
              Loading your lists...
            </div>
          ) : lists.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-[#e0c0b2] p-8">
              <Shield className="w-10 h-10 text-[#584238] mx-auto mb-3 opacity-40" />
              <h3 className="font-semibold text-lg text-[#14385f]">No lists found</h3>
              <p className="text-sm text-[#584238] mt-1 max-w-sm mx-auto">
                {listSearch ? 'No lists matched your search query.' : 'You have not created any lists yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {lists.map((list) => {
                const ver = list.latestVerification;
                const hasVer = Boolean(ver && ver.total > 0);
                const isCurrentActive = activeJob?.listId === list.id && (activeJob.status === 'RUNNING' || activeJob.status === 'QUEUED');

                return (
                  <div
                    key={list.id}
                    className="bg-white rounded-xl border border-[#e0c0b2] p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h3 className="font-bold text-base text-[#14385f] hover:text-[#f16f21] transition-colors">
                            {list.name}
                          </h3>
                          <p className="text-xs text-[#584238] mt-0.5">
                            {list.contactCount} contacts • {list.listType.toUpperCase()}
                          </p>
                        </div>

                        {hasVer && (
                          <button
                            onClick={() => handleOpenHistory(list.id, list.name)}
                            className="text-xs text-[#584238] hover:text-[#14385f] flex items-center gap-1 font-medium bg-[#f9ece1] px-2 py-1 rounded border border-[#e0c0b2]"
                            title="View verification history"
                          >
                            <Clock className="w-3 h-3" />
                            History
                          </button>
                        )}
                      </div>

                      {/* Verification Status Area */}
                      <div className="mt-4 pt-3 border-t border-[#e0c0b2]/60">
                        {hasVer && ver ? (
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-[#584238]">Last verification:</span>
                              <span className="font-medium text-[#14385f]">
                                {new Date(ver.verifiedAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>

                            {/* 4 Primary Breakdown Pills */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-xs">
                              <div className="px-2 py-1 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
                                Deliverable: {ver.deliverable}
                              </div>
                              <div className="px-2 py-1 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200">
                                Catch-all: {ver.catchAll}
                              </div>
                              <div className="px-2 py-1 rounded bg-slate-50 text-slate-800 font-semibold border border-slate-200">
                                Unknown: {ver.unknown}
                              </div>
                              <div className="px-2 py-1 rounded bg-rose-50 text-rose-800 font-semibold border border-rose-200">
                                Undeliverable: {ver.undeliverable}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs py-1">
                            <span className="text-[#584238]">Last verification:</span>
                            <span className="text-amber-700 font-medium">Never verified</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="mt-5 pt-3 border-t border-[#e0c0b2]/40 flex items-center justify-end gap-2.5">
                      {hasVer && ver ? (
                        <>
                          <button
                            onClick={() => handleOpenResults(ver.jobId, { id: list.id, name: list.name })}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#14385f] text-white hover:bg-[#1c4e85] transition-colors shadow-xs"
                          >
                            View Results
                          </button>
                          <button
                            disabled={isCurrentActive || isStartingJob}
                            onClick={() => handleStartVerification(list, true)}
                            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold border border-[#e0c0b2] bg-white text-[#14385f] hover:bg-[#f9ece1] transition-colors disabled:opacity-50"
                          >
                            Re-verify
                          </button>
                        </>
                      ) : (
                        <button
                          disabled={isCurrentActive || isStartingJob || list.contactCount === 0}
                          onClick={() => handleStartVerification(list)}
                          className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#f16f21] text-white hover:bg-[#e05f13] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Verify Emails
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* VIEW 2: JOB RESULTS VIEW                                  */}
      {/* ========================================================= */}
      {viewMode === 'results' && selectedList && (
        <div className="space-y-6">
          {/* Header Summary KPI Card */}
          <div className="bg-white rounded-xl border border-[#e0c0b2] p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#e0c0b2]/60">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#584238]">
                  Verification Results
                </span>
                <h2 className="text-xl font-bold text-[#14385f] mt-0.5">
                  {selectedList.name}
                </h2>
                <div className="flex items-center gap-3 text-xs text-[#584238] mt-1">
                  <span>{totalResultCount} Emails Checked</span>
                  <span>•</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verification complete: 100%
                  </span>
                  {activeJob?.completedAt && (
                    <>
                      <span>•</span>
                      <span>
                        Last checked: {new Date(activeJob.completedAt).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={() => {
                    setDownloadDeliverable(true);
                    setDownloadCatchAll(false);
                    setDownloadUnknown(false);
                    setDownloadUndeliverable(false);
                    setIsDownloadModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#e0c0b2] bg-white text-xs font-semibold text-[#14385f] hover:bg-[#f9ece1] transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4 text-[#f16f21]" />
                  Download CSV
                </button>

                <button
                  onClick={() => {
                    setCleanIncludeDeliverable(true);
                    setCleanIncludeCatchAll(false);
                    setCleanIncludeUnknown(false);
                    setCleanIncludeUndeliverable(false);
                    setCleanListName(`${selectedList.name} – Deliverable`);
                    setCleanListSuccessMsg(null);
                    setIsCleanListModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f16f21] text-xs font-semibold text-white hover:bg-[#e05f13] transition-colors shadow-xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Clean List
                </button>

                <button
                  onClick={() => {
                    setUpdateIncludeDeliverable(true);
                    setUpdateIncludeCatchAll(false);
                    setUpdateIncludeUnknown(false);
                    setUpdateIncludeUndeliverable(false);
                    setUpdateListSuccessMsg(null);
                    setUpdateListErrorMsg(null);
                    setIsUpdateListModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#14385f] bg-[#14385f] text-xs font-semibold text-white hover:bg-[#1a4472] transition-colors shadow-xs"
                  title="Update the existing list with verified contacts"
                >
                  <UserCheck className="w-4 h-4 text-[#f16f21]" />
                  Update List
                </button>

                <button
                  onClick={() => {
                    const l = lists.find(x => x.id === selectedList.id);
                    if (l) handleStartVerification(l, true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e0c0b2] bg-white text-xs font-semibold text-[#584238] hover:bg-[#f9ece1] transition-colors"
                  title="Re-verify this list"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Re-verify
                </button>
              </div>
            </div>

            {/* 4 Primary KPI Summary Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5">
              {/* Deliverable */}
              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-800">Deliverable</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-950">
                    {activeJob?.deliverable ?? 0}
                  </span>
                  <span className="text-xs text-emerald-700 font-medium">
                    {totalResultCount > 0 ? ((activeJob?.deliverable ?? 0) / totalResultCount * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Catch-all */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-800">Catch-all</span>
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-amber-950">
                    {activeJob?.catchAll ?? 0}
                  </span>
                  <span className="text-xs text-amber-700 font-medium">
                    {totalResultCount > 0 ? ((activeJob?.catchAll ?? 0) / totalResultCount * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Unknown */}
              <div className="p-4 rounded-xl bg-slate-50/60 border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">Unknown</span>
                  <HelpCircle className="w-4 h-4 text-slate-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-slate-950">
                    {activeJob?.unknown ?? 0}
                  </span>
                  <span className="text-xs text-slate-700 font-medium">
                    {totalResultCount > 0 ? ((activeJob?.unknown ?? 0) / totalResultCount * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>

              {/* Undeliverable */}
              <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-800">Undeliverable</span>
                  <XCircle className="w-4 h-4 text-rose-600" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-rose-950">
                    {activeJob?.undeliverable ?? 0}
                  </span>
                  <span className="text-xs text-rose-700 font-medium">
                    {totalResultCount > 0 ? ((activeJob?.undeliverable ?? 0) / totalResultCount * 100).toFixed(1) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'DELIVERABLE', label: 'Deliverable' },
                { id: 'CATCH_ALL', label: 'Catch-all' },
                { id: 'UNKNOWN', label: 'Unknown' },
                { id: 'UNDELIVERABLE', label: 'Undeliverable' },
                { id: 'ROLE', label: 'Role Account' },
                { id: 'DISPOSABLE', label: 'Disposable' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setResultFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    resultFilter === tab.id
                      ? 'bg-[#14385f] text-white shadow-xs'
                      : 'bg-white text-[#584238] border border-[#e0c0b2] hover:bg-[#f9ece1]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#584238]" />
              <input
                type="text"
                placeholder="Search email, name, company..."
                value={resultSearch}
                onChange={(e) => setResultSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#e0c0b2] bg-white text-xs text-[#201b14] placeholder-[#584238]/60 focus:outline-none focus:ring-2 focus:ring-[#f16f21]"
              />
            </div>
          </div>

          {/* Verification Results Table */}
          <div className="bg-white rounded-xl border border-[#e0c0b2] overflow-hidden shadow-xs">
            {loadingResults ? (
              <div className="py-16 text-center text-[#584238]">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#f16f21]" />
                Loading verification results...
              </div>
            ) : results.length === 0 ? (
              <div className="py-16 text-center text-[#584238]">
                No records matching your current filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f9ece1] text-[#14385f] font-semibold uppercase tracking-wider border-b border-[#e0c0b2]">
                    <tr>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Result</th>
                      <th className="py-3 px-4 text-center">Domain</th>
                      <th className="py-3 px-4 text-center">MX</th>
                      <th className="py-3 px-4 text-center">SMTP</th>
                      <th className="py-3 px-4 text-center">Catch-all</th>
                      <th className="py-3 px-4 text-center">Disposable</th>
                      <th className="py-3 px-4 text-center">Role</th>
                      <th className="py-3 px-4">Verified At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e0c0b2]/40">
                    {results.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setDetailItem(r)}
                        className="hover:bg-[#fff8f4] cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-[#14385f]">
                          {r.email}
                        </td>
                        <td className="py-3 px-4 text-[#584238]">
                          {r.contact?.fullName || '-'}
                        </td>
                        <td className="py-3 px-4 text-[#584238]">
                          {r.contact?.companyName || '-'}
                        </td>
                        <td className="py-3 px-4">
                          {getResultBadge(r.result)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {r.domainStatus === 'PASS' ? (
                            <span className="text-emerald-700 font-bold">✓</span>
                          ) : (
                            <span className="text-rose-700 font-bold">✗</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {r.mxStatus === 'PASS' ? (
                            <span className="text-emerald-700 font-bold">✓</span>
                          ) : (
                            <span className="text-rose-700 font-bold">✗</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-[10px]">
                          {r.smtpStatus === 'DELIVERABLE_SIGNAL' ? (
                            <span className="text-emerald-700 font-bold">250 OK</span>
                          ) : r.smtpStatus === 'UNDELIVERABLE_SIGNAL' ? (
                            <span className="text-rose-700 font-bold">550 FAIL</span>
                          ) : r.smtpStatus === 'CATCH_ALL' ? (
                            <span className="text-amber-700 font-bold">CATCH-ALL</span>
                          ) : (
                            <span className="text-slate-500 font-bold">UNKNOWN</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {r.isCatchAll ? (
                            <span className="text-amber-700 font-semibold">Yes</span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {r.isDisposable ? (
                            <span className="text-rose-700 font-semibold">Yes</span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {r.isRole ? (
                            <span className="text-indigo-700 font-semibold">Yes</span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#584238] whitespace-nowrap">
                          {new Date(r.verifiedAt).toLocaleDateString('en-GB', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* UI Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#e0c0b2] bg-[#fff8f4] text-xs text-[#584238]">
                <span>
                  Showing {(currentPage - 1) * 50 + 1}–{Math.min(currentPage * 50, totalResultCount)} of {totalResultCount}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-2.5 py-1 rounded bg-white border border-[#e0c0b2] font-semibold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="px-2 font-bold text-[#14385f]">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-2.5 py-1 rounded bg-white border border-[#e0c0b2] font-semibold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: RESULT DETAIL DRAWER                             */}
      {/* ========================================================= */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#e0c0b2] shadow-xl p-6 relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => setDetailItem(null)}
              className="absolute right-4 top-4 text-[#584238] hover:text-[#201b14]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-[#f9ece1] border border-[#e0c0b2]">
                <Shield className="w-6 h-6 text-[#f16f21]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#14385f] break-all">
                  {detailItem.email}
                </h3>
                <div className="mt-1">
                  {getResultBadge(detailItem.result)}
                </div>
              </div>
            </div>

            {/* Contextual Guidance */}
            <div className="mb-4 p-3 rounded-lg bg-[#fff8f4] border border-[#e0c0b2] text-xs text-[#584238]">
              {detailItem.result === 'DELIVERABLE' && (
                <p>
                  <strong>Deliverable:</strong> Strong technical signals indicate that the address can receive email. This does not mean guaranteed inbox placement.
                </p>
              )}
              {detailItem.result === 'CATCH_ALL' && (
                <p>
                  <strong>Catch-all:</strong> The receiving domain accepts arbitrary recipients, so mailbox existence cannot be reliably confirmed.
                </p>
              )}
              {detailItem.result === 'UNKNOWN' && (
                <p>
                  <strong>Unknown:</strong> The verification service could not establish a reliable result.
                </p>
              )}
              {detailItem.result === 'UNDELIVERABLE' && (
                <p>
                  <strong>Undeliverable:</strong> Strong technical signals indicate that the address cannot receive email.
                </p>
              )}
            </div>

            {/* Signal Details List */}
            <div className="space-y-2 text-xs divide-y divide-[#e0c0b2]/40">
              {detailItem.verificationReason && (
                <div className="flex justify-between py-1.5">
                  <span className="text-[#584238]">Verification Reason</span>
                  <span className="font-semibold text-[#14385f]">
                    {detailItem.verificationReason}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-[#584238]">Syntax Validation</span>
                <span className="font-semibold text-emerald-700">
                  {detailItem.syntaxStatus === 'PASS' ? '✓ PASS' : '✗ FAIL'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#584238]">Domain Status</span>
                <span className="font-semibold text-[#14385f]">
                  {detailItem.domainStatus}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#584238]">Mail Exchange (MX)</span>
                <span className="font-semibold text-[#14385f]">
                  {detailItem.mxStatus}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#584238]">SMTP Recipient Handshake</span>
                <span className="font-semibold text-[#14385f]">
                  {detailItem.smtpStatus} {detailItem.smtpResponseCode ? `(${detailItem.smtpResponseCode})` : ''}
                </span>
              </div>
              {detailItem.smtpResponse && (
                <div className="flex justify-between py-1.5 items-start">
                  <span className="text-[#584238] shrink-0">SMTP Diagnostic</span>
                  <span className="font-mono text-[11px] text-[#584238] text-right max-w-[220px] truncate" title={detailItem.smtpResponse}>
                    {detailItem.smtpResponse}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-[#584238]">Catch-all Domain</span>
                <span className="font-semibold text-[#14385f]">
                  {detailItem.isCatchAll ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#584238]">Disposable Email</span>
                <span className="font-semibold text-[#14385f]">
                  {detailItem.isDisposable ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-[#584238]">Role Account</span>
                <span className="font-semibold text-[#14385f]">
                  {detailItem.isRole ? 'Yes (informational signal)' : 'No'}
                </span>
              </div>
              {detailItem.suppressionStatus && (
                <div className="flex justify-between py-1.5">
                  <span className="text-rose-700 font-semibold">Suppression Reason</span>
                  <span className="font-semibold text-rose-700">
                    {detailItem.suppressionStatus}
                  </span>
                </div>
              )}
              {detailItem.bounceStatus && (
                <div className="flex justify-between py-1.5">
                  <span className="text-rose-700 font-semibold">Prior Bounce History</span>
                  <span className="font-semibold text-rose-700">
                    {detailItem.bounceStatus}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-[#584238]">Verified Timestamp</span>
                <span className="font-medium text-[#201b14]">
                  {new Date(detailItem.verifiedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button
                onClick={() => setDetailItem(null)}
                className="px-4 py-2 rounded-lg bg-[#14385f] text-white text-xs font-semibold hover:bg-[#1c4e85]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: DOWNLOAD FULL CSV MODAL                          */}
      {/* ========================================================= */}
      {isDownloadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#e0c0b2] shadow-xl p-6 relative">
            <button
              onClick={() => setIsDownloadModalOpen(false)}
              className="absolute right-4 top-4 text-[#584238] hover:text-[#201b14]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#14385f] mb-1">
              Download Verification Results
            </h3>
            <p className="text-xs text-[#584238] mb-4">
              Select the results to include in the download. The export will include the complete result set matching your selection.
            </p>

            <div className="space-y-3 mb-5">
              <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadDeliverable}
                  onChange={(e) => setDownloadDeliverable(e.target.checked)}
                  className="rounded text-[#f16f21] focus:ring-[#f16f21] w-4 h-4"
                />
                <span className="text-sm font-semibold text-[#14385f]">
                  Deliverable ({activeJob?.deliverable ?? 0})
                </span>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadCatchAll}
                  onChange={(e) => setDownloadCatchAll(e.target.checked)}
                  className="rounded text-[#f16f21] focus:ring-[#f16f21] w-4 h-4"
                />
                <span className="text-sm font-semibold text-[#14385f]">
                  Catch-all ({activeJob?.catchAll ?? 0})
                </span>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadUnknown}
                  onChange={(e) => setDownloadUnknown(e.target.checked)}
                  className="rounded text-[#f16f21] focus:ring-[#f16f21] w-4 h-4"
                />
                <span className="text-sm font-semibold text-[#14385f]">
                  Unknown ({activeJob?.unknown ?? 0})
                </span>
              </label>

              <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                <input
                  type="checkbox"
                  checked={downloadUndeliverable}
                  onChange={(e) => setDownloadUndeliverable(e.target.checked)}
                  className="rounded text-[#f16f21] focus:ring-[#f16f21] w-4 h-4"
                />
                <span className="text-sm font-semibold text-[#14385f]">
                  Undeliverable ({activeJob?.undeliverable ?? 0})
                </span>
              </label>

              <div className="pt-2 border-t border-[#e0c0b2]">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#584238]">
                  <input
                    type="checkbox"
                    checked={downloadIncludeDetails}
                    onChange={(e) => setDownloadIncludeDetails(e.target.checked)}
                    className="rounded text-[#f16f21] focus:ring-[#f16f21]"
                  />
                  <span>Include technical verification details in CSV columns</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setIsDownloadModalOpen(false)}
                className="px-3.5 py-2 rounded-lg border border-[#e0c0b2] text-xs font-semibold text-[#584238]"
              >
                Cancel
              </button>
              <button
                disabled={isExporting}
                onClick={handleDownloadCsv}
                className="px-4 py-2 rounded-lg bg-[#f16f21] text-white text-xs font-semibold hover:bg-[#e05f13] transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? 'Exporting...' : 'Download CSV'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: CREATE CLEAN LIST MODAL                          */}
      {/* ========================================================= */}
      {isCleanListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#e0c0b2] shadow-xl p-6 relative">
            <button
              onClick={() => setIsCleanListModalOpen(false)}
              className="absolute right-4 top-4 text-[#584238] hover:text-[#201b14]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-[#14385f] mb-1">
              Create Clean List
            </h3>
            <p className="text-xs text-[#584238] mb-4">
              Create a derived operational audience for campaigns. The original list will remain completely untouched.
            </p>

            {cleanListSuccessMsg ? (
              <div className="py-4 text-center space-y-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-emerald-900">
                  {cleanListSuccessMsg}
                </p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Link
                    href="/leads"
                    className="px-3.5 py-1.5 rounded-lg bg-[#14385f] text-white text-xs font-semibold hover:bg-[#1c4e85]"
                  >
                    View in Lists
                  </Link>
                  <button
                    onClick={() => setIsCleanListModalOpen(false)}
                    className="px-3.5 py-1.5 rounded-lg border border-[#e0c0b2] text-xs font-semibold text-[#584238]"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#584238] mb-1">
                    New List Name:
                  </label>
                  <input
                    type="text"
                    value={cleanListName}
                    onChange={(e) => setCleanListName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#e0c0b2] text-sm text-[#201b14] focus:outline-none focus:ring-2 focus:ring-[#f16f21]"
                  />
                </div>

                <div className="space-y-2 mb-5">
                  <span className="block text-xs font-semibold text-[#584238]">
                    Include Result Categories:
                  </span>

                  <label className="flex items-center gap-3 p-2 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanIncludeDeliverable}
                      onChange={(e) => setCleanIncludeDeliverable(e.target.checked)}
                      className="rounded text-[#f16f21] focus:ring-[#f16f21]"
                    />
                    <span className="text-xs font-semibold text-emerald-800">
                      Deliverable (Recommended)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-2 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanIncludeCatchAll}
                      onChange={(e) => setCleanIncludeCatchAll(e.target.checked)}
                      className="rounded text-[#f16f21] focus:ring-[#f16f21]"
                    />
                    <span className="text-xs font-semibold text-amber-800">
                      Catch-all
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-2 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanIncludeUnknown}
                      onChange={(e) => setCleanIncludeUnknown(e.target.checked)}
                      className="rounded text-[#f16f21] focus:ring-[#f16f21]"
                    />
                    <span className="text-xs font-semibold text-slate-800">
                      Unknown
                    </span>
                  </label>

                  <label className="flex items-center gap-3 p-2 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cleanIncludeUndeliverable}
                      onChange={(e) => setCleanIncludeUndeliverable(e.target.checked)}
                      className="rounded text-[#f16f21] focus:ring-[#f16f21]"
                    />
                    <span className="text-xs font-semibold text-rose-800">
                      Undeliverable
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => setIsCleanListModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg border border-[#e0c0b2] text-xs font-semibold text-[#584238]"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isCreatingCleanList}
                    onClick={handleCreateCleanList}
                    className="px-4 py-2 rounded-lg bg-[#f16f21] text-white text-xs font-semibold hover:bg-[#e05f13] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {isCreatingCleanList ? 'Creating...' : 'Create List'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UPDATE CURRENT LIST MODAL                          */}
      {/* ========================================================= */}
      {isUpdateListModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#e0c0b2] shadow-xl p-6 relative">
            <button
              onClick={() => {
                setIsUpdateListModalOpen(false);
                setUpdateListSuccessMsg(null);
                setUpdateListErrorMsg(null);
              }}
              className="absolute right-4 top-4 text-[#584238] hover:text-[#201b14]"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#14385f] mb-1">
              Update Current List
            </h3>
            <p className="text-xs text-[#584238] mb-4">
              Select which verification categories to keep in <span className="font-semibold text-[#14385f]">"{selectedList?.name}"</span>. Contacts matching unselected categories will be removed from this list.
            </p>

            {updateListSuccessMsg ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">List Updated Successfully</span>
                    {updateListSuccessMsg}
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setIsUpdateListModalOpen(false);
                      setUpdateListSuccessMsg(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-[#14385f] text-white text-xs font-semibold hover:bg-[#1a4472] transition-colors"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <>
                {updateListErrorMsg && (
                  <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    {updateListErrorMsg}
                  </div>
                )}

                <div className="space-y-2 mb-4">
                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateIncludeDeliverable}
                      onChange={(e) => setUpdateIncludeDeliverable(e.target.checked)}
                      className="rounded text-[#f16f21] focus:ring-[#f16f21]"
                    />
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Deliverable
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {activeJob?.deliverable ?? 0}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateIncludeCatchAll}
                      onChange={(e) => setUpdateIncludeCatchAll(e.target.checked)}
                      className="rounded text-[#f16f21] focus:ring-[#f16f21]"
                    />
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Catch-all
                      </span>
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {activeJob?.catchAll ?? 0}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateIncludeUnknown}
                      onChange={(e) => setUpdateIncludeUnknown(e.target.checked)}
                      className="rounded text-[#f16f21] focus:ring-[#f16f21]"
                    />
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                        <HelpCircle className="w-3.5 h-3.5 text-slate-600" />
                        Unknown
                      </span>
                      <span className="text-xs font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {activeJob?.unknown ?? 0}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={updateIncludeUndeliverable}
                      onChange={(e) => setUpdateIncludeUndeliverable(e.target.checked)}
                      className="rounded text-[#f16f21] focus:ring-[#f16f21]"
                    />
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-rose-900 flex items-center gap-1.5">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        Undeliverable
                      </span>
                      <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {activeJob?.undeliverable ?? 0}
                      </span>
                    </div>
                  </label>
                </div>

                {/* Impact calculation */}
                <div className="p-3 rounded-lg bg-[#f9ece1] border border-[#e0c0b2] mb-4 text-xs text-[#584238]">
                  <div className="flex justify-between items-center mb-1">
                    <span>Contacts to keep in list:</span>
                    <span className="font-bold text-[#14385f]">
                      {(updateIncludeDeliverable ? (activeJob?.deliverable ?? 0) : 0) +
                       (updateIncludeCatchAll ? (activeJob?.catchAll ?? 0) : 0) +
                       (updateIncludeUnknown ? (activeJob?.unknown ?? 0) : 0) +
                       (updateIncludeUndeliverable ? (activeJob?.undeliverable ?? 0) : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Contacts to remove:</span>
                    <span className="font-bold text-rose-700">
                      {Math.max(0, (totalResultCount || 0) - (
                        (updateIncludeDeliverable ? (activeJob?.deliverable ?? 0) : 0) +
                        (updateIncludeCatchAll ? (activeJob?.catchAll ?? 0) : 0) +
                        (updateIncludeUnknown ? (activeJob?.unknown ?? 0) : 0) +
                        (updateIncludeUndeliverable ? (activeJob?.undeliverable ?? 0) : 0)
                      ))}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    onClick={() => {
                      setIsUpdateListModalOpen(false);
                      setUpdateListErrorMsg(null);
                    }}
                    className="px-3.5 py-2 rounded-lg border border-[#e0c0b2] text-xs font-semibold text-[#584238] hover:bg-[#f9ece1] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isUpdatingList || (!updateIncludeDeliverable && !updateIncludeCatchAll && !updateIncludeUnknown && !updateIncludeUndeliverable)}
                    onClick={handleUpdateList}
                    className="px-4 py-2 rounded-lg bg-[#14385f] text-white text-xs font-semibold hover:bg-[#1a4472] transition-colors flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#f16f21]" />
                    {isUpdatingList ? 'Updating...' : 'Update List'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: RESULT GUIDE MODAL                               */}
      {/* ========================================================= */}
      {isGuideModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#e0c0b2] shadow-xl p-6 relative">
            <button
              onClick={() => setIsGuideModalOpen(false)}
              className="absolute right-4 top-4 text-[#584238] hover:text-[#201b14]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <Info className="w-5 h-5 text-[#f16f21]" />
              <h3 className="text-base font-bold text-[#14385f]">
                ListGuard Deliverability Signals
              </h3>
            </div>

            <div className="space-y-3.5 text-xs text-[#201b14]">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900 block mb-1">
                  Deliverable
                </span>
                <p className="text-emerald-800">
                  Strong technical signals indicate the address can receive email. This does not mean guaranteed inbox placement.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">
                  Catch-all
                </span>
                <p className="text-amber-800">
                  The receiving domain accepts arbitrary recipients, so mailbox existence cannot be reliably confirmed.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-1">
                  Unknown
                </span>
                <p className="text-slate-800">
                  The system could not establish a reliable result due to mail-server greylisting, temporary timeouts, or rate limits.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <span className="font-bold text-rose-900 block mb-1">
                  Undeliverable
                </span>
                <p className="text-rose-800">
                  Strong technical signals indicate the address cannot receive email (e.g. invalid syntax, nonexistent domain, hard bounce, or disposable address).
                </p>
              </div>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-[#14385f] text-white text-xs font-semibold"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: VERIFICATION HISTORY MODAL                       */}
      {/* ========================================================= */}
      {isHistoryModalOpen && selectedList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#e0c0b2] shadow-xl p-6 relative">
            <button
              onClick={() => setIsHistoryModalOpen(false)}
              className="absolute right-4 top-4 text-[#584238] hover:text-[#201b14]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-[#f16f21]" />
              <h3 className="text-base font-bold text-[#14385f]">
                Verification History: {selectedList.name}
              </h3>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {jobHistory.length === 0 ? (
                <p className="text-xs text-[#584238] py-4 text-center">
                  No previous verification history found.
                </p>
              ) : (
                jobHistory.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      setIsHistoryModalOpen(false);
                      handleOpenResults(h.id, selectedList);
                    }}
                    className="p-3 rounded-lg border border-[#e0c0b2] hover:bg-[#fff8f4] cursor-pointer transition-colors text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-[#14385f]">
                        {new Date(h.completedAt || h.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <p className="text-[#584238] mt-0.5">
                        {h.total} checked • {h.deliverable} Deliverable • {h.catchAll} Catch-all
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#584238]" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
