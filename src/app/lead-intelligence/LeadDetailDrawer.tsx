"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCode,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Loader2,
  ExternalLink,
  Tag
} from 'lucide-react';

interface LeadDetailDrawerProps {
  leadId: string | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export function LeadDetailDrawer({ leadId, onClose, onStatusUpdated }: LeadDetailDrawerProps) {
  const [lead, setLead] = useState<any | null>(null);
  const [duplicateMatch, setDuplicateMatch] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUpdatingDedupe, setIsUpdatingDedupe] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setLead(null);
      setDuplicateMatch(null);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    apiFetch(`/api/lead-intelligence/leads/${leadId}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch lead details.');
        }
        return res.json();
      })
      .then((data) => {
        setLead(data.lead);
        setDuplicateMatch(data.duplicateMatch);
      })
      .catch((err) => {
        setErrorMsg(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [leadId]);

  if (!leadId) return null;

  const handleOverrideDedupe = async (newStatus: 'UNIQUE' | 'DUPLICATE' | 'POSSIBLE_DUPLICATE') => {
    if (!lead) return;
    setIsUpdatingDedupe(true);
    try {
      const res = await apiFetch(`/api/lead-intelligence/leads/${lead.id}/override-dedupe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dedupeStatus: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to override status.');
      setLead(data.lead);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err: any) {
      alert(`Error updating dedupe status: ${err.message}`);
    } finally {
      setIsUpdatingDedupe(false);
    }
  };

  const getDedupeBadge = (status: string) => {
    switch (status) {
      case 'UNIQUE':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200"><CheckCircle2 className="w-3.5 h-3.5" /> Unique Lead</span>;
      case 'DUPLICATE':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200"><AlertCircle className="w-3.5 h-3.5" /> Confirmed Duplicate</span>;
      case 'POSSIBLE_DUPLICATE':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200"><Clock className="w-3.5 h-3.5" /> Possible Duplicate (Review)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-card border-l border-border shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Lead Record Inspector
              </span>
              <h2 className="text-lg font-bold text-foreground truncate max-w-md">
                {lead?.companyName || 'Lead Details'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {isLoading && (
              <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="text-xs">Loading record provenance & audit trail...</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                {errorMsg}
              </div>
            )}

            {!isLoading && lead && (
              <>
                {/* Status & Completeness Card */}
                <div className="p-4 rounded-xl border border-border bg-card shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>{getDedupeBadge(lead.dedupeStatus)}</div>
                    <div className="text-right">
                      <span className="text-[11px] text-muted-foreground block">Completeness</span>
                      <span className="text-sm font-bold text-primary">
                        {Math.round((lead.completenessScore || 0) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-primary h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.round((lead.completenessScore || 0) * 100)}%` }}
                    />
                  </div>

                  {/* Format Checks */}
                  <div className="flex items-center gap-2 pt-1">
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${lead.hasValidEmail ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-muted text-muted-foreground'}`}>
                      {lead.hasValidEmail ? '✓ Valid Email' : '✗ No Email'}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${lead.hasValidPhone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-muted text-muted-foreground'}`}>
                      {lead.hasValidPhone ? '✓ Valid Phone' : '✗ No Phone'}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${lead.hasValidDomain ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-muted text-muted-foreground'}`}>
                      {lead.hasValidDomain ? '✓ Valid Domain' : '✗ No Domain'}
                    </span>
                  </div>
                </div>

                {/* Company & Normalization Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" /> Company Profile & Normalization
                  </h3>
                  <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Display Name:</span>
                        <span className="font-semibold text-foreground">{lead.companyName}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Normalized Search Key:</span>
                        <span className="font-mono bg-card px-1.5 py-0.5 rounded border border-border text-[11px] text-foreground">
                          {lead.companyNormalizedName || '—'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Domain:</span>
                        <span className="text-foreground">{lead.domain || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Website URL:</span>
                        {lead.websiteUrl ? (
                          <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            Visit Site <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : '—'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Industry / Sector:</span>
                        <span className="text-foreground">{lead.industry || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Company Size:</span>
                        <span className="text-foreground">{lead.companySize || '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-primary" /> Contact Details
                  </h3>
                  <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Contact Name:</span>
                        <span className="font-semibold text-foreground">{lead.contactName || '—'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Title / Role:</span>
                        <span className="text-foreground">{lead.contactTitle || '—'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Email Address:</span>
                        {lead.email ? (
                          <span className="font-mono text-foreground select-all">{lead.email}</span>
                        ) : '—'}
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Phone Number:</span>
                        {lead.phone ? (
                          <span className="font-mono text-foreground select-all">{lead.phone}</span>
                        ) : '—'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Location / City:</span>
                        <span className="text-foreground">
                          {[lead.city, lead.state, lead.country].filter(Boolean).join(', ') || '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">LinkedIn Profile:</span>
                        {lead.linkedinUrl ? (
                          <a href={lead.linkedinUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            LinkedIn Profile <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deduplication Intelligence & Override */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Deduplication Intelligence
                  </h3>
                  <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Match Reason:</span>
                      <span className="text-foreground font-medium">
                        {lead.duplicateReason || 'No duplicate records detected. Record is marked as UNIQUE.'}
                      </span>
                    </div>

                    {lead.duplicateConfidence && (
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Confidence Score:</span>
                        <span className="font-bold text-foreground">
                          {Math.round(lead.duplicateConfidence * 100)}% Match
                        </span>
                      </div>
                    )}

                    {/* Linked Duplicate Match Preview */}
                    {duplicateMatch && (
                      <div className="p-3 rounded-lg bg-card border border-border space-y-1">
                        <span className="text-[11px] font-bold text-amber-800 block">
                          Matched Existing Record:
                        </span>
                        <div className="font-semibold text-foreground">{duplicateMatch.companyName}</div>
                        <div className="text-muted-foreground text-[11px]">
                          {duplicateMatch.domain && `Domain: ${duplicateMatch.domain} · `}
                          {duplicateMatch.email && `Email: ${duplicateMatch.email} · `}
                          {duplicateMatch.city && `City: ${duplicateMatch.city}`}
                        </div>
                      </div>
                    )}

                    {/* Override Actions */}
                    <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Manual Override:</span>
                      {lead.dedupeStatus !== 'UNIQUE' && (
                        <button
                          onClick={() => handleOverrideDedupe('UNIQUE')}
                          disabled={isUpdatingDedupe}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          Mark as Unique
                        </button>
                      )}
                      {lead.dedupeStatus !== 'DUPLICATE' && (
                        <button
                          onClick={() => handleOverrideDedupe('DUPLICATE')}
                          disabled={isUpdatingDedupe}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                        >
                          Mark as Duplicate
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Source Provenance & Raw Data */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-primary" /> Source Provenance
                  </h3>
                  <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Source Type:</span>
                        <span className="font-semibold text-foreground">{lead.sourceType}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Source Batch Name:</span>
                        <span className="text-foreground">{lead.sourceName}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Extracted At:</span>
                        <span className="text-foreground">
                          {lead.extractedAt ? new Date(lead.extractedAt).toLocaleString() : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[11px]">Source Row / Line:</span>
                        <span className="font-mono text-foreground">
                          {lead.provenance?.rowNumber ? `Row #${lead.provenance.rowNumber}` : 'Direct URL Scrape'}
                        </span>
                      </div>
                    </div>

                    {/* Raw Record Data Inspector */}
                    {lead.rawRecord && (
                      <div className="pt-2 border-t border-border/60">
                        <span className="text-muted-foreground block text-[11px] mb-1">
                          Original Raw Data (Unadulterated):
                        </span>
                        <pre className="p-2.5 rounded bg-card border border-border text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-40">
                          {lead.rawRecord.rawData 
                            ? JSON.stringify(lead.rawRecord.rawData, null, 2)
                            : (lead.rawRecord.rawText || '(No raw text)')}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-border flex justify-end bg-muted/20">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-lg border border-border bg-card text-foreground hover:bg-muted/80 transition-colors"
            >
              Close Inspector
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
