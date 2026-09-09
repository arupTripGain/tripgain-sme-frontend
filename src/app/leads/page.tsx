"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, Plus, Filter, MoreHorizontal, FileDown, Upload, Users, Building2, Trash2,
  Sparkles, CheckCircle2, AlertTriangle, RefreshCw, Eye, X, Clock, AlertCircle, ShieldCheck, ChevronDown
} from 'lucide-react';

export default function LeadsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'contacts' | 'lists'>('contacts');
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Personalization filter & modals
  const [personalizationFilter, setPersonalizationFilter] = useState<'all' | 'generated' | 'missing' | 'failed' | 'generating'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activePreviewContact, setActivePreviewContact] = useState<any | null>(null);

  // Bulk Personalization state
  const [bulkPersonalizeModalOpen, setBulkPersonalizeModalOpen] = useState(false);
  const [bulkJob, setBulkJob] = useState<{ id: string; total: number; processed: number; successful: number; failed: number; status: string; progressPct: number } | null>(null);
  const [bulkScope, setBulkScope] = useState<'selected' | 'all'>('selected');
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [isStartingBulk, setIsStartingBulk] = useState(false);

  // Selection & Menus
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    setSelectedContacts(new Set());
    setActiveMenuId(null);
  }, [activeTab, user?.id]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'contacts') {
        const url = searchQuery 
          ? `/api/contacts?search=${encodeURIComponent(searchQuery)}` 
          : '/api/contacts';
        const res = await apiFetch(url);
        const data = await res.json();
        setContacts(Array.isArray(data) ? data : []);
      } else {
        const url = searchQuery 
          ? `/api/lists?search=${encodeURIComponent(searchQuery)}` 
          : '/api/lists';
        const res = await apiFetch(url);
        const data = await res.json();
        setLists(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
            fetchData();
          }
        }
      } catch (err) {
        console.error('Error polling bulk job:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [bulkJob]);

  const handleStartBulkPersonalization = async () => {
    setIsStartingBulk(true);
    try {
      const payload: any = {
        onlyMissing,
        force: false
      };
      if (bulkScope === 'selected') {
        payload.contactIds = Array.from(selectedContacts);
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
        setBulkPersonalizeModalOpen(false);
      } else {
        alert(data.error || 'Failed to start bulk personalization');
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || 'Error starting bulk personalization');
    } finally {
      setIsStartingBulk(false);
    }
  };

  const handleGenerateForList = async (listId: string) => {
    try {
      const res = await apiFetch('/api/contacts/bulk-personalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listId, onlyMissing: true })
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
    } catch (e) {
      console.error(e);
      alert('Error starting personalization for list');
    }
  };

  // Filter contacts by personalization status
  const filteredContacts = contacts.filter(contact => {
    if (personalizationFilter === 'all') return true;
    const status = contact.personalizationStatus;
    const hasLine = !!contact.personalizedLine && contact.personalizedLine.trim() !== '';

    if (personalizationFilter === 'generated') return status === 'GENERATED' || hasLine;
    if (personalizationFilter === 'missing') return !hasLine && (status === 'PENDING' || !status);
    if (personalizationFilter === 'failed') return status === 'FAILED' || status === 'NO_USEFUL_DATA';
    if (personalizationFilter === 'generating') return status === 'GENERATING';
    return true;
  });

  // Removed buggy document.addEventListener for click outside

  const toggleContactSelection = (id: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedContacts(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === contacts.length && contacts.length > 0) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
  };

  const handleDeleteContact = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?\n\nThis will permanently remove the contact and their contact information.`)) return;
    try {
      const res = await apiFetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setContacts(contacts.filter(c => c.id !== id));
        const newSet = new Set(selectedContacts);
        newSet.delete(id);
        setSelectedContacts(newSet);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete contact.');
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedContacts.size} contacts?\n\nThis will permanently remove them.`)) return;
    try {
      const ids = Array.from(selectedContacts);
      const res = await apiFetch(`/api/contacts/bulk-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids })
      });
      if (res.ok) {
        setContacts(contacts.filter(c => !selectedContacts.has(c.id)));
        setSelectedContacts(new Set());
      }
    } catch (e) {
      console.error(e);
      alert('Failed to bulk delete contacts.');
    }
  };

  const handleDeleteList = async (id: string, name: string) => {
    if (id === 'suppression-1') {
      alert("Cannot delete system lists.");
      return;
    }
    if (!confirm(`Delete "${name}"?\n\nThis will delete the list and its membership records. Contacts themselves will not be deleted.`)) return;
    
    try {
      const res = await apiFetch(`/api/lists/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLists(lists.filter(l => l.id !== id));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete list.');
    }
  };

  // Modals
  const [addToListModalOpen, setAddToListModalOpen] = useState(false);
  const [contactsToAdd, setContactsToAdd] = useState<string[]>([]);
  const [selectedListId, setSelectedListId] = useState<string>('');
  
  const [removeFromListModalOpen, setRemoveFromListModalOpen] = useState(false);
  
  const [addToCampaignModalOpen, setAddToCampaignModalOpen] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  
  // Ensure lists are loaded even if on contacts tab
  useEffect(() => {
    apiFetch('/api/lists')
      .then(res => res.json())
      .then(data => setLists(Array.isArray(data) ? data : []))
      .catch(console.error);
      
    apiFetch('/api/campaigns')
      .then(res => res.json())
      .then(data => setCampaigns(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const openAddToListModal = (contactIds: string[]) => {
    setContactsToAdd(contactIds);
    setAddToListModalOpen(true);
  };

  const handleAddToList = async () => {
    if (!selectedListId) return alert('Please select a list');
    try {
      const res = await apiFetch(`/api/lists/${selectedListId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: contactsToAdd })
      });
      if (res.ok) {
        setAddToListModalOpen(false);
        setContactsToAdd([]);
        setSelectedListId('');
        fetchData(); // reload
      } else {
        alert('Failed to add contacts to list');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to add contacts to list');
    }
  };

  const openRemoveFromListModal = (contactIds: string[]) => {
    setContactsToAdd(contactIds); // reuse the same state for selected contacts
    setRemoveFromListModalOpen(true);
  };

  const handleRemoveFromList = async () => {
    if (!selectedListId) return alert('Please select a list');
    try {
      const res = await apiFetch(`/api/lists/${selectedListId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: contactsToAdd })
      });
      if (res.ok) {
        setRemoveFromListModalOpen(false);
        setContactsToAdd([]);
        setSelectedListId('');
        fetchData(); // reload
      } else {
        alert('Failed to remove contacts from list');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to remove contacts from list');
    }
  };

  const handleDuplicateList = async (listId: string) => {
    try {
      const res = await apiFetch(`/api/lists/${listId}/duplicate`, {
        method: 'POST'
      });
      if (res.ok) {
        apiFetch('/api/lists')
          .then(r => r.json())
          .then(data => setLists(Array.isArray(data) ? data : []));
      } else {
        alert('Failed to duplicate list');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRenameList = async (listId: string, currentName: string) => {
    const newName = prompt('Enter new list name:', currentName);
    if (!newName || newName === currentName) return;
    try {
      const res = await apiFetch(`/api/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        apiFetch('/api/lists')
          .then(r => r.json())
          .then(data => setLists(Array.isArray(data) ? data : []));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openAddToCampaignModal = (contactIds: string[]) => {
    setContactsToAdd(contactIds);
    setAddToCampaignModalOpen(true);
  };

  const handleAddToCampaign = async () => {
    if (!selectedCampaignId) return alert('Please select a campaign');
    try {
      const res = await apiFetch(`/api/campaigns/${selectedCampaignId}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: contactsToAdd })
      });
      if (res.ok) {
        setAddToCampaignModalOpen(false);
        setContactsToAdd([]);
        setSelectedCampaignId('');
        alert('Contacts enrolled successfully');
      } else {
        alert('Failed to enroll contacts');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to enroll contacts');
    }
  };

  const placeholderAction = (action: string) => {
    alert(`${action} is a placeholder for this iteration.`);
  };

  const handleMarkDoNotContact = async (contactId: string) => {
    try {
      const res = await apiFetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadStatus: 'Do Not Contact' })
      });
      if (res.ok) fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddToSuppression = async (contactId: string) => {
    try {
      const res = await apiFetch(`/api/lists/suppression-1/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds: [contactId] })
      });
      if (res.ok) alert('Added to suppression list');
    } catch (e) {
      console.error(e);
    }
  };

  const handleExport = async (contactIds: string[]) => {
    if (!contactIds.length) return alert('No contacts selected for export');
    try {
      const res = await apiFetch('/api/contacts/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactIds })
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'contacts_export.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
      } else {
        alert('Failed to export contacts');
      }
    } catch (e) {
      console.error(e);
      alert('Error exporting contacts');
    }
  };

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa] relative">
      
      {/* Top Header */}
      <div className="flex flex-col border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between px-8 py-6">
          <div>
            <h1 className="font-heading text-2xl font-bold text-secondary">Leads</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your verified SME prospects</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href="/leads/import"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-accent h-10 px-4 gap-2 shadow-sm text-secondary transition-colors"
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              Import CSV
            </Link>
            <Link 
              href="/leads/new" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-[#F16F21] text-white hover:opacity-90 h-10 px-4 gap-2 shadow-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              {activeTab === 'contacts' ? 'Add Lead' : 'Create List'}
            </Link>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex items-center gap-6 px-8 mt-2">
          <button 
            onClick={() => setActiveTab('contacts')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'contacts' ? 'border-[#14385F] text-[#14385F]' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          >
            <Users className="h-4 w-4" /> Contacts
          </button>
          <button 
            onClick={() => setActiveTab('lists')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'lists' ? 'border-[#14385F] text-[#14385F]' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'}`}
          >
            <Building2 className="h-4 w-4" /> Lists
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 relative">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder={activeTab === 'contacts' ? "Search contacts, companies, emails, job title..." : "Search lists..."}
              className="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-card text-sm shadow-sm outline-none focus:ring-1 focus:ring-primary"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Personalization Filter Dropdown */}
            {activeTab === 'contacts' && (
              <div className="relative">
                <button 
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className={`inline-flex items-center justify-center rounded-md text-sm font-medium border h-10 px-3 gap-2 shadow-sm transition-colors ${personalizationFilter !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-border bg-card hover:bg-accent text-secondary'}`}
                >
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>
                    Personalization: {personalizationFilter === 'all' ? 'All' : personalizationFilter.charAt(0).toUpperCase() + personalizationFilter.slice(1)}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </button>

                {showFilterDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowFilterDropdown(false)} />
                    <div className="absolute right-0 top-11 w-52 bg-white rounded-lg shadow-xl border border-border py-1.5 z-40 text-xs">
                      <div className="px-3 py-1 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider border-b border-border mb-1">
                        Filter by Personalization
                      </div>
                      {[
                        { key: 'all', label: 'All Contacts', count: contacts.length },
                        { key: 'generated', label: '✓ Generated', count: contacts.filter(c => c.personalizationStatus === 'GENERATED' || !!c.personalizedLine).length },
                        { key: 'missing', label: '⚠ Missing', count: contacts.filter(c => !c.personalizedLine && (c.personalizationStatus === 'PENDING' || !c.personalizationStatus)).length },
                        { key: 'failed', label: '✕ Failed / No Data', count: contacts.filter(c => c.personalizationStatus === 'FAILED' || c.personalizationStatus === 'NO_USEFUL_DATA').length },
                        { key: 'generating', label: '⟳ Generating', count: contacts.filter(c => c.personalizationStatus === 'GENERATING').length },
                      ].map((item) => (
                        <button
                          key={item.key}
                          onClick={() => {
                            setPersonalizationFilter(item.key as any);
                            setShowFilterDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left flex items-center justify-between hover:bg-muted/60 transition-colors ${personalizationFilter === item.key ? 'font-bold text-primary bg-primary/5' : 'text-secondary'}`}
                        >
                          <span>{item.label}</span>
                          <span className="text-[11px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{item.count}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {activeTab === 'contacts' && (
              <button onClick={() => handleExport(contacts.map(c => c.id))} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-accent h-10 px-4 gap-2 shadow-sm text-secondary">
                <FileDown className="h-4 w-4 text-muted-foreground" /> Export
              </button>
            )}
          </div>
        </div>

        {/* Sticky Background Bulk Personalization Job Banner */}
        {bulkJob && bulkJob.status === 'PROCESSING' && (
          <div className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#14385F] text-white shadow-sm">
                <RefreshCw className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <p className="text-sm font-bold text-secondary flex items-center gap-2">
                  Generating AI Personalizations
                  <span className="text-xs font-normal text-muted-foreground">({bulkJob.progressPct}% complete)</span>
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {bulkJob.processed} of {bulkJob.total} leads processed • <span className="text-emerald-700 font-semibold">{bulkJob.successful} generated</span> • <span className="text-amber-700 font-semibold">{bulkJob.failed} fallback/failed</span>
                </p>
              </div>
            </div>
            <div className="w-52 bg-white/80 rounded-full h-2.5 overflow-hidden border border-blue-200">
              <div 
                className="bg-[#14385F] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${bulkJob.progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Contacts Table Container */}
        {activeTab === 'contacts' && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden relative">
            
            {/* Bulk Action Bar */}
            {selectedContacts.size > 0 && (
              <div className="absolute top-0 left-0 right-0 h-14 bg-[#14385F] text-white flex items-center justify-between px-6 z-10 rounded-t-xl animate-in slide-in-from-top-2">
                <div className="flex items-center gap-4">
                  <span className="font-semibold">{selectedContacts.size} contacts selected</span>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      setBulkScope('selected');
                      setBulkPersonalizeModalOpen(true);
                    }}
                    className="px-3 py-1.5 text-sm font-medium bg-[#F16F21] text-white hover:opacity-90 rounded transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Personalize ({selectedContacts.size})
                  </button>
                  <button onClick={() => openAddToListModal(Array.from(selectedContacts))} className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded transition-colors">Add to List</button>
                  <button onClick={() => openAddToCampaignModal(Array.from(selectedContacts))} className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded transition-colors">Campaign</button>
                  <button onClick={() => handleExport(Array.from(selectedContacts))} className="px-3 py-1.5 text-sm font-medium hover:bg-white/10 rounded transition-colors">Export</button>
                  <div className="w-px h-4 bg-white/20 mx-1"></div>
                  <button onClick={handleBulkDelete} className="px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-white/10 hover:text-red-200 rounded transition-colors flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left relative z-0">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="w-10 px-4 py-3.5">
                      <input 
                        type="checkbox" 
                        className="rounded border-input text-primary focus:ring-primary"
                        checked={filteredContacts.length > 0 && selectedContacts.size === filteredContacts.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3.5 font-medium whitespace-nowrap">Name</th>
                    <th className="px-4 py-3.5 font-medium whitespace-nowrap">Company</th>
                    <th className="px-4 py-3.5 font-medium whitespace-nowrap">Job Title</th>
                    <th className="px-4 py-3.5 font-medium whitespace-nowrap">Email</th>
                    <th className="px-4 py-3.5 font-medium whitespace-nowrap">City</th>
                    <th className="px-4 py-3.5 font-medium whitespace-nowrap">Industry</th>
                    <th className="px-4 py-3.5 font-medium whitespace-nowrap">Personalization</th>
                    <th className="px-4 py-3.5 font-medium whitespace-nowrap">Status</th>
                    <th className="w-10 px-3 py-3.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">Loading contacts...</td>
                    </tr>
                  ) : filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-12 text-center text-muted-foreground">
                        {personalizationFilter !== 'all' ? `No contacts matching personalization filter "${personalizationFilter}".` : 'No contacts found. Click "Add Lead" to get started.'}
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((contact) => {
                      const isSelected = selectedContacts.has(contact.id);
                      const isMenuOpen = activeMenuId === contact.id;

                      return (
                        <tr key={contact.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors group relative ${isSelected ? 'bg-blue-50/50' : ''} ${isMenuOpen ? 'z-20' : 'z-0'}`}>
                          <td className="px-4 py-3.5">
                            <input 
                              type="checkbox" 
                              className={`rounded border-input text-primary focus:ring-primary transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                              checked={isSelected}
                              onChange={() => toggleContactSelection(contact.id)}
                            />
                          </td>
                          <td className="px-4 py-3.5 font-medium text-foreground whitespace-nowrap">
                            <Link href={`/leads/${contact.id}`} className="hover:text-primary transition-colors">
                              {contact.fullName || '-'}
                            </Link>
                          </td>
                          <td className="px-4 py-3.5 text-secondary">
                            <div className="flex items-center gap-2 max-w-[190px]" title={contact.companyName || ''}>
                              <div className="w-6 h-6 rounded bg-muted shrink-0 flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                                {contact.companyName ? contact.companyName.substring(0, 2) : '?'}
                              </div>
                              <span className="truncate">{contact.companyName || '-'}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            <div className="max-w-[140px] truncate" title={contact.jobTitle || ''}>
                              {contact.jobTitle || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            <div className="max-w-[190px] truncate" title={contact.email || ''}>
                              {contact.email || '-'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap">{contact.city || '-'}</td>
                          <td className="px-4 py-3.5 text-muted-foreground">
                            {contact.industry ? (
                              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-muted text-secondary max-w-[140px] truncate" title={contact.industry}>
                                {contact.industry}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            {contact.personalizationStatus === 'GENERATING' ? (
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
                          </td>
                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">
                              {contact.status}
                            </span>
                          </td>
                          <td className={`px-3 py-3.5 text-right relative ${isMenuOpen ? 'z-50' : ''}`}>
                            <button 
                              className={`text-muted-foreground hover:text-foreground transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : contact.id); }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                            
                            {/* 3-Dot Menu Dropdown */}
                            {isMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                                <div className="absolute right-4 top-10 w-48 bg-white rounded-md shadow-xl border border-border py-1 z-50 text-left" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => router.push(`/leads/${contact.id}`)} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">View Lead</button>
                                <button onClick={() => router.push(`/leads/${contact.id}`)} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Edit</button>
                                <button onClick={() => openAddToListModal([contact.id])} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Add to List</button>
                                <button onClick={() => { setActiveMenuId(null); openRemoveFromListModal([contact.id]); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Remove from List</button>
                                <button onClick={() => { setActiveMenuId(null); openAddToCampaignModal([contact.id]); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Add to Campaign</button>
                                <button onClick={() => router.push(`/leads/${contact.id}`)} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">View Activity</button>
                                <div className="h-px bg-border my-1"></div>
                                <button onClick={() => { setActiveMenuId(null); handleMarkDoNotContact(contact.id); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Mark Do Not Contact</button>
                                <button onClick={() => { setActiveMenuId(null); handleAddToSuppression(contact.id); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Add to Suppression</button>
                                <div className="h-px bg-border my-1"></div>
                                <button onClick={() => { setActiveMenuId(null); handleDeleteContact(contact.id, contact.fullName || contact.email); }} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium">Delete Lead</button>
                              </div>
                              </>
                            )}
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
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-xs font-medium border border-border rounded bg-card hover:bg-accent disabled:opacity-50">Previous</button>
                <button className="px-3 py-1 text-xs font-medium border border-border rounded bg-card hover:bg-accent disabled:opacity-50">Next</button>
              </div>
            </div>
          </div>
        )}

        {/* Lists Table Container */}
        {activeTab === 'lists' && (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden relative">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                  <tr>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">List Name</th>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">Contacts</th>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">Type</th>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">Personalization</th>
                    <th className="px-6 py-4 font-medium whitespace-nowrap">Status</th>
                    <th className="w-12 px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Loading lists...</td>
                    </tr>
                  ) : lists.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">No lists found. Click "Create List" to get started.</td>
                    </tr>
                  ) : (
                    lists.map((list) => {
                      const isMenuOpen = activeMenuId === `list-${list.id}`;

                      return (
                        <tr key={list.id} className={`border-b border-border last:border-0 hover:bg-muted/30 transition-colors group relative ${isMenuOpen ? 'z-20' : 'z-0'}`}>
                          <td 
                            className="px-6 py-4 font-medium text-foreground flex items-center gap-3 cursor-pointer whitespace-nowrap"
                            onClick={() => router.push(`/lists/${list.id}`)}
                          >
                            <div className="h-8 w-8 rounded-md bg-[#14385F]/10 flex items-center justify-center text-[#14385F]">
                              <Building2 className="h-4 w-4" />
                            </div>
                            {list.name}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-medium">{list.contacts}</td>
                          <td className="px-6 py-4 text-muted-foreground capitalize">
                            <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-muted text-secondary">
                              {list.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateForList(list.id);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md border border-purple-200 transition-colors shadow-sm cursor-pointer"
                              title="Generate personalization for missing contacts in this list"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                              Generate Missing
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                              {list.status}
                            </span>
                          </td>
                          <td className={`px-6 py-4 text-right relative ${isMenuOpen ? 'z-50' : ''}`}>
                            <button 
                              className={`text-muted-foreground hover:text-foreground transition-opacity ${isMenuOpen ? 'opacity-100' : 'opacity-50 hover:opacity-100'}`}
                              onClick={(e) => { e.stopPropagation(); setActiveMenuId(isMenuOpen ? null : `list-${list.id}`); }}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>

                            {/* 3-Dot Menu Dropdown */}
                            {isMenuOpen && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }} />
                                <div className="absolute right-8 top-10 w-48 bg-white rounded-md shadow-lg border border-border py-1 z-50 text-left" onClick={(e) => e.stopPropagation()}>
                                <button onClick={() => router.push(`/lists/${list.id}`)} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Open List</button>
                                <button onClick={() => { setActiveMenuId(null); handleRenameList(list.id, list.name); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Rename</button>
                                <button onClick={() => { setActiveMenuId(null); handleDuplicateList(list.id); }} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Duplicate</button>
                                <button onClick={() => router.push(`/lists/${list.id}`)} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Add Contacts</button>
                                <button onClick={() => router.push(`/lists/${list.id}`)} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Remove Contacts</button>
                                <button onClick={() => placeholderAction('Export')} className="w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 text-left">Export</button>
                                <div className="h-px bg-border my-1"></div>
                                <button onClick={() => { setActiveMenuId(null); handleDeleteList(list.id, list.name); }} className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left font-medium">Delete List</button>
                              </div>
                              </>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      {/* Add To List Modal Overlay */}
      {addToListModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Add to List</h2>
              <button onClick={() => setAddToListModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Add {contactsToAdd.length} contact(s) to a list.</p>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select List</label>
                <select 
                  value={selectedListId} 
                  onChange={e => setSelectedListId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm outline-none focus:border-primary"
                >
                  <option value="" disabled>Select a list...</option>
                  {lists.filter(l => l.type === 'static').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setAddToListModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={handleAddToList} disabled={!selectedListId} className="px-4 py-2 text-sm font-medium bg-[#F16F21] text-white rounded-md hover:opacity-90 disabled:opacity-50">Add</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Add To Campaign Modal Overlay */}
      {addToCampaignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Add to Campaign</h2>
              <button onClick={() => setAddToCampaignModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Enroll {contactsToAdd.length} contact(s) into a campaign.</p>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Campaign</label>
                <select 
                  value={selectedCampaignId} 
                  onChange={e => setSelectedCampaignId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm outline-none focus:border-primary"
                >
                  <option value="" disabled>Select a campaign...</option>
                  {campaigns.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setAddToCampaignModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={handleAddToCampaign} disabled={!selectedCampaignId} className="px-4 py-2 text-sm font-medium bg-[#14385F] text-white rounded-md hover:opacity-90 disabled:opacity-50">Enroll</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Remove From List Modal Overlay */}
      {removeFromListModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-[400px] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-lg">Remove from List</h2>
              <button onClick={() => setRemoveFromListModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Remove {contactsToAdd.length} contact(s) from a list.</p>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Select List</label>
                <select 
                  value={selectedListId} 
                  onChange={e => setSelectedListId(e.target.value)}
                  className="w-full h-10 px-3 border border-gray-200 rounded-md text-sm outline-none focus:border-primary"
                >
                  <option value="" disabled>Select a list...</option>
                  {lists.filter(l => l.type === 'static').map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setRemoveFromListModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
              <button onClick={handleRemoveFromList} disabled={!selectedListId} className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md hover:opacity-90 disabled:opacity-50">Remove</button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Personalization Modal */}
      {bulkPersonalizeModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-[480px] overflow-hidden border border-border">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-orange-500/5 to-transparent">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-600/10 text-purple-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-secondary">Generate Personalization</h2>
                  <p className="text-xs text-muted-foreground">AI research & factual cold email icebreakers</p>
                </div>
              </div>
              <button 
                onClick={() => setBulkPersonalizeModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Scope Selection */}
              <div>
                <label className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-2">Target Scope</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBulkScope('selected')}
                    className={`p-3 rounded-lg border text-left transition-all ${bulkScope === 'selected' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/40'}`}
                  >
                    <span className="block text-xs font-semibold text-secondary">Selected Leads</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{selectedContacts.size} leads selected</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkScope('all')}
                    className={`p-3 rounded-lg border text-left transition-all ${bulkScope === 'all' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/40'}`}
                  >
                    <span className="block text-xs font-semibold text-secondary">All Leads</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{contacts.length} leads in workspace</span>
                  </button>
                </div>
              </div>

              {/* Only Missing Checkbox */}
              <div className="flex items-start gap-3 p-3.5 bg-muted/40 rounded-lg border border-border">
                <input
                  type="checkbox"
                  id="onlyMissingCheckbox"
                  checked={onlyMissing}
                  onChange={(e) => setOnlyMissing(e.target.checked)}
                  className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="onlyMissingCheckbox" className="text-xs text-secondary cursor-pointer">
                  <span className="font-semibold block">Only generate for leads missing personalization</span>
                  <span className="text-muted-foreground text-[11px] block mt-0.5">
                    Skips leads that already have a generated or manual personalization.
                  </span>
                </label>
              </div>

              {/* Info Notice */}
              <div className="flex items-start gap-2.5 text-xs text-muted-foreground bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p>
                  Runs asynchronously in background without freezing your UI. Manual personalizations will never be overwritten.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button 
                onClick={() => setBulkPersonalizeModalOpen(false)} 
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleStartBulkPersonalization} 
                disabled={isStartingBulk || (bulkScope === 'selected' && selectedContacts.size === 0)}
                className="px-4 py-2 text-xs font-medium bg-[#F16F21] text-white rounded-md hover:opacity-90 disabled:opacity-50 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                {isStartingBulk ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Starting Queue...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Start AI Generation
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
