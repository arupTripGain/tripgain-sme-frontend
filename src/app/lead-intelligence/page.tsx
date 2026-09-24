"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  Sparkles, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileSpreadsheet, 
  Globe, 
  Clipboard, 
  FileText, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Layers,
  Database,
  Eye,
  AlertTriangle,
  FolderOpen,
  XCircle,
  Trash2,
  Loader2,
  StopCircle,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { NewResearchModal } from './NewResearchModal';
import { LeadDetailDrawer } from './LeadDetailDrawer';

type TabType = 'BATCHES' | 'LEADS' | 'SOURCES';

export default function LeadIntelligencePage() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const [activeTab, setActiveTab] = useState<TabType>('BATCHES');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  // Selected Batch filter for Leads tab
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [selectedBatchName, setSelectedBatchName] = useState<string | null>(null);

  // Batches State
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesPage, setBatchesPage] = useState(1);
  const [batchesTotalPages, setBatchesTotalPages] = useState(1);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);

  // Leads State
  const [leads, setLeads] = useState<any[]>([]);
  const [leadCounts, setLeadCounts] = useState({ 
    total: 0, 
    unique: 0, 
    duplicate: 0, 
    possibleDuplicate: 0,
    resolvedHigh: 0,
    resolvedMedium: 0,
    resolvedLow: 0,
    reviewRequired: 0,
    unresolved: 0,
    totalResolved: 0
  });
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsLimit] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [resolutionFilter, setResolutionFilter] = useState('ALL');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('ALL');
  const [hasEmailFilter, setHasEmailFilter] = useState(false);
  const [hasPhoneFilter, setHasPhoneFilter] = useState(false);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);

  // Sources State
  const [sources, setSources] = useState<any[]>([]);
  const [sourcesPage, setSourcesPage] = useState(1);
  const [sourcesTotalPages, setSourcesTotalPages] = useState(1);
  const [isLoadingSources, setIsLoadingSources] = useState(false);

  // Fetch Batches
  const fetchBatches = useCallback(async () => {
    setIsLoadingBatches(true);
    try {
      const res = await apiFetch(`/api/lead-intelligence/batches?page=${batchesPage}&limit=20`);
      if (res.status === 401) return;
      if (!res.ok) throw new Error('Failed to fetch research batches');
      const data = await res.json();
      setBatches(data.batches || []);
      setBatchesTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      console.warn('Error loading batches:', err?.message || err);
    } finally {
      setIsLoadingBatches(false);
    }
  }, [batchesPage]);

  // Fetch Leads
  const fetchLeads = useCallback(async () => {
    setIsLoadingLeads(true);
    try {
      const params = new URLSearchParams({
        page: String(leadsPage),
        limit: String(leadsLimit),
      });

      if (selectedBatchId) params.append('batchId', selectedBatchId);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter !== 'ALL') params.append('dedupeStatus', statusFilter);
      if (resolutionFilter !== 'ALL') params.append('resolutionStatus', resolutionFilter);
      if (sourceTypeFilter !== 'ALL') params.append('sourceType', sourceTypeFilter);
      if (hasEmailFilter) params.append('hasEmail', 'true');
      if (hasPhoneFilter) params.append('hasPhone', 'true');

      const res = await apiFetch(`/api/lead-intelligence/leads?${params.toString()}`);
      if (res.status === 401) return;
      if (!res.ok) throw new Error('Failed to fetch leads');
      const data = await res.json();
      setLeads(data.leads || []);
      setLeadCounts(data.counts || { 
        total: 0, 
        unique: 0, 
        duplicate: 0, 
        possibleDuplicate: 0,
        resolvedHigh: 0,
        resolvedMedium: 0,
        resolvedLow: 0,
        reviewRequired: 0,
        unresolved: 0,
        totalResolved: 0
      });
      setLeadsTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      console.warn('Error loading leads:', err?.message || err);
    } finally {
      setIsLoadingLeads(false);
    }
  }, [leadsPage, leadsLimit, selectedBatchId, searchQuery, statusFilter, resolutionFilter, sourceTypeFilter, hasEmailFilter, hasPhoneFilter]);

  // Fetch Sources
  const fetchSources = useCallback(async () => {
    setIsLoadingSources(true);
    try {
      const res = await apiFetch(`/api/lead-intelligence/sources?page=${sourcesPage}&limit=20`);
      if (res.status === 401) return;
      if (!res.ok) throw new Error('Failed to fetch sources');
      const data = await res.json();
      setSources(data.sources || []);
      setSourcesTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      console.warn('Error loading sources:', err?.message || err);
    } finally {
      setIsLoadingSources(false);
    }
  }, [sourcesPage]);

  // Auto poll active batches (6s interval)
  useEffect(() => {
    fetchBatches();
    const interval = setInterval(() => {
      const hasActive = batches.some(b => 
        ['DISCOVERING', 'EXTRACTING', 'QUEUED', 'NORMALIZING', 'DEDUPLICATING', 'RESOLVING_DOMAINS'].includes(b.status)
      );
      if (hasActive) {
        fetchBatches();
      }
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchBatches, batches]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (activeTab === 'SOURCES') {
      fetchSources();
    }
  }, [activeTab, fetchSources]);

  // Batch Handlers
  const handleReviewBatch = (batch: any) => {
    setSelectedBatchId(batch.id);
    setSelectedBatchName(batch.name);
    setLeadsPage(1);
    setActiveTab('LEADS');
  };

  const handleClearBatchFilter = () => {
    setSelectedBatchId(null);
    setSelectedBatchName(null);
    setLeadsPage(1);
  };

  const handleExportBatchCsv = async (batchId: string, batchName: string) => {
    try {
      const res = await apiFetch(`/api/lead-intelligence/batches/${batchId}/export`);
      if (!res.ok) throw new Error('Failed to download batch CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = batchName.replace(/[^a-zA-Z0-9_\-]/g, '_');
      a.download = `${safeName}_export_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export batch failed:', err);
      alert('Failed to export batch CSV. Please try again.');
    }
  };

  const handleCancelBatch = async (batchId: string) => {
    if (!confirm('Are you sure you want to stop processing this research batch?')) return;
    try {
      const res = await apiFetch(`/api/lead-intelligence/batches/${batchId}/cancel`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to cancel batch');
      await fetchBatches();
    } catch (err) {
      console.error('Cancel batch error:', err);
      alert('Failed to cancel batch.');
    }
  };

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to delete batch "${batchName}" and all its extracted leads?`)) return;
    try {
      const res = await apiFetch(`/api/lead-intelligence/batches/${batchId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete batch');
      if (selectedBatchId === batchId) {
        handleClearBatchFilter();
      }
      await fetchBatches();
      await fetchLeads();
    } catch (err) {
      console.error('Delete batch error:', err);
      alert('Failed to delete batch.');
    }
  };

  const handleExportAllLeadsCsv = async () => {
    if (selectedBatchId && selectedBatchName) {
      return handleExportBatchCsv(selectedBatchId, selectedBatchName);
    }

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (statusFilter !== 'ALL') params.append('dedupeStatus', statusFilter);
      if (sourceTypeFilter !== 'ALL') params.append('sourceType', sourceTypeFilter);

      const res = await apiFetch(`/api/lead-intelligence/export?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to download CSV');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lead_intelligence_export_${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export leads. Please try again.');
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'CSV':
      case 'XLSX':
        return <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />;
      case 'PDF':
        return <FileText className="w-3.5 h-3.5 text-rose-600" />;
      case 'PASTED_TEXT':
        return <Clipboard className="w-3.5 h-3.5 text-amber-600" />;
      case 'WEBSITE':
        return <Globe className="w-3.5 h-3.5 text-blue-600" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'UNIQUE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Unique
          </span>
        );
      case 'DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3 h-3" /> Duplicate
          </span>
        );
      case 'POSSIBLE_DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Review Match
          </span>
        );
      default:
        return null;
    }
  };

  const getResolutionBadge = (status: string) => {
    switch (status) {
      case 'RESOLVED_HIGH':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Resolved (High)
          </span>
        );
      case 'RESOLVED_MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3" /> Resolved (Med)
          </span>
        );
      case 'RESOLVED_LOW':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
            <Clock className="w-3 h-3" /> Resolved (Low)
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Review Req
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            Unresolved
          </span>
        );
    }
  };

  const getBatchStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'REVIEW_REQUIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Review Required
          </span>
        );
      case 'RESOLVING_DOMAINS':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Resolving Domains...
          </span>
        );
      case 'NORMALIZING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Normalizing...
          </span>
        );
      case 'DEDUPLICATING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> Deduplicating...
          </span>
        );
      case 'QUEUED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> Queued
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" /> Partial
          </span>
        );
      case 'EXTRACTING':
      case 'DISCOVERING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" /> {status === 'DISCOVERING' ? 'Discovering...' : 'Extracting...'}
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
            <StopCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
            {status}
          </span>
        );
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-full min-h-[500px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-16 text-center">
        <div className="p-8 rounded-2xl bg-card border border-border shadow-lg space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Admin Access Required</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Lead Intelligence is restricted to administrators only. Your current role is <span className="font-semibold text-foreground uppercase">{user?.role || 'MEMBER'}</span>.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/leads"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Leads
            </Link>
            <Link
              href="/campaigns"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/60 transition-colors"
            >
              Go to Campaigns
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" /> Lead Intelligence Hub
            </h1>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              Phase 1 · Local
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Deterministic multi-source ingestion, legal suffix normalization, generic pagination engine, and persistent Research Batches.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportAllLeadsCsv}
            disabled={leadCounts.total === 0}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> 
            {selectedBatchId ? 'Export Entire Batch' : 'Export CSV'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Ingest Leads
          </button>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Exhibitors</span>
          <div className="text-2xl font-bold text-foreground mt-1">{leadCounts.total}</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Across all active batches</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Domains Resolved</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{leadCounts.totalResolved}</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">{leadCounts.resolvedHigh} High · {leadCounts.resolvedMedium} Med</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-700">Review Required</span>
          <div className="text-2xl font-bold text-amber-700 mt-1">{leadCounts.reviewRequired}</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Candidates need human review</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Unresolved</span>
          <div className="text-2xl font-bold text-muted-foreground mt-1">{leadCounts.unresolved}</div>
          <span className="text-[11px] text-muted-foreground mt-0.5 block">Zero domain discovered</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('BATCHES')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'BATCHES'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          Research Batches ({batches.length})
        </button>
        <button
          onClick={() => setActiveTab('LEADS')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'LEADS'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Database className="w-4 h-4" />
          Leads Review Table ({leadCounts.total})
          {selectedBatchId && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary">
              Filtered
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('SOURCES')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'SOURCES'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Layers className="w-4 h-4" />
          Ingestion Sources ({sources.length})
        </button>
      </div>

      {/* TAB 1: RESEARCH BATCHES */}
      {activeTab === 'BATCHES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Every Lead Intelligence research job creates a persistent Research Batch container.
            </div>
            <button
              onClick={() => fetchBatches()}
              className="p-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground text-xs flex items-center gap-1"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBatches ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>

          {batches.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card">
              <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-sm font-bold text-foreground">No Research Batches Yet</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Start a research job by uploading a directory, Excel file, or entering a conference exhibitor URL.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start Ingestion
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.map((batch) => {
                const isRunning = batch.status === 'DISCOVERING' || batch.status === 'EXTRACTING';
                const percent = batch.totalPages > 0 
                  ? Math.min(100, Math.round((batch.pagesProcessed / batch.totalPages) * 100))
                  : 0;

                return (
                  <div key={batch.id} className="p-5 rounded-xl bg-card border border-border shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            {batch.name}
                          </h3>
                          {batch.sourceUrl && (
                            <a
                              href={batch.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5 max-w-md truncate"
                            >
                              <Globe className="w-3 h-3 shrink-0" />
                              {batch.sourceUrl}
                              <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                            </a>
                          )}
                        </div>
                        <div>
                          {getBatchStatusBadge(batch.status)}
                        </div>
                      </div>

                      {/* Progress bar if active */}
                      {isRunning && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Progress ({batch.pagesProcessed} / {batch.totalPages} pages)</span>
                            <span>{percent}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-300"
                              style={{ width: `${Math.max(5, percent)}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Statistics Chips */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/60 text-xs">
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Stage</span>
                          <span className="font-bold text-foreground truncate block text-[11px]">
                            {batch.stage || batch.status}
                          </span>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Exhibitors</span>
                          <span className="font-bold text-foreground">
                            {batch.recordsDiscovered || batch._count?.leads || 0}
                          </span>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Resolved</span>
                          <span className="font-bold text-emerald-700">
                            {batch.domainsResolved ?? 0}
                          </span>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Review Req</span>
                          <span className="font-bold text-amber-700">
                            {batch.reviewRequired ?? 0}
                          </span>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Unresolved</span>
                          <span className="font-bold text-muted-foreground">
                            {batch.domainsUnresolved ?? 0}
                          </span>
                        </div>
                        <div className="bg-muted/30 p-2 rounded-lg">
                          <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Created</span>
                          <span className="text-[11px] text-foreground">
                            {new Date(batch.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {batch.errorMessage && (
                        <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>{batch.errorMessage}</span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleReviewBatch(batch)}
                          className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center gap-1"
                        >
                          <Database className="w-3 h-3" /> Review Leads
                        </button>
                        <button
                          onClick={() => handleExportBatchCsv(batch.id, batch.name)}
                          className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-border bg-card text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Export CSV
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        {isRunning && (
                          <button
                            onClick={() => handleCancelBatch(batch.id)}
                            className="p-1.5 text-xs font-semibold rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            title="Cancel Processing"
                          >
                            <StopCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteBatch(batch.id, batch.name)}
                          className="p-1.5 text-xs font-semibold rounded-lg border border-border text-muted-foreground hover:text-rose-700 hover:bg-rose-50 transition-colors"
                          title="Delete Batch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: LEADS REVIEW TABLE */}
      {activeTab === 'LEADS' && (
        <div className="space-y-4">
          {/* Active Batch Filter Banner */}
          {selectedBatchId && (
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-primary" />
                <span>
                  Filtering leads for Research Batch: <strong>{selectedBatchName || selectedBatchId}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => selectedBatchId && selectedBatchName && handleExportBatchCsv(selectedBatchId, selectedBatchName)}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border text-foreground hover:bg-muted flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Export Entire Batch
                </button>
                <button
                  onClick={handleClearBatchFilter}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-card border border-border text-muted-foreground hover:text-foreground"
                >
                  Clear Filter
                </button>
              </div>
            </div>
          )}

          {/* Search and Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card p-3 rounded-xl border border-border">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search company, contact, email, city, domain..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setLeadsPage(1); }}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={resolutionFilter}
                onChange={(e) => { setResolutionFilter(e.target.value); setLeadsPage(1); }}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground font-medium"
              >
                <option value="ALL">All Resolutions</option>
                <option value="RESOLVED_HIGH">Resolved (High)</option>
                <option value="RESOLVED_MEDIUM">Resolved (Medium)</option>
                <option value="RESOLVED_LOW">Resolved (Low)</option>
                <option value="REVIEW_REQUIRED">Review Required</option>
                <option value="UNRESOLVED">Unresolved</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setLeadsPage(1); }}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground"
              >
                <option value="ALL">All Dedupe Statuses</option>
                <option value="UNIQUE">Unique</option>
                <option value="DUPLICATE">Duplicates</option>
                <option value="POSSIBLE_DUPLICATE">Review Matches</option>
              </select>

              <select
                value={sourceTypeFilter}
                onChange={(e) => { setSourceTypeFilter(e.target.value); setLeadsPage(1); }}
                className="px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background text-foreground"
              >
                <option value="ALL">All Source Types</option>
                <option value="WEBSITE">Website / Directory</option>
                <option value="CSV">CSV</option>
                <option value="XLSX">Excel (XLSX)</option>
                <option value="PDF">PDF</option>
                <option value="PASTED_TEXT">Pasted Text</option>
              </select>
            </div>
          </div>

          {/* Leads Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                  <th className="py-3 px-3 font-semibold text-center w-12 text-muted-foreground">#</th>
                  <th className="py-3 px-4 font-semibold">Exhibitor / Company</th>
                  <th className="py-3 px-4 font-semibold">Website / Domain</th>
                  <th className="py-3 px-3 font-semibold">Booth / Hall</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Resolution Status</th>
                  <th className="py-3 px-4 font-semibold">Source / Conf</th>
                  <th className="py-3 px-3 font-semibold">Dedupe</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoadingLeads ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                      Loading lead intelligence records...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-muted-foreground">
                      No records match the selected filters.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead, idx) => (
                    <tr 
                      key={lead.id} 
                      onClick={() => setSelectedLeadId(lead.id)}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-xs font-mono font-medium text-muted-foreground/80">
                        {(leadsPage - 1) * leadsLimit + idx + 1}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-foreground">{lead.companyName}</div>
                        {lead.rawName && lead.rawName !== lead.companyName ? (
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px]" title={lead.rawName}>
                            Raw: {lead.rawName}
                          </div>
                        ) : null}
                      </td>
                      <td className="py-3 px-4">
                        {lead.websiteUrl || lead.domain ? (
                          <a
                            href={lead.websiteUrl || `https://${lead.domain}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-primary hover:underline flex items-center gap-1 font-mono text-[11px]"
                          >
                            <Globe className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[160px]">{lead.domain || lead.websiteUrl}</span>
                            <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground italic text-[11px]">Unresolved</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-foreground">
                        {lead.boothNumber || lead.hallNumber ? (
                          <span>
                            {lead.boothNumber ? `B: ${lead.boothNumber}` : ''}
                            {lead.boothNumber && lead.hallNumber ? ' · ' : ''}
                            {lead.hallNumber ? `H: ${lead.hallNumber}` : ''}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground truncate max-w-[130px]">
                        {lead.category || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {getResolutionBadge(lead.resolutionStatus)}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[11px] font-medium text-foreground">
                          {lead.resolutionSource || '—'}
                        </div>
                        {lead.resolutionEvidence && (
                          <div 
                            className="text-[10px] text-muted-foreground truncate max-w-[150px]"
                            title={typeof lead.resolutionEvidence === 'object' ? (lead.resolutionEvidence.evidence || JSON.stringify(lead.resolutionEvidence)) : String(lead.resolutionEvidence)}
                          >
                            {typeof lead.resolutionEvidence === 'object' ? (lead.resolutionEvidence.evidence || '') : String(lead.resolutionEvidence)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        {getStatusBadge(lead.dedupeStatus)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedLeadId(lead.id); }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-border bg-card hover:bg-muted text-foreground"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="p-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground bg-muted/10">
              <div>
                Page {leadsPage} of {leadsTotalPages} · Showing {leads.length} of {leadCounts.total} records
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setLeadsPage(Math.max(1, leadsPage - 1))}
                  disabled={leadsPage <= 1}
                  className="p-1 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setLeadsPage(Math.min(leadsTotalPages, leadsPage + 1))}
                  disabled={leadsPage >= leadsTotalPages}
                  className="p-1 rounded-md border border-border bg-card text-foreground hover:bg-muted disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INGESTION SOURCES */}
      {activeTab === 'SOURCES' && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                <th className="py-3 px-4 font-semibold">Source Name</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Total Records</th>
                <th className="py-3 px-4 font-semibold">Valid</th>
                <th className="py-3 px-4 font-semibold">Duplicates</th>
                <th className="py-3 px-4 font-semibold">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoadingSources ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading ingestion sources...
                  </td>
                </tr>
              ) : sources.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    No ingestion sources recorded yet.
                  </td>
                </tr>
              ) : (
                sources.map((src) => (
                  <tr key={src.id} className="hover:bg-muted/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {src.name}
                      {src.url && (
                        <a href={src.url} target="_blank" rel="noreferrer" className="text-[11px] text-primary block hover:underline">
                          {src.url}
                        </a>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {getSourceIcon(src.sourceType)}
                        <span>{src.sourceType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {src.status === 'COMPLETED' ? (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Completed
                        </span>
                      ) : src.status === 'PARTIAL' ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Partial
                        </span>
                      ) : src.status === 'PROCESSING' ? (
                        <span className="text-blue-700 font-semibold flex items-center gap-1 animate-pulse">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Processing
                        </span>
                      ) : (
                        <span className="text-rose-700 font-semibold">{src.status}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold">{src.recordCount}</td>
                    <td className="py-3 px-4 text-emerald-700">{src.validCount}</td>
                    <td className="py-3 px-4 text-rose-700">{src.duplicateCount}</td>
                    <td className="py-3 px-4 text-muted-foreground">{new Date(src.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals & Drawers */}
      <NewResearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchBatches();
          fetchLeads();
          fetchSources();
        }}
      />

      <LeadDetailDrawer
        leadId={selectedLeadId}
        onClose={() => setSelectedLeadId(null)}
        onStatusUpdated={() => fetchLeads()}
      />
    </div>
  );
}
