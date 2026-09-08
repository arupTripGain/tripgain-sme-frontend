"use client";

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Save, Plus, Play, Clock, Mail, Trash2, CheckCircle2, 
  AlertCircle, X, Eye, Check, Sparkles, ChevronDown, Loader2, Rocket 
} from 'lucide-react';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';
import { TemplateEngine, VARIABLE_REGISTRY } from '@/lib/templateEngine';
import { apiFetch } from '@/lib/api';

const quillModules = {
  toolbar: [
    [{ 'header': [false, 1, 2, 3] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'align': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['blockquote', 'link'],
    ['clean']
  ],
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'align',
  'list',
  'blockquote',
  'link'
];

function CampaignEditWizard() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const initialStepParam = Number(searchParams?.get('step')) || 1;
  const [step, setStep] = useState(initialStepParam >= 1 && initialStepParam <= 5 ? initialStepParam : 1);

  useEffect(() => {
    const s = Number(searchParams?.get('step'));
    if (s >= 1 && s <= 5) {
      setStep(s);
    }
  }, [searchParams]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingAndLaunching, setSavingAndLaunching] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState('draft');

  // 1. Settings State
  const [settings, setSettings] = useState({
    name: '',
    campaignCode: '',
    description: '',
    campaignType: 'COLD_OUTREACH',
    personalizationMode: 'Standard',
    senderMailboxes: [] as string[],
    replyToEmail: '',
    stopOnReply: true,
    openTracking: true
  });

  // 2. Audience State
  const [audienceType, setAudienceType] = useState<'list' | 'smart'>('list');
  const [selectedListId, setSelectedListId] = useState('');
  const [selectedList, setSelectedList] = useState<any>(null);
  const [audienceRules, setAudienceRules] = useState({
    city: '',
    jobTitle: '',
    industry: ''
  });
  const [lists, setLists] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any>(null);

  // 3. Schedule & Limits State
  const [schedule, setSchedule] = useState({
    timezone: 'Asia/Kolkata',
    sendingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    sendingWindowStart: '09:30',
    sendingWindowEnd: '17:30',
    dailyLimit: 25,
    hourlyLimit: 5,
    delay: 180
  });

  // 4. Content & Sequence State
  const [content, setContent] = useState({
    landingPageUrl: '',
    utmCampaign: ''
  });
  const [sequenceSteps, setSequenceSteps] = useState<any[]>([
    { id: 1, type: 'email', delayDays: 0, subject: '', body: '' }
  ]);
  const [editorModes, setEditorModes] = useState<Record<string | number, 'visual' | 'code'>>({});
  
  // AI assist state
  const [activeAiStep, setActiveAiStep] = useState<number | string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Mailboxes & Contacts
  const [availableMailboxes, setAvailableMailboxes] = useState<any[]>([]);
  const [mailboxDropdownOpen, setMailboxDropdownOpen] = useState(false);
  const [mailboxSearch, setMailboxSearch] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);

  // Preview State
  const [previewStep, setPreviewStep] = useState<any>(null);
  const [previewLead, setPreviewLead] = useState({
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex@acmetech.io',
    title: 'Director of Growth',
    companyName: 'Acme Technologies',
    website: 'acmetech.io',
    industry: 'Enterprise Software',
    companySize: '50-100',
    companyPhone: '+1-555-0199',
    personLinkedinUrl: 'https://linkedin.com/in/alexmorgan',
    city: 'Bengaluru',
    personalization: '',
    personalizedLine: '',
    senderName: 'Arup',
    senderCompany: 'TripGain'
  });

  const formatTextToHtml = (raw: string) => {
    if (!raw) return '';
    if (raw.includes('<p>') || raw.includes('<div>') || raw.includes('<br')) return raw;
    return raw.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  };

  // Load initial campaign data and dependencies
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    Promise.all([
      apiFetch(`/api/campaigns/${id}`).then(r => r.json()),
      apiFetch('/api/lists').then(r => r.json()).catch(() => []),
      apiFetch('/api/mailboxes').then(r => r.json()).catch(() => []),
      apiFetch('/api/contacts').then(r => r.json()).catch(() => ({ contacts: [] }))
    ])
      .then(([campData, listsData, mbData, contactsData]) => {
        if (!campData || campData.error) throw new Error(campData?.error || 'Campaign not found');

        // Lists
        const fetchedLists = Array.isArray(listsData) ? listsData : [];
        setLists(fetchedLists);

        // Mailboxes
        const fetchedMailboxes = Array.isArray(mbData) ? mbData : [];
        setAvailableMailboxes(fetchedMailboxes);

        // Contacts
        const fetchedContacts = contactsData.contacts || (Array.isArray(contactsData) ? contactsData : []);
        setContacts(fetchedContacts);
        if (fetchedContacts.length > 0) {
          const c = fetchedContacts[0];
          const pers = c.personalizedLine || c.personalization || '';
          setPreviewLead({
            firstName: c.firstName || 'Alex',
            lastName: c.lastName || 'Morgan',
            email: c.email || c.emails?.[0]?.email || 'alex@acmetech.io',
            title: c.jobTitle || 'Director of Growth',
            companyName: c.companyName || c.organization?.name || 'Acme Technologies',
            website: c.website || c.organization?.domain || 'acmetech.io',
            industry: c.industry || c.organization?.industry || 'Enterprise Software',
            companySize: c.companySize || c.organization?.employeeSize || '50-100',
            companyPhone: c.companyPhone || c.organization?.phone || '+1-555-0199',
            personLinkedinUrl: c.linkedinUrl || '',
            city: c.city || 'Bengaluru',
            personalization: pers,
            personalizedLine: pers,
            senderName: 'Arup',
            senderCompany: 'TripGain'
          });
        }

        // Campaign Status
        setCampaignStatus(campData.status || 'draft');

        // Settings
        setSettings({
          name: campData.name || '',
          campaignCode: campData.campaignCode || '',
          description: campData.description || '',
          campaignType: campData.campaignType || 'COLD_OUTREACH',
          personalizationMode: 'Standard',
          senderMailboxes: Array.isArray(campData.senderMailboxes) ? campData.senderMailboxes : [],
          replyToEmail: campData.replyToEmail || '',
          stopOnReply: campData.stopOnReply !== undefined ? campData.stopOnReply : true,
          openTracking: campData.openTracking !== undefined ? campData.openTracking : true
        });

        // Audience
        if (campData.listId) {
          setAudienceType('list');
          setSelectedListId(campData.listId);
          const found = fetchedLists.find((l: any) => l.id === campData.listId);
          setSelectedList(found || null);
        } else if (campData.list?.listType === 'dynamic' && campData.list?.rules) {
          setAudienceType('smart');
          setAudienceRules(campData.list.rules);
        }

        // Schedule
        setSchedule({
          timezone: campData.timezone || 'Asia/Kolkata',
          sendingDays: Array.isArray(campData.sendingDays) ? campData.sendingDays : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          sendingWindowStart: campData.sendingWindowStart || '09:30',
          sendingWindowEnd: campData.sendingWindowEnd || '17:30',
          dailyLimit: campData.dailySendLimit || 25,
          hourlyLimit: campData.hourlySendLimit || 5,
          delay: campData.delayBetweenSendsSeconds || 180
        });

        // Content
        setContent({
          landingPageUrl: campData.landingPageUrl || '',
          utmCampaign: campData.utmCampaign || ''
        });

        // Sequence Steps
        const primarySeq = campData.sequences?.[0];
        if (primarySeq?.steps?.length > 0) {
          setSequenceSteps(primarySeq.steps.map((s: any, idx: number) => ({
            id: s.id || idx + 1,
            type: s.stepType || 'email',
            stepNumber: s.stepNumber || idx + 1,
            delayDays: s.delayDays ?? (idx === 0 ? 0 : 1),
            subject: s.subjectTemplate || '',
            body: s.bodyHtmlTemplate || s.bodyTemplate || ''
          })));
        } else {
          setSequenceSteps([
            { id: 1, type: 'email', delayDays: 0, subject: '', body: 'Hi {{firstName}},\n\n' }
          ]);
        }

        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading campaign data:', err);
        alert('Failed to load campaign data');
        setLoading(false);
      });
  }, [id]);

  // Eligibility preview
  useEffect(() => {
    if (step === 2) {
      const params = new URLSearchParams();
      if (audienceType === 'list' && selectedListId) {
        params.append('listId', selectedListId);
      } else if (audienceType === 'smart') {
        params.append('rules', JSON.stringify(audienceRules));
      }
      
      if (params.toString()) {
        apiFetch(`/api/campaigns/eligibility?${params.toString()}`)
          .then(r => r.json())
          .then(data => setEligibility(data))
          .catch(console.error);
      } else {
        setEligibility(null);
      }
    }
  }, [audienceType, selectedListId, audienceRules, step]);

  const handleListChange = (listId: string) => {
    setSelectedListId(listId);
    if (!listId) {
      setSelectedList(null);
      return;
    }
    const found = lists.find(l => l.id === listId);
    setSelectedList(found || null);
  };

  const updateStep = (stepId: number | string, fieldOrUpdates: string | Record<string, any>, value?: any) => {
    setSequenceSteps(prev =>
      prev.map(s => {
        if (s.id !== stepId) return s;
        if (typeof fieldOrUpdates === 'string') {
          return { ...s, [fieldOrUpdates]: value };
        }
        return { ...s, ...fieldOrUpdates };
      })
    );
  };

  const addSequenceStep = () => {
    const nextIdx = sequenceSteps.length + 1;
    setSequenceSteps(prev => [
      ...prev,
      { id: Date.now(), type: 'email', delayDays: 2, subject: `Re: Follow up with {{firstName}}`, body: `<p>Hi {{firstName}},</p><p>Following up on my previous note regarding {{companyName}}.</p>` }
    ]);
  };

  const removeSequenceStep = (stepId: number | string) => {
    if (sequenceSteps.length <= 1) {
      alert('A campaign sequence must have at least 1 email step.');
      return;
    }
    const filtered = sequenceSteps.filter(s => s.id !== stepId);
    const reordered = filtered.map((s, idx) => ({
      ...s,
      stepNumber: idx + 1,
      delayDays: idx === 0 ? 0 : s.delayDays
    }));
    setSequenceSteps(reordered);
  };

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      sendingDays: prev.sendingDays.includes(day)
        ? prev.sendingDays.filter(d => d !== day)
        : [...prev.sendingDays, day]
    }));
  };

  const insertVariable = (stepId: number | string, tag: string) => {
    const current = sequenceSteps.find(s => s.id === stepId);
    if (!current) return;
    const body = current.body || '';
    if (body.endsWith('</p>')) {
      updateStep(stepId, 'body', body.slice(0, -4) + ' ' + tag + '</p>');
    } else {
      updateStep(stepId, 'body', body + ' ' + tag);
    }
  };

  const generateWithAI = async (stepId: number | string) => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const res = await apiFetch('/api/ai/generate-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instruction: aiPrompt,
          context: 'Company: TripGain\nProduct: Business Travel & Expense Management\nTarget: SME decision makers\nGoal: Start a conversation\nTone: Professional, concise\nCTA: Quick conversation'
        })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || errJson.error || 'Failed to generate template');
      }
      const data = await res.json();
      let template: string = data.template || '';

      let extractedSubject = '';
      const subjectMatch = template.match(/^(\*{0,2})Subject:\s*(\*{0,2})\s*(.+?)(\r?\n|$)/i);
      if (subjectMatch) {
        extractedSubject = subjectMatch[3].trim().replace(/^\*+|\*+$/g, '');
        template = template.replace(/^(\*{0,2})Subject:\s*(\*{0,2}).*?(\r?\n)+/i, '').trim();
      }

      template = TemplateEngine.autoBalanceTags(template);

      const validation = TemplateEngine.validateTemplate(template);
      if (!validation.isValid) {
        alert('AI generated an invalid template with unapproved variables:\n' + validation.errors.join('\n'));
        return;
      }

      updateStep(stepId, {
        body: template,
        ...(extractedSubject ? { subject: extractedSubject } : {})
      });
      setActiveAiStep(null);
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error generating AI template');
    } finally {
      setAiLoading(false);
    }
  };

  const renderPreview = (text: string) => {
    let html = TemplateEngine.renderTemplate(text, previewLead, settings.personalizationMode as any, true);
    html = html.replace(/<p>\s*<\/p>/gi, '');
    if (!html.includes('<p>') && !html.includes('<div>')) {
      html = html.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
    }
    return (
      <div 
        className="email-preview-content text-sm leading-relaxed text-secondary
          [&_p]:mb-4 [&_p:last-child]:mb-0
          [&_p:empty]:hidden
          [&_p>br:only-child]:inline-block [&_p>br:only-child]:h-3
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
          [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3
          [&_a]:text-blue-600 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: html }} 
      />
    );
  };

  // Save changes via PUT /api/campaigns/:id
  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const payload = {
        ...settings,
        ...schedule,
        ...content,
        listId: audienceType === 'list' ? selectedListId : null,
        audienceRules: audienceType === 'smart' ? audienceRules : null,
        dailySendLimit: schedule.dailyLimit,
        hourlySendLimit: schedule.hourlyLimit,
        delayBetweenSendsSeconds: schedule.delay,
        sequenceSteps: sequenceSteps.map((s, idx) => ({
          id: s.id,
          stepNumber: idx + 1,
          delayDays: idx === 0 ? 0 : Number(s.delayDays || 1),
          subject: TemplateEngine.htmlToHandlebars(s.subject || ''),
          body: TemplateEngine.htmlToHandlebars(s.body || '')
        }))
      };

      const res = await apiFetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save changes');
      }

      router.push(`/campaigns/${id}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error saving campaign');
    } finally {
      setSaving(false);
    }
  };

  // Save changes & immediately launch via POST /api/campaigns/:id/activate
  const handleSaveAndLaunch = async () => {
    setSavingAndLaunching(true);
    try {
      // 1. Save
      const payload = {
        ...settings,
        ...schedule,
        ...content,
        listId: audienceType === 'list' ? selectedListId : null,
        audienceRules: audienceType === 'smart' ? audienceRules : null,
        dailySendLimit: schedule.dailyLimit,
        hourlySendLimit: schedule.hourlyLimit,
        delayBetweenSendsSeconds: schedule.delay,
        sequenceSteps: sequenceSteps.map((s, idx) => ({
          id: s.id,
          stepNumber: idx + 1,
          delayDays: idx === 0 ? 0 : Number(s.delayDays || 1),
          subject: TemplateEngine.htmlToHandlebars(s.subject || ''),
          body: TemplateEngine.htmlToHandlebars(s.body || '')
        }))
      };

      const saveRes = await apiFetch(`/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save campaign before launching');
      }

      // 2. Activate
      const activateRes = await apiFetch(`/api/campaigns/${id}/activate`, {
        method: 'POST'
      });

      if (!activateRes.ok) {
        const actData = await activateRes.json().catch(() => ({}));
        throw new Error(actData.error || 'Failed to activate campaign');
      }

      router.push(`/campaigns/${id}`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error launching campaign');
    } finally {
      setSavingAndLaunching(false);
    }
  };

  const stepLabels = ['Identity', 'Audience', 'Limits', 'Sequence', 'Review'];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Loading campaign settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa]">
      
      {/* Top Header Stepper */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href={`/campaigns/${id}`} className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-2xl font-bold text-secondary">{settings.name || 'Edit Campaign'}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${campaignStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {campaignStatus}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Configure outreach settings, audience, timing, and sequence</p>
          </div>
        </div>

        {/* Clickable Step Pills */}
        <div className="hidden md:flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStep(i + 1)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-xs border cursor-pointer ${
                  step === i + 1 
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20' 
                    : 'bg-card text-muted-foreground border-border hover:text-foreground hover:bg-muted'
                }`}
              >
                {i + 1}. {label}
              </button>
              {i < 4 && <div className="w-4 h-px bg-border" />}
            </div>
          ))}
        </div>

        {/* Quick Actions in Header */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={saving || savingAndLaunching}
            className="inline-flex items-center justify-center rounded-full border border-border bg-card hover:bg-muted h-10 px-5 text-sm font-semibold shadow-sm transition-colors text-secondary gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-muted-foreground" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {campaignStatus === 'draft' && (
            <button
              type="button"
              onClick={handleSaveAndLaunch}
              disabled={saving || savingAndLaunching}
              className="inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow hover:shadow-md hover:from-emerald-700 hover:to-teal-700 h-10 px-6 gap-2 disabled:opacity-50 cursor-pointer"
            >
              {savingAndLaunching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {savingAndLaunching ? 'Launching...' : 'Save & Launch'}
            </button>
          )}
        </div>
      </div>

      {/* Main Form Scrollable Container */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="w-full max-w-7xl space-y-8 pb-20">
          
          {/* ================= STEP 1: IDENTITY ================= */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-secondary">1. Campaign Identity</h3>
                  <span className="text-xs text-muted-foreground">Step 1 of 5</span>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-secondary">Campaign Name <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={settings.name} 
                        onChange={e => {
                          const name = e.target.value;
                          setSettings({ ...settings, name });
                        }} 
                        className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" 
                        placeholder="TripGain SME Founders - BLR - Sep 2026" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-secondary">Campaign Code <span className="text-red-500">*</span></label>
                      <input 
                        type="text" 
                        value={settings.campaignCode} 
                        onChange={e => setSettings({ ...settings, campaignCode: e.target.value.toUpperCase() })}
                        className="w-full h-10 px-3 rounded-md border border-input outline-none uppercase font-mono text-sm" 
                        placeholder="TG-SME-BLR-FOUNDERS-SEP26" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary">Campaign Type</label>
                    <select 
                      value={settings.campaignType} 
                      onChange={e => setSettings({ ...settings, campaignType: e.target.value })} 
                      className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="COLD_OUTREACH">Cold Outreach</option>
                      <option value="WARM_LEAD_FOLLOW_UP">Warm Lead Follow Up</option>
                      <option value="PROMOTIONAL">Promotional</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary">Internal Description</label>
                    <textarea 
                      value={settings.description} 
                      onChange={e => setSettings({ ...settings, description: e.target.value })} 
                      className="w-full p-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none min-h-[80px]" 
                      placeholder="Purpose, target persona, and goals for this campaign..." 
                    />
                  </div>

                  {/* Mailbox Selector */}
                  <div className="space-y-2 pt-4 border-t border-border">
                    <label className="text-sm font-medium text-secondary flex items-center justify-between">
                      <span>Sender Mailboxes <span className="text-red-500">*</span></span>
                      <span className="text-xs text-muted-foreground">{settings.senderMailboxes?.length || 0} selected</span>
                    </label>
                    <div className="relative">
                      <div 
                        onClick={() => setMailboxDropdownOpen(true)}
                        className="flex flex-wrap gap-2 p-2 min-h-[44px] rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-primary items-center cursor-pointer relative"
                      >
                        {settings.senderMailboxes?.map((email, idx) => (
                          <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-900 rounded-md text-xs font-medium border border-blue-200 shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>{email}</span>
                            <button 
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSettings({ ...settings, senderMailboxes: settings.senderMailboxes.filter((_, i) => i !== idx) });
                              }} 
                              className="text-blue-600 hover:text-red-500 ml-1 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))}
                        <input 
                          type="text" 
                          value={mailboxSearch}
                          onChange={(e) => {
                            setMailboxSearch(e.target.value);
                            setMailboxDropdownOpen(true);
                          }}
                          onFocus={() => setMailboxDropdownOpen(true)}
                          className="flex-1 bg-transparent border-none outline-none text-sm min-w-[140px] px-2 h-7" 
                          placeholder={settings.senderMailboxes?.length ? "Add more mailboxes..." : "Select sender mailboxes..."} 
                        />
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMailboxDropdownOpen(prev => !prev);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {mailboxDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMailboxDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-gray-100">
                            {availableMailboxes
                              .filter(mb => mb.email?.toLowerCase().includes(mailboxSearch.toLowerCase()))
                              .map(mb => {
                                const isSelected = (settings.senderMailboxes || []).includes(mb.email);
                                return (
                                  <div 
                                    key={mb.id}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSettings({
                                          ...settings,
                                          senderMailboxes: settings.senderMailboxes.filter(e => e !== mb.email)
                                        });
                                      } else {
                                        setSettings({
                                          ...settings,
                                          senderMailboxes: [...(settings.senderMailboxes || []), mb.email]
                                        });
                                      }
                                      setMailboxSearch('');
                                    }}
                                    className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/70' : 'hover:bg-gray-50'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                        {mb.email?.charAt(0).toUpperCase()}
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-gray-900">{mb.displayName || mb.email}</p>
                                        <p className="text-[11px] text-gray-500 font-mono">{mb.email}</p>
                                      </div>
                                    </div>
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reply-To Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary">Reply-To Email (Optional)</label>
                    <input 
                      type="email" 
                      value={settings.replyToEmail} 
                      onChange={e => setSettings({ ...settings, replyToEmail: e.target.value })} 
                      className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" 
                      placeholder="reply@tripgainapp.com" 
                    />
                  </div>

                  {/* Safety & Tracking Toggles */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-card rounded-lg border border-border p-3.5 flex items-center justify-between shadow-xs">
                      <div>
                        <h5 className="font-medium text-secondary text-xs">Stop sending on reply</h5>
                        <p className="text-[11px] text-muted-foreground">Automatically completes sequence when lead replies</p>
                      </div>
                      <div className="flex bg-muted p-0.5 rounded-md">
                        <button type="button" onClick={() => setSettings({ ...settings, stopOnReply: false })} className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${!settings.stopOnReply ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'}`}>Off</button>
                        <button type="button" onClick={() => setSettings({ ...settings, stopOnReply: true })} className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${settings.stopOnReply ? 'bg-emerald-600 text-white shadow-xs font-bold' : 'text-muted-foreground'}`}>On</button>
                      </div>
                    </div>

                    <div className="bg-card rounded-lg border border-border p-3.5 flex items-center justify-between shadow-xs">
                      <div>
                        <h5 className="font-medium text-secondary text-xs">Open Tracking</h5>
                        <p className="text-[11px] text-muted-foreground">Track read receipts with invisible tracking pixel</p>
                      </div>
                      <div className="flex bg-muted p-0.5 rounded-md">
                        <button type="button" onClick={() => setSettings({ ...settings, openTracking: false })} className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${!settings.openTracking ? 'bg-background shadow-xs text-foreground font-bold' : 'text-muted-foreground'}`}>Off</button>
                        <button type="button" onClick={() => setSettings({ ...settings, openTracking: true })} className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors ${settings.openTracking ? 'bg-primary text-primary-foreground shadow-xs font-bold' : 'text-muted-foreground'}`}>On</button>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => setStep(2)} 
                  disabled={!settings.name} 
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Continue to Audience →
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: AUDIENCE ================= */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-secondary">2. Audience Selection</h3>
                  <span className="text-xs text-muted-foreground">Step 2 of 5</span>
                </div>
                <div className="p-6 grid grid-cols-5 gap-8">
                  <div className="col-span-3 space-y-6">
                    <div className="flex gap-2 p-1 bg-muted rounded-lg inline-flex">
                      <button 
                        type="button"
                        onClick={() => setAudienceType('list')} 
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${audienceType === 'list' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Saved List
                      </button>
                      <button 
                        type="button"
                        onClick={() => setAudienceType('smart')} 
                        className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-colors ${audienceType === 'smart' ? 'bg-background shadow-xs text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      >
                        Smart Filter
                      </button>
                    </div>

                    {audienceType === 'list' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Target List <span className="text-red-500">*</span></label>
                        <select 
                          value={selectedListId} 
                          onChange={e => handleListChange(e.target.value)} 
                          className="w-full h-11 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none text-sm font-medium"
                        >
                          <option value="">-- Choose a list --</option>
                          {lists.map(l => (
                            <option key={l.id} value={l.id}>
                              {l.name} ({l.contacts ?? l._count?.members ?? 0} contacts)
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Industry</label>
                            <input 
                              type="text" 
                              value={audienceRules.industry} 
                              onChange={e => setAudienceRules({ ...audienceRules, industry: e.target.value })} 
                              className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none text-sm" 
                              placeholder="e.g. Information Technology" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Job Title</label>
                            <input 
                              type="text" 
                              value={audienceRules.jobTitle} 
                              onChange={e => setAudienceRules({ ...audienceRules, jobTitle: e.target.value })} 
                              className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none text-sm" 
                              placeholder="e.g. Founder, CEO" 
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-secondary">City</label>
                          <input 
                            type="text" 
                            value={audienceRules.city} 
                            onChange={e => setAudienceRules({ ...audienceRules, city: e.target.value })} 
                            className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none text-sm" 
                            placeholder="e.g. Bengaluru" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Eligibility Metric Panel */}
                  <div className="col-span-2">
                    <div className="bg-muted/10 border border-border rounded-xl p-5 sticky top-5 space-y-4 shadow-xs">
                      <h4 className="font-bold text-secondary text-xs uppercase tracking-wider border-b border-border pb-2 flex items-center justify-between">
                        <span>Eligibility Preview</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      </h4>
                      
                      {eligibility ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Audience Count:</span>
                            <span className="font-medium text-secondary">{eligibility.totalContacts}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground text-red-500/80">Suppressed:</span>
                            <span className="font-medium text-secondary">{eligibility.suppressed}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground text-amber-600/80">Already Active:</span>
                            <span className="font-medium text-secondary">{eligibility.alreadyActive}</span>
                          </div>
                          <div className="pt-3 border-t border-border flex justify-between items-center">
                            <span className="font-bold text-secondary">Eligible to Sequence:</span>
                            <span className="font-bold text-emerald-600 text-lg">{eligibility.eligibleContacts}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedList ? `Selected list "${selectedList.name}" has ${selectedList.contacts ?? 0} members.` : 'Select an audience list to preview contacts.'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button 
                  type="button"
                  onClick={() => setStep(1)} 
                  className="px-6 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  ← Back to Identity
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(3)} 
                  disabled={audienceType === 'list' ? !selectedListId : (!audienceRules.industry && !audienceRules.jobTitle && !audienceRules.city)} 
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Continue to Limits →
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: LIMITS & SCHEDULE ================= */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-secondary">3. Sending Schedule & Limits</h3>
                  <span className="text-xs text-muted-foreground">Step 3 of 5</span>
                </div>
                <div className="p-6 space-y-8">
                  
                  <div>
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Timing & Days</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Timezone</label>
                        <select 
                          value={schedule.timezone} 
                          onChange={e => setSchedule({ ...schedule, timezone: e.target.value })} 
                          className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none text-sm font-medium"
                        >
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                          <option value="Europe/London">Europe/London (GMT)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Sending Days</label>
                        <div className="flex gap-2">
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                            <button 
                              key={day} 
                              type="button"
                              onClick={() => toggleDay(day)}
                              className={`h-10 w-10 flex items-center justify-center rounded-lg text-xs font-bold transition-all border ${
                                schedule.sendingDays.includes(day) 
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs' 
                                  : 'bg-card text-muted-foreground border-border hover:border-primary/50'
                              }`}
                            >
                              {day.charAt(0)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Sending Window Start</label>
                        <input 
                          type="time" 
                          value={schedule.sendingWindowStart} 
                          onChange={e => setSchedule({ ...schedule, sendingWindowStart: e.target.value })} 
                          className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Sending Window End</label>
                        <input 
                          type="time" 
                          value={schedule.sendingWindowEnd} 
                          onChange={e => setSchedule({ ...schedule, sendingWindowEnd: e.target.value })} 
                          className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Limits & Pacing</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Daily Limit (emails/day)</label>
                        <input 
                          type="number" 
                          value={schedule.dailyLimit} 
                          onChange={e => setSchedule({ ...schedule, dailyLimit: parseInt(e.target.value) || 25 })} 
                          className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Hourly Limit (emails/hour)</label>
                        <input 
                          type="number" 
                          value={schedule.hourlyLimit} 
                          onChange={e => setSchedule({ ...schedule, hourlyLimit: parseInt(e.target.value) || 5 })} 
                          className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Delay Between Sends (seconds)</label>
                        <input 
                          type="number" 
                          value={schedule.delay} 
                          onChange={e => setSchedule({ ...schedule, delay: parseInt(e.target.value) || 180 })} 
                          className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" 
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex justify-between">
                <button 
                  type="button"
                  onClick={() => setStep(2)} 
                  className="px-6 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  ← Back to Audience
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(4)} 
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                >
                  Continue to Sequence →
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: SEQUENCE BUILDER ================= */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-secondary">4. Content & Sequence Steps</h3>
                  <span className="text-xs text-muted-foreground">{sequenceSteps.length} Step{sequenceSteps.length === 1 ? '' : 's'}</span>
                </div>
                
                <div className="p-6 space-y-8">
                  <div className="flex gap-6 items-start">
                    
                    {/* Left: Steps List */}
                    <div className="flex-1 space-y-5">
                      {sequenceSteps.map((s, index) => (
                        <div key={s.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                          {index > 0 && (
                            <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between text-xs font-medium text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3.5 h-3.5 text-primary" /> Wait 
                                <input 
                                  type="number" 
                                  className="w-14 h-7 px-1.5 border border-input rounded-md text-center text-xs font-semibold bg-background" 
                                  value={s.delayDays} 
                                  onChange={e => updateStep(s.id, 'delayDays', parseInt(e.target.value) || 1)} 
                                /> days before sending this step
                              </div>
                            </div>
                          )}
                          <div className="p-5 flex gap-4">
                            <div className="flex flex-col items-center gap-2 w-10 shrink-0 border-r border-border pr-3">
                              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                {index + 1}
                              </div>
                              <Mail className="w-4 h-4 text-muted-foreground" />
                            </div>
                            
                            <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="w-full space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject Line</label>
                                    <div className="flex items-center gap-2">
                                      {index > 0 && <span className="text-xs text-muted-foreground italic mr-1">Leave empty to reply in thread</span>}
                                      <button 
                                        type="button"
                                        onClick={() => setPreviewStep(s.id)} 
                                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded border border-primary/20 transition-colors"
                                      >
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                      </button>
                                      <select 
                                        className="text-xs border border-border rounded px-2 py-1 bg-muted/50 hover:bg-muted outline-none cursor-pointer text-muted-foreground font-medium"
                                        defaultValue=""
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            updateStep(s.id, 'subject', (s.subject || '') + (s.subject ? ' ' : '') + e.target.value);
                                            e.target.value = '';
                                          }
                                        }}
                                      >
                                        <option value="" disabled>+ Subject Var</option>
                                        <option value="{{firstName}}">First Name</option>
                                        <option value="{{companyName}}">Company Name</option>
                                        <option value="{{title}}">Job Title</option>
                                        <option value="{{industry}}">Industry</option>
                                      </select>
                                    </div>
                                  </div>
                                  <input 
                                    type="text" 
                                    value={s.subject} 
                                    onChange={e => updateStep(s.id, 'subject', e.target.value)} 
                                    className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none font-medium text-sm" 
                                    placeholder={index === 0 ? "e.g. Quick thought for {{firstName}}" : "Re: Quick thought for {{firstName}}"} 
                                  />
                                </div>
                                {index > 0 && (
                                  <button 
                                    type="button"
                                    onClick={() => removeSequenceStep(s.id)} 
                                    className="ml-3 p-2 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                                    title="Delete step"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>

                              {/* Body Editor Container */}
                              <div className="space-y-2">
                                <div className="flex justify-between items-center pb-1">
                                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Body</label>
                                  <div className="flex items-center gap-2">
                                    {/* Insert Variable Dropdown */}
                                    <select
                                      className="text-xs border border-border rounded px-2 py-1 bg-muted/50 hover:bg-muted outline-none cursor-pointer text-muted-foreground font-medium"
                                      defaultValue=""
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          insertVariable(s.id, e.target.value);
                                          e.target.value = '';
                                        }
                                      }}
                                    >
                                      <option value="" disabled>+ Insert Variable</option>
                                      <option value="{{firstName}}">First Name (&#123;&#123;firstName&#125;&#125;)</option>
                                      <option value="{{lastName}}">Last Name (&#123;&#123;lastName&#125;&#125;)</option>
                                      <option value="{{companyName}}">Company Name (&#123;&#123;companyName&#125;&#125;)</option>
                                      <option value="{{title}}">Job Title (&#123;&#123;title&#125;&#125;)</option>
                                      <option value="{{industry}}">Industry (&#123;&#123;industry&#125;&#125;)</option>
                                      <option value="{{website}}">Website (&#123;&#123;website&#125;&#125;)</option>
                                      <option value="{{city}}">City (&#123;&#123;city&#125;&#125;)</option>
                                      <option value="{{personalization}}">AI Personalization (&#123;&#123;personalization&#125;&#125;)</option>
                                      <option value="{{senderName}}">Sender Name (&#123;&#123;senderName&#125;&#125;)</option>
                                      <option value="{{senderCompany}}">Sender Company (&#123;&#123;senderCompany&#125;&#125;)</option>
                                    </select>

                                    {/* Visual / HTML Switcher */}
                                    <div className="flex items-center bg-muted/70 p-0.5 rounded-md border border-border text-xs">
                                      <button
                                        type="button"
                                        onClick={() => setEditorModes(prev => ({ ...prev, [s.id]: 'visual' }))}
                                        className={`px-2 py-0.5 rounded transition-all font-medium ${
                                          (editorModes[s.id] || 'visual') === 'visual'
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                      >
                                        Visual
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setEditorModes(prev => ({ ...prev, [s.id]: 'code' }))}
                                        className={`px-2 py-0.5 rounded transition-all font-medium ${
                                          editorModes[s.id] === 'code'
                                            ? 'bg-background text-foreground shadow-xs font-semibold'
                                            : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                      >
                                        &lt;/&gt; HTML
                                      </button>
                                    </div>

                                    <button 
                                      type="button"
                                      onClick={() => setActiveAiStep(activeAiStep === s.id ? null : s.id)} 
                                      className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md transition-colors"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" /> AI Generate
                                    </button>
                                  </div>
                                </div>

                                {/* Quick Insert Chips */}
                                <div className="flex items-center gap-1.5 flex-wrap py-1 text-xs">
                                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-0.5">Quick Insert:</span>
                                  {[
                                    { label: 'First Name', tag: '{{firstName}}' },
                                    { label: 'Company', tag: '{{companyName}}' },
                                    { label: 'AI Icebreaker', tag: '{{personalization}}' },
                                    { label: 'Job Title', tag: '{{title}}' },
                                    { label: 'Sender', tag: '{{senderName}}' },
                                  ].map(chip => (
                                    <button
                                      key={chip.tag}
                                      type="button"
                                      onClick={() => insertVariable(s.id, chip.tag)}
                                      className="px-2 py-0.5 rounded bg-muted/60 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-border text-muted-foreground transition-all text-xs font-mono"
                                    >
                                      + {chip.tag}
                                    </button>
                                  ))}
                                </div>

                                {/* AI Prompt Box */}
                                {activeAiStep === s.id && (
                                  <div className="bg-purple-50/50 border border-purple-100 rounded-md p-3 mb-2 flex flex-col gap-2">
                                    <textarea 
                                      value={aiPrompt}
                                      onChange={e => setAiPrompt(e.target.value)}
                                      placeholder="e.g. Write a short cold email to SME founders focusing on corporate travel bookings and expense consolidation..."
                                      className="w-full text-sm p-2 rounded border border-purple-200 outline-none focus:ring-1 focus:ring-purple-400 min-h-[60px]"
                                    />
                                    <div className="flex justify-end">
                                      <button 
                                        type="button"
                                        onClick={() => generateWithAI(s.id)}
                                        disabled={aiLoading || !aiPrompt.trim()}
                                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50 flex items-center gap-2"
                                      >
                                        {aiLoading ? 'Generating...' : <><Sparkles className="w-3 h-3" /> Generate Template</>}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Editor Body */}
                                {(editorModes[s.id] || 'visual') === 'visual' ? (
                                  <div className="bg-background rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-primary [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-input [&_.ql-toolbar]:bg-muted/30 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[180px] [&_.ql-editor]:text-sm [&_.ql-editor_a]:text-blue-600 [&_.ql-editor_a]:underline">
                                    <ReactQuill 
                                      theme="snow" 
                                      modules={quillModules}
                                      formats={quillFormats}
                                      value={s.body} 
                                      onChange={val => updateStep(s.id, 'body', val)} 
                                      placeholder="Hi {{firstName}}..." 
                                    />
                                  </div>
                                ) : (
                                  <textarea
                                    value={s.body}
                                    onChange={e => updateStep(s.id, 'body', e.target.value)}
                                    className="w-full text-sm p-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none font-mono bg-muted/20 min-h-[200px] resize-y leading-relaxed"
                                    placeholder="<p>Hi {{firstName}},...</p>"
                                    spellCheck={false}
                                  />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="flex justify-center pt-2">
                        <button 
                          type="button"
                          onClick={addSequenceStep} 
                          className="inline-flex items-center justify-center rounded-full text-sm font-medium border-2 border-dashed border-primary text-primary hover:bg-primary/5 h-10 px-6 gap-2 cursor-pointer"
                        >
                          <Plus className="h-4 w-4" /> Add Next Step
                        </button>
                      </div>

                      {/* Template Health Validation */}
                      <div className="bg-card rounded-xl border border-border shadow-xs p-5 mt-6">
                        <h4 className="font-semibold text-secondary text-sm mb-3">Template Health & Validation</h4>
                        {(() => {
                          const allText = sequenceSteps.map(s => (s.subject || '') + '\n\n' + (s.body || '')).join('\n\n');
                          const validation = TemplateEngine.validateTemplate(allText);
                          return (
                            <div className="space-y-2 text-sm">
                              {validation.isValid ? (
                                <div className="flex items-start gap-2 text-emerald-600">
                                  <CheckCircle2 className="w-4 h-4 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-xs">All sequence templates validated successfully</p>
                                    <p className="text-muted-foreground text-[11px]">{validation.variablesFound.length} Handlebars tags recognized</p>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 text-red-600">
                                  <AlertCircle className="w-4 h-4 mt-0.5" />
                                  <div>
                                    <p className="font-medium text-xs">Template validation issues detected</p>
                                    {validation.errors.map((e, i) => (
                                      <p key={i} className="text-xs text-red-500 mt-0.5">✕ {e}</p>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Right: Dynamic Variables Drawer */}
                    <div className="w-64 shrink-0 space-y-4 sticky top-6">
                      <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
                        <div className="bg-muted/30 px-4 py-3 border-b border-border">
                          <h4 className="font-semibold text-secondary text-xs uppercase tracking-wider">Dynamic Variables</h4>
                          <p className="text-[11px] text-muted-foreground mt-0.5">Click to copy into email templates</p>
                        </div>
                        <div className="p-3 space-y-3 max-h-[420px] overflow-y-auto">
                          {['Contact', 'Company', 'Personalization', 'Sender'].map(category => {
                            const vars = Object.values(VARIABLE_REGISTRY).filter(v => v.category === category);
                            if (vars.length === 0) return null;
                            return (
                              <div key={category} className="space-y-1">
                                <h5 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{category}</h5>
                                {vars.map(v => (
                                  <button
                                    key={v.tag}
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(v.tag)}
                                    className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-muted transition-colors group flex flex-col gap-0.5 border border-transparent hover:border-border cursor-pointer"
                                    title={`Click to copy: ${v.tag}`}
                                  >
                                    <span className="text-xs font-medium text-secondary">{v.label}</span>
                                    <code className="text-[11px] text-primary font-mono bg-primary/5 px-1 py-0.5 rounded group-hover:bg-primary/10 transition-colors w-fit">{v.tag}</code>
                                  </button>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <button 
                  type="button"
                  onClick={() => setStep(3)} 
                  className="px-6 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors"
                >
                  ← Back to Limits
                </button>
                <button 
                  type="button"
                  onClick={() => setStep(5)} 
                  disabled={sequenceSteps.some((s, i) => (i === 0 && !s.subject?.trim()) || !s.body?.trim()) || !settings.senderMailboxes?.length} 
                  className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  Continue to Review →
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 5: REVIEW & SAVE ================= */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-emerald-500/10 px-6 py-8 border-b border-border flex flex-col items-center justify-center text-center">
                  <h2 className="text-2xl font-bold text-emerald-800">Campaign Review & Confirm</h2>
                  <p className="text-xs text-emerald-700 mt-1 max-w-lg">
                    Review your updated settings and sequence steps before saving. You can save your changes or directly launch and sequence the campaign.
                  </p>
                </div>
                
                <div className="p-8 grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="space-y-3 bg-muted/20 p-5 rounded-xl border border-border">
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Identity & Sender
                      </h4>
                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <span className="text-muted-foreground">Campaign Name:</span> <span className="font-semibold text-secondary">{settings.name}</span>
                        <span className="text-muted-foreground">Campaign Code:</span> <span className="font-semibold text-secondary font-mono">{settings.campaignCode}</span>
                        <span className="text-muted-foreground">Type:</span> <span className="font-medium text-secondary">{settings.campaignType}</span>
                        <span className="text-muted-foreground">Senders:</span> <span className="font-medium text-secondary">{settings.senderMailboxes?.join(', ') || 'None selected'}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3 bg-muted/20 p-5 rounded-xl border border-border">
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Limits & Schedule
                      </h4>
                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <span className="text-muted-foreground">Volume Limits:</span> <span className="font-medium text-secondary">{schedule.dailyLimit}/day, {schedule.hourlyLimit}/hour</span>
                        <span className="text-muted-foreground">Sending Days:</span> <span className="font-medium text-secondary">{schedule.sendingDays.join(', ')}</span>
                        <span className="text-muted-foreground">Time Window:</span> <span className="font-medium text-secondary">{schedule.sendingWindowStart} – {schedule.sendingWindowEnd}</span>
                        <span className="text-muted-foreground">Timezone:</span> <span className="font-medium text-secondary">{schedule.timezone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-3 bg-muted/20 p-5 rounded-xl border border-border">
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Target Audience
                      </h4>
                      <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                        <div className="text-2xl font-bold text-emerald-700">
                          {selectedList?.name || 'Selected Audience'}
                        </div>
                        <div className="text-xs text-emerald-800 font-medium mt-1">
                          {eligibility?.eligibleContacts ?? (selectedList?.contacts ?? 0)} Eligible contacts sequenced upon launch
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3 bg-muted/20 p-5 rounded-xl border border-border">
                      <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sequence Steps Overview
                      </h4>
                      <div className="space-y-2">
                        {sequenceSteps.map((s, idx) => (
                          <div key={s.id} className="text-xs flex items-center justify-between p-2 rounded bg-background border border-border">
                            <span className="font-semibold text-secondary">Step {idx + 1}: {s.subject || 'Follow-up'}</span>
                            <span className="text-muted-foreground">{idx === 0 ? 'Immediate' : `+${s.delayDays} day(s)`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <button 
                  type="button"
                  onClick={() => setStep(4)} 
                  className="px-6 py-2.5 rounded-full border border-border text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                >
                  ← Back to Sequence
                </button>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={handleSaveChanges} 
                    disabled={saving || savingAndLaunching} 
                    className="px-6 py-3 rounded-full border border-border text-sm font-semibold hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> : <Save className="w-4 h-4 text-muted-foreground" />}
                    {saving ? 'Saving Changes...' : 'Save Changes'}
                  </button>

                  {campaignStatus === 'draft' && (
                    <button 
                      type="button"
                      onClick={handleSaveAndLaunch} 
                      disabled={saving || savingAndLaunching} 
                      className="px-8 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      {savingAndLaunching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                      {savingAndLaunching ? 'Launching...' : 'Save & Launch Campaign'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Email Preview Modal */}
      {previewStep !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-5xl flex overflow-hidden max-h-[90vh]">
            {/* Left Preview Sidebar */}
            <div className="w-80 bg-muted/30 border-r border-border p-6 overflow-y-auto flex flex-col">
              <h3 className="font-bold text-secondary text-base flex items-center gap-2 mb-4">
                <Eye className="w-4 h-4 text-primary" /> Live Lead Preview
              </h3>
              
              <div className="space-y-4 flex-1">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Select Lead</label>
                  <select 
                    className="w-full text-xs border border-border rounded-md p-2 bg-background font-medium"
                    onChange={(e) => {
                      const c = contacts.find(contact => contact.id === e.target.value);
                      if (c) {
                        const pers = c.personalizedLine || c.personalization || '';
                        setPreviewLead({
                          firstName: c.firstName || '',
                          lastName: c.lastName || '',
                          email: c.email || c.emails?.[0]?.email || '',
                          title: c.jobTitle || '',
                          companyName: c.companyName || c.organization?.name || '',
                          website: c.website || c.organization?.domain || '',
                          industry: c.industry || c.organization?.industry || '',
                          companySize: c.companySize || c.organization?.employeeSize || '',
                          companyPhone: c.companyPhone || c.organization?.phone || '',
                          personLinkedinUrl: c.linkedinUrl || '',
                          city: c.city || '',
                          personalization: pers,
                          personalizedLine: pers,
                          senderName: 'Arup',
                          senderCompany: 'TripGain'
                        });
                      }
                    }}
                  >
                    {contacts.length === 0 && <option value="">No leads found...</option>}
                    {contacts.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.fullName || c.email} ({c.companyName || 'Lead'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-background border border-border rounded-lg p-3 space-y-2 text-xs">
                  <div className="font-semibold text-secondary border-b border-border pb-1">Resolved Contact Tokens</div>
                  <div className="text-muted-foreground"><strong className="text-secondary">First Name:</strong> {previewLead.firstName || '-'}</div>
                  <div className="text-muted-foreground"><strong className="text-secondary">Company:</strong> {previewLead.companyName || '-'}</div>
                  <div className="text-muted-foreground"><strong className="text-secondary">Job Title:</strong> {previewLead.title || '-'}</div>
                  <div className="text-muted-foreground"><strong className="text-secondary">City:</strong> {previewLead.city || '-'}</div>
                  {previewLead.personalization && (
                    <div className="text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200 mt-2">
                      <strong className="block text-[10px] uppercase font-bold text-emerald-800">AI Personalization:</strong>
                      {previewLead.personalization}
                    </div>
                  )}
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setPreviewStep(null)} 
                className="mt-6 w-full py-2 bg-muted hover:bg-muted/80 rounded-md text-xs font-semibold text-secondary transition-colors"
              >
                Close Preview
              </button>
            </div>

            {/* Right Email Preview Display */}
            <div className="flex-1 flex flex-col h-full bg-card overflow-hidden">
              <div className="p-4 border-b border-border flex justify-between items-center bg-muted/10">
                <span className="text-xs font-bold uppercase text-muted-foreground">Email Preview Render</span>
                <button type="button" onClick={() => setPreviewStep(null)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 flex-1 overflow-y-auto space-y-4">
                <div className="border border-border rounded-lg p-3 bg-muted/10">
                  <div className="text-xs text-muted-foreground font-semibold">Subject:</div>
                  <div className="text-sm font-bold text-secondary mt-0.5">
                    {TemplateEngine.renderTemplate(
                      sequenceSteps.find(s => s.id === previewStep)?.subject || '', 
                      previewLead, 
                      settings.personalizationMode as any, 
                      false
                    ) || <span className="italic text-muted-foreground">No subject</span>}
                  </div>
                </div>

                <div className="border border-border rounded-lg p-6 bg-background min-h-[300px]">
                  {renderPreview(sequenceSteps.find(s => s.id === previewStep)?.body || '')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function CampaignEditPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <CampaignEditWizard />
    </Suspense>
  );
}
