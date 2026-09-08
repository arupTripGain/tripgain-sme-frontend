'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Search, MoreVertical, Archive, Check, Inbox, Star, 
  AlertCircle, X, ChevronRight, ChevronDown, CornerUpLeft, 
  Plus, RefreshCw, Send, User, Building, MapPin, ExternalLink, 
  Info, CheckCircle2, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow, format } from 'date-fns';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface Conversation {
  id: string;
  contact: { id: string; fullName: string; jobTitle: string; emails: { email: string; isPrimary: boolean }[] };
  organization: { id: string; name: string; city: string; industry: string };
  campaign: { id: string; name: string };
  subject: string;
  status: string;
  priority: string;
  unreadCount: number;
  latestMessagePreview: string;
  latestMessageAt: string;
  interestStatus: string;
}

// Helper to strip HTML tags and decode entities for clean snippets
function cleanSnippet(text?: string): string {
  if (!text) return 'No messages yet.';
  return text
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Clean and resolve handlebars templates for old/raw emails
function cleanAndResolveTemplates(content: string, context?: { contactName?: string; companyName?: string }): string {
  if (!content) return '';
  let result = content;

  // Replace &nbsp; inside template blocks e.g. {{#if&nbsp;firstName}}
  result = result.replace(/\{\{([^{}]+)\}\}/g, (match) => {
    return match.replace(/&nbsp;/g, ' ');
  });

  const firstName = context?.contactName ? context.contactName.trim().split(' ')[0] : 'there';
  const companyName = context?.companyName || 'your company';

  // Handle common handlebars conditionals
  result = result.replace(/\{\{#if\s+firstName\}\}(.*?)\{\{else\}\}(.*?)\{\{\/if\}\}/gi, firstName || '$2');
  result = result.replace(/\{\{#if\s+firstName\}\}(.*?)\{\{\/if\}\}/gi, firstName ? '$1' : '');
  result = result.replace(/\{\{firstName\}\}/gi, firstName);

  result = result.replace(/\{\{#if\s+companyName\}\}(.*?)\{\{else\}\}(.*?)\{\{\/if\}\}/gi, companyName || '$2');
  result = result.replace(/\{\{#if\s+companyName\}\}(.*?)\{\{\/if\}\}/gi, companyName ? '$1' : '');
  result = result.replace(/\{\{companyName\}\}/gi, companyName);

  // Clean remaining unknown template blocks
  result = result.replace(/\{\{#if\s+[^}]+\}\}(.*?)\{\{else\}\}(.*?)\{\{\/if\}\}/gi, '$2');
  result = result.replace(/\{\{#[^}]+\}\}/gi, '');
  result = result.replace(/\{\{\/[^}]+\}\}/gi, '');
  result = result.replace(/\{\{[^}]+\}\}/gi, '');

  return result;
}

// Split out quoted reply history (e.g., "On Mon, 7 Sept... wrote: > ...")
function splitEmailQuotes(content: string, isHtml: boolean): { main: string; quote: string | null } {
  if (!content) return { main: '', quote: null };

  if (isHtml) {
    const bqMatch = content.match(/<blockquote[\s\S]*$/i) || content.match(/<div class="gmail_quote"[\s\S]*$/i);
    if (bqMatch && bqMatch.index !== undefined && bqMatch.index > 0) {
      return {
        main: content.substring(0, bqMatch.index).trim(),
        quote: content.substring(bqMatch.index).trim()
      };
    }
    const onWroteMatch = content.match(/<p>[^<]*On\s+[^<]+wrote:?<\/p>[\s\S]*$/i);
    if (onWroteMatch && onWroteMatch.index !== undefined && onWroteMatch.index > 0) {
      return {
        main: content.substring(0, onWroteMatch.index).trim(),
        quote: content.substring(onWroteMatch.index).trim()
      };
    }
  } else {
    const onWroteRegex = /(\r?\n\s*On\s+.+?wrote:\s*[\r\n]+[\s\S]*$)/i;
    const match = content.match(onWroteRegex);
    if (match && match.index !== undefined && match.index > 0) {
      return {
        main: content.substring(0, match.index).trim(),
        quote: match[0].trim()
      };
    }

    const origMsgRegex = /(\r?\n\s*-----Original Message-----[\s\S]*$)/i;
    const matchOrig = content.match(origMsgRegex);
    if (matchOrig && matchOrig.index !== undefined && matchOrig.index > 0) {
      return {
        main: content.substring(0, matchOrig.index).trim(),
        quote: matchOrig[0].trim()
      };
    }

    const lines = content.split('\n');
    const firstQuoteIdx = lines.findIndex(l => l.trim().startsWith('>'));
    if (firstQuoteIdx > 0) {
      return {
        main: lines.slice(0, firstQuoteIdx).join('\n').trim(),
        quote: lines.slice(firstQuoteIdx).join('\n').trim()
      };
    }
  }

  return { main: content, quote: null };
}

// Convert plain text URLs to clickable links
function linkifyText(text: string): React.ReactNode[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={i} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-700 underline break-all font-medium"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

// Individual Beautiful Email Message Card
function EmailMessageCard({ 
  msg, 
  contactName, 
  companyName 
}: { 
  msg: any; 
  contactName?: string; 
  companyName?: string;
}) {
  const [showQuote, setShowQuote] = useState(false);
  const isOutbound = msg.direction === 'OUTBOUND';

  // Determine if content has HTML
  const rawContent = msg.bodyHtml || msg.bodyText || '';
  const containsHtml = /<\/?[a-z][\s\S]*>/i.test(rawContent);

  // Clean templates
  const resolvedContent = useMemo(() => {
    return cleanAndResolveTemplates(rawContent, { contactName, companyName });
  }, [rawContent, contactName, companyName]);

  // Split quotes
  const { main, quote } = useMemo(() => {
    return splitEmailQuotes(resolvedContent, containsHtml);
  }, [resolvedContent, containsHtml]);

  // Sender display info
  const senderDisplayName = isOutbound ? 'You' : (msg.senderName || contactName || 'Lead');
  const senderEmail = isOutbound ? (msg.senderEmail || 'admin@tripgain.com') : (msg.senderEmail || 'lead@company.com');
  const recipientEmail = isOutbound 
    ? (Array.isArray(msg.recipientEmails) ? msg.recipientEmails[0] : msg.recipientEmails || 'Lead') 
    : 'You (connected mailbox)';

  const formattedDate = msg.createdAt ? format(new Date(msg.createdAt), 'MMM d, yyyy • h:mm a') : '';
  const relativeDate = msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : '';

  return (
    <div className={cn(
      "w-full rounded-2xl border transition-all duration-150 shadow-xs overflow-hidden",
      isOutbound 
        ? "bg-white border-slate-200/90" 
        : "bg-white border-emerald-200/80 ring-1 ring-emerald-500/10"
    )}>
      {/* Email Header */}
      <div className={cn(
        "px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b text-xs",
        isOutbound ? "bg-slate-50/70 border-slate-100" : "bg-emerald-50/40 border-emerald-100/60"
      )}>
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs",
            isOutbound 
              ? "bg-slate-900 text-white" 
              : "bg-emerald-600 text-white"
          )}>
            {isOutbound ? 'Y' : (contactName?.charAt(0) || senderDisplayName.charAt(0) || 'L')}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 text-sm">{senderDisplayName}</span>
              <span className="text-slate-400 text-xs hidden sm:inline">&lt;{senderEmail}&gt;</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider",
                isOutbound 
                  ? "bg-slate-200/80 text-slate-700" 
                  : "bg-emerald-100 text-emerald-800"
              )}>
                {isOutbound ? 'Outbound' : 'Lead Reply'}
              </span>
            </div>
            <div className="text-slate-500 text-[11px] truncate mt-0.5">
              To: <span className="font-mono text-slate-700">{recipientEmail}</span>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <div className="text-slate-600 font-medium text-xs">{formattedDate}</div>
          <div className="text-slate-400 text-[11px]">{relativeDate}</div>
        </div>
      </div>

      {/* Email Body */}
      <div className="px-6 py-5 text-sm leading-relaxed text-slate-800 bg-white">
        {containsHtml ? (
          <div 
            className="prose prose-sm max-w-none text-slate-800 
              prose-p:my-2.5 prose-p:leading-relaxed 
              prose-a:text-blue-600 prose-a:font-semibold prose-a:underline hover:prose-a:text-blue-800
              prose-strong:font-bold prose-strong:text-slate-900 
              prose-em:italic
              prose-ul:my-2 prose-li:my-0.5"
            dangerouslySetInnerHTML={{ __html: main }} 
          />
        ) : (
          <div className="whitespace-pre-wrap leading-relaxed font-normal text-slate-800">
            {linkifyText(main)}
          </div>
        )}

        {/* Collapsible Quoted Email Reply */}
        {quote && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowQuote(!showQuote)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title={showQuote ? "Hide trimmed quote" : "Show trimmed quote"}
            >
              <span className="font-mono font-bold tracking-widest text-[13px] leading-none">···</span>
              <span>{showQuote ? 'Hide quoted text' : 'Show quoted text'}</span>
            </button>

            {showQuote && (
              <div className="mt-3 pl-4 border-l-2 border-slate-300 py-1.5 text-xs text-slate-500 bg-slate-50/80 rounded-r-lg">
                {containsHtml ? (
                  <div 
                    className="prose prose-xs max-w-none text-slate-600"
                    dangerouslySetInnerHTML={{ __html: quote }}
                  />
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed font-mono text-[12px] text-slate-600">
                    {quote}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UniboxPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState<'list' | 'thread' | 'contact'>('list');
  const [threadDetails, setThreadDetails] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [loadingThread, setLoadingThread] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(false);

  useEffect(() => {
    fetchConversations(activeTab);
  }, [activeTab, user, scope]);

  useEffect(() => {
    if (selectedId) {
      loadThread(selectedId);
      setViewState('thread');
    }
  }, [selectedId]);

  const fetchConversations = async (tab: string) => {
    try {
      const res = await apiFetch(`/api/unibox?tab=${tab}&scope=${scope}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversations(data);
        if (data.length > 0) {
          if (!selectedId || !data.some(c => c.id === selectedId)) {
            setSelectedId(data[0].id);
          }
        } else {
          setSelectedId(null);
          setThreadDetails(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadThread = async (id: string) => {
    setLoadingThread(true);
    try {
      const res = await apiFetch(`/api/unibox/${id}`);
      const data = await res.json();
      setThreadDetails(data);
      if (data.unreadCount > 0) {
        await apiFetch(`/api/unibox/${id}/read`, { method: 'POST' });
        fetchConversations(activeTab);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingThread(false);
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedId) return;
    setSendingReply(true);
    try {
      const res = await apiFetch(`/api/unibox/${selectedId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyText: replyText })
      });
      const data = await res.json();
      if (data.sentViaSmtp) {
        alert(`Success! Email reply sent directly to ${threadDetails?.contact?.emails?.[0]?.email || 'recipient'} via your connected Google mailbox!`);
      } else {
        alert('Reply recorded in Unibox thread.');
      }
      setReplyText('');
      loadThread(selectedId);
      fetchConversations(activeTab);
    } catch (e) {
      console.error(e);
      alert('Error sending reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSimulateReply = async () => {
    setSimulating(true);
    try {
      const res = await apiFetch('/api/unibox/simulate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok && data.conversation) {
        await fetchConversations(activeTab);
        setSelectedId(data.conversation.id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const handleSyncMailbox = async () => {
    setSyncing(true);
    try {
      const res = await apiFetch('/api/unibox/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        alert(data.details || `Synced ${data.syncedCount} message(s) from Gmail.`);
        fetchConversations(activeTab);
        if (selectedId) loadThread(selectedId);
      } else {
        alert(data.error || 'Failed to sync with Gmail.');
      }
    } catch (e: any) {
      alert('Sync failed: ' + (e?.message || 'Network error'));
    } finally {
      setSyncing(false);
    }
  };

  const handleAction = async (action: string) => {
    if (!selectedId) return;
    try {
      await apiFetch(`/api/unibox/${selectedId}/${action}`, { method: 'POST' });
      fetchConversations(activeTab);
      loadThread(selectedId);
    } catch (e) {
      console.error(e);
    }
  };

  const tabs = [
    { id: 'all', label: 'All', icon: Inbox },
    { id: 'unread', label: 'Unread', icon: Mail },
    { id: 'replies', label: 'Replies', icon: CornerUpLeft },
    { id: 'interested', label: 'Interested', icon: Star },
    { id: 'needs-action', label: 'Needs Action', icon: AlertCircle },
  ];

  const filteredConversations = conversations.filter(c => 
    c.contact?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.organization?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.campaign?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden font-sans select-text">
      
      {/* LEFT PANE - CONVERSATIONS LIST */}
      <div className={cn(
        "w-full md:w-[320px] lg:w-[350px] flex-shrink-0 flex flex-col bg-white border-r border-slate-200 transition-all z-10", 
        viewState !== 'list' ? "hidden md:flex" : "flex"
      )}>
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Unibox</h1>
              <p className="text-xs text-slate-500">
                {user ? `${user.name?.split(' ')[0] || user.email}'s Inbox` : 'Outreach threads & replies'}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSyncMailbox}
                disabled={syncing}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-xs disabled:opacity-50"
                title="Sync incoming Gmail replies"
              >
                <RefreshCw className={cn("w-3.5 h-3.5 text-slate-600", syncing && "animate-spin text-blue-600")} />
                {syncing ? 'Syncing...' : 'Sync'}
              </button>
              <button
                onClick={() => handleSimulateReply()}
                disabled={simulating}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-all shadow-xs disabled:opacity-50"
                title="Generate a realistic incoming lead reply to test Unibox triage"
              >
                {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Plus className="w-3.5 h-3.5 text-blue-600" />}
                Demo
              </button>
            </div>
          </div>

          {user?.role === 'ADMIN' && (
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold mb-2.5">
              <button
                type="button"
                onClick={() => setScope('my')}
                className={cn("flex-1 py-1 text-center rounded-md transition-all", scope === 'my' ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800")}
              >
                My Threads
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={cn("flex-1 py-1 text-center rounded-md transition-all", scope === 'all' ? "bg-white text-slate-900 shadow-xs font-bold" : "text-slate-500 hover:text-slate-800")}
              >
                All Workspace
              </button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-slate-50/50"
            />
          </div>
        </div>

        {/* Tabs without native horizontal scrollbar */}
        <div className="flex overflow-x-auto p-2 gap-1 border-b border-slate-100 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0",
                activeTab === t.id 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/80"
              )}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 mb-1">No conversations</p>
              <p className="text-xs text-slate-400 mb-4 max-w-xs mx-auto">
                No replies or threads match this filter. Click below to simulate an incoming reply.
              </p>
              <button
                onClick={() => handleSimulateReply()}
                disabled={simulating}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
              >
                {simulating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Generate Test Reply
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <div 
                key={conv.id} 
                onClick={() => setSelectedId(conv.id)}
                className={cn(
                  "p-3.5 cursor-pointer hover:bg-slate-50 transition-colors relative text-left",
                  selectedId === conv.id ? "bg-blue-50/60 border-l-4 border-blue-600" : ""
                )}
              >
                <div className="flex justify-between items-start mb-1 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {conv.unreadCount > 0 && <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />}
                    <span className={cn(
                      "text-sm truncate text-slate-900",
                      conv.unreadCount > 0 ? "font-bold" : "font-semibold"
                    )}>
                      {conv.contact?.fullName || 'Unknown Lead'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap shrink-0">
                    {conv.latestMessageAt ? formatDistanceToNow(new Date(conv.latestMessageAt), { addSuffix: true }) : ''}
                  </span>
                </div>

                <div className="text-xs font-medium text-slate-500 mb-1 truncate">
                  {conv.organization?.name || 'Company'}
                </div>

                <div className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {cleanSnippet(conv.latestMessagePreview)}
                </div>

                <div className="flex gap-1.5 mt-2 flex-wrap items-center">
                  {conv.interestStatus === 'INTERESTED' && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Interested
                    </span>
                  )}
                  {conv.status === 'NEEDS_ACTION' && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-bold uppercase tracking-wider">
                      Reply Needed
                    </span>
                  )}
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[10px] uppercase truncate max-w-[130px]">
                    {conv.campaign?.name || 'Outreach'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CENTER PANE - EMAIL THREAD */}
      <div className={cn(
        "flex-1 min-w-0 flex flex-col bg-[#F8FAFC] transition-all", 
        viewState === 'thread' || viewState === 'contact' ? "flex" : "hidden md:flex"
      )}>
        
        {selectedId ? (
          <>
            {/* Thread Header */}
            <div className="h-16 border-b border-slate-200 flex items-center justify-between px-4 md:px-6 bg-white shrink-0 shadow-xs z-10">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg" 
                  onClick={() => setViewState('list')}
                  title="Back to inbox list"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-slate-900 text-base md:text-lg truncate">
                      {threadDetails?.contact?.fullName}
                    </h2>
                    {threadDetails?.interestStatus === 'INTERESTED' && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold uppercase tracking-wider">
                        Interested
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate max-w-md">
                    {threadDetails?.subject || 'Outreach thread'}
                  </p>
                </div>
              </div>

              {/* Action Buttons & Collapsible Menu Toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => handleAction('mark-interested')} 
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Mark Interested
                </button>

                <button 
                  onClick={() => handleAction('archive')} 
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                  title="Archive thread"
                >
                  <Archive className="w-4 h-4" />
                </button>

                {/* Collapsible Details Panel Button */}
                <button
                  onClick={() => setShowRightPanel(!showRightPanel)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-xs",
                    showRightPanel 
                      ? "bg-blue-50 text-blue-700 border-blue-300 ring-2 ring-blue-500/20" 
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  )}
                  title="Toggle lead details & outreach context"
                >
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">{showRightPanel ? 'Hide Details' : 'Lead Details'}</span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
              {loadingThread ? (
                <div className="flex flex-col justify-center items-center h-full text-slate-400 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-sm">Loading conversation...</span>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto w-full space-y-4">
                  {threadDetails?.messages?.map((msg: any) => (
                    <EmailMessageCard 
                      key={msg.id} 
                      msg={msg} 
                      contactName={threadDetails?.contact?.fullName} 
                      companyName={threadDetails?.organization?.name} 
                    />
                  ))}
                  
                  {threadDetails?.status === 'REPLIED' && (
                    <div className="flex justify-center my-4">
                      <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-4 py-1.5 rounded-full font-medium flex items-center gap-2 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Sequence paused automatically — Inbound reply received
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reply Composer Dock */}
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <div className="max-w-3xl mx-auto border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all shadow-xs bg-white">
                
                {/* Composer Header */}
                <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-semibold text-slate-700">To:</span>
                    <span className="bg-slate-200/80 px-2 py-0.5 rounded text-slate-800 font-mono text-[11px] truncate">
                      {threadDetails?.contact?.emails?.[0]?.email || 'Lead Email'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Connected Google Mailbox
                  </div>
                </div>

                {/* Textarea */}
                <textarea 
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={e => {
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                  placeholder="Write a reply or follow-up to this lead... (Press Ctrl + Enter to send)"
                  className="w-full p-4 min-h-[110px] max-h-[220px] resize-y focus:outline-none text-sm text-slate-800 bg-white leading-relaxed"
                />

                {/* Composer Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-50/60 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">Quick insert:</span>
                    <button 
                      type="button" 
                      onClick={() => setReplyText("Hi " + (threadDetails?.contact?.fullName?.split(' ')[0] || 'there') + ",\n\nThanks for reaching back out! We'd be glad to walk you through a brief 10-minute demo to see how TripGain can streamline travel bookings and corporate approvals for your team.\n\nWould you have 10 minutes open tomorrow or Wednesday?\n\nBest regards,\nArup")} 
                      className="px-2.5 py-1 hover:bg-slate-200/70 bg-slate-100 rounded-md text-xs font-medium text-slate-600 transition-colors"
                    >
                      + Propose Demo
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setReplyText("Hi " + (threadDetails?.contact?.fullName?.split(' ')[0] || 'there') + ",\n\nHere is our onboarding link where you can explore the platform right away:\nhttps://neo.tripgain.com/register-your-sme\n\nLet me know if you run into any questions while exploring!\n\nBest,\nArup")} 
                      className="px-2.5 py-1 hover:bg-slate-200/70 bg-slate-100 rounded-md text-xs font-medium text-slate-600 transition-colors"
                    >
                      + Send Link
                    </button>
                  </div>

                  <button 
                    onClick={handleSendReply}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs disabled:opacity-50 ml-auto"
                    disabled={!replyText.trim() || sendingReply}
                  >
                    {sendingReply ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Sending via Gmail...
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        Send Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-white border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
                <Inbox className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">No conversation selected</h3>
              <p className="text-slate-500 text-xs max-w-sm">Select a lead conversation from the list to read messages and send replies.</p>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANE - COLLAPSIBLE CONTACT & CAMPAIGN DETAILS */}
      {showRightPanel && (
        <div className="w-80 lg:w-88 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-200 shadow-sm z-20">
          
          {/* Header with Close X */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-sm">Lead & Outreach Info</h3>
            </div>
            <button 
              onClick={() => setShowRightPanel(false)} 
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {threadDetails ? (
            <div className="p-5 space-y-6">
              
              {/* Contact Avatar & Role */}
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
                  {threadDetails.contact?.fullName?.charAt(0) || '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {threadDetails.contact?.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {threadDetails.contact?.jobTitle || 'Business Contact'}
                  </p>
                </div>
              </div>

              {/* Contact Info Card */}
              <section className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact Details</h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-slate-500">Email</span>
                    <span className="font-medium text-slate-900 text-right break-all font-mono">
                      {threadDetails.contact?.emails?.[0]?.email || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500">Company</span>
                    <span className="font-semibold text-slate-900 text-right truncate">
                      {threadDetails.organization?.name || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-slate-500">Location</span>
                    <span className="font-medium text-slate-900 text-right">
                      {threadDetails.organization?.city || 'India'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Outreach Context Card */}
              <section className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Outreach Context</h4>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <span className="block text-slate-500 mb-1">Campaign</span>
                    <Link 
                      href={`/campaigns/${threadDetails.campaignId}`} 
                      className="font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      {threadDetails.campaign?.name || 'Outreach Campaign'}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200/60">
                    <span className="text-slate-500">Enrollment Status</span>
                    <span className="font-bold text-slate-900 capitalize px-2 py-0.5 bg-white border border-slate-200 rounded text-[11px]">
                      {threadDetails.enrollment?.status || 'Active'}
                    </span>
                  </div>
                </div>
              </section>

              {/* Action Buttons */}
              <section className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Triage Actions</h4>
                <button 
                  onClick={() => handleAction('mark-interested')} 
                  className="w-full px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Star className="w-3.5 h-3.5 text-emerald-600" />
                  Mark as Interested
                </button>
                <button 
                  onClick={() => handleAction('mark-not-interested')} 
                  className="w-full px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2 border border-slate-200"
                >
                  <X className="w-3.5 h-3.5 text-slate-400" />
                  Not Interested
                </button>
              </section>

            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              Select a conversation to view contact details
            </div>
          )}
        </div>
      )}

    </div>
  );
}
