"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Building2, User, Mail, Phone, MapPin, 
  Globe, Calendar, CheckCircle2, Play, 
  Pause, Check, AlertCircle, Clock, Users, Edit, Trash2,
  Sparkles, RefreshCw, Save, X, AlertTriangle, ShieldCheck
} from 'lucide-react';

export default function LeadProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // AI Personalization state
  const [personalizing, setPersonalizing] = useState(false);
  const [isEditingPersonalization, setIsEditingPersonalization] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [personalizationError, setPersonalizationError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchContact = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/contacts/${id}`);
        if (!res.ok) throw new Error('Contact not found');
        const data = await res.json();
        setContact(data);
      } catch (err) {
        console.error(err);
        router.push('/leads');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchContact();
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm(`Delete ${contact.fullName || 'this contact'}?\n\nThis will permanently remove the contact.`)) return;
    try {
      const res = await fetch(`http://localhost:3001/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        router.push('/leads');
      } else {
        alert('Failed to delete contact.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to delete contact.');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadStatus: newStatus })
      });
      if (res.ok) {
        setContact({ ...contact, leadStatus: newStatus });
      } else {
        alert('Failed to update status.');
      }
    } catch (e) {
      console.error('Error updating status:', e);
      alert('Failed to update status.');
    }
  };

  const handleGeneratePersonalization = async (force = false) => {
    if (!contact) return;
    setPersonalizing(true);
    setPersonalizationError(null);
    try {
      const res = await fetch(`http://localhost:3001/api/contacts/${contact.id}/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      });
      const data = await res.json();
      if (res.ok) {
        setContact((prev: any) => ({
          ...prev,
          personalizedLine: data.personalization,
          personalizationStatus: data.status,
          personalizationSource: data.source,
          personalizationConfidence: data.confidence,
          personalizationGeneratedAt: new Date().toISOString(),
          personalizationEvidence: data.evidence
        }));
        if (!data.success && data.status === 'NO_USEFUL_DATA') {
          setPersonalizationError(data.reason || 'Insufficient verified signals found for this company.');
        }
      } else {
        setPersonalizationError(data.detail || data.error || 'Failed to generate personalization');
      }
    } catch (e: any) {
      setPersonalizationError(e.message || 'Error communicating with server');
    } finally {
      setPersonalizing(false);
    }
  };

  const handleSaveManualPersonalization = async () => {
    if (!contact) return;
    try {
      const res = await fetch(`http://localhost:3001/api/contacts/${contact.id}/personalize`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personalization: editedText })
      });
      const data = await res.json();
      if (res.ok) {
        setContact((prev: any) => ({
          ...prev,
          personalizedLine: data.personalization,
          personalizationStatus: data.status,
          personalizationSource: 'MANUAL',
          personalizationConfidence: data.confidence,
          personalizationUpdatedAt: new Date().toISOString()
        }));
        setIsEditingPersonalization(false);
      } else {
        alert('Failed to save personalization.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save personalization.');
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#fafafa]">Loading...</div>;
  }
  
  if (!contact) return null;

  const primaryEmail = contact.emails?.find((e: any) => e.isPrimary)?.email || contact.emails?.[0]?.email;
  const org = contact.organization || {};

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa]">
      
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold uppercase shadow-inner border border-primary/20">
              {contact.firstName?.[0] || contact.fullName?.[0] || '?'}
            </div>
            <div>
              <h1 className="font-heading text-2xl font-bold text-secondary tracking-tight">{contact.fullName}</h1>
              <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                {contact.jobTitle && <span>{contact.jobTitle}</span>}
                {contact.jobTitle && org.name && <span>•</span>}
                {org.name && <span className="font-medium text-secondary">{org.name}</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button onClick={handleDelete} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 h-9 px-3 shadow-sm transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
          <Link href={`/leads/${id}/edit`} className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-border bg-card hover:bg-accent h-9 px-4 gap-2 shadow-sm text-secondary transition-colors">
            <Edit className="h-4 w-4" /> Edit
          </Link>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-[#14385F] text-white hover:opacity-90 h-9 px-4 shadow-sm transition-colors">
            Add to List
          </button>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-[#F16F21] text-white hover:opacity-90 h-9 px-4 shadow-sm transition-colors">
            <Play className="h-4 w-4 mr-1.5" />
            Enroll in Campaign
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Details */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Contact Info Card */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-muted/30 to-transparent flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <h2 className="font-semibold text-secondary">Contact Info</h2>
              </div>
              <div className="p-5 space-y-5">
                {primaryEmail && (
                  <div className="flex items-start gap-3 group">
                    <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Work Email</p>
                      <p className="text-sm text-secondary font-medium">{primaryEmail}</p>
                    </div>
                  </div>
                )}
                {contact.phone && (
                  <div className="flex items-start gap-3 group">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Phone</p>
                      <p className="text-sm text-secondary font-medium">{contact.phone}</p>
                    </div>
                  </div>
                )}
                {contact.linkedinUrl && (
                  <div className="flex items-start gap-3 group">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">LinkedIn</p>
                      <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline truncate block max-w-[200px] font-medium">
                        {contact.linkedinUrl}
                      </a>
                    </div>
                  </div>
                )}
                {contact.city && (
                  <div className="flex items-start gap-3 group">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Location</p>
                      <p className="text-sm text-secondary font-medium">{contact.city}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Company Info Card */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-muted/30 to-transparent flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-500/10">
                  <Building2 className="h-4 w-4 text-blue-600" />
                </div>
                <h2 className="font-semibold text-secondary">Company Details</h2>
              </div>
              <div className="p-5 space-y-5">
                <div className="flex items-start gap-3 group">
                  <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-blue-600 transition-colors" />
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Company Name</p>
                    <p className="text-sm text-secondary font-medium">{org.name || 'N/A'}</p>
                  </div>
                </div>
                {org.domain && (
                  <div className="flex items-start gap-3 group">
                    <Globe className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-blue-600 transition-colors" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Website</p>
                      <a href={`https://${org.domain}`} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline font-medium">{org.domain}</a>
                    </div>
                  </div>
                )}
                {org.industry && (
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded-sm bg-muted-foreground/20 mt-0.5 shrink-0"></div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Industry</p>
                      <p className="text-sm text-secondary font-medium">{org.industry}</p>
                    </div>
                  </div>
                )}
                {org.employeeSize && (
                  <div className="flex items-start gap-3">
                    <div className="h-4 w-4 rounded-sm bg-muted-foreground/20 mt-0.5 shrink-0"></div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Company Size</p>
                      <p className="text-sm text-secondary font-medium">{org.employeeSize} employees</p>
                    </div>
                  </div>
                )}
                {org.phone && (
                  <div className="flex items-start gap-3 group">
                    <Phone className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0 group-hover:text-blue-600 transition-colors" />
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">Company Phone</p>
                      <p className="text-sm text-secondary font-medium">{org.phone}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Personalization & Tags */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-muted/30 to-transparent flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-500/10">
                  <CheckCircle2 className="h-4 w-4 text-purple-600" />
                </div>
                <h2 className="font-semibold text-secondary">Lead Status</h2>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Status</p>
                  <div className="relative inline-block w-full">
                    <select
                      value={contact.leadStatus || 'Cold'}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-secondary font-medium"
                    >
                      <option value="New">New</option>
                      <option value="Ready">Ready</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Replied">Replied</option>
                      <option value="Interested">Interested</option>
                      <option value="Not Interested">Not Interested</option>
                      <option value="Bounced">Bounced</option>
                      <option value="Unsubscribed">Unsubscribed</option>
                      <option value="Do Not Contact">Do Not Contact</option>
                      <option value="Suppressed">Suppressed</option>
                      <option value="Cold">Cold</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted-foreground">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Personalization Section */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-purple-500/10 via-blue-500/5 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-purple-600/10 text-purple-600">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-secondary text-sm">AI Personalization</h2>
                    <p className="text-[11px] text-muted-foreground">Factual icebreaker for email templates</p>
                  </div>
                </div>
                
                {/* Status Indicator Badge */}
                {personalizing ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full ring-1 ring-blue-600/20">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Generating...
                  </span>
                ) : contact.personalizedLine ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full ring-1 ring-emerald-600/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Generated
                  </span>
                ) : contact.personalizationStatus === 'NO_USEFUL_DATA' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full ring-1 ring-amber-600/20">
                    <AlertTriangle className="h-3 w-3" />
                    No useful data
                  </span>
                ) : contact.personalizationStatus === 'FAILED' ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full ring-1 ring-rose-600/20">
                    <AlertCircle className="h-3 w-3" />
                    Failed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full border border-border">
                    <Clock className="h-3 w-3" />
                    Pending
                  </span>
                )}
              </div>

              <div className="p-5 space-y-4">
                {personalizing ? (
                  <div className="p-6 text-center space-y-3 bg-muted/20 rounded-lg border border-dashed border-border animate-pulse">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-xs font-medium text-muted-foreground">
                      Researching public company data and crafting factual personalization...
                    </p>
                  </div>
                ) : isEditingPersonalization ? (
                  <div className="space-y-3">
                    <label className="text-xs font-semibold text-secondary block">
                      Edit Personalization (Will be saved as MANUAL)
                    </label>
                    <textarea
                      value={editedText}
                      onChange={(e) => setEditedText(e.target.value)}
                      rows={4}
                      className="w-full text-xs font-medium text-secondary p-3 rounded-lg border border-input bg-background focus:ring-1 focus:ring-primary focus:border-primary outline-none"
                      placeholder="Write or refine the 1–2 sentence personalization..."
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => setIsEditingPersonalization(false)}
                        className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-secondary rounded-md border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        onClick={handleSaveManualPersonalization}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-[#F16F21] hover:opacity-90 rounded-md transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Save className="w-3.5 h-3.5" /> Save Manual
                      </button>
                    </div>
                  </div>
                ) : contact.personalizedLine ? (
                  <div className="space-y-3">
                    <div className="bg-muted/40 p-4 rounded-lg border border-border relative overflow-hidden group">
                      <div className={`absolute top-0 left-0 w-1 h-full ${contact.personalizationSource === 'MANUAL' ? 'bg-amber-500' : 'bg-purple-600'}`} />
                      <p className="text-sm text-secondary font-medium leading-relaxed italic">
                        "{contact.personalizedLine}"
                      </p>
                    </div>

                    {/* Metadata strip */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded ${contact.personalizationSource === 'MANUAL' ? 'bg-amber-100/70 text-amber-800' : 'bg-purple-100/70 text-purple-800'}`}>
                          {contact.personalizationSource === 'MANUAL' ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-amber-700" />
                              MANUAL (Protected)
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3 text-purple-600" />
                              AI Research
                            </>
                          )}
                        </span>
                        {contact.personalizationConfidence && (
                          <span className="font-medium bg-muted px-1.5 py-0.5 rounded text-secondary">
                            {contact.personalizationConfidence} confidence
                          </span>
                        )}
                      </div>

                      {contact.personalizationGeneratedAt && (
                        <span>
                          {new Date(contact.personalizationGeneratedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <button
                        onClick={() => {
                          setEditedText(contact.personalizedLine || '');
                          setIsEditingPersonalization(true);
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-primary rounded-md border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => handleGeneratePersonalization(true)}
                        className="px-3 py-1.5 text-xs font-medium text-secondary hover:text-purple-600 rounded-md border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5 shadow-sm"
                        title="Regenerate with fresh AI research"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {contact.personalizationStatus === 'NO_USEFUL_DATA' ? (
                      <div className="p-3 bg-amber-50/50 border border-amber-200/50 rounded-lg text-xs text-amber-900 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">No verifiable public signals found</p>
                            <p className="text-muted-foreground mt-0.5">
                              The email sequencer will automatically render your email template's fallback paragraph. You can also write a custom icebreaker manually.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : contact.personalizationStatus === 'FAILED' ? (
                      <div className="p-3 bg-rose-50/50 border border-rose-200/50 rounded-lg text-xs text-rose-900 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold">Generation failed</p>
                            <p className="text-muted-foreground mt-0.5">
                              {personalizationError || 'Could not verify signals against quality standards.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Generate a factual 1–2 sentence icebreaker bridging this prospect's business domain to TripGain's travel and expense solution.
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => handleGeneratePersonalization(false)}
                        className="px-4 py-2 text-xs font-medium text-white bg-[#F16F21] hover:opacity-90 rounded-md transition-colors flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {contact.personalizationStatus ? 'Regenerate' : 'Generate Personalization'}
                      </button>
                      <button
                        onClick={() => {
                          setEditedText('');
                          setIsEditingPersonalization(true);
                        }}
                        className="px-3 py-2 text-xs font-medium text-secondary hover:text-primary rounded-md border border-border bg-card hover:bg-muted transition-colors flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Write Manually
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Activity & Relationships */}
          <div className="lg:col-span-8 space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Enrollments & Campaigns */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-[#F16F21]/10 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[#F16F21]/10">
                      <Play className="h-4 w-4 text-[#F16F21]" />
                    </div>
                    <h2 className="font-semibold text-secondary">Active Campaigns</h2>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium border border-border">{contact.enrollments?.length || 0}</span>
                </div>
                <div className="p-0 flex-1">
                  {(!contact.enrollments || contact.enrollments.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Play className="h-5 w-5 opacity-50" />
                      </div>
                      <p className="text-sm font-medium">Not enrolled in any campaigns.</p>
                      <button className="mt-4 text-xs font-medium text-[#F16F21] hover:underline">Enroll Now &rarr;</button>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {contact.enrollments.map((enrollment: any) => (
                        <div key={enrollment.id} className="p-5 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                          <div>
                            <h3 className="font-medium text-secondary group-hover:text-primary transition-colors">{enrollment.campaign?.name || 'Unknown Campaign'}</h3>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-600/20 shadow-sm">
                                <CheckCircle2 className="h-3 w-3" />
                                {enrollment.status}
                              </span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium bg-muted px-2 py-0.5 rounded border border-border">
                                Step {enrollment.currentStep || 1}
                              </span>
                            </div>
                            {contact?.linkedinUrl && (
                              <div className="flex items-center gap-2 text-sm mt-2">
                                <span className="text-blue-600">in</span>
                                <a href={contact.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                  LinkedIn Profile
                                </a>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="p-2 text-muted-foreground hover:text-[#14385F] hover:bg-muted rounded-md transition-colors border border-transparent hover:border-border" title="Pause Sequence">
                              <Pause className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* List Memberships */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
                <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-[#14385F]/10 to-transparent flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-[#14385F]/10">
                      <Users className="h-4 w-4 text-[#14385F]" />
                    </div>
                    <h2 className="font-semibold text-secondary">Lists</h2>
                  </div>
                  <span className="text-xs bg-muted px-2 py-1 rounded-full font-medium border border-border">{contact.listMemberships?.length || 0}</span>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  {(!contact.listMemberships || contact.listMemberships.length === 0) ? (
                    <div className="h-full flex flex-col items-center justify-center p-4 text-center text-muted-foreground">
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                        <Users className="h-5 w-5 opacity-50" />
                      </div>
                      <p className="text-sm font-medium">Not assigned to any lists.</p>
                      <button className="mt-4 text-xs font-medium text-[#14385F] hover:underline">Add to List &rarr;</button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {contact.listMemberships.map((membership: any) => (
                        <span key={membership.list.id} className="inline-flex items-center gap-1.5 rounded-md bg-[#14385F]/5 px-3 py-1.5 text-xs font-semibold text-[#14385F] ring-1 ring-inset ring-[#14385F]/20 shadow-sm hover:bg-[#14385F]/10 transition-colors cursor-default">
                          <Users className="h-3 w-3 opacity-70" />
                          {membership.list.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/10 to-transparent flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-primary/10">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="font-semibold text-secondary">Activity Timeline</h2>
                </div>
              </div>
              <div className="p-8 relative">
                <div className="absolute top-8 bottom-8 left-[47px] w-0.5 bg-gradient-to-b from-border via-border to-transparent"></div>
                
                <div className="space-y-8">
                  
                  {/* Messages / Events from enrollments */}
                  {contact.enrollments?.flatMap((e: any) => e.messages || []).map((msg: any) => (
                    <div key={msg.id} className="relative flex gap-5 group">
                      <div className="relative z-10 w-10 h-10 rounded-full bg-green-50 flex items-center justify-center ring-4 ring-card shrink-0 shadow-sm border border-green-100 group-hover:scale-110 transition-transform">
                        <Mail className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-secondary">Email Sent</p>
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(msg.sentAt).toLocaleDateString()} at {new Date(msg.sentAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="mt-2 bg-muted/50 p-4 rounded-lg border border-border shadow-sm">
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Subject</p>
                          <p className="text-sm font-medium text-secondary">{msg.subject}</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  {contact.enrollments?.map((enrollment: any) => (
                    <div key={enrollment.id} className="relative flex gap-5 group">
                      <div className="relative z-10 w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center ring-4 ring-card shrink-0 shadow-sm border border-orange-100 group-hover:scale-110 transition-transform">
                        <Play className="h-4 w-4 text-[#F16F21]" />
                      </div>
                      <div className="flex-1 pt-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-secondary">Enrolled in Campaign</p>
                          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(enrollment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm text-secondary mt-1 font-medium bg-muted inline-flex px-2 py-1 rounded border border-border">
                          {enrollment.campaign?.name}
                        </p>
                      </div>
                    </div>
                  ))}

                  {/* Contact Created Event */}
                  <div className="relative flex gap-5 group">
                    <div className="relative z-10 w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center ring-4 ring-card shrink-0 shadow-sm border border-blue-100 group-hover:scale-110 transition-transform">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 pt-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-secondary">Contact Created</p>
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(contact.createdAt).toLocaleDateString()} at {new Date(contact.createdAt).toLocaleTimeString()}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Lead profile was generated in the system.</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
