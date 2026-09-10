"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  Clock, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Loader2, 
  ShieldCheck, 
  AlertTriangle,
  Play,
  Layers,
  Sparkles,
  Users,
  Check,
  ChevronRight,
  HelpCircle,
  X,
  Plus,
  Search,
  CheckSquare,
  Square,
  UserCheck
} from 'lucide-react';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { buildCanonicalLeadContext, TemplateEngine } from '@/lib/templateEngine';

const quillModules = {
  toolbar: [
    [{ 'header': [false, 1, 2, 3] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'align',
  'list', 'bullet',
  'link'
];

const CANONICAL_VARIABLES = [
  { tag: '{{firstName}}', desc: "Recipient's first name" },
  { tag: '{{lastName}}', desc: "Recipient's last name" },
  { tag: '{{companyName}}', desc: "Recipient's company name" },
  { tag: '{{title}}', desc: "Recipient's job title" },
  { tag: '{{city}}', desc: "Recipient's city location" },
  { tag: '{{personalization}}', desc: 'AI personalized opener sentence' },
  { tag: '{{senderName}}', desc: 'Assigned sender name' },
  { tag: '{{senderCompany}}', desc: 'Sender company name (TripGain)' },
  { tag: '{{unsubscribeLink}}', desc: 'One-click unsubscribe link' }
];

interface TestRecipientResult {
  recipient: string;
  contactName: string;
  companyName: string;
  success: boolean;
  messageId?: string;
  renderedSubject?: string;
  error?: string;
}

export default function NewBulkCampaignPage() {
  const router = useRouter();

  // Wizard state: 1: Audience & Info, 2: Compose, 3: Mailbox Pool, 4: Test Email, 5: Pre-flight & Launch
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  // Lists & Mailboxes
  const [lists, setLists] = useState<any[]>([]);
  const [availableMailboxes, setAvailableMailboxes] = useState<any[]>([]);

  // Step 1: Details & Audience
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [audienceContacts, setAudienceContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Step 2: Compose
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('<p>Hi {{firstName}},</p><p><br></p><p><br></p><p style="font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 24px;"><a href="{{unsubscribeLink}}">Unsubscribe</a> from future communications</p>');

  // Preview Modal State
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewContactId, setPreviewContactId] = useState<string>('');

  // Step 3: Mailbox Pool & Throttling
  const [selectedMailboxes, setSelectedMailboxes] = useState<string[]>([]);
  const [dailyLimit, setDailyLimit] = useState(50);
  const [hourlyLimit, setHourlyLimit] = useState(10);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [sendingWindowStart, setSendingWindowStart] = useState('09:30');
  const [sendingWindowEnd, setSendingWindowEnd] = useState('17:30');

  // Step 4: Safe Test Email State
  const [selectedTestContactIds, setSelectedTestContactIds] = useState<string[]>([]);
  const [manualTestEmails, setManualTestEmails] = useState<string[]>([]);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [testResults, setTestResults] = useState<TestRecipientResult[] | null>(null);
  const [testSummaryMessage, setTestSummaryMessage] = useState<string | null>(null);

  // Step 5: Preflight Audit, Queue & Launch
  const [preflightData, setPreflightData] = useState<any | null>(null);
  const [isFetchingPreflight, setIsFetchingPreflight] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  // Initial data loading
  useEffect(() => {
    apiFetch('/api/lists')
      .then(res => res.json())
      .then(data => setLists(Array.isArray(data) ? data : []))
      .catch(console.error);

    apiFetch('/api/mailboxes')
      .then(res => res.json())
      .then(data => {
        const mboxes = Array.isArray(data) ? data : [];
        setAvailableMailboxes(mboxes);
        if (mboxes.length > 0) {
          const healthy = mboxes.filter(m => m.healthScore === undefined || m.healthScore >= 70);
          setSelectedMailboxes(healthy.map(m => m.id));
        }
      })
      .catch(console.error);
  }, []);

  // Fetch contacts for selected audience list
  useEffect(() => {
    if (selectedListId && selectedListId !== 'suppression-1') {
      setIsLoadingContacts(true);
      apiFetch(`/api/lists/${selectedListId}`)
        .then(res => res.json())
        .then(data => {
          const cts = Array.isArray(data?.contacts) ? data.contacts : [];
          setAudienceContacts(cts);
          if (cts.length > 0) {
            setPreviewContactId(cts[0].id);
            // Default first 2 contacts for test if none selected
            setSelectedTestContactIds(prev => prev.length === 0 ? cts.slice(0, Math.min(2, cts.length)).map((c: any) => c.id) : prev);
          }
        })
        .catch(err => {
          console.error('Failed to load list contacts:', err);
          setAudienceContacts([]);
        })
        .finally(() => setIsLoadingContacts(false));
    } else {
      setAudienceContacts([]);
      setPreviewContactId('');
    }
  }, [selectedListId]);

  const handleInsertVariable = (tag: string) => {
    setBody(prev => {
      if (prev.endsWith('</p>')) {
        return prev.slice(0, -4) + ' ' + tag + '</p>';
      }
      return prev + ' ' + tag;
    });
  };

  const handleSaveDraft = async () => {
    if (!name.trim()) {
      alert('Please enter a campaign name');
      return null;
    }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        listId: selectedListId || null,
        subjectTemplate: subject.trim(),
        bodyHtmlTemplate: body,
        senderMailboxes: selectedMailboxes,
        dailySendLimit: Number(dailyLimit),
        hourlySendLimit: Number(hourlyLimit),
        timezone,
        sendingWindowStart,
        sendingWindowEnd
      };

      let res;
      if (campaignId) {
        res = await apiFetch(`/api/bulk-campaigns/${campaignId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await apiFetch('/api/bulk-campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save bulk campaign');
      }

      const saved = await res.json();
      setCampaignId(saved.id);
      return saved;
    } catch (err: any) {
      alert(err.message || 'Error saving campaign');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchPreflightAudit = async (cid: string) => {
    setIsFetchingPreflight(true);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${cid}/preflight`);
      if (res.ok) {
        const data = await res.json();
        setPreflightData(data);
      }
    } catch (err) {
      console.error('Failed to fetch preflight:', err);
    } finally {
      setIsFetchingPreflight(false);
    }
  };

  const handleNextStep = async () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        alert('Campaign name is required.');
        return;
      }
      if (!selectedListId) {
        alert('Please select an Audience list.');
        return;
      }
      const saved = await handleSaveDraft();
      if (saved) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!subject.trim()) {
        alert('Email subject is required.');
        return;
      }
      if (!body.trim() || body === '<p><br></p>') {
        alert('Email body cannot be empty.');
        return;
      }
      const saved = await handleSaveDraft();
      if (saved) setCurrentStep(3);
    } else if (currentStep === 3) {
      if (selectedMailboxes.length === 0) {
        alert('Please select at least one sender mailbox.');
        return;
      }
      const saved = await handleSaveDraft();
      if (saved) setCurrentStep(4);
    } else if (currentStep === 4) {
      const saved = await handleSaveDraft();
      if (saved) {
        setCurrentStep(5);
        fetchPreflightAudit(saved.id);
      }
    }
  };

  // Manual Email Handlers
  const handleAddManualEmail = () => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const email = manualEmailInput.trim().toLowerCase();
    if (!email || !emailRegex.test(email)) {
      alert('Please enter a valid email address.');
      return;
    }
    if (manualTestEmails.includes(email)) {
      alert('This email address is already added.');
      return;
    }
    setManualTestEmails(prev => [...prev, email]);
    setManualEmailInput('');
  };

  const handleRemoveManualEmail = (emailToRemove: string) => {
    setManualTestEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  // Contact Selection Handlers
  const handleToggleContact = (contactId: string) => {
    setSelectedTestContactIds(prev => 
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const handleSelectFirstN = (n: number) => {
    const ids = audienceContacts.slice(0, n).map(c => c.id);
    setSelectedTestContactIds(ids);
  };

  const handleClearSelectedContacts = () => {
    setSelectedTestContactIds([]);
  };

  // Filtered contacts in Test step
  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery.trim()) return audienceContacts;
    const q = contactSearchQuery.toLowerCase();
    return audienceContacts.filter(c => 
      (c.fullName || '').toLowerCase().includes(q) ||
      (c.companyName || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.jobTitle || '').toLowerCase().includes(q)
    );
  }, [audienceContacts, contactSearchQuery]);

  // Selected contact objects for review
  const selectedContactObjects = useMemo(() => {
    return audienceContacts.filter(c => selectedTestContactIds.includes(c.id));
  }, [audienceContacts, selectedTestContactIds]);

  const totalTestRecipientsCount = selectedTestContactIds.length + manualTestEmails.length;

  // Active Preview Lead Context (Canonical Resolution)
  const activePreviewContact = useMemo(() => {
    return audienceContacts.find(c => c.id === previewContactId) || audienceContacts[0] || null;
  }, [audienceContacts, previewContactId]);

  const previewContext = useMemo(() => {
    const activeMailbox = availableMailboxes.find(m => selectedMailboxes.includes(m.id)) || availableMailboxes[0];
    const senderName = activeMailbox?.displayName || 'TripGain Team';
    const senderCompany = activeMailbox?.organization?.name || 'TripGain';
    const ctx = buildCanonicalLeadContext(activePreviewContact, senderName, senderCompany);
    ctx.unsubscribeLink = 'https://tripgain.local/u/preview-token';
    return ctx;
  }, [activePreviewContact, availableMailboxes, selectedMailboxes]);

  const renderedPreviewSubject = useMemo(() => {
    try {
      return TemplateEngine.renderTemplate(subject || 'Preview Subject', previewContext, 'Flexible');
    } catch {
      return subject;
    }
  }, [subject, previewContext]);

  const renderedPreviewBody = useMemo(() => {
    try {
      return TemplateEngine.renderTemplate(body || '<p>Preview body...</p>', previewContext, 'Flexible');
    } catch {
      return body;
    }
  }, [body, previewContext]);

  // Send Test Email Execution
  const handleExecuteSendTest = async () => {
    setShowConfirmModal(false);
    if (totalTestRecipientsCount === 0) {
      alert('Please select at least one test contact or enter a test email address.');
      return;
    }

    let activeCid = campaignId;
    if (!activeCid) {
      const saved = await handleSaveDraft();
      if (!saved) return;
      activeCid = saved.id;
    }

    setIsSendingTest(true);
    setTestResults(null);
    setTestSummaryMessage(null);

    try {
      const res = await apiFetch(`/api/bulk-campaigns/${activeCid}/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactIds: selectedTestContactIds,
          testRecipients: manualTestEmails,
          sampleContactId: previewContactId || selectedTestContactIds[0] || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch test emails');
      }

      setTestResults(data.results || []);
      setTestSummaryMessage(data.message || `Test emails dispatched to ${data.totalSent} recipient(s).`);
    } catch (err: any) {
      setTestSummaryMessage(err.message || 'Error dispatching test emails');
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleQueueRecipients = async () => {
    if (!campaignId) return;
    setIsQueueing(true);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${campaignId}/queue`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to queue recipients');
      }
      setIsQueued(true);
      fetchPreflightAudit(campaignId);
      alert(`Successfully queued ${data.queuedCount} verified recipients. You can now launch the campaign.`);
    } catch (err: any) {
      alert(err.message || 'Error queueing recipients');
    } finally {
      setIsQueueing(false);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!confirm('Launch this Bulk Campaign now? Dispatches will start in the background according to your configured mailbox schedule and limits.')) return;
    if (!campaignId) return;

    setIsLaunching(true);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${campaignId}/launch`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to launch bulk campaign');
      }
      router.push(`/bulk-email/${campaignId}`);
    } catch (err: any) {
      alert(err.message || 'Error launching campaign');
      setIsLaunching(false);
    }
  };

  const hasUnsubscribeTag = body.includes('{{unsubscribeLink}}');
  const canQueue = preflightData && preflightData.canQueue && !isQueued;
  const canLaunch = preflightData && (preflightData.canLaunch || isQueued);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/bulk-email"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Create Bulk Campaign</h1>
            <p className="text-xs text-slate-500 mt-0.5">Step-by-step verified single-touch outreach creation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-all shadow-sm"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>
        </div>
      </div>

      {/* Stepper Navigation (5 Steps) */}
      <div className="grid grid-cols-5 gap-2 border-b border-slate-200 pb-4">
        {[
          { num: 1, label: '1. Audience & Info' },
          { num: 2, label: '2. Compose' },
          { num: 3, label: '3. Mailbox Pool' },
          { num: 4, label: '4. Safe Test Email' },
          { num: 5, label: '5. Pre-flight & Launch' }
        ].map(s => (
          <button
            key={s.num}
            onClick={() => {
              if (s.num < currentStep || campaignId) setCurrentStep(s.num);
            }}
            className={cn(
              "flex items-center gap-2 p-2.5 rounded-lg text-xs font-medium text-left transition-all border",
              currentStep === s.num 
                ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm"
                : currentStep > s.num
                  ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                  : "bg-white border-transparent text-slate-400 cursor-not-allowed"
            )}
          >
            <span className={cn(
              "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
              currentStep === s.num ? "bg-indigo-600 text-white" : currentStep > s.num ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-600"
            )}>
              {currentStep > s.num ? <Check className="w-3 h-3" /> : s.num}
            </span>
            <span className="truncate">{s.label}</span>
          </button>
        ))}
      </div>

      {/* STEP 1: Details & Audience */}
      {currentStep === 1 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Campaign Details & Verified Audience</h2>
            <p className="text-xs text-slate-500 mt-0.5">Bulk campaigns must select an existing verified list of contacts.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Q4 Executive Product Update"
                className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Description / Internal Goal
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={2}
                placeholder="Internal notes regarding this bulk announcement..."
                className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Audience List <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedListId}
                onChange={e => setSelectedListId(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="">-- Choose a verified contact list --</option>
                {lists.map(l => {
                  const count = typeof l.contacts === 'number'
                    ? l.contacts
                    : (l.contactCount ?? l._count?.contacts ?? l._count?.members ?? (Array.isArray(l.contacts) ? l.contacts.length : 0));
                  return (
                    <option key={l.id} value={l.id}>
                      {l.name} — {count} contacts
                    </option>
                  );
                })}
              </select>

              {isLoadingContacts ? (
                <div className="flex items-center gap-2 mt-2 text-xs text-indigo-600">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading audience contacts...
                </div>
              ) : selectedListId && audienceContacts.length > 0 ? (
                <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200 flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Loaded {audienceContacts.length} contacts available for preview and safe test sending.
                </div>
              ) : null}

              <p className="text-[11px] text-slate-500 mt-1.5">
                Only verified audience lists are supported. List counts are strictly scoped to your workspace.
              </p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm shadow-indigo-200"
            >
              Continue to Compose
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Compose Email */}
      {currentStep === 2 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Compose Bulk Outreach Email</h2>
              <p className="text-xs text-slate-500 mt-0.5">Use canonical lead variables. Preview renders actual lead values.</p>
            </div>

            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold transition-all shadow-xs"
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              Preview Email
            </button>
          </div>

          {/* Variable chips bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
              <span>Canonical Lead Variables (Click to insert):</span>
              {!hasUnsubscribeTag && (
                <span className="text-amber-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Missing {'{{unsubscribeLink}}'}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CANONICAL_VARIABLES.map(v => (
                <button
                  key={v.tag}
                  type="button"
                  onClick={() => handleInsertVariable(v.tag)}
                  className="px-2.5 py-1 text-xs font-mono bg-white hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300 border border-slate-200 rounded-md text-slate-700 transition-colors shadow-xs"
                  title={v.desc}
                >
                  {v.tag}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Subject Line <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="e.g. Quick question for {{firstName}} regarding {{companyName}}"
                className="w-full text-sm px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Content <span className="text-red-500">*</span>
              </label>
              <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500">
                <ReactQuill
                  theme="snow"
                  value={body}
                  onChange={setBody}
                  modules={quillModules}
                  formats={quillFormats}
                  className="min-h-[220px]"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(1)}
              className="text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Back to Audience
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-medium rounded-lg transition-all"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                Preview Email
              </button>
              <button
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm shadow-indigo-200"
              >
                Continue to Mailbox Pool
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Mailbox Pool & Throttling */}
      {currentStep === 3 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Mailbox Pool & Reputation Throttling</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select multiple sender mailboxes to rotate outgoing dispatches fairly and maintain safe sending reputation.
            </p>
          </div>

          {/* Mailboxes Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Select Sender Mailboxes <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedMailboxes.length === availableMailboxes.length) {
                    setSelectedMailboxes([]);
                  } else {
                    setSelectedMailboxes(availableMailboxes.map(m => m.id));
                  }
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                {selectedMailboxes.length === availableMailboxes.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {availableMailboxes.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800">
                No configured mailboxes found. Please configure an active SMTP mailbox in settings.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableMailboxes.map(m => {
                  const isChecked = selectedMailboxes.includes(m.id);
                  return (
                    <label
                      key={m.id}
                      className={cn(
                        "flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all",
                        isChecked 
                          ? "bg-indigo-50/60 border-indigo-300 text-slate-900 shadow-xs" 
                          : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {
                          setSelectedMailboxes(prev => 
                            prev.includes(m.id) ? prev.filter(id => id !== m.id) : [...prev, m.id]
                          );
                        }}
                        className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-slate-900 truncate">{m.email}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{m.displayName || 'Default Sender'}</div>
                        <div className="flex items-center gap-2 mt-2 text-[10px]">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded font-medium",
                            (m.healthScore ?? 100) >= 80 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                          )}>
                            Health: {m.healthScore ?? 100}%
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-500">Sent Today: {m.sentToday || 0}/{m.dailyLimit || 100}</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Limits & Throttling */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Daily Send Limit (Per Mailbox)
              </label>
              <input
                type="number"
                min={1}
                max={500}
                value={dailyLimit}
                onChange={e => setDailyLimit(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Hourly Send Limit (Per Mailbox)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={hourlyLimit}
                onChange={e => setHourlyLimit(Number(e.target.value))}
                className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Scheduling Window */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Schedule Timezone
              </label>
              <select
                value={timezone}
                onChange={e => setTimezone(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Window Start Time
              </label>
              <input
                type="time"
                value={sendingWindowStart}
                onChange={e => setSendingWindowStart(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Window End Time
              </label>
              <input
                type="time"
                value={sendingWindowEnd}
                onChange={e => setSendingWindowEnd(e.target.value)}
                className="w-full text-sm px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(2)}
              className="text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Back to Compose
            </button>
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm shadow-indigo-200"
            >
              Continue to Safe Test Email
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Safe Test Email */}
      {currentStep === 4 && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-600" />
                Safe Test Email & Sandbox Verification
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Test emails are strictly isolated: zero enrollments created, zero campaign state consumed, zero scheduler calls.
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200">
              Sandbox Testing
            </span>
          </div>

          {/* Section 1: Select Contacts for Test */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  1. Select Audience Contacts for Test
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tests will use actual lead context (name, company, title, personalization) for authentic recipient rendering.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectFirstN(3)}
                  className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                >
                  Select First 3
                </button>
                <button
                  type="button"
                  onClick={handleClearSelectedContacts}
                  className="text-xs px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Contact search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={contactSearchQuery}
                onChange={e => setContactSearchQuery(e.target.value)}
                placeholder="Search audience contacts by name, company, or email..."
                className="w-full text-xs pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Contacts checkbox list */}
            {audienceContacts.length === 0 ? (
              <div className="p-4 bg-slate-50 rounded-lg text-xs text-slate-500 text-center">
                No audience contacts loaded. Go back to Step 1 to select an audience list.
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-slate-50/50">
                {filteredContacts.map(c => {
                  const isChecked = selectedTestContactIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        "flex items-center justify-between p-3 text-xs cursor-pointer hover:bg-white transition-colors",
                        isChecked && "bg-indigo-50/50"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleContact(c.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div className="truncate">
                          <span className="font-semibold text-slate-900">
                            {c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Unnamed Contact'}
                          </span>
                          <span className="text-slate-400 mx-1.5">—</span>
                          <span className="text-indigo-600 font-medium">
                            {c.companyName || c.organization?.name || 'No Company'}
                          </span>
                          {c.jobTitle && (
                            <span className="text-slate-500 text-[11px] ml-1.5">
                              ({c.jobTitle})
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0 ml-2">
                        {c.email}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Manual Safe Test Addresses */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                2. Additional Manual Test Email Addresses (Optional)
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Add safe inbox addresses (e.g. your own email) to verify dispatches directly.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="email"
                value={manualEmailInput}
                onChange={e => setManualEmailInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddManualEmail();
                  }
                }}
                placeholder="Enter test recipient email (e.g. you@company.com)..."
                className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddManualEmail}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Recipient
              </button>
            </div>

            {manualTestEmails.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {manualTestEmails.map(email => (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-full font-medium"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => handleRemoveManualEmail(email)}
                      className="text-indigo-400 hover:text-indigo-700 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Review Selected Test Recipients & Action */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Test Recipients Review
                </span>
                <p className="text-xs text-slate-600 mt-0.5">
                  Selected: <strong className="text-indigo-600">{selectedTestContactIds.length}</strong> contacts + <strong className="text-indigo-600">{manualTestEmails.length}</strong> manual addresses = <strong className="text-slate-900">{totalTestRecipientsCount} total recipients</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 text-slate-700 hover:bg-white text-xs font-semibold rounded-lg transition-all shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  Preview Selected
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (totalTestRecipientsCount === 0) {
                      alert('Please select at least one contact or manual test recipient.');
                      return;
                    }
                    setShowConfirmModal(true);
                  }}
                  disabled={isSendingTest || totalTestRecipientsCount === 0}
                  className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all shadow-sm shadow-indigo-200"
                >
                  {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Send Test Email ({totalTestRecipientsCount})
                </button>
              </div>
            </div>

            {/* Pill preview of selected targets */}
            {totalTestRecipientsCount > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200/60">
                {selectedContactObjects.map(c => (
                  <span key={c.id} className="text-[11px] px-2 py-0.5 bg-white border border-slate-200 text-slate-700 rounded-md font-medium">
                    {c.fullName || c.firstName || 'Contact'} ({c.companyName || 'Lead'})
                  </span>
                ))}
                {manualTestEmails.map(em => (
                  <span key={em} className="text-[11px] px-2 py-0.5 bg-white border border-indigo-200 text-indigo-700 rounded-md font-medium">
                    {em} (Manual)
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Test Execution Results */}
          {testSummaryMessage && (
            <div className="space-y-3 pt-2">
              <div className={cn(
                "p-3 rounded-lg text-xs flex items-start gap-2.5 border",
                testResults && testResults.some(r => r.success)
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              )}>
                {testResults && testResults.some(r => r.success) 
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  : <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                }
                <div className="font-medium">{testSummaryMessage}</div>
              </div>

              {testResults && testResults.length > 0 && (
                <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 overflow-hidden text-xs">
                  {testResults.map((r, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-2">
                        {r.success ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span className="font-semibold text-slate-900">{r.recipient}</span>
                        {r.contactName && <span className="text-slate-500">({r.contactName} - {r.companyName})</span>}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        r.success ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {r.success ? 'DISPATCHED / SIMULATED' : (r.error || 'FAILED')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(3)}
              className="text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Back to Mailbox Pool
            </button>
            <button
              onClick={handleNextStep}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg font-medium text-sm transition-all shadow-sm shadow-indigo-200"
            >
              Continue to Pre-flight Audit
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Pre-flight Audit & Launch */}
      {currentStep === 5 && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-600" />
                  Pre-flight Hygiene & Safety Audit
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated checks run across suppression lists, mailbox health, and template syntax.
                </p>
              </div>

              {campaignId && (
                <button
                  onClick={() => fetchPreflightAudit(campaignId)}
                  disabled={isFetchingPreflight}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  {isFetchingPreflight ? 'Checking...' : 'Re-run Audit'}
                </button>
              )}
            </div>

            {isFetchingPreflight ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
                <p className="text-xs text-slate-500 mt-2">Analyzing audience and mailbox hygiene...</p>
              </div>
            ) : preflightData ? (
              <div className="space-y-6">
                {/* 1. Audience Breakdown */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Audience Hygiene Breakdown
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Raw List Size</span>
                      <p className="text-lg font-bold text-slate-900 mt-1">{preflightData.audience.rawListSize}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Duplicate Emails</span>
                      <p className="text-lg font-bold text-amber-600 mt-1">{preflightData.audience.duplicateCount}</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Suppressed / Opt-out</span>
                      <p className="text-lg font-bold text-red-600 mt-1">
                        {preflightData.audience.suppressedCount + preflightData.audience.unsubscribedCount}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="text-[10px] uppercase font-bold text-emerald-700">Eligible to Send</span>
                      <p className="text-lg font-bold text-emerald-800 mt-1">{preflightData.audience.finalEligibleRecipients}</p>
                    </div>
                  </div>
                </div>

                {/* 2. Mailbox Pool Health */}
                <div>
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                    Mailbox Pool Capacity & Health
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Configured Mailboxes</span>
                      <p className="text-sm font-bold text-slate-900 mt-1">{preflightData.delivery.mailboxes.length} Active Mailbox(es)</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Remaining Daily Capacity</span>
                      <p className="text-sm font-bold text-slate-900 mt-1">{preflightData.delivery.remainingDailyPoolCapacity} emails</p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Effective Rate</span>
                      <p className="text-sm font-bold text-slate-900 mt-1">~{preflightData.delivery.effectiveHourlyRate} emails / hr</p>
                    </div>
                  </div>
                </div>

                {/* 3. Action Buttons: Queue & Launch */}
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Launch Preparation & Dispatch
                      </h4>
                      <p className="text-xs text-indigo-700 mt-0.5">
                        Queueing snapshots eligible recipients to guarantee exact deterministic delivery.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleQueueRecipients}
                        disabled={isQueueing || isQueued}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all shadow-sm",
                          isQueued 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default"
                            : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
                        )}
                      >
                        {isQueueing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isQueued ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Layers className="w-3.5 h-3.5" />}
                        {isQueued ? 'Recipients Queued' : 'Queue Recipients'}
                      </button>

                      <button
                        type="button"
                        onClick={handleLaunchCampaign}
                        disabled={!isQueued || isLaunching}
                        className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg font-bold text-xs transition-all shadow-sm shadow-emerald-200"
                      >
                        {isLaunching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                        Launch Campaign Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500">
                Please save campaign details to generate pre-flight audit.
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={() => setCurrentStep(4)}
                className="text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Back to Safe Test Email
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Email Preview Modal with Recipient Selector (A -> B -> A Switching) */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Email Preview</h3>
                <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                  Canonical Rendering
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Recipient Selector Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-white space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider shrink-0">
                  Preview As:
                </label>
                <select
                  value={previewContactId}
                  onChange={e => setPreviewContactId(e.target.value)}
                  className="flex-1 text-xs font-medium px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {audienceContacts.length === 0 && (
                    <option value="">Default Recipient (No list selected)</option>
                  )}
                  {audienceContacts.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim()} — {c.companyName || c.organization?.name || 'No Company'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Resolved Variables Metadata Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  <strong>First Name:</strong> {previewContext.firstName || '(empty)'}
                </span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                  <strong>Company:</strong> {previewContext.companyName || '(empty)'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  <strong>Title:</strong> {previewContext.title || '(empty)'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  <strong>City:</strong> {previewContext.city || '(empty)'}
                </span>
              </div>
              {previewContext.personalization && (
                <div className="text-[11px] bg-amber-50/70 border border-amber-200/60 p-2 rounded text-amber-900">
                  <strong>AI Personalization:</strong> &ldquo;{previewContext.personalization}&rdquo;
                </div>
              )}
            </div>

            {/* Email Client Preview Container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {/* Mail client headers */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-xs text-xs">
                <div className="flex items-center text-slate-500">
                  <span className="w-16 font-semibold uppercase text-[10px] text-slate-400">From:</span>
                  <span className="text-slate-800 font-medium">{previewContext.senderName} &lt;team@{previewContext.senderCompany.toLowerCase()}.com&gt;</span>
                </div>
                <div className="flex items-center text-slate-500">
                  <span className="w-16 font-semibold uppercase text-[10px] text-slate-400">To:</span>
                  <span className="text-slate-800 font-medium">
                    {previewContext.firstName} {previewContext.lastName} &lt;{previewContext.email || 'recipient@example.com'}&gt;
                  </span>
                </div>
                <div className="flex items-center text-slate-500 pt-2 border-t border-slate-100">
                  <span className="w-16 font-semibold uppercase text-[10px] text-slate-400">Subject:</span>
                  <span className="text-slate-900 font-bold">{renderedPreviewSubject}</span>
                </div>
              </div>

              {/* Rendered Email Body */}
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs min-h-[180px]">
                <div 
                  className="prose prose-sm max-w-none text-slate-800"
                  dangerouslySetInnerHTML={{ __html: renderedPreviewBody }}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                Switch contacts above to verify that variables render correctly with zero leakage.
              </span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Test Send Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Safe Test Send</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  You are about to dispatch a test email to <strong className="text-indigo-600">{totalTestRecipientsCount} recipient(s)</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 max-h-36 overflow-y-auto">
              <div className="font-semibold text-slate-700">Recipients receiving test:</div>
              {selectedContactObjects.map(c => (
                <div key={c.id} className="text-slate-600 truncate">
                  • {c.fullName || c.firstName} ({c.companyName || 'Lead'}) — {c.email}
                </div>
              ))}
              {manualTestEmails.map(em => (
                <div key={em} className="text-slate-600 truncate">
                  • {em} (Manual safe tester)
                </div>
              ))}
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
              <strong>Sandbox Guarantee:</strong> This test send will NOT create campaign enrollments, will NOT launch the campaign, and will NOT alter sequence status.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSendTest}
                className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm shadow-indigo-200"
              >
                <Send className="w-3.5 h-3.5" />
                Confirm & Send Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
