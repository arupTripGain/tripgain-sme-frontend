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
  UserCheck,
  Trash2,
  Calendar,
  Lock,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { buildCanonicalLeadContext, TemplateEngine, VARIABLE_REGISTRY } from '@/lib/templateEngine';

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

export interface BulkSequenceStep {
  id: string | number;
  stepNumber: number;
  stepName?: string;
  delayDays: number;
  subject: string;
  body: string;
}

interface TestRecipientResult {
  recipient: string;
  contactName: string;
  companyName: string;
  success: boolean;
  messageId?: string;
  renderedSubject?: string;
  error?: string;
}

interface BulkCampaignWizardProps {
  initialCampaignId?: string | null;
}

export const WIZARD_STEPS = [
  { num: 1, id: 'campaign', label: '1. Campaign', shortLabel: 'Campaign' },
  { num: 2, id: 'audience', label: '2. Audience', shortLabel: 'Audience' },
  { num: 3, id: 'email', label: '3. Email', shortLabel: 'Email' },
  { num: 4, id: 'sender', label: '4. Sender', shortLabel: 'Sender' },
  { num: 5, id: 'schedule', label: '5. Schedule', shortLabel: 'Schedule' },
  { num: 6, id: 'review', label: '6. Review', shortLabel: 'Review' },
  { num: 7, id: 'send', label: '7. Send', shortLabel: 'Send' }
];

