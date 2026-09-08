"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Play, Pause, Square, Trash2, Clock, Mail, Users, 
  CheckCircle2, PlayCircle, StopCircle, RefreshCw, AlertCircle, 
  Eye, Edit3, X, Sparkles, Send, ExternalLink, ChevronRight, Rocket, Copy
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TemplateEngine } from '@/lib/templateEngine';

export default function CampaignDashboardPage() {
  const { id } = useParams();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState('sequences');
  const [campaign, setCampaign] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sequence Preview State
  const [previewStep, setPreviewStep] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [previewLead, setPreviewLead] = useState<any>({
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex.morgan@acmetech.io',
    title: 'Director of Growth',
    companyName: 'Acme Technologies',
    website: 'acmetech.io',
    city: 'Bengaluru',
    senderName: 'Arup Nirala',
    senderCompany: 'TripGain'
  });

  // Scheduler and modal state
  const [ticking, setTicking] = useState(false);
  const [simulatingEvent, setSimulatingEvent] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const handleDuplicateCampaign = async () => {
    setDuplicating(true);
    try {
      const res = await fetch(`http://localhost:3001/api/campaigns/${id}/duplicate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to duplicate campaign');
      }
      if (data.campaign?.id) {
        router.push(`/campaigns/${data.campaign.id}`);
      } else {
        router.push('/campaigns');
      }
    } catch (err: any) {
      alert(err.message || 'Error duplicating campaign');
      setDuplicating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Campaign Details
      const campRes = await fetch(`http://localhost:3001/api/campaigns/${id}`);
      const campData = await campRes.json();
      setCampaign(campData);
      
      // 2. Fetch Enrollments
      const leadRes = await fetch(`http://localhost:3001/api/campaigns/${id}/leads`);
      const leadData = await leadRes.json();
      const loadedEnrollments = Array.isArray(leadData) ? leadData : [];
      setEnrollments(loadedEnrollments);
      
      // 3. Fetch Analytics
      const analyticsRes = await fetch(`http://localhost:3001/api/campaigns/${id}/analytics`);
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);
      
      // 4. Fetch Audit Logs
      const auditRes = await fetch(`http://localhost:3001/api/campaigns/${id}/audit-logs`);
      const auditData = await auditRes.json();
      setAuditLogs(Array.isArray(auditData) ? auditData : []);

      // 5. Fetch Contacts for variable preview testing
      const contactsRes = await fetch(`http://localhost:3001/api/contacts`);
      if (contactsRes.ok) {
        const cData = await contactsRes.json();
        const contactList = Array.isArray(cData) ? cData : (cData.contacts || []);
        setContacts(contactList);

        if (loadedEnrollments.length > 0) {
          const lead = loadedEnrollments[0];
          const pers = lead.personalizedLine || lead.personalization || '';
          setPreviewLead({
            firstName: lead.firstName || 'there',
            lastName: lead.lastName || '',
            email: lead.email || 'lead@example.com',
            title: lead.title || 'Decision Maker',
            companyName: lead.company || 'Company',
            city: lead.city || '',
            personalization: pers,
            personalizedLine: pers,
            senderName: campData?.senderMailboxes?.[0]?.split('@')[0] || 'Arup Nirala',
            senderCompany: 'TripGain'
          });
        } else if (contactList.length > 0) {
          const contact = contactList[0];
          const pers = contact.personalizedLine || contact.personalization || contact.personalizationTrigger || '';
          setPreviewLead({
            firstName: contact.firstName || 'there',
            lastName: contact.lastName || '',
            email: contact.emails?.[0]?.email || contact.email || 'lead@example.com',
            title: contact.jobTitle || 'Executive',
            companyName: contact.organization?.name || 'Acme Technologies',
            city: contact.city || 'Bengaluru',
            personalization: pers,
            personalizedLine: pers,
            senderName: campData?.senderMailboxes?.[0]?.split('@')[0] || 'Arup Nirala',
            senderCompany: 'TripGain'
          });
        }
      }
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const renderCleanHtml = (htmlContent: string) => {
    let clean = (htmlContent || '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&#160;/g, ' ')
      .replace(/&#xA0;/gi, ' ')
      .replace(/\u00A0/g, ' ')
      .replace(/<p>\s*<\/p>/gi, '')
      .replace(/<p><br\s*\/?><\/p>/gi, '<br class="my-2" />');

    return (
      <div 
        className="email-preview-content text-sm leading-relaxed text-secondary
          [&_p]:mb-3 [&_p:last-child]:mb-0
          [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3
          [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3
          [&_a]:text-blue-600 [&_a]:underline"
        dangerouslySetInnerHTML={{ __html: clean }} 
      />
    );
  };

  const [launching, setLaunching] = useState(false);
  const [pausing, setPausing] = useState(false);

  const handleLaunchCampaign = async () => {
    setLaunching(true);
    try {
      const res = await fetch(`http://localhost:3001/api/campaigns/${id}/activate`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Campaign launched successfully! Enrolled ${data.enrolledCount ?? 0} leads into the sequence.`);
        fetchData();
      } else {
        alert(data.error || 'Failed to launch campaign');
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Error launching campaign');
    } finally {
      setLaunching(false);
    }
  };

  const handlePauseCampaign = async () => {
    setPausing(true);
    try {
      const res = await fetch(`http://localhost:3001/api/campaigns/${id}/pause`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        fetchData();
      } else {
        alert(data.error || 'Failed to pause campaign');
      }
    } catch (error: any) {
      console.error(error);
      alert('Error pausing campaign');
    } finally {
      setPausing(false);
    }
  };

  const runSchedulerTick = async () => {
    setTicking(true);
    try {
      const res = await fetch(`http://localhost:3001/api/scheduler/tick`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          campaignId: id, 
          bypassStepDelay: true, 
          force: true 
        })
      });
      const result = await res.json();
      alert(`Scheduler tick complete. Sent ${result.processed ?? 0} email(s) (Step delays bypassed for testing).`);
      fetchData(); // Refresh UI
    } catch (error) {
      console.error(error);
      alert("Failed to run scheduler tick.");
    } finally {
      setTicking(false);
    }
  };

  const simulateWebhook = async (enrollmentId: string, eventType: string) => {
    setSimulatingEvent(true);
    try {
      const res = await fetch(`http://localhost:3001/api/webhooks/simulate-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollmentId, eventType })
      });
      if (res.ok) {
        fetchData(); // Refresh to see status update
      } else {
        alert("Webhook failed");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSimulatingEvent(false);
    }
  };

  const handleDeleteCampaign = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`http://localhost:3001/api/campaigns/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        router.push('/campaigns');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Failed to delete campaign');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while deleting campaign');
    } finally {
      setDeleting(false);
    }
  };

  const changeEnrollmentStatus = async (enrollmentId: string, action: 'pause' | 'resume' | 'stop') => {
    try {
      const res = await fetch(`http://localhost:3001/api/campaigns/${id}/enrollments/${enrollmentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (res.ok) {
        fetchData();
      } else {
        alert(`Failed to ${action} enrollment`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-8 flex items-center justify-center h-screen"><RefreshCw className="animate-spin text-primary" /></div>;
  if (!campaign) return <div className="p-8 text-red-500 flex justify-center mt-20">Campaign not found.</div>;

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa]">
      
      {/* Top Header */}
      <div className="flex flex-col border-b border-border bg-card/60 backdrop-blur-md shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-5">
            <Link href="/campaigns" className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="font-heading text-2xl font-bold text-secondary">{campaign.name}</h1>
              <div className="flex items-center gap-3 mt-1.5">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm
                  ${campaign.status === 'active' ? 'bg-green-100 text-green-700 ring-1 ring-inset ring-green-600/20' : 'bg-yellow-100 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'}
                `}>
                  {campaign.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse"></span>}
                  {campaign.status}
                </span>
                <div className="w-1 h-1 rounded-full bg-border"></div>
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> 
                  Audience: <span className="text-secondary">{campaign.list?.name || 'Unknown'}</span>
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Link 
              href={`/campaigns/${id}/edit?step=1`}
              className="inline-flex items-center justify-center rounded-full border border-border bg-card hover:bg-muted h-10 px-5 text-sm font-medium shadow-sm transition-colors text-secondary hover:text-primary gap-1.5"
            >
              <Edit3 className="h-4 w-4 text-muted-foreground" />
              Edit Campaign
            </Link>

            <button
              onClick={handleDuplicateCampaign}
              disabled={duplicating}
              className="inline-flex items-center justify-center rounded-full border border-border bg-card hover:bg-muted h-10 px-4 text-sm font-medium shadow-sm transition-colors text-secondary hover:text-primary gap-1.5 disabled:opacity-50 cursor-pointer"
              title="Duplicate this campaign"
            >
              <Copy className={`h-4 w-4 text-muted-foreground ${duplicating ? 'animate-spin' : ''}`} />
              {duplicating ? 'Duplicating...' : 'Duplicate'}
            </button>

            {/* If Draft, show prominent Launch Campaign button */}
            {campaign.status === 'draft' && (
              <button 
                onClick={handleLaunchCampaign}
                disabled={launching}
                className="inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-teal-700 h-10 px-6 gap-2 disabled:opacity-50 cursor-pointer"
              >
                {launching ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Launching & Sequencing...
                  </>
                ) : (
                  <>
                    <Rocket className="h-4 w-4" />
                    Launch Campaign
                  </>
                )}
              </button>
            )}

            {/* If Paused, show Resume Campaign button */}
            {campaign.status === 'paused' && (
              <button 
                onClick={handleLaunchCampaign}
                disabled={launching}
                className="inline-flex items-center justify-center rounded-full text-sm font-semibold transition-all bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg hover:from-emerald-700 hover:to-teal-700 h-10 px-6 gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Play className="h-4 w-4 fill-current" />
                {launching ? 'Resuming...' : 'Resume Campaign'}
              </button>
            )}

            {/* If Active, show Force Scheduler Tick and Pause Campaign */}
            {campaign.status === 'active' && (
              <>
                <button 
                  onClick={runSchedulerTick}
                  disabled={ticking}
                  className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-all bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow hover:shadow-md hover:from-purple-700 hover:to-indigo-700 h-10 px-6 gap-2 disabled:opacity-50 disabled:grayscale"
                >
                  <RefreshCw className={`h-4 w-4 ${ticking ? 'animate-spin' : ''}`} />
                  {ticking ? 'Engine Running...' : 'Force Scheduler Tick'}
                </button>
                <button 
                  onClick={handlePauseCampaign}
                  disabled={pausing}
                  className="inline-flex items-center justify-center rounded-full border border-border bg-card hover:bg-muted h-10 px-5 text-sm font-medium shadow-sm transition-colors text-secondary hover:text-primary"
                >
                  <Pause className="h-4 w-4 mr-2" />
                  {pausing ? 'Pausing...' : 'Pause Campaign'}
                </button>
              </>
            )}

            <button 
              onClick={() => setShowDeleteModal(true)}
              className="inline-flex items-center justify-center rounded-full border border-input hover:border-red-200 bg-card hover:bg-red-50 text-muted-foreground hover:text-red-600 h-10 px-4 text-sm font-medium shadow-sm transition-colors"
              title="Delete Campaign"
            >
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-6 px-6 mt-2">
          <button 
            onClick={() => setActiveTab('sequences')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'sequences' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Mail className="w-4 h-4" />
            Sequence Steps ({campaign.sequences?.[0]?.steps?.length || 0})
          </button>
          <button 
            onClick={() => setActiveTab('enrollments')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'enrollments' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            <Users className="w-4 h-4" />
            Enrollments & Engine ({enrollments.length})
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'analytics' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Dashboard Analytics
          </button>
          <button 
            onClick={() => setActiveTab('config')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'config' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
          >
            Configuration & Audit
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        
        {/* Draft Notice Banner */}
        {campaign.status === 'draft' && (
          <div className="bg-gradient-to-r from-amber-500/10 via-primary/5 to-transparent border-b border-amber-200/60 px-8 py-4">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-800 border border-amber-300 shrink-0">
                  <Rocket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-secondary flex items-center gap-2">
                    Campaign is currently in Draft
                    <span className="text-[11px] font-normal text-muted-foreground">• Ready to sequence</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Target audience: <span className="font-semibold text-secondary">{campaign.list?.name || 'Assigned List'}</span>. Launching will enroll all eligible contacts into the sequence and activate automated email outreach.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link
                  href={`/campaigns/${id}/edit?step=1`}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted text-xs font-medium text-secondary transition-colors"
                >
                  Edit Settings
                </Link>
                <button
                  onClick={handleLaunchCampaign}
                  disabled={launching}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {launching ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Launching & Sequencing...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-3.5 h-3.5" />
                      Launch Campaign Now
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- SEQUENCE STEPS TAB --- */}
        {activeTab === 'sequences' && (
          <div className="p-8 w-full max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Sequence Overview Bar */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-xl font-bold text-secondary font-heading">
                    {campaign.sequences?.[0]?.name || 'Primary Sequence'}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {(campaign.sequences?.[0]?.steps || []).length} Email Step{(campaign.sequences?.[0]?.steps || []).length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Sender Mailbox: <span className="font-semibold text-secondary">{campaign.senderMailboxes?.[0] || 'Default connected mailbox'}</span>
                  {campaign.sequences?.[0]?.steps?.length > 1 && (
                    <> • Total Sequence Delay: <span className="font-semibold text-secondary">{campaign.sequences[0].steps.reduce((acc: number, s: any) => acc + (s.delayDays || 0), 0)} day(s)</span></>
                  )}
                </p>
              </div>

              <Link
                href={`/campaigns/${id}/edit?step=4`}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm self-start md:self-auto"
              >
                <Edit3 className="w-4 h-4" />
                Edit Sequence & Templates
              </Link>
            </div>

            {/* Steps List */}
            {(!campaign.sequences?.[0]?.steps || campaign.sequences[0].steps.length === 0) ? (
              <div className="bg-card border border-dashed border-border rounded-xl p-12 text-center">
                <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold text-secondary">No Sequence Steps Configured</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first outreach email step to begin engaging leads.</p>
                <Link
                  href={`/campaigns/${id}/edit?step=4`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> Configure Steps
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {campaign.sequences[0].steps.map((step: any, index: number) => (
                  <div 
                    key={step.id || index}
                    className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:border-border/80"
                  >
                    {/* Step Card Header */}
                    <div className="bg-muted/40 border-b border-border p-5 flex items-center justify-between flex-wrap gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-xs">
                          {step.stepNumber || index + 1}
                        </span>
                        <span className="font-bold text-secondary text-base">
                          {index === 0 ? 'Step 1: Initial Email' : `Step ${step.stepNumber}: Follow-up`}
                        </span>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-background border border-border text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          {index === 0 || !step.delayDays || step.delayDays === 0 
                            ? 'Send immediately on enrollment' 
                            : `Wait ${step.delayDays} day(s) after previous step`}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setPreviewStep(step)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-secondary transition-colors shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                          Preview with Variables
                        </button>
                        <Link
                          href={`/campaigns/${id}/edit?step=4`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-semibold text-secondary transition-colors shadow-sm"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                          Edit Step
                        </Link>
                      </div>
                    </div>

                    {/* Step Content Preview */}
                    <div className="p-6 space-y-4">
                      {/* Subject */}
                      <div className="bg-background border border-border rounded-lg p-3.5 flex items-start gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground shrink-0 mt-0.5 w-16">
                          Subject:
                        </span>
                        <span className="text-sm font-semibold text-secondary break-words flex-1">
                          {step.subjectTemplate || <span className="text-muted-foreground italic font-normal">No subject defined</span>}
                        </span>
                      </div>

                      {/* Body */}
                      <div className="bg-background border border-border rounded-lg p-6 min-h-[120px]">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                          Email Content Preview
                        </div>
                        {renderCleanHtml(step.bodyTemplate || step.bodyHtmlTemplate || '<p class="text-muted-foreground italic">No email body defined.</p>')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- ENROLLMENTS ENGINE TAB --- */}
        {activeTab === 'enrollments' && (
          <div className="p-8 w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            <div className="flex justify-between items-end mb-2">
              <div>
                <h2 className="text-2xl font-bold text-secondary font-heading">Sequence Engine</h2>
                <p className="text-sm text-muted-foreground mt-1.5">Track where contacts are in the sequence and test stop rules.</p>
              </div>
            </div>
            
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-muted/50 border-b border-border text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Contact</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Status</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Current Step</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Next Send</th>
                      <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Engine Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                          {campaign.status === 'draft' ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-4">
                              <div className="p-3 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                                <Rocket className="w-6 h-6" />
                              </div>
                              <p className="text-base font-bold text-secondary">
                                Campaign is currently in Draft
                              </p>
                              <p className="text-xs text-muted-foreground max-w-md text-center leading-relaxed">
                                Leads have not been enrolled yet. Launching the campaign will enroll all eligible contacts from <span className="font-semibold text-secondary">{campaign.list?.name || 'your audience list'}</span> into the sequence and start automated outreach.
                              </p>
                              <button
                                onClick={handleLaunchCampaign}
                                disabled={launching}
                                className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-md transition-all cursor-pointer disabled:opacity-50"
                              >
                                {launching ? (
                                  <>
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                    Launching & Sequencing...
                                  </>
                                ) : (
                                  <>
                                    <Rocket className="w-4 h-4" />
                                    Launch Campaign & Sequence Leads
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            'No enrollments found for this campaign.'
                          )}
                        </td>
                      </tr>
                    ) : enrollments.map(enroll => {
                      const isStopped = ['replied', 'bounced', 'unsubscribed', 'registered', 'completed'].includes(enroll.status);
                      
                      return (
                      <tr key={enroll.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-4">
                          <Link href={`/leads/${enroll.contactId}`} className="font-semibold text-primary hover:underline">
                            {enroll.fullName || enroll.email}
                          </Link>
                          <div className="text-xs text-muted-foreground mt-0.5">{enroll.company || 'Unknown Company'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase
                            ${enroll.status === 'active' ? 'bg-blue-100 text-blue-700' : ''}
                            ${enroll.status === 'pending' ? 'bg-gray-100 text-gray-700' : ''}
                            ${enroll.status === 'completed' ? 'bg-green-100 text-green-700' : ''}
                            ${['replied', 'registered'].includes(enroll.status) ? 'bg-purple-100 text-purple-700' : ''}
                            ${['bounced', 'unsubscribed', 'failed'].includes(enroll.status) ? 'bg-red-100 text-red-700' : ''}
                            ${enroll.status === 'paused' ? 'bg-yellow-100 text-yellow-700' : ''}
                          `}>
                            {enroll.status}
                          </span>
                          {enroll.stopReason && (
                            <div className="text-xs text-red-500 font-medium mt-1 uppercase truncate max-w-[150px]">
                              [{enroll.stopReason}]
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-secondary">
                          Step {enroll.currentStep}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-xs">
                          {enroll.nextSendAt ? new Date(enroll.nextSendAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col gap-1 items-end">
                            <div className="flex gap-2">
                              {enroll.status === 'active' && (
                                <button onClick={() => changeEnrollmentStatus(enroll.id, 'pause')} className="text-xs border border-yellow-200 bg-yellow-50 rounded-md px-3 py-1.5 font-medium hover:bg-yellow-100 text-yellow-700 transition-colors shadow-sm hover:shadow">
                                  Pause
                                </button>
                              )}
                              {enroll.status === 'paused' && (
                                <button onClick={() => changeEnrollmentStatus(enroll.id, 'resume')} className="text-xs border border-green-200 bg-green-50 rounded-md px-3 py-1.5 font-medium hover:bg-green-100 text-green-700 transition-colors shadow-sm hover:shadow">
                                  Resume
                                </button>
                              )}
                              {!isStopped && (
                                <button onClick={() => changeEnrollmentStatus(enroll.id, 'stop')} className="text-xs border border-gray-200 bg-gray-50 rounded-md px-3 py-1.5 font-medium hover:bg-gray-100 text-gray-700 transition-colors shadow-sm hover:shadow">
                                  Stop
                                </button>
                              )}
                            </div>
                            <div className="flex justify-end gap-1.5 mt-2 opacity-30 hover:opacity-100 transition-opacity">
                              <button 
                                disabled={isStopped || simulatingEvent}
                                onClick={() => simulateWebhook(enroll.id, 'REPLY')}
                                className="text-[10px] uppercase font-bold tracking-wider border border-border rounded px-2 py-1 hover:bg-purple-50 text-purple-700 disabled:opacity-30 bg-card"
                                title="Simulate Reply"
                              >
                                Sim:Reply
                              </button>
                              <button 
                                disabled={isStopped || simulatingEvent}
                                onClick={() => simulateWebhook(enroll.id, 'REGISTRATION')}
                                className="text-[10px] uppercase font-bold tracking-wider border border-border rounded px-2 py-1 hover:bg-green-50 text-green-700 disabled:opacity-30 bg-card"
                                title="Simulate Registration"
                              >
                                Sim:Reg
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-500" />
              <div>
                <strong>How to test sequences & manual ticks:</strong><br/>
                Click the "Force Scheduler Tick" button to manually dispatch the next step for active leads (multi-day step delays are automatically bypassed during manual force ticks for instant testing). Once dispatched, the enrollment immediately advances to the next step. You can also test Stop Rules using the Simulate buttons.
              </div>
            </div>

          </div>
        )}

        {/* --- ANALYTICS TAB --- */}
        {activeTab === 'analytics' && analytics && (
          <div className="p-8 w-full max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-2xl font-bold text-secondary mb-2 font-heading">Performance Dashboard</h2>
            
            <div className="grid grid-cols-5 gap-5">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/20 p-6 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-4">Started</div>
                <div className="text-5xl font-bold text-secondary drop-shadow-sm">{analytics?.summary?.sequenceStarted ?? enrollments.filter(e => e.lastSentAt || e.status !== 'pending').length ?? 0}</div>
              </div>
              <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/20 p-6 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-4">Open Rate</div>
                <div className="text-4xl font-bold text-secondary drop-shadow-sm">{analytics?.summary?.openRate || 0}<span className="text-2xl text-muted-foreground ml-1">%</span></div>
              </div>
              <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/20 p-6 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-4">Click Rate</div>
                <div className="text-4xl font-bold text-secondary drop-shadow-sm">{analytics?.summary?.clickRate || 0}<span className="text-2xl text-muted-foreground ml-1">%</span></div>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-6 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-primary text-sm font-semibold uppercase tracking-wider mb-4">Replies</div>
                <div className="text-5xl font-bold text-primary drop-shadow-sm">{analytics?.summary?.replies ?? enrollments.filter(e => e.status === 'replied').length}</div>
              </div>
              <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50/50 to-green-100/30 p-6 shadow-sm text-center relative overflow-hidden group hover:shadow-md transition-all">
                <div className="absolute inset-0 bg-green-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-green-700 text-sm font-semibold uppercase tracking-wider mb-4">Registrations</div>
                <div className="text-5xl font-bold text-green-600 drop-shadow-sm">{analytics?.summary?.registrations ?? enrollments.filter(e => e.status === 'registered').length}</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm mt-8">
              <h3 className="font-bold text-secondary mb-6">Activity Timeline</h3>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <CartesianGrid vertical={false} stroke="#e2e8f0" />
                    <Tooltip />
                    <Area type="monotone" dataKey="sent" stroke="#3b82f6" fillOpacity={0.1} fill="#3b82f6" />
                    <Area type="monotone" dataKey="opens" stroke="#facc15" fillOpacity={0.1} fill="#facc15" />
                    <Area type="monotone" dataKey="replies" stroke="#10b981" fillOpacity={0.1} fill="#10b981" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* --- CONFIGURATION & AUDIT TAB --- */}
        {activeTab === 'config' && (
          <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <h2 className="text-2xl font-bold text-secondary mb-2 font-heading">Configuration & Audit Log</h2>
            
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Read-only Configuration */}
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
                  <h3 className="font-bold text-secondary border-b border-border pb-3 uppercase tracking-wider text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Identity & Sender
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Campaign Name</div>
                      <div className="font-medium text-secondary">{campaign.name}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Campaign Code</div>
                      <div className="font-medium text-secondary">{campaign.campaignCode || '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Sender Email</div>
                      <div className="font-medium text-secondary">{campaign.senderEmail || (campaign.senderMailboxes && campaign.senderMailboxes[0]) || '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Reply-to Email</div>
                      <div className="font-medium text-secondary">{campaign.replyToEmail || (campaign.senderMailboxes && campaign.senderMailboxes[0]) || '-'}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Description</div>
                      <div className="font-medium text-secondary bg-muted/30 p-2 rounded text-xs">{campaign.description || 'Cold outreach sequence for TripGain prospective clients.'}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-6">
                  <h3 className="font-bold text-secondary border-b border-border pb-3 uppercase tracking-wider text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" /> Schedule & Limits
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Timezone</div>
                      <div className="font-medium text-secondary">{campaign.timezone || '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Sending Window</div>
                      <div className="font-medium text-secondary">{campaign.sendingWindowStart || '-'} to {campaign.sendingWindowEnd || '-'}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Sending Days</div>
                      <div className="font-medium text-secondary flex gap-2">
                        {campaign.sendingDays && campaign.sendingDays.length > 0 
                          ? campaign.sendingDays.map((day: string) => (
                            <span key={day} className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-bold">{day}</span>
                          ))
                          : '-'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Audit Log */}
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-full">
                  <h3 className="font-bold text-secondary border-b border-border pb-3 uppercase tracking-wider text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary" /> Audit History
                  </h3>
                  
                  <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4">
                    {auditLogs.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">No audit logs found.</div>
                    ) : (
                      <div className="relative border-l border-border ml-3 space-y-6">
                        {auditLogs.map((log, index) => (
                          <div key={log.id} className="relative pl-6">
                            <div className="absolute w-3 h-3 bg-card border-2 border-primary rounded-full -left-[1.5px] top-1.5 ring-4 ring-card"></div>
                            <div className="bg-muted/30 rounded-lg p-3 border border-border">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-sm font-bold text-secondary">{log.action}</span>
                                <span className="text-[10px] text-muted-foreground font-medium bg-card px-1.5 py-0.5 rounded border border-border">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {log.details && (
                                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{log.details}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-secondary font-heading">Delete Campaign?</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-secondary">"{campaign.name}"</span>?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All enrolled leads, sequence steps, and dispatch logs will be permanently deleted. This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setShowDeleteModal(false)}
                className="rounded-xl border border-input bg-background hover:bg-muted px-4 py-2 text-sm font-medium text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteCampaign}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Campaign'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Email Preview Modal */}
      {previewStep !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-5xl flex overflow-hidden max-h-[90vh] border border-border">
            {/* Left Sidebar */}
            <div className="w-80 bg-muted/30 border-r border-border p-6 overflow-y-auto flex flex-col">
              <h3 className="font-bold text-secondary text-lg flex items-center gap-2 mb-6">
                <Play className="w-5 h-5 -rotate-90 fill-current text-primary" /> Test Variables
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground tracking-wider">Load Data for Lead:</label>
                  <select 
                    className="w-full h-10 px-3 rounded-lg border border-input focus:ring-1 focus:ring-primary outline-none text-sm bg-background text-secondary"
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const enrolled = enrollments.find(l => l.id === selectedId || l.contactId === selectedId);
                      if (enrolled) {
                        const pers = enrolled.personalizedLine || enrolled.personalization || '';
                        setPreviewLead({
                          firstName: enrolled.firstName || 'there',
                          lastName: enrolled.lastName || '',
                          email: enrolled.email || 'lead@example.com',
                          title: enrolled.title || 'Decision Maker',
                          companyName: enrolled.company || 'Company',
                          city: enrolled.city || '',
                          personalization: pers,
                          personalizedLine: pers,
                          senderName: campaign?.senderMailboxes?.[0]?.split('@')[0] || 'Arup Nirala',
                          senderCompany: 'TripGain'
                        });
                        return;
                      }
                      const c = contacts.find(contact => contact.id === selectedId);
                      if (c) {
                        const pers = c.personalizedLine || c.personalization || c.personalizationTrigger || '';
                        setPreviewLead({
                          firstName: c.firstName || '',
                          lastName: c.lastName || '',
                          email: c.emails?.[0]?.email || c.email || '',
                          title: c.jobTitle || '',
                          companyName: c.organization?.name || '',
                          website: c.organization?.domain || '',
                          industry: c.organization?.industry || '',
                          companySize: c.organization?.employeeSize || '',
                          city: c.city || '',
                          personalization: pers,
                          personalizedLine: pers,
                          senderName: campaign?.senderMailboxes?.[0]?.split('@')[0] || 'Arup Nirala',
                          senderCompany: 'TripGain'
                        });
                      }
                    }}
                  >
                    {enrollments.length > 0 && (
                      <optgroup label="Enrolled Campaign Leads">
                        {enrollments.map(e => (
                          <option key={e.id} value={e.id}>
                            {e.fullName || `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email} ({e.company || 'Lead'})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {contacts.length > 0 && (
                      <optgroup label="All Workspace Contacts">
                        {contacts.map(c => (
                          <option key={c.id} value={c.id}>
                            {c.firstName} {c.lastName} ({c.organization?.name || 'Contact'})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    {enrollments.length === 0 && contacts.length === 0 && (
                      <option value="">Sample Lead</option>
                    )}
                  </select>
                </div>
              </div>

              <div className="border-t border-border pt-4 flex-1">
                <h4 className="font-bold text-secondary text-xs uppercase tracking-wider mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" /> Resolved Variables
                </h4>
                <div className="space-y-3">
                  {Object.entries(previewLead).map(([key, value]) => (
                    <div key={key}>
                      <p className="text-[11px] font-semibold text-muted-foreground">{`{{${key}}}`}</p>
                      <p className="text-xs font-medium text-secondary truncate mt-0.5 bg-muted/60 px-2 py-1 rounded">
                        {(value as string) || <span className="italic text-muted-foreground">none</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 bg-background flex flex-col">
              <div className="p-6 border-b border-border flex justify-between items-center bg-card">
                <div>
                  <h3 className="font-bold text-secondary text-lg flex items-center gap-2">
                    <Eye className="w-5 h-5 text-primary" /> Email Preview
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Step {previewStep.stepNumber || 1} • {previewStep.delayDays > 0 ? `Wait ${previewStep.delayDays} day(s)` : 'Initial Send'}
                  </p>
                </div>
                <button 
                  onClick={() => setPreviewStep(null)} 
                  className="p-2 text-muted-foreground hover:bg-muted rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-3 max-w-3xl bg-card border border-border p-5 rounded-xl shadow-sm">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold text-muted-foreground w-16">From:</span>
                    <span className="font-medium text-secondary">
                      {campaign?.senderMailboxes?.[0] || 'outreach@tripgainapp.com'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold text-muted-foreground w-16">To:</span>
                    <span className="font-medium text-secondary">{previewLead.email}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="font-semibold text-muted-foreground w-16">Subject:</span>
                    <span className="font-bold text-secondary text-sm">
                      {TemplateEngine.renderTemplate(previewStep.subjectTemplate || previewStep.subject || '', previewLead, 'Standard', false) || 'No Subject'}
                    </span>
                  </div>
                </div>

                {/* Email Body Card */}
                <div className="bg-card border border-border p-8 rounded-xl max-w-3xl min-h-[250px] shadow-sm">
                  {(() => {
                    const rawBody = previewStep.bodyTemplate || previewStep.bodyHtmlTemplate || previewStep.body || '';
                    const rendered = TemplateEngine.renderTemplate(rawBody, previewLead, 'Standard', false);
                    return renderCleanHtml(rendered);
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
