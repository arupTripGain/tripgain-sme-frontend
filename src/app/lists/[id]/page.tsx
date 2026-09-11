"use client";

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { 
  ArrowLeft, Search, Filter, FileDown, MoreHorizontal, Building2, UploadCloud, UserPlus, Megaphone,
  Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Eye, X, Clock, AlertCircle, ShieldCheck, ChevronDown, Check
} from 'lucide-react';

type PersonalizationFilterType = 'ALL' | 'GENERATED' | 'MISSING' | 'FAILED' | 'GENERATING';

export default function ListDashboardPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [personalizationStats, setPersonalizationStats] = useState<any>(null);
  const [activePreviewContact, setActivePreviewContact] = useState<any | null>(null);
  const [generatingContactId, setGeneratingContactId] = useState<string | null>(null);

  // Search, Filter & Multi-Select State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PersonalizationFilterType>('ALL');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Bulk Personalization state for this list
  const [bulkJob, setBulkJob] = useState<{ id: string; total: number; processed: number; successful: number; failed: number; status: string; progressPct: number } | null>(null);
  const [isStartingBulk, setIsStartingBulk] = useState(false);

  const fetchListData = () => {
    apiFetch(`/api/lists/${id}`)
      .then(res => res.json())
      .then(data => {
        setList(data);
        setLoading(false);
      })
      .catch(console.error);

    apiFetch(`/api/lists/${id}/personalization-stats`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setPersonalizationStats(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchListData();
  }, [id]);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setIsFilterDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Poll active bulk personalization job
  useEffect(() => {
    if (!bulkJob || bulkJob.status === 'COMPLETED' || bulkJob.status === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch(`/api/contacts/personalization-jobs/${bulkJob.id}`);
        if (res.ok) {
          const data = await res.json();
          setBulkJob(data);
          if (data.status === 'COMPLETED' || data.status === 'FAILED') {
            fetchListData();
          }
        }
      } catch (err) {
        console.error('Error polling bulk job:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [bulkJob]);

  const contacts = list?.contacts || [];

  // Helper to categorize contact status
  const getContactStatusCategory = (contact: any): 'GENERATED' | 'MISSING' | 'FAILED' | 'GENERATING' => {
    if (generatingContactId === contact.id || contact.personalizationStatus === 'GENERATING') {
      return 'GENERATING';
    }
    if (contact.personalizedLine && (contact.personalizationStatus === 'GENERATED' || !contact.personalizationStatus)) {
      return 'GENERATED';
    }
    if (contact.personalizationStatus === 'FAILED' || contact.personalizationStatus === 'NO_USEFUL_DATA') {
      return 'FAILED';
    }
    return 'MISSING';
  };

  // Real-time counts computed from contacts array
  const statusCounts = {
    ALL: contacts.length,
    GENERATED: contacts.filter((c: any) => getContactStatusCategory(c) === 'GENERATED').length,
    MISSING: contacts.filter((c: any) => getContactStatusCategory(c) === 'MISSING').length,
    FAILED: contacts.filter((c: any) => getContactStatusCategory(c) === 'FAILED').length,
    GENERATING: contacts.filter((c: any) => getContactStatusCategory(c) === 'GENERATING').length,
  };

  // Filtered contacts based on search query and status filter
  const filteredContacts = contacts.filter((contact: any) => {
    const cat = getContactStatusCategory(contact);
    if (statusFilter !== 'ALL' && cat !== statusFilter) {
      return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (contact.fullName || '').toLowerCase();
      const comp = (contact.companyName || '').toLowerCase();
      const email = (contact.email || '').toLowerCase();
      const title = (contact.jobTitle || '').toLowerCase();
      const ind = (contact.industry || '').toLowerCase();
      if (!name.includes(q) && !comp.includes(q) && !email.includes(q) && !title.includes(q) && !ind.includes(q)) {
        return false;
      }
    }

    return true;
  });

  // Bulk Personalization Trigger
  const handleBulkPersonalize = async (targetContactIds?: string[], force = false) => {
    setIsStartingBulk(true);
    try {
      const payload: any = { listId: id, force };
      if (targetContactIds && targetContactIds.length > 0) {
        payload.contactIds = targetContactIds;
      } else {
        payload.onlyMissing = true;
      }

      const res = await apiFetch('/api/contacts/bulk-personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setBulkJob({
          id: data.jobId,
          total: data.total,
          processed: 0,
          successful: 0,
          failed: 0,
          status: data.status,
          progressPct: 0
        });
        setSelectedContactIds(new Set());
      } else {
        if (data.code === 'AI_PROVIDER_NOT_CONFIGURED') {
          if (confirm(`${data.error}\n\nWould you like to go to Settings to connect your AI API key now?`)) {
            window.location.href = '/settings';
          }
        } else {
          alert(data.error || 'Failed to start personalization');
        }
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error starting personalization');
    } finally {
      setIsStartingBulk(false);
    }
  };

  const handleGenerateMissing = async () => {
    const missingContacts = contacts.filter((c: any) => getContactStatusCategory(c) === 'MISSING');
    if (missingContacts.length === 0) {
      alert('All contacts in this list already have personalizations.');
      return;
    }
    await handleBulkPersonalize(missingContacts.map((c: any) => c.id), false);
  };

  const handleRegenerateFailed = async () => {
    const failedContacts = contacts.filter((c: any) => getContactStatusCategory(c) === 'FAILED');
    if (failedContacts.length === 0) {
      alert('No failed contacts found to regenerate.');
      return;
    }
    await handleBulkPersonalize(failedContacts.map((c: any) => c.id), true);
  };

  const handleRegenerateSelected = async () => {
    if (selectedContactIds.size === 0) return;
    await handleBulkPersonalize(Array.from(selectedContactIds), true);
  };

  const handleSingleGenerate = async (contactId: string, force = true) => {
    setGeneratingContactId(contactId);
    try {
      const res = await apiFetch(`/api/contacts/${contactId}/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      if (res.ok) {
        fetchListData();
      } else {
        if (data.code === 'AI_PROVIDER_NOT_CONFIGURED') {
          if (confirm(`${data.error}\n\nWould you like to go to Settings to connect your AI API key now?`)) {
            window.location.href = '/settings';
          }
        } else {
          alert(data.error || 'Failed to personalize contact');
        }
      }
    } catch (e: any) {
      console.error(e);
      alert('Error personalizing contact');
    } finally {
      setGeneratingContactId(null);
    }
  };

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedContactIds.size === filteredContacts.length) {
      setSelectedContactIds(new Set());
    } else {
      setSelectedContactIds(new Set(filteredContacts.map((c: any) => c.id)));
    }
  };

  const toggleSelectContact = (contactId: string) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      if (next.has(contactId)) next.delete(contactId);
      else next.add(contactId);
      return next;
    });
  };

  // CSV Export
  const handleExportCsv = (contactList: any[]) => {
    if (contactList.length === 0) {
      alert('No contacts to export');
      return;
    }
    const headers = ['Name', 'Company', 'Job Title', 'Email', 'Personalization Status', 'Personalized Line', 'Industry'];
    const rows = contactList.map((c: any) => [
      c.fullName || '',
      c.companyName || '',
      c.jobTitle || '',
      c.email || '',
      c.personalizationStatus || (c.personalizedLine ? 'GENERATED' : 'MISSING'),
      (c.personalizedLine || '').replace(/"/g, '""'),
      c.industry || ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(list?.name || 'contacts').replace(/\s+/g, '_')}_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-8">Loading list...</div>;
  if (!list || list.error) return <div className="p-8 text-red-500">List not found.</div>;

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa]">
      
      {/* Header */}
      <div className="flex flex-col border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between px-8 py-6 border-b border-border">
          <div className="flex items-center gap-4">
            <Link href="/leads" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-heading text-2xl font-bold text-secondary">{list.name}</h1>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${list.listType === 'dynamic' ? 'bg-purple-100 text-purple-800' : list.listType === 'system' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'}`}>
                  {list.listType}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{contacts.length} Contacts Enrolled</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/leads/import')}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-accent h-10 px-4 gap-2 shadow-sm text-secondary transition-colors"
            >
              <UploadCloud className="h-4 w-4 text-muted-foreground" /> Import CSV
            </button>
            <button 
              onClick={() => router.push('/leads/new')}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-accent h-10 px-4 gap-2 shadow-sm text-secondary transition-colors"
            >
              <UserPlus className="h-4 w-4 text-muted-foreground" /> Add Contacts
            </button>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2 shadow-sm transition-colors">
              <Megaphone className="h-4 w-4" /> Create Campaign
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        
        {/* Personalization Summary Banner */}
        <div className="rounded-xl border border-purple-200/70 bg-gradient-to-r from-purple-500/5 via-indigo-500/5 to-transparent p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-purple-600/10 text-purple-600 border border-purple-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-secondary">AI Personalization Engine</h3>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    TripGain Cold Icebreakers
                  </span>
                </div>
                
                {/* Clickable Interactive Filter Pills */}
                <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                  {/* Generated Pill */}
                  <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === 'GENERATED' ? 'ALL' : 'GENERATED')}
                    className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      statusFilter === 'GENERATED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400/30'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200'
                    }`}
                    title="Click to filter by Generated"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {statusCounts.GENERATED} Generated
                  </button>

                  {/* Missing Pill */}
                  <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === 'MISSING' ? 'ALL' : 'MISSING')}
                    className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      statusFilter === 'MISSING'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400/30'
                        : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200'
                    }`}
                    title="Click to filter by Missing"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {statusCounts.MISSING} Missing
                  </button>

                  {/* Failed / No Data Pill */}
                  <button
                    type="button"
                    onClick={() => setStatusFilter(statusFilter === 'FAILED' ? 'ALL' : 'FAILED')}
                    className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                      statusFilter === 'FAILED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-400/30'
                        : 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
                    }`}
                    title="Click to filter by Failed / No Data"
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    {statusCounts.FAILED} Failed / No Data
                  </button>

                  {/* Generating Pill */}
                  {statusCounts.GENERATING > 0 && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter(statusFilter === 'GENERATING' ? 'ALL' : 'GENERATING')}
                      className={`inline-flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        statusFilter === 'GENERATING'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm ring-2 ring-blue-400/30'
                          : 'text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200'
                      }`}
                      title="Click to filter by Generating"
                    >
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      {statusCounts.GENERATING} Generating
                    </button>
                  )}

                  {/* Clear Filter if active */}
                  {statusFilter !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className="text-[11px] text-purple-700 font-semibold hover:underline flex items-center gap-0.5 ml-1"
                    >
                      <X className="w-3 h-3" /> Reset Filter
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons in Banner */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Regenerate Failed Button */}
              {statusCounts.FAILED > 0 && (
                <button
                  type="button"
                  onClick={handleRegenerateFailed}
                  disabled={Boolean(isStartingBulk || (bulkJob && (bulkJob.status === 'PENDING' || bulkJob.status === 'PROCESSING')))}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  title="Regenerate all failed contacts using the active AI model"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isStartingBulk ? 'animate-spin' : ''}`} />
                  Regenerate Failed ({statusCounts.FAILED})
                </button>
              )}

              {/* Generate Missing Button */}
              <button
                type="button"
                onClick={handleGenerateMissing}
                disabled={Boolean(isStartingBulk || (bulkJob && (bulkJob.status === 'PENDING' || bulkJob.status === 'PROCESSING')) || statusCounts.MISSING === 0)}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-xs shadow hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isStartingBulk ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Starting...
                  </>
                ) : (bulkJob && (bulkJob.status === 'PENDING' || bulkJob.status === 'PROCESSING')) ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Generating ({bulkJob.processed}/{bulkJob.total})...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Missing ({statusCounts.MISSING})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Job Progress Bar */}
          {bulkJob && (bulkJob.status === 'PENDING' || bulkJob.status === 'PROCESSING') && (
            <div className="mt-4 pt-4 border-t border-purple-100">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                  Generating icebreakers for this list: {bulkJob.processed} / {bulkJob.total} leads
                </span>
                <span className="text-purple-700 font-bold">
                  {bulkJob.progressPct || Math.round((bulkJob.processed / (bulkJob.total || 1)) * 100)}%
                </span>
              </div>
              <div className="w-full bg-purple-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${bulkJob.progressPct || Math.round((bulkJob.processed / (bulkJob.total || 1)) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Filter Tabs & Toolbar */}
        <div className="space-y-3">
          {/* Quick Filter Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap border-b border-gray-200 pb-2.5">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-[#14385F] text-white shadow-sm'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              All ({statusCounts.ALL})
            </button>
            <button
              onClick={() => setStatusFilter('GENERATED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'GENERATED'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
              }`}
            >
              <CheckCircle2 className="w-3 h-3" />
              Generated ({statusCounts.GENERATED})
            </button>
            <button
              onClick={() => setStatusFilter('MISSING')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'MISSING'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white text-amber-700 hover:bg-amber-50 border border-amber-200'
              }`}
            >
              <Clock className="w-3 h-3" />
              Missing ({statusCounts.MISSING})
            </button>
            <button
              onClick={() => setStatusFilter('FAILED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                statusFilter === 'FAILED'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              Failed / No Data ({statusCounts.FAILED})
            </button>
            {statusCounts.GENERATING > 0 && (
              <button
                onClick={() => setStatusFilter('GENERATING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  statusFilter === 'GENERATING'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                }`}
              >
                <RefreshCw className="w-3 h-3 animate-spin" />
                Generating ({statusCounts.GENERATING})
              </button>
            )}
          </div>

          {/* Search, Filter & Bulk Actions Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input with Clear Button */}
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, email, role..." 
                className="w-full h-10 pl-9 pr-9 rounded-md border border-input bg-card text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Toolbar Buttons */}
            <div className="flex items-center gap-3">
              {/* Working Filter Dropdown */}
              <div className="relative" ref={filterDropdownRef}>
                <button 
                  onClick={() => setIsFilterDropdownOpen(prev => !prev)}
                  className={`inline-flex items-center justify-center rounded-md text-sm font-medium border h-10 px-4 gap-2 shadow-sm transition-colors cursor-pointer ${
                    statusFilter !== 'ALL'
                      ? 'bg-purple-50 text-purple-800 border-purple-300 font-semibold'
                      : 'border-border bg-card hover:bg-accent text-secondary'
                  }`}
                >
                  <Filter className={`h-4 w-4 ${statusFilter !== 'ALL' ? 'text-purple-600' : 'text-muted-foreground'}`} />
                  Filter
                  {statusFilter !== 'ALL' && (
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span>
                  )}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60 ml-0.5" />
                </button>

                {/* Filter Popover Dropdown */}
                {isFilterDropdownOpen && (
                  <div className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 p-2 animate-in fade-in space-y-1">
                    <div className="px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Filter by Personalization
                    </div>
                    
                    <button
                      onClick={() => { setStatusFilter('ALL'); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        statusFilter === 'ALL' ? 'bg-gray-100 text-gray-900 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>All Contacts</span>
                      <span className="text-gray-400 text-[11px]">({statusCounts.ALL})</span>
                    </button>

                    <button
                      onClick={() => { setStatusFilter('GENERATED'); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        statusFilter === 'GENERATED' ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Generated
                      </span>
                      <span className="text-emerald-700 text-[11px]">({statusCounts.GENERATED})</span>
                    </button>

                    <button
                      onClick={() => { setStatusFilter('MISSING'); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        statusFilter === 'MISSING' ? 'bg-amber-50 text-amber-900 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        Missing
                      </span>
                      <span className="text-amber-700 text-[11px]">({statusCounts.MISSING})</span>
                    </button>

                    <button
                      onClick={() => { setStatusFilter('FAILED'); setIsFilterDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                        statusFilter === 'FAILED' ? 'bg-rose-50 text-rose-900 font-bold' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        Failed / No Data
                      </span>
                      <span className="text-rose-700 text-[11px]">({statusCounts.FAILED})</span>
                    </button>

                    {statusCounts.GENERATING > 0 && (
                      <button
                        onClick={() => { setStatusFilter('GENERATING'); setIsFilterDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors ${
                          statusFilter === 'GENERATING' ? 'bg-blue-50 text-blue-900 font-bold' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                          Generating
                        </span>
                        <span className="text-blue-700 text-[11px]">({statusCounts.GENERATING})</span>
                      </button>
                    )}

                    {statusFilter !== 'ALL' && (
                      <div className="pt-2 border-t border-gray-100">
                        <button
                          onClick={() => { setStatusFilter('ALL'); setIsFilterDropdownOpen(false); }}
                          className="w-full text-center py-1 text-xs text-rose-600 hover:underline font-semibold"
                        >
                          Clear Filter
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Export Button */}
              <button 
                onClick={() => handleExportCsv(filteredContacts)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-accent h-10 px-4 gap-2 shadow-sm text-secondary transition-colors cursor-pointer"
                title="Export current view as CSV"
              >
                <FileDown className="h-4 w-4 text-muted-foreground" /> Export
              </button>
            </div>
          </div>

          {/* Active Selection Bulk Action Bar */}
          {selectedContactIds.size > 0 && (
            <div className="bg-[#14385F] text-white px-4 py-2.5 rounded-lg flex items-center justify-between text-xs shadow-md animate-in fade-in">
              <span className="font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                {selectedContactIds.size} of {filteredContacts.length} contacts selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateSelected}
                  disabled={isStartingBulk}
                  className="bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-md font-semibold text-white shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Regenerate Selected ({selectedContactIds.size})
                </button>
                <button
                  onClick={() => handleExportCsv(contacts.filter((c: any) => selectedContactIds.has(c.id)))}
                  className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-md font-semibold text-white transition-colors cursor-pointer"
                >
                  Export Selected
                </button>
                <button
                  onClick={() => setSelectedContactIds(new Set())}
                  className="text-white/70 hover:text-white px-2 py-1 transition-colors cursor-pointer ml-1"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contacts Table Container */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="w-12 px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={filteredContacts.length > 0 && selectedContactIds.size === filteredContacts.length}
                      onChange={toggleSelectAll}
                      className="rounded border-input text-primary focus:ring-primary cursor-pointer" 
                    />
                  </th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Name</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Company</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Job Title</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Email</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Personalization</th>
                  <th className="px-6 py-4 font-medium whitespace-nowrap">Industry</th>
                  <th className="w-12 px-6 py-4"></th>
                </tr>
              </thead>
            <tbody>
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-8 h-8 text-gray-300" />
                      <p className="font-semibold text-sm text-gray-600">No contacts match the current filter.</p>
                      {statusFilter !== 'ALL' && (
                        <button
                          onClick={() => setStatusFilter('ALL')}
                          className="text-xs text-purple-600 hover:underline font-semibold"
                        >
                          Clear filter to show all {contacts.length} contacts
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact: any) => {
                  const isGeneratingThis = generatingContactId === contact.id || contact.personalizationStatus === 'GENERATING';
                  const isSelected = selectedContactIds.has(contact.id);

                  return (
                    <tr 
                      key={contact.id} 
                      className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors group ${
                        isSelected ? 'bg-purple-50/40' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => toggleSelectContact(contact.id)}
                          className="rounded border-input text-primary focus:ring-primary cursor-pointer" 
                        />
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        <Link href={`/leads/${contact.id}`} className="hover:text-primary transition-colors">
                          {contact.fullName || '-'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-secondary flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase shrink-0">
                          {contact.companyName ? contact.companyName.substring(0, 2) : '?'}
                        </div>
                        <span className="truncate max-w-[160px]">{contact.companyName || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        <span className="truncate max-w-[150px] inline-block">{contact.jobTitle || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{contact.email || '-'}</td>
                      
                      {/* Personalization Column */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {isGeneratingThis ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              Generating
                            </span>
                          ) : contact.personalizedLine ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePreviewContact(contact);
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-200 transition-colors group cursor-pointer"
                              title="Click to preview personalization"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Generated
                              <Eye className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5" />
                            </button>
                          ) : contact.personalizationStatus === 'NO_USEFUL_DATA' ? (
                            <button
                              onClick={() => handleSingleGenerate(contact.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200 transition-colors cursor-pointer"
                              title="Click to re-try generation"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              No Data
                            </button>
                          ) : contact.personalizationStatus === 'FAILED' ? (
                            <button
                              onClick={() => handleSingleGenerate(contact.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200 transition-colors cursor-pointer"
                              title="Click to re-try generation"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Failed
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSingleGenerate(contact.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted hover:bg-gray-200 px-2.5 py-1 rounded-full border border-border transition-colors cursor-pointer"
                              title="Click to generate"
                            >
                              <Clock className="w-3 h-3" />
                              Missing
                            </button>
                          )}

                          {/* Quick row-level trigger button */}
                          <button
                            onClick={() => handleSingleGenerate(contact.id)}
                            disabled={isGeneratingThis}
                            className="p-1 rounded text-purple-600 hover:bg-purple-100/70 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30 cursor-pointer"
                            title={contact.personalizedLine ? "Regenerate line" : "Generate line"}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-muted-foreground">
                        {contact.industry ? (
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-muted text-secondary truncate max-w-[140px]">
                            {contact.industry}
                          </span>
                        ) : '-'}
                      </td>
                      
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => router.push(`/leads/${contact.id}`)}
                          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer p-1"
                          title="Open Lead Profile"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
          
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20 text-xs text-muted-foreground">
            <span>
              Showing {filteredContacts.length} of {contacts.length} contacts
              {statusFilter !== 'ALL' && ` (Filtered: ${statusFilter})`}
            </span>
            {statusCounts.FAILED > 0 && (
              <button
                onClick={handleRegenerateFailed}
                className="text-rose-600 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Regenerate all {statusCounts.FAILED} failed contacts
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Personalization Quick Preview Modal */}
      {activePreviewContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[500px] overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-transparent">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-600/10 text-purple-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-secondary">
                    {activePreviewContact.fullName || activePreviewContact.email}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {activePreviewContact.jobTitle || 'Lead'} • {activePreviewContact.companyName || 'Company'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setActivePreviewContact(null)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-muted cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                  Personalization Line
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${activePreviewContact.personalizationSource === 'MANUAL' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'}`}>
                  {activePreviewContact.personalizationSource === 'MANUAL' ? (
                    <>
                      <ShieldCheck className="w-3 h-3" />
                      MANUAL
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3" />
                      AI Research
                    </>
                  )}
                  {activePreviewContact.personalizationConfidence && ` • ${activePreviewContact.personalizationConfidence}`}
                </span>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border border-border relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1.5 h-full ${activePreviewContact.personalizationSource === 'MANUAL' ? 'bg-amber-500' : 'bg-purple-600'}`} />
                <p className="text-sm text-secondary font-medium leading-relaxed italic pl-1">
                  "{activePreviewContact.personalizedLine}"
                </p>
              </div>

              {activePreviewContact.personalizationGeneratedAt && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 opacity-60" />
                  Generated {new Date(activePreviewContact.personalizationGeneratedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  const contactId = activePreviewContact.id;
                  setActivePreviewContact(null);
                  handleSingleGenerate(contactId);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Regenerate Line
              </button>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActivePreviewContact(null)} 
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button 
                  onClick={() => router.push(`/leads/${activePreviewContact.id}`)}
                  className="px-4 py-2 text-xs font-medium bg-[#14385F] text-white hover:opacity-90 rounded-md transition-colors shadow-sm cursor-pointer"
                >
                  Open Lead Profile &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
