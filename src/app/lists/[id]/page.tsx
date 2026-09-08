"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Search, Filter, FileDown, MoreHorizontal, Building2, UploadCloud, UserPlus, Megaphone,
  Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Eye, X, Clock, AlertCircle, ShieldCheck
} from 'lucide-react';

export default function ListDashboardPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [personalizationStats, setPersonalizationStats] = useState<any>(null);
  const [activePreviewContact, setActivePreviewContact] = useState<any | null>(null);
  const [generatingContactId, setGeneratingContactId] = useState<string | null>(null);

  // Bulk Personalization state for this list
  const [bulkJob, setBulkJob] = useState<{ id: string; total: number; processed: number; successful: number; failed: number; status: string; progressPct: number } | null>(null);
  const [isStartingBulk, setIsStartingBulk] = useState(false);

  const fetchListData = () => {
    fetch(`http://localhost:3001/api/lists/${id}`)
      .then(res => res.json())
      .then(data => {
        setList(data);
        setLoading(false);
      })
      .catch(console.error);

    fetch(`http://localhost:3001/api/lists/${id}/personalization-stats`)
      .then(res => res.json())
      .then(data => {
        if (!data.error) setPersonalizationStats(data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchListData();
  }, [id]);

  // Poll active bulk personalization job
  useEffect(() => {
    if (!bulkJob || bulkJob.status === 'COMPLETED' || bulkJob.status === 'FAILED') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/contacts/personalization-jobs/${bulkJob.id}`);
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

  const handleGenerateMissing = async () => {
    setIsStartingBulk(true);
    try {
      const res = await fetch('http://localhost:3001/api/contacts/bulk-personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId: id, onlyMissing: true })
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
      } else {
        alert(data.error || 'Failed to start personalization for list');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error starting personalization for list');
    } finally {
      setIsStartingBulk(false);
    }
  };

  const handleSingleGenerate = async (contactId: string, force = true) => {
    setGeneratingContactId(contactId);
    try {
      const res = await fetch(`http://localhost:3001/api/contacts/${contactId}/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      if (res.ok) {
        fetchListData();
      } else {
        alert(data.error || 'Failed to personalize contact');
      }
    } catch (e: any) {
      console.error(e);
      alert('Error personalizing contact');
    } finally {
      setGeneratingContactId(null);
    }
  };

  if (loading) return <div className="p-8">Loading list...</div>;
  if (!list || list.error) return <div className="p-8 text-red-500">List not found.</div>;

  const contacts = list.contacts || [];

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
                <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3" />
                    {personalizationStats?.generated ?? 0} Generated
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                    <Clock className="w-3 h-3" />
                    {personalizationStats?.missing ?? (contacts.length - (personalizationStats?.generated ?? 0))} Missing
                  </span>
                  {(personalizationStats?.failed ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                      <AlertCircle className="w-3 h-3" />
                      {personalizationStats.failed} Failed / No Data
                    </span>
                  )}
                  {(personalizationStats?.generating ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      {personalizationStats.generating} Generating
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateMissing}
                disabled={Boolean(isStartingBulk || (bulkJob && (bulkJob.status === 'PENDING' || bulkJob.status === 'PROCESSING')))}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium text-xs shadow hover:opacity-95 disabled:opacity-60 transition-all cursor-pointer"
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
                    Generate Missing
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

        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search contacts in this list..." 
              className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-card text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-accent h-10 px-4 gap-2 shadow-sm text-secondary">
              <Filter className="h-4 w-4 text-muted-foreground" /> Filter
            </button>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-accent h-10 px-4 gap-2 shadow-sm text-secondary">
              <FileDown className="h-4 w-4 text-muted-foreground" /> Export
            </button>
          </div>
        </div>

        {/* Contacts Table Container */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                <tr>
                  <th className="w-12 px-6 py-4">
                    <input type="checkbox" className="rounded border-input text-primary focus:ring-primary" />
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
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">No contacts found in this list.</td>
                </tr>
              ) : (
                contacts.map((contact: any) => {
                  const isGeneratingThis = generatingContactId === contact.id || contact.personalizationStatus === 'GENERATING';

                  return (
                    <tr key={contact.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors group">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-input text-primary focus:ring-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">
                        <Link href={`/leads/${contact.id}`} className="hover:text-primary transition-colors">
                          {contact.fullName || '-'}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-secondary flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                          {contact.companyName ? contact.companyName.substring(0, 2) : '?'}
                        </div>
                        {contact.companyName || '-'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{contact.jobTitle || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{contact.email || '-'}</td>
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
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              No Data
                            </span>
                          ) : contact.personalizationStatus === 'FAILED' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                              <AlertCircle className="w-3 h-3" />
                              Failed
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                              <Clock className="w-3 h-3" />
                              Missing
                            </span>
                          )}

                          {/* Quick row-level trigger button */}
                          <button
                            onClick={() => handleSingleGenerate(contact.id)}
                            disabled={isGeneratingThis}
                            className="p-1 rounded text-purple-600 hover:bg-purple-100/70 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
                            title={contact.personalizedLine ? "Regenerate line" : "Generate line"}
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {contact.industry ? (
                          <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-muted text-secondary">
                            {contact.industry}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
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
          
          <div className="flex items-center justify-between border-t border-border px-6 py-4 bg-muted/20">
            <span className="text-xs text-muted-foreground">Showing {contacts.length} contacts</span>
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
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-muted"
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

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setActivePreviewContact(null)} 
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => router.push(`/leads/${activePreviewContact.id}`)}
                className="px-4 py-2 text-xs font-medium bg-[#14385F] text-white hover:opacity-90 rounded-md transition-colors shadow-sm"
              >
                Open Lead Profile &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

