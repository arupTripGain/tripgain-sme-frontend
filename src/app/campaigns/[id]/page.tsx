"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { 
  ArrowLeft, Play, Pause, Square, Trash2, Clock, Mail, Users, 
  CheckCircle2, PlayCircle, StopCircle, RefreshCw, AlertCircle, 
  Eye, Edit3, X, Sparkles, Send, ExternalLink, ChevronRight, Rocket, Copy,
  Download, MousePointerClick, MessageSquare, Info, Filter, ArrowUpRight, TrendingUp, HelpCircle, Check,
  UserCheck, AlertTriangle, ShieldCheck
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

  // Outreach Analytics & Filter State
  const [analyticsDays, setAnalyticsDays] = useState<string>('7');
  const [stepPerformance, setStepPerformance] = useState<any[]>([]);
  const [linkPerformance, setLinkPerformance] = useState<any[]>([]);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [enrollmentFilter, setEnrollmentFilter] = useState<string>('ALL');
  const [selectedContactTimeline, setSelectedContactTimeline] = useState<any>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [showOpenInfo, setShowOpenInfo] = useState(false);
  
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
      const res = await apiFetch(`/api/campaigns/${id}/duplicate`, {
        method: 'POST',
        headers: {
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
      const campRes = await apiFetch(`/api/campaigns/${id}`);
      const campData = await campRes.json();
      setCampaign(campData);
      
      // 2. Fetch Enrollments
      const leadRes = await apiFetch(`/api/campaigns/${id}/leads`);
      const leadData = await leadRes.json();
      const loadedEnrollments = Array.isArray(leadData) ? leadData : [];
      setEnrollments(loadedEnrollments);
      
      // 3. Fetch Analytics
      const analyticsRes = await apiFetch(`/api/campaigns/${id}/analytics?days=${analyticsDays}`);
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);

      // 3b. Fetch Step Performance
      const stepsRes = await apiFetch(`/api/campaigns/${id}/analytics/steps`);
      if (stepsRes.ok) {
        const stepsData = await stepsRes.json();
        setStepPerformance(stepsData.steps || []);
      }

      // 3c. Fetch Link Performance
      const linksRes = await apiFetch(`/api/campaigns/${id}/analytics/links`);
      if (linksRes.ok) {
        const linksData = await linksRes.json();
        setLinkPerformance(linksData.links || []);
      }
      
      // 4. Fetch Audit Logs
      const auditRes = await apiFetch(`/api/campaigns/${id}/audit-logs`);
      const auditData = await auditRes.json();
      setAuditLogs(Array.isArray(auditData) ? auditData : []);

      // 5. Fetch Contacts for variable preview testing
      const contactsRes = await apiFetch(`/api/contacts`);
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

  const handleDaysChange = async (days: string) => {
    setAnalyticsDays(days);
    try {
      const url = days === 'all' 
        ? `/api/campaigns/${id}/analytics?days=9999` 
        : `/api/campaigns/${id}/analytics?days=${days}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (e) {
      console.error('Failed to change time window:', e);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      const res = await apiFetch(`/api/campaigns/${id}/analytics/export`);
      if (!res.ok) throw new Error('Failed to generate CSV export');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const campaignNameSanitized = (campaign?.name || 'campaign').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `${campaignNameSanitized}_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err?.message || 'Failed to export CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  const openContactTimeline = async (enrollmentId: string) => {
    setLoadingTimeline(true);
    setSelectedContactTimeline({ loading: true, events: [] });
    try {
      const res = await apiFetch(`/api/campaigns/${id}/analytics/contacts/${enrollmentId}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setSelectedContactTimeline(data);
      } else {
        alert('Failed to load contact activity timeline');
        setSelectedContactTimeline(null);
      }
    } catch (err) {
      console.error(err);
      setSelectedContactTimeline(null);
    } finally {
      setLoadingTimeline(false);
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
      const res = await apiFetch(`/api/campaigns/${id}/activate`, {
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
      const res = await apiFetch(`/api/campaigns/${id}/pause`, {
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
      const res = await apiFetch(`/api/scheduler/tick`, { 
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
      const res = await apiFetch(`/api/webhooks/simulate-event`, {
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
      const res = await apiFetch(`/api/campaigns/${id}`, {
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
      const res = await apiFetch(`/api/campaigns/${id}/enrollments/${enrollmentId}/status`, {
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
        )}        {/* --- ENROLLMENTS ENGINE TAB --- */}
        {activeTab === 'enrollments' && (
          <div className="p-8 w-full max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
              <div>
                <h2 className="text-2xl font-bold text-secondary font-heading">Sequence Engine & Lead Engagement</h2>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Track where contacts are in the sequence, inspect individual engagement activity, and test stop rules.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportCsv}
                  disabled={exportingCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-secondary transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  title="Export outreach engagement CSV (22 columns)"
                >
                  <Download className={`w-3.5 h-3.5 text-primary ${exportingCsv ? 'animate-bounce' : ''}`} />
                  {exportingCsv ? 'Exporting...' : 'Export Engagement CSV'}
                </button>
              </div>
            </div>

            {/* Engagement Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'ALL', label: 'All Contacts', count: enrollments.length },
                { id: 'OPENED', label: 'Opened', count: enrollments.filter(e => e.engagement?.uniqueOpened).length },
                { id: 'CLICKED', label: 'Clicked', count: enrollments.filter(e => e.engagement?.uniqueClicked).length },
                { id: 'REPLIED', label: 'Replied', count: enrollments.filter(e => e.engagement?.replied || e.status === 'replied').length },
                { 
                  id: 'HIGH_ENGAGEMENT', 
                  label: 'High Engagement', 
                  count: enrollments.filter(e => (e.engagement?.replyCount > 0) || (e.engagement?.clickCount > 0) || ((e.engagement?.openCount || 0) >= 2)).length 
                },
                { 
                  id: 'NOT_OPENED', 
                  label: 'Not Opened', 
                  count: enrollments.filter(e => !e.engagement?.uniqueOpened && (e.lastSentAt || e.status !== 'pending')).length 
                },
                { id: 'BOUNCED', label: 'Bounced', count: enrollments.filter(e => e.status === 'bounced').length },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setEnrollmentFilter(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer border ${
                    enrollmentFilter === f.id
                      ? 'bg-secondary text-white border-secondary shadow-xs'
                      : 'bg-card text-muted-foreground border-border hover:bg-muted/60'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    enrollmentFilter === f.id ? 'bg-white/20 text-white' : 'bg-muted text-secondary'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden relative">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-[#f9ece1]/60 border-b border-border text-[#584238]">
                    <tr>
                      <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Contact</th>
                      <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs">Sequence Status</th>
                      <th className="px-4 py-3.5 font-semibold uppercase tracking-wider text-xs">Step</th>
                      <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Outreach Engagement</th>
                      <th className="px-5 py-3.5 font-semibold uppercase tracking-wider text-xs">Next Send</th>
                      <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs text-right">Engine Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const filteredEnrollments = enrollments.filter(enroll => {
                        if (enrollmentFilter === 'ALL') return true;
                        if (enrollmentFilter === 'OPENED') return enroll.engagement?.uniqueOpened;
                        if (enrollmentFilter === 'NOT_OPENED') return !enroll.engagement?.uniqueOpened && (enroll.lastSentAt || enroll.status !== 'pending');
                        if (enrollmentFilter === 'CLICKED') return enroll.engagement?.uniqueClicked;
                        if (enrollmentFilter === 'REPLIED') return enroll.engagement?.replied || enroll.status === 'replied';
                        if (enrollmentFilter === 'BOUNCED') return enroll.status === 'bounced';
                        if (enrollmentFilter === 'HIGH_ENGAGEMENT') {
                          return (enroll.engagement?.replyCount > 0) || 
                                 (enroll.engagement?.clickCount > 0) || 
                                 ((enroll.engagement?.openCount || 0) >= 2);
                        }
                        return true;
                      });

                      if (filteredEnrollments.length === 0) {
                        return (
                          <tr>
                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                              {enrollments.length === 0 && campaign.status === 'draft' ? (
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
                                'No contacts match the selected engagement filter.'
                              )}
                            </td>
                          </tr>
                        );
                      }

                      return filteredEnrollments.map(enroll => {
                        const isStopped = ['replied', 'bounced', 'unsubscribed', 'registered', 'completed'].includes(enroll.status);
                        const eng = enroll.engagement || {};
                        const engStatus = eng.engagementStatus || 'NOT_SENT';

                        // Engagement status badge styling
                        const engBadgeStyles: Record<string, string> = {
                          REPLIED: 'bg-purple-100 text-purple-800 border-purple-200',
                          CLICKED: 'bg-blue-100 text-blue-800 border-blue-200',
                          OPENED: 'bg-amber-100 text-amber-800 border-amber-200',
                          SENT: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                          BOUNCED: 'bg-red-100 text-red-800 border-red-200',
                          UNSUBSCRIBED: 'bg-red-50 text-red-700 border-red-200',
                          NOT_SENT: 'bg-gray-100 text-gray-700 border-gray-200'
                        };

                        return (
                          <tr key={enroll.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-4">
                              <Link href={`/leads/${enroll.contactId}`} className="font-semibold text-primary hover:underline">
                                {enroll.fullName || enroll.email}
                              </Link>
                              <div className="text-xs text-muted-foreground mt-0.5">{enroll.company || 'Unknown Company'}</div>
                            </td>
                            <td className="px-5 py-4">
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
                            <td className="px-4 py-4 font-medium text-secondary">
                              Step {enroll.currentStep}
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1.5 items-start">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${engBadgeStyles[engStatus] || engBadgeStyles.NOT_SENT}`}>
                                    {engStatus.replace('_', ' ')}
                                  </span>

                                  {eng.uniqueOpened && (
                                    <span 
                                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200" 
                                      title={eng.lastOpenedAt ? `Last opened: ${new Date(eng.lastOpenedAt).toLocaleString()}` : ''}
                                    >
                                      <Eye className="w-3 h-3 text-amber-600" />
                                      {eng.openCount} open{eng.openCount > 1 ? 's' : ''}
                                    </span>
                                  )}

                                  {eng.uniqueClicked && (
                                    <span 
                                      className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200"
                                      title={eng.lastClickedAt ? `Last clicked: ${new Date(eng.lastClickedAt).toLocaleString()}` : ''}
                                    >
                                      <MousePointerClick className="w-3 h-3 text-blue-600" />
                                      {eng.clickCount} click{eng.clickCount > 1 ? 's' : ''}
                                    </span>
                                  )}

                                  {eng.replied && (
                                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                                      <MessageSquare className="w-3 h-3 text-purple-600" />
                                      Replied
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                                  <span>
                                    {eng.lastActivityAt ? (
                                      <>Activity: {new Date(eng.lastActivityAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</>
                                    ) : (
                                      <>No engagement activity</>
                                    )}
                                  </span>
                                  <button
                                    onClick={() => openContactTimeline(enroll.id)}
                                    className="text-primary font-semibold hover:underline inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Clock className="w-3 h-3" />
                                    Timeline
                                  </button>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-muted-foreground text-xs">
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
                        );
                      });
                    })()}
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

        {/* --- OUTREACH ANALYTICS TAB --- */}
        {activeTab === 'analytics' && analytics && (
          <div className="p-8 w-full max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            
            {/* Analytics Header & Controls */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2 border-b border-border">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-secondary font-heading">Campaign Outreach Analytics</h2>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#f9ece1] text-[#584238] border border-[#e0c0b2]">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {analytics.timezone || 'Asia/Kolkata (IST)'}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Human-centered metrics (Unique People ≠ Raw Events), progressive engagement funnels, and verified link clicks.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Time Window Buttons */}
                <div className="inline-flex rounded-xl p-1 bg-card border border-border shadow-xs text-xs font-semibold">
                  {[
                    { id: '7', label: 'Last 7 Days' },
                    { id: '14', label: 'Last 14 Days' },
                    { id: '30', label: 'Last 30 Days' },
                    { id: 'all', label: 'All Time' }
                  ].map(w => (
                    <button
                      key={w.id}
                      onClick={() => handleDaysChange(w.id)}
                      className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        analyticsDays === w.id
                          ? 'bg-primary text-white shadow-xs'
                          : 'text-muted-foreground hover:text-secondary'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                {/* CSV Export Button */}
                <button
                  onClick={handleExportCsv}
                  disabled={exportingCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-secondary transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  title="Download complete campaign engagement CSV (22 sanitized columns)"
                >
                  <Download className={`w-3.5 h-3.5 text-primary ${exportingCsv ? 'animate-bounce' : ''}`} />
                  {exportingCsv ? 'Exporting...' : 'Export Analytics CSV'}
                </button>
              </div>
            </div>

            {/* Top 5 Primary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Card 1: Delivered */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm relative overflow-hidden group hover:border-[#14385f]/40 transition-all">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Delivered</span>
                  <Send className="w-4 h-4 text-blue-500" />
                </div>
                <div className="text-3xl font-extrabold text-secondary tracking-tight">
                  {analytics?.summary?.delivered ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-medium">
                  {analytics?.summary?.delivered ?? 0} of {analytics?.summary?.sent ?? 0} sent delivered
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 pt-2 border-t border-border flex justify-between">
                  <span>Delivery: <strong className="text-secondary">{analytics?.summary?.deliveryRate !== null ? `${analytics.summary.deliveryRate}%` : '—'}</strong></span>
                  <span>Bounces: <strong className="text-red-500">{analytics?.summary?.bounced ?? 0}</strong></span>
                </div>
              </div>

              {/* Card 2: Unique Open Rate */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm relative overflow-hidden group hover:border-amber-400/50 transition-all">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                  <span className="flex items-center gap-1">
                    Unique Open Rate
                    <button 
                      onClick={() => setShowOpenInfo(!showOpenInfo)}
                      className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      title="Learn about unique vs total opens"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </span>
                  <Eye className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-3xl font-extrabold text-secondary tracking-tight">
                  {analytics?.summary?.uniqueOpenRate !== null ? (
                    <>{analytics.summary.uniqueOpenRate}<span className="text-xl text-muted-foreground font-semibold ml-0.5">%</span></>
                  ) : (
                    '—'
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-medium">
                  <strong className="text-secondary">{analytics?.summary?.uniqueOpeners ?? 0}</strong> unique openers / {analytics?.summary?.delivered ?? 0} delivered
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 pt-2 border-t border-border flex justify-between">
                  <span>Total Opens: <strong className="text-secondary">{analytics?.summary?.totalOpens ?? 0}</strong></span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 rounded">Deduplicated</span>
                </div>
              </div>

              {/* Card 3: Unique Click Rate */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm relative overflow-hidden group hover:border-blue-400/50 transition-all">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Unique Click Rate</span>
                  <MousePointerClick className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-3xl font-extrabold text-secondary tracking-tight">
                  {analytics?.summary?.uniqueClickRate !== null ? (
                    <>{analytics.summary.uniqueClickRate}<span className="text-xl text-muted-foreground font-semibold ml-0.5">%</span></>
                  ) : (
                    '—'
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-medium">
                  <strong className="text-secondary">{analytics?.summary?.uniqueClickers ?? 0}</strong> unique clickers / {analytics?.summary?.delivered ?? 0} delivered
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 pt-2 border-t border-border flex justify-between">
                  <span>Total Clicks: <strong className="text-secondary">{analytics?.summary?.totalClicks ?? 0}</strong></span>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 rounded">Verified Links</span>
                </div>
              </div>

              {/* Card 4: Reply Rate */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm relative overflow-hidden group hover:border-purple-400/50 transition-all">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>Reply Rate</span>
                  <MessageSquare className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-3xl font-extrabold text-secondary tracking-tight">
                  {analytics?.summary?.replyRate !== null ? (
                    <>{analytics.summary.replyRate}<span className="text-xl text-muted-foreground font-semibold ml-0.5">%</span></>
                  ) : (
                    '—'
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-medium">
                  <strong className="text-secondary">{analytics?.summary?.uniqueRepliers ?? 0}</strong> unique repliers
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 pt-2 border-t border-border flex justify-between">
                  <span>Total Replies: <strong className="text-secondary">{analytics?.summary?.totalReplies ?? 0}</strong></span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 rounded">Primary Goal</span>
                </div>
              </div>

              {/* Card 5: List Health / Unsubscribes */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm relative overflow-hidden group hover:border-green-400/50 transition-all">
                <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                  <span>List Hygiene</span>
                  <ShieldCheck className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-3xl font-extrabold text-secondary tracking-tight">
                  {analytics?.summary?.unsubscribes ?? 0}
                </div>
                <div className="text-xs text-muted-foreground mt-2 font-medium">
                  Unsubscribes: <strong className="text-secondary">{analytics?.summary?.unsubscribeRate !== null ? `${analytics.summary.unsubscribeRate}%` : '—'}</strong>
                </div>
                <div className="text-[11px] text-muted-foreground mt-1 pt-2 border-t border-border flex justify-between">
                  <span>Bounce Rate: <strong className="text-secondary">{analytics?.summary?.bounceRate !== null ? `${analytics.summary.bounceRate}%` : '—'}</strong></span>
                  <span className="text-[10px] text-green-700 bg-green-50 px-1.5 rounded">Compliant</span>
                </div>
              </div>

            </div>

            {/* Open Tracking Explanation Banner (if toggled or always visible hint) */}
            {showOpenInfo && (
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-3 animate-in fade-in duration-200">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-950">How Open Tracking & Deduplication Works</p>
                  <p>
                    Email opens are tracked using an invisible 1x1 image pixel. Corporate security scanners, image caching proxies, or a recipient re-opening an email can generate multiple raw open events. 
                    TripGain deduplicates all events at the contact level so your <strong>Unique Open Rate will never exceed 100%</strong>. Both unique openers and raw total events are reported for complete transparency.
                  </p>
                </div>
                <button 
                  onClick={() => setShowOpenInfo(false)}
                  className="text-amber-700 hover:text-amber-950 p-1 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 5-Stage Progressive Engagement Funnel */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="font-bold text-secondary text-base">5-Stage Outreach Funnel</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Conversion progression across unique contacts: Sent → Delivered → Opened → Clicked → Replied.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border">
                  Unique Contacts Base: <strong className="text-secondary">{analytics?.summary?.sent ?? 0}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
                {(analytics.funnel || []).map((stage: any, idx: number) => {
                  const stageColors = [
                    { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-800', bar: 'bg-slate-700', icon: Send },
                    { bg: 'bg-blue-50/60', border: 'border-blue-200', text: 'text-blue-800', bar: 'bg-blue-600', icon: CheckCircle2 },
                    { bg: 'bg-amber-50/60', border: 'border-amber-200', text: 'text-amber-800', bar: 'bg-amber-500', icon: Eye },
                    { bg: 'bg-indigo-50/60', border: 'border-indigo-200', text: 'text-indigo-800', bar: 'bg-indigo-600', icon: MousePointerClick },
                    { bg: 'bg-emerald-50/60', border: 'border-emerald-200', text: 'text-emerald-800', bar: 'bg-emerald-600', icon: MessageSquare }
                  ];
                  const cfg = stageColors[idx] || stageColors[0];
                  const Icon = cfg.icon;

                  return (
                    <div 
                      key={stage.stage}
                      className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-xs`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            Stage {idx + 1}
                          </span>
                          <Icon className={`w-4 h-4 ${cfg.text}`} />
                        </div>
                        <div className="text-sm font-bold text-secondary">
                          {stage.stage}
                        </div>
                        <div className="text-2xl font-extrabold text-secondary mt-1">
                          {stage.count}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/50 space-y-1.5">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-muted-foreground">Of Sent:</span>
                          <span className="font-semibold text-secondary">{stage.percentOfSent}%</span>
                        </div>
                        {idx > 0 && (
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">From Prev:</span>
                            <span className="font-semibold text-secondary">{stage.conversionFromPrevious}%</span>
                          </div>
                        )}
                        <div className="w-full bg-border/60 h-1.5 rounded-full overflow-hidden mt-1">
                          <div 
                            className={`h-full ${cfg.bar} transition-all duration-500`}
                            style={{ width: `${Math.min(stage.percentOfSent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Activity Timeline Chart */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h3 className="font-bold text-secondary text-base">Outreach Activity Timeline</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Daily breakdown of messages dispatched, unique opens, link clicks, and replies received.
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5 text-secondary">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#14385F]"></span> Sent
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#F16F21]"></span> Opens
                  </span>
                  <span className="flex items-center gap-1.5 text-indigo-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Clicks
                  </span>
                  <span className="flex items-center gap-1.5 text-emerald-600">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Replies
                  </span>
                </div>
              </div>

              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.chartData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14385F" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#14385F" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOpens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F16F21" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#F16F21" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReplies" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <CartesianGrid vertical={false} stroke="#f1f5f9" />
                    <Tooltip />
                    <Area type="monotone" dataKey="sent" stroke="#14385F" strokeWidth={2} fillOpacity={1} fill="url(#colorSent)" name="Sent" />
                    <Area type="monotone" dataKey="opens" stroke="#F16F21" strokeWidth={2} fillOpacity={1} fill="url(#colorOpens)" name="Opens" />
                    <Area type="monotone" dataKey="clicks" stroke="#6366F1" strokeWidth={2} fillOpacity={1} fill="url(#colorClicks)" name="Clicks" />
                    <Area type="monotone" dataKey="replies" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorReplies)" name="Replies" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sequence Step Performance Breakdown Table */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-secondary text-base">Sequence Step Performance</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Attribution of sent messages, unique opens, clicks, and replies per sequence step.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {stepPerformance.length} Configured Step(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-[#f9ece1]/50 border-b border-border text-[#584238]">
                    <tr>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">Step</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Subject / Delay</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-center">Sent</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-center">Delivered</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-center">Unique Openers</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-center">Open Rate</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs text-center">Unique Clickers</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-center">Click Rate</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-center">Replies</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-center">Reply Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stepPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-6 py-8 text-center text-muted-foreground text-xs">
                          No step analytics available yet.
                        </td>
                      </tr>
                    ) : (
                      stepPerformance.map((step) => (
                        <tr key={step.stepNumber} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4 font-bold text-secondary">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold mr-2">
                              {step.stepNumber}
                            </span>
                            Step {step.stepNumber}
                          </td>
                          <td className="px-5 py-4 max-w-xs truncate text-muted-foreground text-xs">
                            <span className="font-semibold text-secondary block truncate">
                              {step.subject || <span className="italic text-muted-foreground">Threaded Reply (No Subject)</span>}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              {step.stepNumber === 1 ? 'Immediate dispatch' : `Wait ${step.delayDays} day(s)`}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-secondary">{step.sent}</td>
                          <td className="px-4 py-4 text-center font-medium text-secondary">{step.delivered}</td>
                          <td className="px-5 py-4 text-center font-medium text-amber-700">{step.uniqueOpeners}</td>
                          <td className="px-4 py-4 text-center font-bold text-secondary">
                            {step.uniqueOpenRate !== null ? `${step.uniqueOpenRate}%` : '—'}
                          </td>
                          <td className="px-5 py-4 text-center font-medium text-blue-700">{step.uniqueClickers}</td>
                          <td className="px-4 py-4 text-center font-bold text-secondary">
                            {step.uniqueClickRate !== null ? `${step.uniqueClickRate}%` : '—'}
                          </td>
                          <td className="px-4 py-4 text-center font-medium text-purple-700">{step.uniqueRepliers}</td>
                          <td className="px-4 py-4 text-center font-bold text-secondary">
                            {step.replyRate !== null ? `${step.replyRate}%` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tracked Links Performance Table */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-6 border-b border-border bg-card flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <h3 className="font-bold text-secondary text-base">Tracked Links Performance</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click volume and unique recipient engagement per outbound URL.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {linkPerformance.length} Tracked Link(s)
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-[#f9ece1]/50 border-b border-border text-[#584238]">
                    <tr>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-xs">Destination URL</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-center">Total Clicks</th>
                      <th className="px-4 py-3 font-semibold uppercase tracking-wider text-xs text-center">Unique Clickers</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">First Clicked</th>
                      <th className="px-5 py-3 font-semibold uppercase tracking-wider text-xs">Last Clicked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkPerformance.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground text-xs">
                          No links tracked in this campaign yet.
                        </td>
                      </tr>
                    ) : (
                      linkPerformance.map((link) => (
                        <tr key={link.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                          <td className="px-6 py-4">
                            <a 
                              href={link.destinationUrl} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="text-primary font-medium hover:underline inline-flex items-center gap-1.5 max-w-md truncate"
                            >
                              <span className="truncate">{link.destinationUrl}</span>
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </a>
                          </td>
                          <td className="px-4 py-4 text-center font-bold text-secondary">{link.totalClicks}</td>
                          <td className="px-4 py-4 text-center font-bold text-blue-700">{link.uniqueClickers}</td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">
                            {link.firstClickedAt ? new Date(link.firstClickedAt).toLocaleString() : '—'}
                          </td>
                          <td className="px-5 py-4 text-xs text-muted-foreground">
                            {link.lastClickedAt ? new Date(link.lastClickedAt).toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
      {/* Contact Activity Timeline Drawer / Modal */}
      {selectedContactTimeline && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-xs flex items-center justify-end animate-in fade-in duration-200">
          <div className="bg-card border-l border-border h-full max-w-xl w-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-6 border-b border-border bg-[#f9ece1]/40 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-secondary font-heading">
                    {selectedContactTimeline.contact?.fullName || 'Contact Activity Timeline'}
                  </h3>
                  {selectedContactTimeline.engagement?.engagementStatus && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-primary/10 text-primary border border-primary/20">
                      {selectedContactTimeline.engagement.engagementStatus.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedContactTimeline.contact?.email}
                  {selectedContactTimeline.contact?.company && ` • ${selectedContactTimeline.contact.company}`}
                  {selectedContactTimeline.contact?.title && ` • ${selectedContactTimeline.contact.title}`}
                </p>
                <div className="flex items-center gap-3 mt-3 text-xs">
                  <span className="text-muted-foreground">
                    Step: <strong className="text-secondary">{selectedContactTimeline.enrollment?.currentStep ?? 1}</strong>
                  </span>
                  <span className="text-muted-foreground">
                    Status: <strong className="text-secondary uppercase">{selectedContactTimeline.enrollment?.status || 'Active'}</strong>
                  </span>
                  {selectedContactTimeline.enrollment?.stopReason && (
                    <span className="text-red-600 font-semibold">
                      [{selectedContactTimeline.enrollment.stopReason}]
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => setSelectedContactTimeline(null)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Engagement Summary Metric Pills */}
            <div className="grid grid-cols-4 gap-2 p-4 bg-muted/20 border-b border-border text-center">
              <div className="bg-card p-2 rounded-lg border border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Opens</div>
                <div className="text-base font-bold text-amber-700">{selectedContactTimeline.engagement?.openCount ?? 0}</div>
              </div>
              <div className="bg-card p-2 rounded-lg border border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Clicks</div>
                <div className="text-base font-bold text-blue-700">{selectedContactTimeline.engagement?.clickCount ?? 0}</div>
              </div>
              <div className="bg-card p-2 rounded-lg border border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Replies</div>
                <div className="text-base font-bold text-purple-700">{selectedContactTimeline.engagement?.replyCount ?? 0}</div>
              </div>
              <div className="bg-card p-2 rounded-lg border border-border">
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Sent Steps</div>
                <div className="text-base font-bold text-secondary">{selectedContactTimeline.messages?.length ?? 0}</div>
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingTimeline ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
                  <RefreshCw className="w-5 h-5 animate-spin mr-2 text-primary" /> Loading engagement timeline...
                </div>
              ) : (!selectedContactTimeline.events || selectedContactTimeline.events.length === 0) && (!selectedContactTimeline.messages || selectedContactTimeline.messages.length === 0) ? (
                <div className="text-center py-16 text-muted-foreground text-sm">
                  No outreach events recorded for this contact yet.
                </div>
              ) : (
                <div className="relative border-l-2 border-[#e0c0b2] ml-3 space-y-6">
                  {/* Unified Events Stream (Messages + Events sorted desc) */}
                  {(() => {
                    const allFeedItems: any[] = [];
                    (selectedContactTimeline.messages || []).forEach((m: any) => {
                      if (m.sentAt) {
                        allFeedItems.push({
                          type: 'message_sent',
                          timestamp: new Date(m.sentAt),
                          title: `Email Dispatched (Step ${m.sequenceStep?.stepNumber || 1})`,
                          details: m.subject || 'Threaded Follow-up (No Subject)',
                          extra: m.status,
                          icon: Send,
                          iconColor: 'bg-[#14385F] text-white'
                        });
                      }
                    });
                    (selectedContactTimeline.events || []).forEach((e: any) => {
                      const et = e.eventType;
                      let title = 'Event';
                      let icon = Eye;
                      let iconColor = 'bg-amber-500 text-white';
                      let details = '';

                      if (et === 'opened' || et === 'email.opened') {
                        title = 'Email Opened';
                        icon = Eye;
                        iconColor = 'bg-amber-500 text-white';
                        details = `Recipient opened email (Step ${e.message?.sequenceStep?.stepNumber || '1'})`;
                      } else if (et === 'clicked' || et === 'email.clicked') {
                        title = 'Link Clicked';
                        icon = MousePointerClick;
                        iconColor = 'bg-blue-600 text-white';
                        details = e.eventData?.url || e.metadata?.url || 'Tracked link clicked in email';
                      } else if (et === 'replied' || et === 'email.replied') {
                        title = 'Reply Received';
                        icon = MessageSquare;
                        iconColor = 'bg-purple-600 text-white';
                        details = 'Prospect replied to email sequence';
                      } else if (et === 'bounced' || et === 'email.bounced') {
                        title = 'Email Bounced';
                        icon = AlertCircle;
                        iconColor = 'bg-red-600 text-white';
                        details = 'Delivery failed / mailbox bounce recorded';
                      } else if (et === 'unsubscribed') {
                        title = 'Unsubscribed';
                        icon = ShieldCheck;
                        iconColor = 'bg-gray-700 text-white';
                        details = 'Prospect requested unenrollment';
                      }

                      allFeedItems.push({
                        type: et,
                        timestamp: new Date(e.eventAt || e.createdAt),
                        title,
                        details,
                        extra: null,
                        icon,
                        iconColor
                      });
                    });

                    allFeedItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

                    return allFeedItems.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div key={i} className="relative pl-6">
                          <div className={`absolute -left-2.5 top-1 w-5 h-5 rounded-full flex items-center justify-center ${item.iconColor} ring-4 ring-card text-xs`}>
                            <Icon className="w-2.5 h-2.5" />
                          </div>
                          <div className="bg-card border border-border rounded-xl p-3.5 shadow-2xs">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-secondary text-xs">{item.title}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {item.timestamp.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 break-words leading-relaxed">
                              {item.details}
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-border bg-card flex justify-end">
              <button
                onClick={() => setSelectedContactTimeline(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-secondary text-white hover:bg-secondary/90 transition-colors cursor-pointer"
              >
                Close Activity Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