export default function BulkCampaignWizard({ initialCampaignId = null }: BulkCampaignWizardProps) {
  const router = useRouter();

  // Wizard state: 1 to 7
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [campaignId, setCampaignId] = useState<string | null>(initialCampaignId);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!initialCampaignId);

  // Lists & Mailboxes & Audience
  const [lists, setLists] = useState<any[]>([]);
  const [availableMailboxes, setAvailableMailboxes] = useState<any[]>([]);
  const [audienceContacts, setAudienceContacts] = useState<any[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Step 1: Campaign Details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [step1Touched, setStep1Touched] = useState(false);

  // Step 2: Audience Selection (Multi-List)
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [listSearch, setListSearch] = useState('');
  const [step2Touched, setStep2Touched] = useState(false);

  // Step 3: Email Content & Sequence
  const [sequenceSteps, setSequenceSteps] = useState<BulkSequenceStep[]>([
    {
      id: 1,
      stepNumber: 1,
      stepName: 'Initial Send',
      delayDays: 0,
      subject: '',
      body: '<p>Hi {{firstName}},</p><p><br></p><p><br></p><p style="font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 24px;"><a href="{{unsubscribeLink}}">Unsubscribe</a> from future communications</p>'
    }
  ]);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [previewContactId, setPreviewContactId] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [step3Touched, setStep3Touched] = useState(false);

  // Step 3 Test Email
  const [selectedTestContactIds, setSelectedTestContactIds] = useState<string[]>([]);
  const [manualTestEmails, setManualTestEmails] = useState<string[]>([]);
  const [manualEmailInput, setManualEmailInput] = useState('');
  const [testEmailStepNumber, setTestEmailStepNumber] = useState<number>(1);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [showConfirmTestModal, setShowConfirmTestModal] = useState(false);
  const [testResults, setTestResults] = useState<TestRecipientResult[] | null>(null);
  const [testSummaryMessage, setTestSummaryMessage] = useState<string | null>(null);

  // Step 4: Sender Selection
  const [selectedMailboxes, setSelectedMailboxes] = useState<string[]>([]);
  const [step4Touched, setStep4Touched] = useState(false);

  // Step 5: Schedule & Limits
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [dailyLimit, setDailyLimit] = useState(50);
  const [hourlyLimit, setHourlyLimit] = useState(10);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [sendingWindowStart, setSendingWindowStart] = useState('09:30');
  const [sendingWindowEnd, setSendingWindowEnd] = useState('17:30');
  const [step5Touched, setStep5Touched] = useState(false);

  // Step 6 & 7: Preflight, Queue & Launch
  const [preflightData, setPreflightData] = useState<any | null>(null);
  const [isFetchingPreflight, setIsFetchingPreflight] = useState(false);
  const [isQueueing, setIsQueueing] = useState(false);
  const [isQueued, setIsQueued] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  // Load Lists & Mailboxes
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
        if (mboxes.length > 0 && selectedMailboxes.length === 0) {
          const healthy = mboxes.filter(m => m.status === 'CONNECTED' && (m.healthScore === undefined || m.healthScore >= 70));
          if (healthy.length > 0) {
            setSelectedMailboxes(healthy.map(m => m.id));
          } else {
            setSelectedMailboxes([mboxes[0].id]);
          }
        }
      })
      .catch(console.error);
  }, []);

  // Load existing campaign data if editing
  useEffect(() => {
    if (!initialCampaignId) return;

    setInitialLoading(true);
    apiFetch(`/api/bulk-campaigns/${initialCampaignId}`)
      .then(async res => {
        if (!res.ok) throw new Error('Campaign not found');
        return res.json();
      })
      .then(camp => {
        setCampaignId(camp.id);
        setName(camp.name || '');
        setDescription(camp.description || '');

        const targetListIds = Array.isArray(camp.listIds) && camp.listIds.length > 0
          ? camp.listIds
          : (camp.listId ? [camp.listId] : []);
        setSelectedListIds(targetListIds);

        if (Array.isArray(camp.senderMailboxes) && camp.senderMailboxes.length > 0) {
          setSelectedMailboxes(camp.senderMailboxes);
        }

        if (camp.dailySendLimit) setDailyLimit(camp.dailySendLimit);
        if (camp.hourlySendLimit) setHourlyLimit(camp.hourlySendLimit);
        if (camp.timezone) setTimezone(camp.timezone);
        if (camp.sendingWindowStart) setSendingWindowStart(camp.sendingWindowStart.slice(0, 5));
        if (camp.sendingWindowEnd) setSendingWindowEnd(camp.sendingWindowEnd.slice(0, 5));

        if (camp.startAt) {
          setScheduleType('scheduled');
          const dt = new Date(camp.startAt);
          if (!isNaN(dt.getTime())) {
            setScheduledDate(dt.toISOString().slice(0, 10));
            setScheduledTime(dt.toTimeString().slice(0, 5));
          }
        }

        if (Array.isArray(camp.steps) && camp.steps.length > 0) {
          setSequenceSteps(camp.steps.map((s: any, idx: number) => ({
            id: s.id || idx + 1,
            stepNumber: s.stepNumber || idx + 1,
            stepName: s.stepName || (idx === 0 ? 'Initial Send' : `Follow-up ${idx}`),
            delayDays: s.delayDays ?? (idx === 0 ? 0 : 2),
            subject: s.subject || s.subjectTemplate || '',
            body: s.bodyHtml || s.bodyHtmlTemplate || s.bodyTemplate || s.body || ''
          })));
        } else if (camp.subjectTemplate || camp.bodyHtmlTemplate) {
          setSequenceSteps([{
            id: 1,
            stepNumber: 1,
            stepName: 'Initial Send',
            delayDays: 0,
            subject: camp.subjectTemplate || '',
            body: camp.bodyHtmlTemplate || camp.bodyTemplate || ''
          }]);
        }

        // Fetch preflight
        fetchPreflightAudit(camp.id, targetListIds);
      })
      .catch(err => {
        console.error('Failed to load existing campaign:', err);
      })
      .finally(() => setInitialLoading(false));
  }, [initialCampaignId]);

  // Fetch unique contacts across selected lists
  useEffect(() => {
    const validListIds = selectedListIds.filter(id => id && id !== 'suppression-1');
    if (validListIds.length > 0) {
      setIsLoadingContacts(true);
      Promise.all(validListIds.map(id => 
        apiFetch(`/api/lists/${id}`)
          .then(res => res.json())
          .catch(() => null)
      ))
        .then(listResponses => {
          const contactMap = new Map<string, any>();
          listResponses.forEach(res => {
            if (!res) return;
            const members = res.members || res.contacts || [];
            members.forEach((m: any) => {
              const c = m.contact || m;
              if (c && c.id) {
                const primaryEmail = (c.emails?.find((e: any) => e.isPrimary)?.email || c.emails?.[0]?.email || c.email || '').trim().toLowerCase();
                const key = primaryEmail || c.id;
                if (!contactMap.has(key)) {
                  contactMap.set(key, {
                    ...c,
                    email: primaryEmail || c.email,
                    companyName: c.organization?.name || c.companyName || ''
                  });
                }
              }
            });
          });

          const uniqueList = Array.from(contactMap.values());
          setAudienceContacts(uniqueList);
          if (uniqueList.length > 0 && !previewContactId) {
            setPreviewContactId(uniqueList[0].id);
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
  }, [selectedListIds]);

  // Deduplicated audience count
  const uniqueAudienceCount = useMemo(() => {
    return audienceContacts.length;
  }, [audienceContacts]);

  // Active sender mailbox
  const primaryMailbox = useMemo(() => {
    return availableMailboxes.find(m => selectedMailboxes.includes(m.id)) || availableMailboxes[0] || null;
  }, [availableMailboxes, selectedMailboxes]);

  // Combined pool throughput calculation
  const poolCapacity = useMemo(() => {
    const activeBoxes = availableMailboxes.filter(m => selectedMailboxes.includes(m.id));
    const totalHourly = activeBoxes.reduce((acc, m) => acc + (m.hourlySendLimit || 10), 0);
    const totalDaily = activeBoxes.reduce((acc, m) => acc + (m.dailySendLimit || 50), 0);
    return {
      mailboxesCount: activeBoxes.length,
      totalHourly,
      totalDaily,
      effectiveHourlyRate: Math.min(hourlyLimit, totalHourly || 1),
      effectiveDailyRate: Math.min(dailyLimit, totalDaily || 1)
    };
  }, [availableMailboxes, selectedMailboxes, dailyLimit, hourlyLimit]);

  // Multi-list toggle helpers
  const toggleListSelection = (id: string) => {
    setSelectedListIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const selectAllLists = () => {
    setSelectedListIds(lists.map(l => l.id));
  };

  const clearAllLists = () => {
    setSelectedListIds([]);
  };

  const filteredLists = useMemo(() => {
    if (!listSearch.trim()) return lists;
    return lists.filter(l => l.name?.toLowerCase().includes(listSearch.toLowerCase().trim()));
  }, [lists, listSearch]);

  // Sequence Step handlers
  const addSequenceStep = () => {
    const nextNum = sequenceSteps.length + 1;
    setSequenceSteps(prev => [
      ...prev,
      {
        id: Date.now(),
        stepNumber: nextNum,
        stepName: `Follow-up ${nextNum - 1}`,
        delayDays: 2,
        subject: '',
        body: '<p>Hi {{firstName}},</p><p><br></p><p><br></p><p style="font-size: 11px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 24px;"><a href="{{unsubscribeLink}}">Unsubscribe</a> from future communications</p>'
      }
    ]);
    setActiveStepTab(nextNum);
  };

  const removeSequenceStep = (stepNumber: number) => {
    if (sequenceSteps.length <= 1) return;
    setSequenceSteps(prev => {
      const filtered = prev.filter(s => s.stepNumber !== stepNumber);
      return filtered.map((s, idx) => ({
        ...s,
        stepNumber: idx + 1,
        delayDays: idx === 0 ? 0 : (s.delayDays || 1),
        stepName: idx === 0 ? 'Initial Send' : `Follow-up ${idx}`
      }));
    });
    if (activeStepTab >= stepNumber && activeStepTab > 1) {
      setActiveStepTab(prev => Math.max(1, prev - 1));
    }
  };

  const updateStepField = (stepNumber: number, field: 'subject' | 'body' | 'delayDays' | 'stepName', value: any) => {
    setSequenceSteps(prev => prev.map(s => {
      if (s.stepNumber === stepNumber) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  const handleInsertVariableToActiveStep = (tag: string) => {
    setSequenceSteps(prev => prev.map(s => {
      if (s.stepNumber === activeStepTab) {
        let newBody = s.body;
        if (newBody.endsWith('</p>')) {
          newBody = newBody.slice(0, -4) + ' ' + tag + '</p>';
        } else {
          newBody = newBody + ' ' + tag;
        }
        return { ...s, body: newBody };
      }
      return s;
    }));
  };

  // Preview Lead Context
  const activePreviewContact = useMemo(() => {
    return audienceContacts.find(c => c.id === previewContactId) || audienceContacts[0] || null;
  }, [audienceContacts, previewContactId]);

  const previewContext = useMemo(() => {
    const senderName = primaryMailbox?.displayName || 'TripGain Team';
    const senderCompany = primaryMailbox?.organization?.name || 'TripGain';
    const ctx = buildCanonicalLeadContext(activePreviewContact, senderName, senderCompany);
    ctx.unsubscribeLink = 'https://tripgain.local/u/preview-token';
    return ctx;
  }, [activePreviewContact, primaryMailbox]);

  const activeStepObj = useMemo(() => {
    return sequenceSteps.find(s => s.stepNumber === activeStepTab) || sequenceSteps[0];
  }, [sequenceSteps, activeStepTab]);

  const renderedPreviewSubject = useMemo(() => {
    try {
      return TemplateEngine.renderTemplate(activeStepObj?.subject || 'Preview Subject', previewContext, 'Flexible');
    } catch {
      return activeStepObj?.subject || '';
    }
  }, [activeStepObj?.subject, previewContext]);

  const renderedPreviewBody = useMemo(() => {
    try {
      return TemplateEngine.renderTemplate(activeStepObj?.body || '<p>Preview body...</p>', previewContext, 'Flexible');
    } catch {
      return activeStepObj?.body || '';
    }
  }, [activeStepObj?.body, previewContext]);

  // Save Draft API Orchestration
  const handleSaveDraft = async (): Promise<any | null> => {
    if (!name.trim()) {
      setStep1Touched(true);
      return null;
    }

    setLoading(true);
    try {
      let resolvedStartAt: string | null = null;
      if (scheduleType === 'scheduled' && scheduledDate) {
        resolvedStartAt = new Date(`${scheduledDate}T${scheduledTime || '09:00'}:00`).toISOString();
      }

      const payload = {
        name: name.trim(),
        description: description.trim(),
        listId: selectedListIds[0] || null,
        listIds: selectedListIds,
        subjectTemplate: sequenceSteps[0]?.subject?.trim() || '',
        bodyHtmlTemplate: sequenceSteps[0]?.body || '',
        sequenceSteps: sequenceSteps.map((s, idx) => ({
          stepNumber: idx + 1,
          stepName: s.stepName || (idx === 0 ? 'Initial Send' : `Follow-up ${idx}`),
          delayDays: idx === 0 ? 0 : Math.max(0, Number(s.delayDays || 1)),
          subjectTemplate: s.subject.trim(),
          bodyTemplate: s.body,
          bodyHtmlTemplate: s.body
        })),
        senderMailboxes: selectedMailboxes,
        dailySendLimit: Number(dailyLimit),
        hourlySendLimit: Number(hourlyLimit),
        timezone,
        sendingWindowStart,
        sendingWindowEnd,
        startAt: resolvedStartAt
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

      const rawText = await res.text();
      let saved: any = {};
      try {
        saved = JSON.parse(rawText);
      } catch {
        throw new Error(`Server returned non-JSON response (${res.status}): ${rawText.slice(0, 120)}`);
      }

      if (!res.ok) {
        throw new Error(saved.error || `Failed to save bulk campaign (${res.status})`);
      }

      setCampaignId(saved.id);
      return saved;
    } catch (err: any) {
      alert(err.message || 'Error saving campaign draft');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Fetch Preflight Audit
  const fetchPreflightAudit = async (cid: string, overrideListIds?: string[]) => {
    setIsFetchingPreflight(true);
    try {
      const activeLists = overrideListIds || selectedListIds;
      const query = activeLists.length > 0 ? `?listIds=${activeLists.join(',')}` : '';
      const res = await apiFetch(`/api/bulk-campaigns/${cid}/preflight${query}`);
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        return;
      }
      if (res.ok) {
        setPreflightData(data);
      }
    } catch (err) {
      console.error('Failed to fetch preflight:', err);
    } finally {
      setIsFetchingPreflight(false);
    }
  };

  // Safe Test Email Handlers
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

  const handleToggleContact = (contactId: string) => {
    setSelectedTestContactIds(prev => 
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  const totalTestRecipientsCount = selectedTestContactIds.length + manualTestEmails.length;

  const handleExecuteSendTest = async () => {
    setShowConfirmTestModal(false);
    if (totalTestRecipientsCount === 0) {
      alert('Please select at least one test contact or enter a test email address.');
      return;
    }

    const currentStep = activeStepObj || sequenceSteps[0];
    const currentSubject = currentStep?.subject !== undefined ? currentStep.subject : (sequenceSteps[0]?.subject || '');
    const currentBody = currentStep?.body !== undefined ? currentStep.body : (sequenceSteps[0]?.body || '');

    if (!currentBody || currentBody === '<p><br></p>') {
      alert('Email body cannot be empty before sending test email.');
      return;
    }

    // Always save current wizard progress (subject, body, list, schedule) to draft before dispatching test
    const saved = await handleSaveDraft();
    if (!saved) {
      setTestSummaryMessage('Could not save campaign draft before testing. Please verify campaign details.');
      return;
    }
    const activeCid = saved.id || campaignId;

    if (!activeCid) {
      setTestSummaryMessage('Please fill campaign details and save draft before testing.');
      return;
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
          sampleContactId: previewContactId || selectedTestContactIds[0] || undefined,
          stepNumber: currentStep?.stepNumber || 1,
          subject: currentSubject,
          body: currentBody
        })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server error (${res.status}): ${rawText.slice(0, 120)}`);
      }

      if (!res.ok) {
        throw new Error(data.error || `Failed to dispatch test emails (${res.status})`);
      }

      setTestResults(data.results || []);
      setTestSummaryMessage(data.message || `Test emails dispatched to ${data.totalSent} recipient(s).`);
    } catch (err: any) {
      setTestSummaryMessage(err.message || 'Error dispatching test emails');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Step 7: Queue & Launch Handlers
  const handleQueueRecipients = async () => {
    if (!campaignId) return;
    setIsQueueing(true);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${campaignId}/queue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server error (${res.status}): ${rawText.slice(0, 120)}`);
      }
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
    setShowLaunchModal(false);
    if (!campaignId) return;

    setIsLaunching(true);
    try {
      const res = await apiFetch(`/api/bulk-campaigns/${campaignId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error(`Server error (${res.status}): ${rawText.slice(0, 120)}`);
      }
      if (!res.ok) {
        throw new Error(data.error || 'Failed to launch bulk campaign');
      }
      window.location.href = `/bulk-email/${campaignId}`;
    } catch (err: any) {
      alert(err.message || 'Error launching campaign');
      setIsLaunching(false);
    }
  };

  // Step Validation Logic
  const validateStep = (stepNum: number): boolean => {
    if (stepNum === 1) {
      return !!name.trim();
    }
    if (stepNum === 2) {
      return selectedListIds.length > 0;
    }
    if (stepNum === 3) {
      const step1 = sequenceSteps[0];
      const hasSubject = !!step1?.subject?.trim();
      const hasBody = !!step1?.body?.trim() && step1.body !== '<p><br></p>';
      return hasSubject && hasBody;
    }
    if (stepNum === 4) {
      return selectedMailboxes.length > 0;
    }
    if (stepNum === 5) {
      if (scheduleType === 'scheduled') {
        return !!scheduledDate && !!scheduledTime;
      }
      return dailyLimit > 0 && hourlyLimit > 0;
    }
    if (stepNum === 6) {
      return validateStep(1) && validateStep(2) && validateStep(3) && validateStep(4) && validateStep(5);
    }
    return true;
  };

  // Navigation handlers
  const handleContinue = async () => {
    if (currentStep === 1) {
      setStep1Touched(true);
      if (!validateStep(1)) return;
      const saved = await handleSaveDraft();
      if (saved) setCurrentStep(2);
    } else if (currentStep === 2) {
      setStep2Touched(true);
      if (!validateStep(2)) return;
      const saved = await handleSaveDraft();
      if (saved) setCurrentStep(3);
    } else if (currentStep === 3) {
      setStep3Touched(true);
      if (!validateStep(3)) return;
      const saved = await handleSaveDraft();
      if (saved) setCurrentStep(4);
    } else if (currentStep === 4) {
      setStep4Touched(true);
      if (!validateStep(4)) return;
      const saved = await handleSaveDraft();
      if (saved) setCurrentStep(5);
    } else if (currentStep === 5) {
      setStep5Touched(true);
      if (!validateStep(5)) return;
      const saved = await handleSaveDraft();
      if (saved) {
        setCurrentStep(6);
        fetchPreflightAudit(saved.id);
      }
    } else if (currentStep === 6) {
      const saved = await handleSaveDraft();
      if (saved) {
        setCurrentStep(7);
        fetchPreflightAudit(saved.id);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleNavigateToStep = (targetStep: number) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep || campaignId) {
      setCurrentStep(targetStep);
      if (targetStep >= 6 && campaignId) {
        fetchPreflightAudit(campaignId);
      }
    }
  };

  if (initialLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3 text-slate-500 text-sm font-medium">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span>Loading Campaign Configuration...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card shrink-0 shadow-xs z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/bulk-email"
            className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted"
            title="Return to Bulk Email dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="font-heading text-xl font-bold text-secondary">
                {campaignId ? 'Edit Bulk Campaign' : 'Create Bulk Campaign'}
              </h1>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                Bulk Email
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Step-by-step verified single-touch outreach creation
            </p>
          </div>
        </div>

        {/* Desktop Stepper Pills (Matching General Campaign) */}
        <div className="hidden xl:flex items-center gap-2">
          {WIZARD_STEPS.map((s, i) => {
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            const isAccessible = s.num <= currentStep || !!campaignId;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleNavigateToStep(s.num)}
                  disabled={!isAccessible}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all shadow-xs border select-none",
                    isActive
                      ? "bg-primary text-primary-foreground border-primary"
                      : isCompleted
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                        : isAccessible
                          ? "bg-muted text-muted-foreground border-transparent hover:bg-slate-200 cursor-pointer"
                          : "bg-muted text-muted-foreground border-transparent cursor-not-allowed opacity-50"
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {isCompleted ? <Check className="w-3 h-3 text-emerald-600" /> : null}
                    {s.label}
                  </span>
                </button>
                {i < WIZARD_STEPS.length - 1 && <div className="w-4 h-px bg-border" />}
              </div>
            );
          })}
        </div>

        {/* Header Right Action: Save Draft */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-secondary bg-white border border-input hover:bg-muted rounded-lg transition-all shadow-xs disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>
        </div>
      </div>

      {/* Mobile / Tablet Progress Bar */}
      <div className="xl:hidden flex items-center justify-between px-6 py-3 bg-muted/40 border-b border-border text-xs">
        <span className="font-semibold text-secondary">
          Step {currentStep} of 7: <strong className="text-primary">{WIZARD_STEPS[currentStep - 1]?.label}</strong>
        </span>
        <div className="flex items-center gap-1.5">
          {WIZARD_STEPS.map(s => (
            <button
              key={s.id}
              onClick={() => handleNavigateToStep(s.num)}
              disabled={s.num > currentStep && !campaignId}
              aria-label={s.label}
              className={cn(
                "h-2 rounded-full transition-all",
                s.num === currentStep
                  ? "w-6 bg-primary"
                  : s.num < currentStep
                    ? "w-3 bg-emerald-500 cursor-pointer"
                    : "w-3 bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 flex justify-center">
        <div className="w-full max-w-5xl space-y-6 pb-24">

          {/* ============================================================== */}
          {/* STEP 1: CAMPAIGN DETAILS                                        */}
          {/* ============================================================== */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-secondary text-base">Step 1 of 7: Campaign Identity</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Define your bulk outreach initiative name and operational goals.</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Step 1 of 7
                  </span>
                </div>

                <div className="p-6 space-y-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                      Campaign Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Q4 Executive Product Update"
                      className={cn(
                        "w-full h-11 px-3.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                        step1Touched && !name.trim() ? "border-red-400 bg-red-50/20" : "border-input"
                      )}
                    />
                    {step1Touched && !name.trim() && (
                      <p className="text-xs font-medium text-red-600 flex items-center gap-1.5 mt-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        Campaign name is required to continue.
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                      Internal Description / Campaign Goal <span className="text-muted-foreground font-normal text-xs">(Optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      rows={3}
                      placeholder="Internal purpose, target persona, or context for team alignment..."
                      className="w-full p-3.5 text-sm rounded-lg border border-input bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y"
                    />
                  </div>

                  <div className="p-4 bg-muted/40 border border-border rounded-lg text-xs space-y-1 text-muted-foreground">
                    <div className="font-semibold text-secondary flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-primary" />
                      Bulk Email Sandbox & Isolation Notice
                    </div>
                    <p>
                      Bulk campaigns are completely user-isolated. Creating or editing a campaign draft does not enroll contacts, consume mailbox quotas, or initiate scheduler delivery.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between pt-2">
                <Link
                  href="/bulk-email"
                  className="px-4 py-2 text-xs font-semibold text-secondary border border-input bg-white hover:bg-muted rounded-lg transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={loading || !name.trim()}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Continue to Audience <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: AUDIENCE SELECTION (MULTI-LIST)                         */}
          {/* ============================================================== */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-secondary text-base">Step 2 of 7: Audience Selection</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Select one or more verified contact lists. Deduplication across lists is performed automatically.</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Step 2 of 7
                  </span>
                </div>

                <div className="p-6 space-y-5">
                  {/* List Controls */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search contact lists..."
                        value={listSearch}
                        onChange={e => setListSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={selectAllLists}
                        className="px-3 py-1.5 rounded border border-input text-secondary hover:bg-muted font-medium transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={clearAllLists}
                        className="px-3 py-1.5 rounded border border-input text-secondary hover:bg-muted font-medium transition-colors"
                      >
                        Clear
                      </button>
                      <Link
                        href="/lists/new"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-muted text-secondary hover:bg-slate-200 font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Create List
                      </Link>
                    </div>
                  </div>

                  {/* Scrollable list options */}
                  <div className="border border-border rounded-lg max-h-64 overflow-y-auto divide-y divide-border/60 bg-white">
                    {filteredLists.length === 0 ? (
                      <div className="p-6 text-center text-xs text-muted-foreground">
                        No contact lists found matching your search.
                      </div>
                    ) : (
                      filteredLists.map(l => {
                        const isSelected = selectedListIds.includes(l.id);
                        const count = typeof l.contacts === 'number'
                          ? l.contacts
                          : (l.contactCount ?? l._count?.contacts ?? l._count?.members ?? (Array.isArray(l.contacts) ? l.contacts.length : 0));
                        return (
                          <div
                            key={l.id}
                            onClick={() => toggleListSelection(l.id)}
                            className={cn(
                              "flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-sm select-none",
                              isSelected ? "bg-orange-50/60 hover:bg-orange-50" : "hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 pointer-events-none"
                              />
                              <div>
                                <span className={cn("text-xs font-semibold block", isSelected ? "text-primary" : "text-secondary")}>
                                  {l.name}
                                </span>
                                {l.description && (
                                  <span className="text-[11px] text-muted-foreground block line-clamp-1">
                                    {l.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className={cn(
                              "text-[11px] px-2.5 py-0.5 rounded-full font-semibold shrink-0",
                              isSelected ? "bg-orange-100 text-orange-800" : "bg-muted text-muted-foreground"
                            )}>
                              {count.toLocaleString()} contacts
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selected List Chips */}
                  {selectedListIds.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Selected Lists ({selectedListIds.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedListIds.map(id => {
                          const l = lists.find(item => item.id === id);
                          if (!l) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 text-xs bg-orange-50 text-orange-800 border border-orange-200 px-3 py-1 rounded-full font-medium"
                            >
                              {l.name}
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleListSelection(id); }}
                                className="text-orange-500 hover:text-orange-800 ml-0.5"
                                title="Remove list"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Unique Audience Count Box */}
                  <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                          Authoritative Unique Audience
                        </span>
                      </div>
                      {isLoadingContacts ? (
                        <span className="text-xs text-primary flex items-center gap-1.5 font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculating deduplicated contacts...
                        </span>
                      ) : (
                        <span className="text-sm font-bold text-secondary">
                          {uniqueAudienceCount.toLocaleString()} Unique Contacts
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Contacts appearing in multiple selected lists are deduplicated so no lead ever receives duplicate communications.
                    </p>
                  </div>

                  {step2Touched && selectedListIds.length === 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      Please select at least one audience list to proceed.
                    </div>
                  )}
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-secondary border border-input bg-white hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaign
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={loading || selectedListIds.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Continue to Email <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: EMAIL CONTENT & SEQUENCE                                */}
          {/* ============================================================== */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-secondary text-base">Step 3 of 7: Email Content & Sequence</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Compose your email message, add variables, and verify with safe sandbox test dispatch.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPreviewOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-input bg-white hover:bg-muted text-secondary shadow-xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-primary" />
                      Preview As Lead
                    </button>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                      Step 3 of 7
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Multi-step sequence navigation tabs */}
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2 overflow-x-auto">
                      {sequenceSteps.map(step => (
                        <button
                          key={step.stepNumber}
                          type="button"
                          onClick={() => setActiveStepTab(step.stepNumber)}
                          className={cn(
                            "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                            activeStepTab === step.stepNumber
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "bg-muted text-muted-foreground hover:bg-slate-200"
                          )}
                        >
                          <span>{step.stepName || `Step ${step.stepNumber}`}</span>
                          {step.stepNumber > 1 && (
                            <span className="text-[10px] opacity-80">(+{step.delayDays}d)</span>
                          )}
                          {sequenceSteps.length > 1 && step.stepNumber > 1 && (
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                removeSequenceStep(step.stepNumber);
                              }}
                              className="hover:text-red-300 ml-1 p-0.5"
                              title="Delete follow-up step"
                            >
                              <X className="w-3 h-3" />
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={addSequenceStep}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-input text-xs font-semibold text-secondary hover:bg-muted transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary" />
                      Add Follow-up
                    </button>
                  </div>

                  {/* Active Step Configuration */}
                  <div className="space-y-4">
                    {activeStepObj.stepNumber > 1 && (
                      <div className="flex items-center gap-4 p-3 bg-muted/40 border border-border rounded-lg text-xs">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-primary" />
                          <span className="font-semibold text-secondary">Follow-up Delay:</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="1"
                            max="30"
                            value={activeStepObj.delayDays}
                            onChange={e => updateStepField(activeStepObj.stepNumber, 'delayDays', Number(e.target.value))}
                            className="w-16 h-8 px-2 text-center rounded border border-input bg-white text-xs font-bold"
                          />
                          <span className="text-muted-foreground">day(s) after previous message if no reply</span>
                        </div>
                      </div>
                    )}

                    {/* Subject Line */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-secondary uppercase tracking-wider">
                          Subject Line <span className="text-red-500">*</span>
                        </label>
                        {activeStepObj.stepNumber > 1 && (
                          <span className="text-[11px] text-muted-foreground">
                            Leave empty to send as reply in the same email thread
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        value={activeStepObj.subject}
                        onChange={e => updateStepField(activeStepObj.stepNumber, 'subject', e.target.value)}
                        placeholder={activeStepObj.stepNumber === 1 ? "e.g. Business Travel Savings for {{firstName}}" : "Re: Business Travel Savings (or leave blank to thread)"}
                        className={cn(
                          "w-full h-11 px-3.5 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
                          step3Touched && activeStepObj.stepNumber === 1 && !activeStepObj.subject.trim() ? "border-red-400 bg-red-50/20" : "border-input"
                        )}
                      />
                      {step3Touched && activeStepObj.stepNumber === 1 && !activeStepObj.subject.trim() && (
                        <p className="text-xs font-medium text-red-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Initial email subject line is required.
                        </p>
                      )}
                    </div>

                    {/* Canonical Variable Insertion Buttons */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                        Insert Personalization Variables:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(VARIABLE_REGISTRY).map(([key, v]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleInsertVariableToActiveStep(v.tag)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-input text-secondary hover:border-primary hover:text-primary rounded-md transition-colors"
                            title={`Inserts ${v.tag} (${v.label})`}
                          >
                            + {v.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rich Email Body Editor */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                        Email Body <span className="text-red-500">*</span>
                      </label>
                      <div className={cn(
                        "rounded-lg border bg-white overflow-hidden shadow-xs",
                        step3Touched && (!activeStepObj.body || activeStepObj.body === '<p><br></p>') ? "border-red-400" : "border-input"
                      )}>
                        <ReactQuill
                          theme="snow"
                          value={activeStepObj.body}
                          onChange={(content: string) => updateStepField(activeStepObj.stepNumber, 'body', content)}
                          modules={quillModules}
                          formats={quillFormats}
                          placeholder="Compose your bulk email announcement..."
                          className="min-h-[220px]"
                        />
                      </div>
                      {step3Touched && (!activeStepObj.body || activeStepObj.body === '<p><br></p>') && (
                        <p className="text-xs font-medium text-red-600 flex items-center gap-1.5 mt-1">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          Email body cannot be empty.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Section 3.5: SAFE TEST EMAIL DISPATCH (In Step 3 for Immediate Verification) */}
                  <div className="p-5 bg-muted/30 border border-border rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-primary" />
                        <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                          Safe Test Email & Sandbox Verification
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        Zero Enrollments Created
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground">
                      Dispatch a verified live test to your own inbox or test contacts to verify formatting and canonical variables before launching.
                    </p>

                    {/* Manual Email Input */}
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={manualEmailInput}
                        onChange={e => setManualEmailInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddManualEmail(); } }}
                        placeholder="Enter test email address (e.g. you@company.com)..."
                        className="flex-1 h-9 px-3 text-xs bg-white border border-input rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="button"
                        onClick={handleAddManualEmail}
                        className="px-3.5 py-1.5 bg-white border border-input hover:bg-slate-50 text-secondary text-xs font-bold rounded-lg transition-colors"
                      >
                        + Add Tester
                      </button>
                    </div>

                    {/* Tester Badges */}
                    {manualTestEmails.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {manualTestEmails.map(em => (
                          <span key={em} className="inline-flex items-center gap-1.5 text-xs bg-white border border-orange-200 text-orange-800 px-2.5 py-1 rounded-full font-medium">
                            {em}
                            <button
                              type="button"
                              onClick={() => handleRemoveManualEmail(em)}
                              className="text-orange-400 hover:text-orange-700"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Test Dispatch Button & Results */}
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">
                        Testing Step: <strong>{activeStepObj.stepName || `Step ${activeStepObj.stepNumber}`}</strong> | Target: <strong>{totalTestRecipientsCount} recipient(s)</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (totalTestRecipientsCount === 0) {
                            alert('Please add at least one test email address above.');
                            return;
                          }
                          setShowConfirmTestModal(true);
                        }}
                        disabled={isSendingTest || totalTestRecipientsCount === 0}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-all disabled:opacity-50 shadow-xs"
                      >
                        {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                        Send Test Email ({totalTestRecipientsCount})
                      </button>
                    </div>

                    {/* Test Result Message */}
                    {testSummaryMessage && (
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
                        <div className="font-medium">
                          {testSummaryMessage}
                          {testResults && testResults.find(r => !r.success && r.error) && (
                            <div className="text-[11px] opacity-90 mt-1 font-normal">
                              Reason: {testResults.find(r => !r.success && r.error)?.error}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-secondary border border-input bg-white hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Audience
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={loading || !sequenceSteps[0]?.subject?.trim() || !sequenceSteps[0]?.body?.trim() || sequenceSteps[0]?.body === '<p><br></p>'}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Continue to Sender <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: SENDER CONFIGURATION                                    */}
          {/* ============================================================== */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-secondary text-base">Step 4 of 7: Sender Mailbox Pool</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Select healthy sender mailboxes to rotate dispatches and distribute load evenly.</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Step 4 of 7
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Sender Overview Card */}
                  <div className="p-4 bg-muted/40 border border-border rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider block">
                        Sending From (Primary Mailbox):
                      </span>
                      <span className="text-sm font-bold text-primary mt-0.5 block">
                        {primaryMailbox ? primaryMailbox.email : 'No mailbox selected'}
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        Sender Name: {primaryMailbox?.displayName || 'TripGain Team'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-secondary block">
                        Active Pool Capacity:
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {poolCapacity.totalDaily} emails/day max ({poolCapacity.totalHourly} emails/hr)
                      </span>
                    </div>
                  </div>

                  {/* Mailbox Grid Selection */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                      Select Mailboxes for Rotation ({selectedMailboxes.length} of {availableMailboxes.length} Selected):
                    </label>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableMailboxes.length === 0 ? (
                        <div className="col-span-2 p-6 text-center text-xs text-muted-foreground bg-white border border-border rounded-lg">
                          No connected mailboxes found for your account. Please connect a mailbox in Settings.
                        </div>
                      ) : (
                        availableMailboxes.map(m => {
                          const isSelected = selectedMailboxes.includes(m.id);
                          const isConnected = m.status === 'CONNECTED' && m.smtpStatus === 'CONNECTED';
                          return (
                            <div
                              key={m.id}
                              onClick={() => {
                                setSelectedMailboxes(prev => 
                                  prev.includes(m.id) 
                                    ? (prev.length > 1 ? prev.filter(id => id !== m.id) : prev) 
                                    : [...prev, m.id]
                                );
                              }}
                              className={cn(
                                "p-3.5 rounded-xl border transition-all cursor-pointer select-none text-xs space-y-1.5",
                                isSelected
                                  ? "bg-orange-50/50 border-primary ring-1 ring-primary/20 shadow-xs"
                                  : "bg-white border-border hover:border-slate-300"
                              )}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => {}}
                                    className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4 pointer-events-none"
                                  />
                                  <span className="font-bold text-secondary truncate max-w-[200px]">
                                    {m.email}
                                  </span>
                                </div>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold",
                                  isConnected ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                                )}>
                                  {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                                <span>{m.displayName || 'No display name'}</span>
                                <span>{m.dailySendLimit || 50}/day limit</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {step4Touched && selectedMailboxes.length === 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                      Please select at least one sender mailbox.
                    </div>
                  )}
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-secondary border border-input bg-white hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Email
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={loading || selectedMailboxes.length === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Continue to Schedule <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 5: SCHEDULE & SENDING LIMITS                              */}
          {/* ============================================================== */}
          {currentStep === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-secondary text-base">Step 5 of 7: Delivery Schedule & Limits</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Configure execution timing, business hours sending windows, and throughput caps.</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Step 5 of 7
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Send Timing Toggle */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                      Launch Timing:
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => setScheduleType('immediate')}
                        className={cn(
                          "p-4 rounded-xl border cursor-pointer transition-all space-y-1",
                          scheduleType === 'immediate'
                            ? "bg-orange-50/50 border-primary ring-1 ring-primary/20 shadow-xs"
                            : "bg-white border-border hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-secondary">
                          <Play className="w-4 h-4 text-primary" />
                          Send Immediately Once Launched
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Campaign dispatches will commence as soon as recipients are queued and the sending window opens.
                        </p>
                      </div>

                      <div
                        onClick={() => setScheduleType('scheduled')}
                        className={cn(
                          "p-4 rounded-xl border cursor-pointer transition-all space-y-1",
                          scheduleType === 'scheduled'
                            ? "bg-orange-50/50 border-primary ring-1 ring-primary/20 shadow-xs"
                            : "bg-white border-border hover:border-slate-300"
                        )}
                      >
                        <div className="flex items-center gap-2 font-bold text-xs text-secondary">
                          <Calendar className="w-4 h-4 text-primary" />
                          Schedule for Later Date & Time
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Campaign stays queued and dispatches begin automatically at your targeted future date.
                        </p>
                      </div>
                    </div>

                    {/* Schedule Date/Time Picker */}
                    {scheduleType === 'scheduled' && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 border border-border rounded-xl">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-secondary block">Scheduled Date:</label>
                          <input
                            type="date"
                            value={scheduledDate}
                            onChange={e => setScheduledDate(e.target.value)}
                            min={new Date().toISOString().slice(0, 10)}
                            className="w-full h-10 px-3 text-xs bg-white border border-input rounded-lg"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-secondary block">Scheduled Time:</label>
                          <input
                            type="time"
                            value={scheduledTime}
                            onChange={e => setScheduledTime(e.target.value)}
                            className="w-full h-10 px-3 text-xs bg-white border border-input rounded-lg"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Sending Window & Limits Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-border">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                        Sending Window (Start - End):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={sendingWindowStart}
                          onChange={e => setSendingWindowStart(e.target.value)}
                          className="h-10 px-3 text-xs bg-white border border-input rounded-lg flex-1"
                        />
                        <span className="text-xs text-muted-foreground font-semibold">to</span>
                        <input
                          type="time"
                          value={sendingWindowEnd}
                          onChange={e => setSendingWindowEnd(e.target.value)}
                          className="h-10 px-3 text-xs bg-white border border-input rounded-lg flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                        Timezone:
                      </label>
                      <select
                        value={timezone}
                        onChange={e => setTimezone(e.target.value)}
                        className="w-full h-10 px-3 text-xs bg-white border border-input rounded-lg"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST - +05:30)</option>
                        <option value="America/New_York">America/New_York (EST - -05:00)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST - -08:00)</option>
                        <option value="Europe/London">Europe/London (GMT - +00:00)</option>
                        <option value="Europe/Berlin">Europe/Berlin (CET - +01:00)</option>
                        <option value="Asia/Dubai">Asia/Dubai (GST - +04:00)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT - +08:00)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                        Daily Send Limit:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="2000"
                        value={dailyLimit}
                        onChange={e => setDailyLimit(Number(e.target.value))}
                        className="w-full h-10 px-3 text-xs bg-white border border-input rounded-lg"
                      />
                      <span className="text-[11px] text-muted-foreground block">
                        Max emails sent per day across all mailboxes for this campaign
                      </span>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
                        Hourly Send Limit:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={hourlyLimit}
                        onChange={e => setHourlyLimit(Number(e.target.value))}
                        className="w-full h-10 px-3 text-xs bg-white border border-input rounded-lg"
                      />
                      <span className="text-[11px] text-muted-foreground block">
                        Throttling rate per hour to ensure pristine mailbox reputation
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-secondary border border-input bg-white hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sender
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Continue to Review <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 6: CAMPAIGN REVIEW                                         */}
          {/* ============================================================== */}
          {currentStep === 6 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-secondary text-base">Step 6 of 7: Pre-launch Review & Audit</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Carefully verify all campaign parameters and automated sanity checks before dispatch.</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Step 6 of 7
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Summary Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Campaign Identity */}
                    <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Campaign Identity
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(1)}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="font-bold text-sm text-secondary">{name}</div>
                      {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </div>

                    {/* Audience */}
                    <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Audience
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(2)}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="font-bold text-sm text-secondary">
                        {uniqueAudienceCount.toLocaleString()} Unique Contacts
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Across {selectedListIds.length} audience list{selectedListIds.length > 1 ? 's' : ''} (Deduplicated)
                      </p>
                    </div>

                    {/* Email Content */}
                    <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Email Sequence
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(3)}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="font-bold text-xs text-secondary truncate">
                        Subject: {sequenceSteps[0]?.subject || '(No subject)'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {sequenceSteps.length} step(s) in sequence | Unsubscribe link verified
                      </p>
                    </div>

                    {/* Sender & Schedule */}
                    <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                          Sender & Schedule
                        </span>
                        <button
                          type="button"
                          onClick={() => setCurrentStep(4)}
                          className="text-xs text-primary hover:underline font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                      <div className="font-bold text-xs text-secondary truncate">
                        Primary: {primaryMailbox?.email || 'None selected'}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {scheduleType === 'scheduled' ? `Scheduled for ${scheduledDate} at ${scheduledTime}` : 'Send Immediately'} | {sendingWindowStart} - {sendingWindowEnd} ({timezone})
                      </p>
                    </div>
                  </div>

                  {/* Preflight Audit Checklist */}
                  <div className="p-4 bg-white border border-border rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-secondary uppercase tracking-wider">
                        Pre-launch Verification Checklist
                      </span>
                      {isFetchingPreflight && (
                        <span className="text-xs text-primary flex items-center gap-1">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                        </span>
                      )}
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Audience selected: <strong>{uniqueAudienceCount.toLocaleString()} unique contacts</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Email subject and content configured across {sequenceSteps.length} sequence step(s)</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Sender mailbox pool configured ({selectedMailboxes.length} active mailbox{selectedMailboxes.length > 1 ? 'es' : ''})</span>
                      </div>
                      <div className="flex items-center gap-2 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Sending limits set: {dailyLimit}/day, {hourlyLimit}/hour ({timezone})</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-secondary border border-input bg-white hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Schedule
                </button>
                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all shadow-sm"
                >
                  Continue to Final Send <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 7: SEND / FINAL ACTION                                     */}
          {/* ============================================================== */}
          {currentStep === 7 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-card rounded-xl border border-border overflow-hidden shadow-xs">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-secondary text-base">Step 7 of 7: Campaign Activation & Queueing</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Enroll verified contacts and initiate automated background dispatches.</p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
                    Final Step
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  {/* Ready to send summary card */}
                  <div className="p-5 bg-orange-50/40 border border-orange-200 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-primary" />
                      <h4 className="text-sm font-bold text-secondary">
                        Ready to {scheduleType === 'scheduled' ? 'Schedule' : 'Launch'} Campaign?
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
                      <div>
                        <span className="text-muted-foreground block">Audience:</span>
                        <span className="font-bold text-secondary text-sm">
                          {uniqueAudienceCount.toLocaleString()} Contacts
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Sender:</span>
                        <span className="font-bold text-secondary truncate block">
                          {primaryMailbox?.email || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Timing:</span>
                        <span className="font-bold text-secondary">
                          {scheduleType === 'scheduled' ? `${scheduledDate} ${scheduledTime}` : 'Immediate'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Rate:</span>
                        <span className="font-bold text-secondary">
                          {hourlyLimit}/hr, {dailyLimit}/day
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Single Clean Launch Action Card */}
                  <div className="p-6 bg-white border border-border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-xs">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-secondary flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {scheduleType === 'scheduled' ? 'Campaign Schedule Ready' : 'Ready to Launch Outreach'}
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-lg leading-relaxed">
                        {scheduleType === 'scheduled'
                          ? `Recipients will be enrolled and queued to start dispatching automatically on ${scheduledDate} at ${scheduledTime}.`
                          : 'Clicking Launch will automatically enroll your validated recipients and activate background sending during active delivery hours.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLaunchModal(true)}
                      disabled={isLaunching || !campaignId}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-all shadow-md shadow-primary/20 disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isLaunching ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Launching Campaign...
                        </>
                      ) : scheduleType === 'scheduled' ? (
                        <>
                          <Calendar className="w-4 h-4" />
                          Schedule Campaign
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Launch Campaign
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-xs font-semibold text-secondary border border-input bg-white hover:bg-muted rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Review
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Modal for Test Email */}
      {showConfirmTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Send className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Confirm Safe Test Send</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  You are about to dispatch a sandbox test email to <strong>{totalTestRecipientsCount} recipient(s)</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5 max-h-36 overflow-y-auto">
              <div className="font-semibold text-slate-700">Recipients receiving test:</div>
              {manualTestEmails.map(e => (
                <div key={e} className="text-slate-600 truncate">• {e} (Manual test address)</div>
              ))}
              {selectedTestContactIds.map(id => {
                const c = audienceContacts.find(item => item.id === id);
                return (
                  <div key={id} className="text-slate-600 truncate">
                    • {c?.fullName || c?.firstName || 'Contact'} ({c?.email})
                  </div>
                );
              })}
            </div>

            <div className="text-[11px] text-slate-500 bg-amber-50 border border-amber-200 p-2.5 rounded-lg">
              <strong>Sandbox Guarantee:</strong> This test send will NOT create campaign enrollments, will NOT launch the campaign, and will NOT alter sequence status.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmTestModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteSendTest}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-all shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Confirm & Send Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Final Launch */}
      {showLaunchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {scheduleType === 'scheduled' ? 'Confirm Campaign Schedule' : 'Confirm Launch Campaign'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you ready to {scheduleType === 'scheduled' ? 'schedule' : 'launch'} <strong>{name}</strong>?
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Audience:</span>
                <span className="font-bold text-slate-900">{uniqueAudienceCount.toLocaleString()} Contacts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sender:</span>
                <span className="font-bold text-slate-900">{primaryMailbox?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timing:</span>
                <span className="font-bold text-slate-900">
                  {scheduleType === 'scheduled' ? `${scheduledDate} at ${scheduledTime}` : 'Immediate'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLaunchModal(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLaunchCampaign}
                className="inline-flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold rounded-lg transition-all shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                {scheduleType === 'scheduled' ? 'Confirm Schedule' : 'Confirm & Launch Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview As Lead Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b border-border bg-card flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-secondary">Rendered Email Preview</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Simulate actual recipient email rendering with zero variable leakage.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-border bg-muted/20 flex items-center gap-3">
              <label className="text-xs font-bold text-secondary shrink-0">Preview Contact:</label>
              <select
                value={previewContactId}
                onChange={e => setPreviewContactId(e.target.value)}
                className="flex-1 h-9 px-3 text-xs bg-white border border-input rounded-lg"
              >
                {audienceContacts.length === 0 && (
                  <option value="">Sample Lead (No list selected)</option>
                )}
                {audienceContacts.slice(0, 50).map(c => (
                  <option key={c.id} value={c.id}>
                    {c.fullName || `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email} {c.companyName ? `(${c.companyName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div><strong>Subject:</strong> {renderedPreviewSubject}</div>
                <div><strong>From:</strong> {primaryMailbox?.displayName || 'TripGain'} &lt;{primaryMailbox?.email || 'outreach@tripgain.com'}&gt;</div>
                <div><strong>To:</strong> {previewContext.firstName} {previewContext.lastName} &lt;{previewContext.email}&gt;</div>
              </div>

              <div
                className="p-5 border border-border rounded-lg bg-white text-sm leading-relaxed text-secondary email-preview-content
                  [&_p]:mb-4 [&_p:last-child]:mb-0
                  [&_p:empty]:min-h-[1rem]
                  [&_p>br:only-child]:inline-block [&_p>br:only-child]:h-4
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4
                  [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:my-3
                  [&_a]:text-blue-600 [&_a]:underline min-h-[150px]"
                dangerouslySetInnerHTML={{ __html: renderedPreviewBody }}
              />
            </div>

            <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 text-xs font-semibold bg-white border border-input rounded-lg hover:bg-muted"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Rocket(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </svg>
  );
}
