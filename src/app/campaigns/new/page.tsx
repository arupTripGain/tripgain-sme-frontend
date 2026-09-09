"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Plus, Play, Clock, Mail, Trash2, CheckCircle2, AlertCircle, X, Eye, Check, Sparkles, ChevronDown, Loader2 } from 'lucide-react';
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

export default function CampaignComposerPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeAiStep, setActiveAiStep] = useState<number | null>(null);
  const [editorModes, setEditorModes] = useState<Record<number, 'visual' | 'code'>>({});
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const insertVariable = (stepId: number, tag: string) => {
    const currentStep = sequenceSteps.find(s => s.id === stepId);
    if (!currentStep) return;
    const currentBody = currentStep.body || '';
    if (currentBody.endsWith('</p>')) {
      updateStep(stepId, 'body', currentBody.slice(0, -4) + ' ' + tag + '</p>');
    } else {
      updateStep(stepId, 'body', currentBody + (currentBody ? ' ' : '') + tag);
    }
  };

  const formatTextToHtml = (raw: string) => {
    if (!raw) return '';
    if (raw.includes('<p>') || raw.includes('<div>') || raw.includes('<br')) return raw;
    return raw.split('\n\n').map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  };
  const [lists, setLists] = useState<any[]>([]);
  const [eligibility, setEligibility] = useState<any>(null);
  const [previewStep, setPreviewStep] = useState<number | null>(null);
  const [previewLead, setPreviewLead] = useState({
    firstName: '',
    lastName: '',
    email: '',
    title: '',
    companyName: '',
    website: '',
    industry: '',
    companySize: '',
    companyPhone: '',
    personLinkedinUrl: '',
    city: '',
    personalization: '',
    personalizedLine: '',
    senderName: 'Arup',
    senderCompany: 'TripGain'
  });
  
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

  // 3. Schedule & Limits State
  const [schedule, setSchedule] = useState({
    timezone: 'Asia/Kolkata',
    sendingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    sendingWindowStart: '09:30',
    sendingWindowEnd: '17:30',
    dailyLimit: 25,
    hourlyLimit: 5,
    delay: 600
  });

  // 4. Sequence & Content State
  const [content, setContent] = useState({
    landingPageUrl: 'https://sme-self-onboarding.vercel.app/',
    utmCampaign: ''
  });
  const [sequenceSteps, setSequenceSteps] = useState([
    { id: 1, type: 'email', delayDays: 0, subject: '', body: 'Hi {{firstName}},\n\n' }
  ]);

  const [contacts, setContacts] = useState<any[]>([]);
  const [availableMailboxes, setAvailableMailboxes] = useState<any[]>([]);
  const [mailboxDropdownOpen, setMailboxDropdownOpen] = useState(false);
  const [mailboxSearch, setMailboxSearch] = useState('');

  useEffect(() => {
    apiFetch('/api/lists')
      .then(res => res.json())
      .then(data => setLists(Array.isArray(data) ? data : []))
      .catch(console.error);

    apiFetch('/api/mailboxes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAvailableMailboxes(data);
          const connected = data.filter((m: any) => m.status === 'CONNECTED' && m.isActive !== false);
          if (connected.length > 0) {
            setSettings(prev => ({
              ...prev,
              senderMailboxes: prev.senderMailboxes?.length ? prev.senderMailboxes : [connected[0].email]
            }));
          }
        }
      })
      .catch(console.error);

    apiFetch('/api/contacts')
      .then(res => res.json())
      .then(data => {
        const fetchedContacts = data.contacts || (Array.isArray(data) ? data : []);
        setContacts(fetchedContacts);
        if (fetchedContacts.length > 0) {
          const c = fetchedContacts[0];
          const pers = c.personalizedLine || c.personalization || c.personalizationTrigger || '';
          setPreviewLead({
            firstName: c.firstName || '',
            lastName: c.lastName || '',
            email: c.email || '',
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
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Generate UTM automatically
    if (settings.campaignCode) {
      setContent(prev => ({ ...prev, utmCampaign: settings.campaignCode.toLowerCase().replace(/[^a-z0-9]/g, '_') }));
    }
  }, [settings.campaignCode]);

  useEffect(() => {
    if (step === 2) {
      // Calculate eligibility
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

  const handleListChange = async (listId: string) => {
    setSelectedListId(listId);
    if (!listId) {
      setSelectedList(null);
      return;
    }
    const list = lists.find(l => l.id === listId);
    setSelectedList(list);
  };

  const addSequenceStep = (type: 'email' | 'wait') => {
    if (type === 'email') {
      setSequenceSteps([
        ...sequenceSteps, 
        { id: Date.now(), type: 'email', delayDays: 3, subject: '', body: '' }
      ]);
    }
  };

  const removeSequenceStep = (id: number) => {
    setSequenceSteps(sequenceSteps.filter(s => s.id !== id));
  };

  const generateWithAI = async (stepId: number) => {
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

      // Extract "Subject: ..." line if the AI included it at the top
      let extractedSubject = '';
      const subjectMatch = template.match(/^(\*{0,2})Subject:\s*(\*{0,2})\s*(.+?)(\r?\n|$)/i);
      if (subjectMatch) {
        extractedSubject = subjectMatch[3].trim().replace(/^\*+|\*+$/g, '');
        template = template.replace(/^(\*{0,2})Subject:\s*(\*{0,2}).*?(\r?\n)+/i, '').trim();
      }

      // Auto balance unclosed tags if the AI truncated
      template = TemplateEngine.autoBalanceTags(template);

      // Validate the body template (plain text)
      const validation = TemplateEngine.validateTemplate(template);
      if (!validation.isValid) {
        alert('AI generated an invalid template with unapproved variables:\n' + validation.errors.join('\n'));
        return;
      }

      // Update both body and subject atomically in a single state pass
      updateStep(stepId, {
        body: template,
        ...(extractedSubject ? { subject: extractedSubject } : {})
      });
      setActiveAiStep(null);
      setAiPrompt('');
    } catch (err: any) {
      console.error(err);
      if (err?.message?.includes('Gemini') || err?.message?.includes('provider') || err?.message?.includes('key') || err?.code === 'AI_PROVIDER_NOT_CONFIGURED') {
        if (confirm(`${err.message || 'A Gemini API key is required.'}\n\nWould you like to open Settings to connect your Gemini API key now?`)) {
          window.location.href = '/settings';
        }
      } else {
        alert(err?.message || 'Error generating AI template');
      }
    } finally {
      setAiLoading(false);
    }
  };

  const updateStep = (id: number, fieldOrUpdates: string | Record<string, any>, value?: any) => {
    setSequenceSteps(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        if (typeof fieldOrUpdates === 'string') {
          return { ...s, [fieldOrUpdates]: value };
        }
        return { ...s, ...fieldOrUpdates };
      })
    );
  };

  const toggleDay = (day: string) => {
    setSchedule(prev => ({
      ...prev,
      sendingDays: prev.sendingDays.includes(day) ? prev.sendingDays.filter(d => d !== day) : [...prev.sendingDays, day]
    }));
  };

  const renderPreview = (text: string) => {
    let html = TemplateEngine.renderTemplate(text, previewLead, settings.personalizationMode as any, true);
    
    // Remove phantom empty paragraphs created by Handlebars tags (e.g. <p></p>)
    html = html.replace(/<p>\s*<\/p>/gi, '');

    // If plain text without <p> tags, convert newlines to paragraphs
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

  const [savingDraft, setSavingDraft] = useState(false);

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    try {
      const composeRes = await apiFetch('/api/campaigns/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          ...schedule,
          ...content,
          listId: audienceType === 'list' ? selectedListId : null,
          audienceRules: audienceType === 'smart' ? audienceRules : null,
          dailySendLimit: schedule.dailyLimit,
          hourlySendLimit: schedule.hourlyLimit,
          delayBetweenSendsSeconds: schedule.delay,
          sequenceSteps: sequenceSteps.map(s => ({
            ...s,
            body: TemplateEngine.htmlToHandlebars(s.body || ''),
            subject: TemplateEngine.htmlToHandlebars(s.subject || '')
          }))
        })
      });
      
      if (!composeRes.ok) {
        const errData = await composeRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save campaign draft');
      }
      const campaign = await composeRes.json();
      router.push(`/campaigns/${campaign.id}`);
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Error saving campaign draft');
    } finally {
      setSavingDraft(false);
    }
  };

  const handleActivate = async () => {
    setLoading(true);
    try {
      const composeRes = await apiFetch('/api/campaigns/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settings,
          ...schedule,
          ...content,
          listId: audienceType === 'list' ? selectedListId : null,
          audienceRules: audienceType === 'smart' ? audienceRules : null,
          dailySendLimit: schedule.dailyLimit,
          hourlySendLimit: schedule.hourlyLimit,
          delayBetweenSendsSeconds: schedule.delay,
          sequenceSteps: sequenceSteps.map(s => ({
            ...s,
            body: TemplateEngine.htmlToHandlebars(s.body || ''),
            subject: TemplateEngine.htmlToHandlebars(s.subject || '')
          }))
        })
      });
      
      if (!composeRes.ok) throw new Error('Failed to compose campaign');
      const campaign = await composeRes.json();
      
      const activateRes = await apiFetch(`/api/campaigns/${campaign.id}/activate`, {
        method: 'POST'
      });
      
      if (!activateRes.ok) throw new Error('Failed to activate campaign');
      router.push(`/campaigns/${campaign.id}`);
      
    } catch (err) {
      console.error(err);
      alert('Error activating campaign');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Identity', 'Audience', 'Limits', 'Sequence', 'Review'];

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa]">
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Link href="/campaigns" className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-secondary">Campaign Configuration</h1>
            <p className="text-sm text-muted-foreground mt-1">Configure outreach settings, audience, and sequence</p>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-sm border ${step === i + 1 ? 'bg-primary text-primary-foreground border-primary' : step > i + 1 ? 'bg-green-100 text-green-700 border-green-200' : 'bg-muted text-muted-foreground border-transparent'}`}>
                {label}
              </div>
              {i < 4 && <div className="w-6 h-px bg-border" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="w-full max-w-7xl space-y-8 pb-20">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-muted/30 px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-secondary">1. Campaign Identity</h3>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-secondary">Campaign Name <span className="text-red-500">*</span></label>
                      <input type="text" value={settings.name} onChange={e => {
                        const name = e.target.value;
                        const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                        setSettings({...settings, name, campaignCode: code});
                      }} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" placeholder="TripGain SME Founders - BLR - Sep 2026" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-secondary">Campaign Code <span className="text-red-500">*</span></label>
                      <input type="text" value={settings.campaignCode} readOnly className="w-full h-10 px-3 rounded-md border border-input bg-muted/50 focus:ring-0 outline-none uppercase text-muted-foreground cursor-not-allowed" placeholder="TG-SME-BLR-FOUNDERS-SEP26" title="Auto-generated from Campaign Name" />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary">Campaign Type</label>
                    <select value={settings.campaignType} onChange={e => setSettings({...settings, campaignType: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none">
                      <option value="COLD_OUTREACH">Cold Outreach</option>
                      <option value="WARM_LEAD_FOLLOW_UP">Warm Lead Follow Up</option>
                      <option value="PROMOTIONAL">Promotional</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-secondary">Internal Description</label>
                    <textarea value={settings.description} onChange={e => setSettings({...settings, description: e.target.value})} className="w-full p-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none min-h-[80px]" placeholder="Purpose and context..." />
                  </div>

                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={() => setStep(2)} disabled={!settings.name || !settings.campaignCode} className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">Continue to Audience</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-muted/30 px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-secondary">2. Audience Selection</h3>
                </div>
                <div className="p-6 grid grid-cols-5 gap-8">
                  <div className="col-span-3 space-y-6">
                    <div className="flex gap-4 p-1 bg-muted rounded-md inline-flex">
                      <button onClick={() => setAudienceType('list')} className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors ${audienceType === 'list' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Saved List</button>
                      <button onClick={() => setAudienceType('smart')} className={`px-4 py-2 text-sm font-medium rounded-sm transition-colors ${audienceType === 'smart' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Smart Filter</button>
                    </div>

                    {audienceType === 'list' ? (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Target List</label>
                        <select value={selectedListId} onChange={e => handleListChange(e.target.value)} className="w-full h-11 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none">
                          <option value="">-- Choose a list --</option>
                          {lists.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Industry</label>
                            <input type="text" value={audienceRules.industry} onChange={e => setAudienceRules({...audienceRules, industry: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. Software" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-secondary">Job Title</label>
                            <input type="text" value={audienceRules.jobTitle} onChange={e => setAudienceRules({...audienceRules, jobTitle: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. CEO" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-secondary">City</label>
                          <input type="text" value={audienceRules.city} onChange={e => setAudienceRules({...audienceRules, city: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" placeholder="e.g. San Francisco" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="col-span-2">
                    <div className="bg-muted/10 border border-border rounded-lg p-5 sticky top-5 space-y-4">
                      <h4 className="font-bold text-secondary text-sm uppercase tracking-wider border-b border-border pb-2">Eligibility Preview</h4>
                      
                      {eligibility ? (
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground">Estimated Audience</span>
                            <span className="font-medium text-secondary">{eligibility.totalContacts}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground text-red-500/80">Suppressed</span>
                            <span className="font-medium text-secondary">{eligibility.suppressed}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-muted-foreground text-yellow-600/80">Already Active</span>
                            <span className="font-medium text-secondary">{eligibility.alreadyActive}</span>
                          </div>
                          <div className="pt-3 border-t border-border flex justify-between items-center">
                            <span className="font-bold text-secondary">Eligible to Enroll</span>
                            <span className="font-bold text-green-600 text-lg">{eligibility.eligibleContacts}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Select an audience to preview eligibility metrics.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors">Back</button>
                <button onClick={() => setStep(3)} disabled={audienceType === 'list' ? !selectedListId : (!audienceRules.industry && !audienceRules.jobTitle && !audienceRules.city)} className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">Continue to Schedule & Limits</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-muted/30 px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-secondary">3. Sending Schedule & Limits</h3>
                </div>
                <div className="p-6 space-y-8">
                  
                  <div>
                    <h4 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Timing</h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Timezone</label>
                        <select value={schedule.timezone} onChange={e => setSchedule({...schedule, timezone: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none">
                          <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">America/New_York (EST)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Sending Days</label>
                        <div className="flex gap-2">
                          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day => (
                            <button 
                              key={day} 
                              onClick={() => toggleDay(day)}
                              className={`h-10 w-10 flex items-center justify-center rounded-md text-sm font-medium transition-colors border ${schedule.sendingDays.includes(day) ? 'bg-primary text-white border-primary' : 'bg-card text-muted-foreground border-border hover:border-primary/50'}`}
                            >
                              {day.charAt(0)}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Sending Window Start</label>
                        <input type="time" value={schedule.sendingWindowStart} onChange={e => setSchedule({...schedule, sendingWindowStart: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Sending Window End</label>
                        <input type="time" value={schedule.sendingWindowEnd} onChange={e => setSchedule({...schedule, sendingWindowEnd: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-secondary uppercase tracking-wider mb-4 border-b border-border pb-2">Limits & Pacing</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Daily Limit</label>
                        <input type="number" value={schedule.dailyLimit} onChange={e => setSchedule({...schedule, dailyLimit: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Hourly Limit</label>
                        <input type="number" value={schedule.hourlyLimit} onChange={e => setSchedule({...schedule, hourlyLimit: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-secondary">Delay Between Sends (s)</label>
                        <input type="number" value={schedule.delay} onChange={e => setSchedule({...schedule, delay: parseInt(e.target.value)})} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none" />
                      </div>
                    </div>
                  </div>

                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="px-6 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors">Back</button>
                <button onClick={() => setStep(4)} className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Continue to Sequence</button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                <div className="bg-muted/30 px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-secondary">4. Content & Sequence</h3>
                </div>
                
                <div className="p-6 space-y-8">

                  
                  
                  <div className="flex gap-6 items-start">
                    {/* Left: Sequence Steps */}
                    <div className="flex-1 space-y-4">
                      {sequenceSteps.map((step, index) => (
                        <div key={step.id} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                          {index > 0 && (
                            <div className="bg-muted/30 px-4 py-2 border-b border-border flex items-center justify-between text-xs font-medium text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" /> Wait 
                                <input type="number" className="w-12 h-6 px-1 border border-input rounded text-center" value={step.delayDays} onChange={e => updateStep(step.id, 'delayDays', parseInt(e.target.value))} /> days before sending
                              </div>
                            </div>
                          )}
                          <div className="p-4 flex gap-4">
                            <div className="flex flex-col items-center gap-2 w-12 shrink-0 border-r border-border pr-4">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{index + 1}</div>
                              <Mail className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="flex justify-between items-start">
                                <div className="w-full space-y-1">
                                  <div className="flex justify-between items-center">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subject Line</label>
                                    <div className="flex items-center gap-2">
                                      {index > 0 && <span className="text-xs text-muted-foreground italic mr-2">Leave empty to reply in thread</span>}
                                      <button onClick={() => setPreviewStep(step.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded border border-primary/20 transition-colors">
                                        <Eye className="w-3.5 h-3.5" /> Preview
                                      </button>
                                      <select 
                                         className="text-xs border border-border rounded px-2 py-1.5 bg-muted/50 hover:bg-muted outline-none cursor-pointer text-muted-foreground font-medium"
                                         defaultValue=""
                                         onChange={(e) => {
                                           if (e.target.value) {
                                             updateStep(step.id, 'subject', (step.subject || '') + (step.subject ? ' ' : '') + e.target.value);
                                             e.target.value = '';
                                           }
                                         }}
                                       >
                                         <option value="" disabled>+ Subject Var</option>
                                         <option value="{{firstName}}">First Name (&#123;&#123;firstName&#125;&#125;)</option>
                                         <option value="{{companyName}}">Company Name (&#123;&#123;companyName&#125;&#125;)</option>
                                         <option value="{{title}}">Job Title (&#123;&#123;title&#125;&#125;)</option>
                                         <option value="{{industry}}">Industry (&#123;&#123;industry&#125;&#125;)</option>
                                       </select>
                                      <select 
                                         className="text-xs border border-border rounded px-2 py-1.5 bg-muted/50 hover:bg-muted outline-none cursor-pointer"
                                         onChange={(e) => {
                                           if (e.target.value) {
                                             updateStep(step.id, 'body', formatTextToHtml(e.target.value));
                                             e.target.value = '';
                                           }
                                         }}
                                       >
                                         <option value="">Load Template...</option>
                                         <option value="Hi {{firstName}},\n\nI noticed you lead the team at {{companyName}}. We help companies in the {{industry}} industry scale efficiently.\n\n{{personalization}}\n\nAre you open to a quick chat?">Cold Outreach (Standard)</option>
                                         <option value="Hi {{firstName}},\n\nJust floating this to the top of your inbox.\n\nLet me know if you have any questions.">Follow-up (Bump)</option>
                                         <option value="Hi {{firstName}},\n\nSince I haven't heard back, I'll assume this isn't a priority for {{companyName}} right now.\n\nI'll check back in a few months.">Breakup Email</option>
                                       </select>
                                    </div>
                                  </div>
                                  <input type="text" value={step.subject} onChange={e => updateStep(step.id, 'subject', e.target.value)} className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none font-medium" placeholder="e.g. Quick question" />
                                </div>
                                {index > 0 && <button onClick={() => removeSequenceStep(step.id)} className="ml-4 p-2 text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></button>}
                              </div>
                              <div className="space-y-1">
                                 <div className="flex justify-between items-center pb-1">
                                   <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email Body</label>
                                   <div className="flex items-center gap-2">
                                     {/* Insert Variable Dropdown */}
                                     <select
                                       className="text-xs border border-border rounded px-2 py-1 bg-muted/50 hover:bg-muted outline-none cursor-pointer text-muted-foreground font-medium"
                                       defaultValue=""
                                       onChange={(e) => {
                                         if (e.target.value) {
                                           insertVariable(step.id, e.target.value);
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
                                       <option value="{{senderName}}">Sender Name (&#123;&#123;senderName&#125;&#125;)</option>
                                       <option value="{{senderCompany}}">Sender Company (&#123;&#123;senderCompany&#125;&#125;)</option>
                                     </select>

                                     {/* Visual / HTML Mode Switcher */}
                                     <div className="flex items-center bg-muted/70 p-0.5 rounded-md border border-border text-xs">
                                       <button
                                         type="button"
                                         onClick={() => setEditorModes(prev => ({ ...prev, [step.id]: 'visual' }))}
                                         className={`px-2 py-0.5 rounded transition-all font-medium ${
                                           (editorModes[step.id] || 'visual') === 'visual'
                                             ? 'bg-background text-foreground shadow-xs font-semibold'
                                             : 'text-muted-foreground hover:text-foreground'
                                         }`}
                                       >
                                         Visual
                                       </button>
                                       <button
                                         type="button"
                                         onClick={() => setEditorModes(prev => ({ ...prev, [step.id]: 'code' }))}
                                         className={`px-2 py-0.5 rounded transition-all font-medium ${
                                           editorModes[step.id] === 'code'
                                             ? 'bg-background text-foreground shadow-xs font-semibold'
                                             : 'text-muted-foreground hover:text-foreground'
                                         }`}
                                       >
                                         &lt;/&gt; HTML
                                       </button>
                                     </div>

                                     <button onClick={() => setActiveAiStep(activeAiStep === step.id ? null : step.id)} className="text-xs font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-md transition-colors">
                                       <Sparkles className="w-3.5 h-3.5" /> AI Generate
                                     </button>
                                   </div>
                                 </div>

                                 {/* Quick Insert Variable Chips */}
                                 <div className="flex items-center gap-1.5 flex-wrap py-1 text-xs">
                                   <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-0.5">Quick Insert:</span>
                                   {[
                                     { label: 'First Name', tag: '{{firstName}}' },
                                     { label: 'Company', tag: '{{companyName}}' },
                                     { label: 'Job Title', tag: '{{title}}' },
                                     { label: 'Industry', tag: '{{industry}}' },
                                     { label: 'Sender', tag: '{{senderName}}' },
                                   ].map(chip => (
                                     <button
                                       key={chip.tag}
                                       type="button"
                                       onClick={() => insertVariable(step.id, chip.tag)}
                                       className="px-2 py-0.5 rounded bg-muted/60 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-border text-muted-foreground transition-all text-xs font-mono"
                                     >
                                       + {chip.tag}
                                     </button>
                                   ))}
                                 </div>

                                 {activeAiStep === step.id && (
                                   <div className="bg-purple-50/50 border border-purple-100 rounded-md p-3 mb-2 flex flex-col gap-2">
                                     <textarea 
                                       value={aiPrompt}
                                       onChange={e => setAiPrompt(e.target.value)}
                                       placeholder="e.g. Write a short cold email to CEOs of IT companies. Focus on reducing business travel management effort..."
                                       className="w-full text-sm p-2 rounded border border-purple-200 outline-none focus:ring-1 focus:ring-purple-400 min-h-[60px]"
                                     />
                                     <div className="flex justify-end">
                                       <button 
                                         onClick={() => generateWithAI(step.id)}
                                         disabled={aiLoading || !aiPrompt.trim()}
                                         className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded font-medium disabled:opacity-50 flex items-center gap-2"
                                       >
                                         {aiLoading ? 'Generating...' : <><Sparkles className="w-3 h-3" /> Generate Template</>}
                                       </button>
                                     </div>
                                   </div>
                                 )}

                                 {/* Editor: Visual (Quill) or HTML Source Code */}
                                 {(editorModes[step.id] || 'visual') === 'visual' ? (
                                   <div className="bg-background rounded-md border border-input overflow-hidden focus-within:ring-1 focus-within:ring-primary [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-input [&_.ql-toolbar]:bg-muted/30 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[180px] [&_.ql-editor]:text-sm [&_.ql-editor_a]:text-blue-600 [&_.ql-editor_a]:underline">
                                     <ReactQuill 
                                       theme="snow" 
                                       modules={quillModules}
                                       formats={quillFormats}
                                       value={step.body} 
                                       onChange={val => updateStep(step.id, 'body', val)} 
                                       placeholder="Hi {{firstName}}..." 
                                     />
                                   </div>
                                 ) : (
                                   <textarea
                                     value={step.body}
                                     onChange={e => updateStep(step.id, 'body', e.target.value)}
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
                        <button onClick={() => addSequenceStep('email')} className="inline-flex items-center justify-center rounded-full text-sm font-medium border-2 border-dashed border-primary text-primary hover:bg-primary/5 h-10 px-6 gap-2"><Plus className="h-4 w-4" /> Add Next Step</button>
                      </div>

                      {/* Template Health */}
                      <div className="bg-card rounded-xl border border-border shadow-sm p-5 mt-8">
                        <h4 className="font-semibold text-secondary text-sm mb-4">Template Health</h4>
                        {(() => {
                           const allText = sequenceSteps.map(s => (s.subject || '') + '\n\n' + (s.body || '')).join('\n\n');
                           const validation = TemplateEngine.validateTemplate(allText);
                           return (
                             <div className="space-y-3 text-sm">
                               {validation.isValid ? (
                                 <div className="flex items-start gap-2 text-green-600">
                                   <CheckCircle2 className="w-4 h-4 mt-0.5" />
                                   <div>
                                     <p className="font-medium">Template is ready</p>
                                     <p className="text-muted-foreground text-xs">{validation.variablesFound.length} variables recognized</p>
                                   </div>
                                 </div>
                               ) : (
                                 <div className="flex items-start gap-2 text-red-600">
                                   <AlertCircle className="w-4 h-4 mt-0.5" />
                                   <div>
                                     <p className="font-medium">Template has errors</p>
                                   </div>
                                 </div>
                               )}
                               
                               {validation.errors.length > 0 && (
                                 <ul className="text-red-600 text-xs space-y-1 ml-6">
                                   {validation.errors.map((e, i) => <li key={i}>✕ {e}</li>)}
                                 </ul>
                               )}
                               {validation.warnings.length > 0 && (
                                 <ul className="text-yellow-600 text-xs space-y-1 ml-6">
                                   {validation.warnings.map((w, i) => <li key={i}>⚠ {w}</li>)}
                                 </ul>
                               )}
                             </div>
                           );
                        })()}
                      </div>
                    </div>

                    {/* Right: Variables Helper */}
                    <div className="w-64 shrink-0 space-y-4 sticky top-6">
                      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                        <div className="bg-muted/30 px-4 py-3 border-b border-border">
                          <h4 className="font-semibold text-secondary text-sm">Dynamic Variables</h4>
                          <p className="text-xs text-muted-foreground mt-0.5">Click to copy & paste into emails</p>
                        </div>
                        <div className="p-3 space-y-4 max-h-[400px] overflow-y-auto">
                          {['Contact', 'Company', 'Personalization', 'Sender'].map(category => {
                            const vars = Object.values(VARIABLE_REGISTRY).filter(v => v.category === category);
                            if (vars.length === 0) return null;
                            return (
                              <div key={category} className="space-y-1.5">
                                <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground ml-1">{category}</h5>
                                {vars.map(v => (
                                  <button
                                    key={v.tag}
                                    onClick={() => navigator.clipboard.writeText(v.tag)}
                                    className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors group flex flex-col gap-0.5 border border-transparent hover:border-border relative"
                                    title={`Fallback: ${v.fallback || 'None'}\nBehavior: ${v.behavior === 'remove' ? 'Remove' : v.behavior === 'remove_block' ? 'Remove block' : 'Replace'}`}
                                  >
                                    <span className="text-xs font-medium text-secondary flex items-center gap-1.5">
                                      {v.label}
                                      {v.required && <span className="text-[9px] bg-red-100 text-red-600 px-1 rounded-sm uppercase font-bold">Req</span>}
                                    </span>
                                    <code className="text-xs text-primary font-mono bg-primary/5 px-1.5 py-0.5 rounded group-hover:bg-primary/10 transition-colors w-fit">{v.tag}</code>
                                  </button>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Options Section */}
                  <div className="mt-10 pt-10 border-t border-border space-y-8">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-secondary text-sm">Accounts to use</h4>
                      <div className="bg-card rounded-xl border border-border p-5 shadow-sm flex flex-col gap-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-medium text-secondary text-sm">Sender Mailboxes <span className="text-red-500">*</span></h5>
                            <p className="text-xs text-muted-foreground mt-1">Select one or more accounts to send emails from</p>
                          </div>
                          <div className="w-[450px] relative">
                            <div 
                              onClick={() => setMailboxDropdownOpen(true)}
                              className="flex flex-wrap gap-2 p-2 min-h-[44px] rounded-md border border-input bg-background focus-within:ring-1 focus-within:ring-primary items-center cursor-pointer relative"
                            >
                              {settings.senderMailboxes?.map((email, idx) => {
                                const mb = availableMailboxes.find(m => m.email?.toLowerCase() === email?.toLowerCase());
                                return (
                                  <span key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-900 rounded-md text-xs font-medium border border-blue-200 shadow-sm">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span className="truncate max-w-[200px]">{mb?.displayName ? `${mb.displayName} (${email})` : email}</span>
                                    <button 
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSettings({...settings, senderMailboxes: settings.senderMailboxes.filter((_, i) => i !== idx)});
                                      }} 
                                      className="text-blue-600 hover:text-red-500 ml-1 transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </span>
                                );
                              })}

                              <input 
                                type="text" 
                                value={mailboxSearch}
                                onChange={(e) => {
                                  setMailboxSearch(e.target.value);
                                  setMailboxDropdownOpen(true);
                                }}
                                onFocus={() => setMailboxDropdownOpen(true)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const val = mailboxSearch.trim();
                                    if (val && val.includes('@') && !(settings.senderMailboxes || []).includes(val)) {
                                      setSettings({...settings, senderMailboxes: [...(settings.senderMailboxes || []), val]});
                                      setMailboxSearch('');
                                    }
                                  }
                                }} 
                                className="flex-1 bg-transparent border-none outline-none text-sm min-w-[140px] px-2 h-7" 
                                placeholder={settings.senderMailboxes?.length ? "Search or select mailbox..." : "Click to select connected mailbox..."} 
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

                            {/* Dropdown Menu */}
                            {mailboxDropdownOpen && (
                              <>
                                <div 
                                  className="fixed inset-0 z-10" 
                                  onClick={() => setMailboxDropdownOpen(false)}
                                />
                                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto divide-y divide-gray-100">
                                  <div className="px-3 py-2 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider flex justify-between items-center">
                                    <span>Connected Sender Accounts</span>
                                    <span>{availableMailboxes.length} Available</span>
                                  </div>

                                  {availableMailboxes
                                    .filter(mb => 
                                      mb.email?.toLowerCase().includes(mailboxSearch.toLowerCase()) || 
                                      mb.displayName?.toLowerCase().includes(mailboxSearch.toLowerCase()) ||
                                      mb.provider?.toLowerCase().includes(mailboxSearch.toLowerCase())
                                    )
                                    .map((mb) => {
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
                                          className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                                            isSelected ? 'bg-blue-50/70 hover:bg-blue-100/60' : 'hover:bg-gray-50'
                                          }`}
                                        >
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                                              {mb.displayName?.charAt(0) || mb.email?.charAt(0) || 'M'}
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-gray-900">{mb.displayName || mb.email}</span>
                                                <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                  {mb.provider || 'Google'}
                                                </span>
                                                {mb.status === 'CONNECTED' ? (
                                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Connected
                                                  </span>
                                                ) : (
                                                  <span className="text-[10px] text-amber-600">Unverified</span>
                                                )}
                                              </div>
                                              <p className="text-xs text-gray-500 font-mono mt-0.5">{mb.email}</p>
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                                              isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'
                                            }`}>
                                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}

                                  {availableMailboxes.length === 0 && (
                                    <div className="p-4 text-center">
                                      <p className="text-xs text-gray-500 mb-2">No connected mailboxes found.</p>
                                      <Link 
                                        href="/settings/mailboxes" 
                                        className="text-xs font-semibold text-blue-600 hover:underline"
                                      >
                                        + Connect a Mailbox in Settings
                                      </Link>
                                    </div>
                                  )}

                                  {mailboxSearch.trim() && !availableMailboxes.some(mb => mb.email?.toLowerCase() === mailboxSearch.trim().toLowerCase()) && (
                                    <div 
                                      onClick={() => {
                                        if (mailboxSearch.includes('@') && !(settings.senderMailboxes || []).includes(mailboxSearch.trim())) {
                                          setSettings({
                                            ...settings,
                                            senderMailboxes: [...(settings.senderMailboxes || []), mailboxSearch.trim()]
                                          });
                                          setMailboxSearch('');
                                          setMailboxDropdownOpen(false);
                                        }
                                      }}
                                      className="p-2.5 bg-gray-50 hover:bg-gray-100 text-xs text-blue-600 font-medium cursor-pointer flex items-center gap-2"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Add custom email: <span className="font-mono text-gray-800">{mailboxSearch}</span>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center border-t border-border/50 pt-5">
                          <div>
                            <h5 className="font-medium text-secondary text-sm">Reply-to Email</h5>
                            <p className="text-xs text-muted-foreground mt-1">Optional. Default is sender's address.</p>
                          </div>
                          <div className="w-[450px]">
                            <input type="email" value={settings.replyToEmail} onChange={e => setSettings({...settings, replyToEmail: e.target.value})} className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-1 focus:ring-primary outline-none text-sm" placeholder="user@company.com" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold text-secondary text-sm">Advanced Delivery</h4>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex flex-col justify-between gap-4">
                        <div>
                          <h5 className="font-medium text-secondary text-sm">Personalization Mode</h5>
                          <p className="text-xs text-muted-foreground mt-1">Fallback strictness when data is missing</p>
                        </div>
                        <select
                          className="w-full text-xs border border-border rounded-md px-2 py-1.5 bg-background outline-none"
                          value={settings.personalizationMode}
                          onChange={e => setSettings({...settings, personalizationMode: e.target.value})}
                        >
                          <option value="Flexible">Flexible (Strip empty variables)</option>
                          <option value="Standard">Standard (Warn on missing)</option>
                          <option value="Strict">Strict (Block sending if missing)</option>
                        </select>
                      </div>
                      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-secondary text-sm">Stop sending on reply</h5>
                          <p className="text-xs text-muted-foreground mt-1">Stop sending emails to a lead if a response has been received</p>
                        </div>
                        <div className="flex bg-muted p-1 rounded-md">
                          <button onClick={() => setSettings({...settings, stopOnReply: false})} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${!settings.stopOnReply ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Disable</button>
                          <button onClick={() => setSettings({...settings, stopOnReply: true})} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${settings.stopOnReply ? 'bg-green-500 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Enable</button>
                        </div>
                      </div>
                      <div className="bg-card rounded-xl border border-border p-4 shadow-sm flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-secondary text-sm">Open Tracking</h5>
                          <p className="text-xs text-muted-foreground mt-1">Track email opens</p>
                        </div>
                        <div className="flex bg-muted p-1 rounded-md">
                          <button onClick={() => setSettings({...settings, openTracking: false})} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${!settings.openTracking ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>Disable</button>
                          <button onClick={() => setSettings({...settings, openTracking: true})} className={`px-4 py-1.5 text-xs font-medium rounded-sm transition-colors ${settings.openTracking ? 'bg-blue-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>Enable</button>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-between">
                <button onClick={() => setStep(3)} className="px-6 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors">Back</button>
                <button onClick={() => setStep(5)} disabled={sequenceSteps.some((s, i) => (i === 0 && !s.subject?.trim()) || !s.body?.trim()) || !settings.senderMailboxes?.length} className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">Continue to Review</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-green-500/10 px-6 py-8 border-b border-border flex flex-col items-center justify-center text-center">
                  <h2 className="text-2xl font-bold text-green-700">Ready for Launch!</h2>
                  <p className="text-green-600 mt-2">All settings have been configured. Review and approve the campaign.</p>
                </div>
                
                <div className="p-8 grid grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Identity & Sender</h4>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-muted-foreground">Name:</span> <span className="font-medium text-secondary">{settings.name}</span>
                        <span className="text-muted-foreground">Code:</span> <span className="font-medium text-secondary">{settings.campaignCode}</span>
                        <span className="text-muted-foreground">Sender:</span> <span className="font-medium text-secondary">{settings.senderMailboxes?.join(', ')}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Limits & Timing</h4>
                      <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <span className="text-muted-foreground">Volume:</span> <span className="font-medium text-secondary">{schedule.dailyLimit}/day, {schedule.hourlyLimit}/hour</span>
                        <span className="text-muted-foreground">Schedule:</span> <span className="font-medium text-secondary">{schedule.sendingDays.join(', ')} ({schedule.sendingWindowStart}-{schedule.sendingWindowEnd})</span>
                        <span className="text-muted-foreground">Timezone:</span> <span className="font-medium text-secondary">{schedule.timezone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Audience Target</h4>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <div className="text-3xl font-bold text-green-700">{eligibility?.eligibleContacts || 0}</div>
                        <div className="text-sm text-green-800 font-medium mt-1">Eligible Contacts Enrolled Instantly</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-bold text-secondary uppercase tracking-wider flex items-center gap-2 border-b border-border pb-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> Mandatory Stop Rules Active</h4>
                      <ul className="text-sm text-muted-foreground space-y-1.5 list-disc pl-5">
                        <li>Stop when Prospect replies</li>
                        <li>Stop when Email hard bounces</li>
                        <li>Stop when Prospect unsubscribes</li>
                        <li>Stop when Prospect registers</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4">
                <button onClick={() => setStep(4)} className="px-6 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors" disabled={loading}>Back to Content</button>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={handleSaveDraft} 
                    disabled={loading || savingDraft} 
                    className="px-6 py-3 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingDraft ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                        Saving Draft...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-muted-foreground" />
                        Save as Draft
                      </>
                    )}
                  </button>
                  <button onClick={handleActivate} disabled={loading} className="px-8 py-3 rounded-md bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-500/20 flex items-center gap-2 disabled:opacity-50">
                    {loading ? 'Processing...' : <><Play className="w-5 h-5 fill-current" /> APPROVE & ACTIVATE</>}
                  </button>
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
            {/* Left Sidebar */}
            <div className="w-80 bg-muted/30 border-r border-border p-6 overflow-y-auto flex flex-col">
              <h3 className="font-bold text-secondary text-lg flex items-center gap-2 mb-6">
                <Play className="w-5 h-5 -rotate-90 fill-current" /> Test Email
              </h3>
              
              <div className="space-y-5 mb-8">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider">Send from:</label>
                  <select className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none text-sm bg-background">
                    {settings.senderMailboxes?.map((email, idx) => (
                      <option key={idx} value={email}>{email}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider">Load data for lead:</label>
                  <select 
                    className="w-full h-10 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none text-sm bg-background text-secondary"
                    value={previewLead.email ? contacts.find(c => (c.email || c.emails?.[0]?.email) === previewLead.email)?.id || '' : ''}
                    onChange={(e) => {
                      const c = contacts.find(contact => contact.id === e.target.value);
                      if (c) {
                        const pers = c.personalizedLine || c.personalization || c.personalizationTrigger || '';
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
                        {c.firstName} {c.lastName} ({c.companyName || c.organization?.name || 'Lead'})
                        {c.personalizedLine ? ' ✨' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-6 flex-1">
                <h4 className="font-bold text-secondary text-sm flex items-center gap-2 mb-5">
                  <AlertCircle className="w-4 h-4 text-primary" /> Variables
                </h4>
                <div className="space-y-4">
                  {Object.entries(previewLead).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-xs font-semibold text-muted-foreground">{key}</p>
                      <p className={`text-sm font-medium mt-0.5 ${key === 'personalization' && value ? 'text-purple-700 bg-purple-50 p-2.5 rounded-lg border border-purple-200 whitespace-normal text-xs leading-relaxed' : 'text-secondary truncate'}`}>
                        {value || <span className="text-muted-foreground italic text-xs">none</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 bg-background flex flex-col">
              <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                <h3 className="font-bold text-secondary text-xl flex items-center gap-2">
                  <Eye className="w-6 h-6" /> Email Preview
                </h3>
                <button onClick={() => setPreviewStep(null)} className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Header */}
                <div className="space-y-5 max-w-3xl">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground w-16">Send to:</span>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="px-3 py-1.5 bg-muted border border-border rounded-full text-sm font-medium text-secondary flex items-center gap-2">
                        {previewLead.email}
                        <button className="text-muted-foreground hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      </span>
                      <input type="text" placeholder="Enter email address" className="flex-1 text-sm bg-transparent border-none outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-muted-foreground w-16">Subject:</span>
                    <span className="font-semibold text-secondary text-sm">
                      {(() => {
                        const stepData = sequenceSteps.find(s => s.id === previewStep);
                        if (!stepData) return '';
                        let result = TemplateEngine.renderTemplate(stepData.subject, previewLead, settings.personalizationMode as any, false);
                        return result || <span className="text-muted-foreground italic font-normal">No subject</span>;
                      })()}
                    </span>
                  </div>
                </div>

                {/* Email Body Preview */}
                <div className="bg-card border border-border rounded-xl p-8 max-w-3xl min-h-[300px] shadow-sm">
                  {(() => {
                     const stepData = sequenceSteps.find(s => s.id === previewStep);
                     if (!stepData) return null;
                     return renderPreview(stepData.body);
                  })()}
                </div>
              </div>

              <div className="p-6 border-t border-border bg-card flex justify-end gap-4 items-center">
                <button className="px-5 py-2.5 rounded-md border border-blue-600 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-colors">Check Deliverability Score</button>
                <button className="px-6 py-2.5 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20 flex items-center gap-2">
                  <Play className="w-4 h-4 fill-current rotate-90" /> Send test email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
