"use client";

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  Sparkles, X, CheckCircle2, AlertTriangle, ArrowLeft, Plus, 
  Building2, Mail, User, Globe, Briefcase, Check, Loader2
} from 'lucide-react';

const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28Z" />
  </svg>
);

export interface SmartAddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (contact: any) => void;
  defaultListId?: string;
}

type DetectionStatus = 'DETECTED' | 'NEEDS_REVIEW' | 'NOT_FOUND' | 'INVALID';

interface LeadFormState {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  jobTitle: string;
  companyName: string;
  linkedinUrl: string;
  websiteUrl: string;
}

interface FieldStatusState {
  name: DetectionStatus;
  email: DetectionStatus;
  jobTitle: DetectionStatus;
  company: DetectionStatus;
  linkedin: DetectionStatus;
  website: DetectionStatus;
}

export default function SmartAddLeadModal({
  isOpen,
  onClose,
  onSuccess,
  defaultListId
}: SmartAddLeadModalProps) {
  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Available user lists
  const [availableLists, setAvailableLists] = useState<{ id: string; name: string }[]>([]);
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [newListName, setNewListName] = useState('');
  const [isCreatingInlineList, setIsCreatingInlineList] = useState(false);

  // Parsed / Editable Lead Form
  const [leadForm, setLeadForm] = useState<LeadFormState>({
    firstName: '',
    lastName: '',
    fullName: '',
    email: '',
    jobTitle: '',
    companyName: '',
    linkedinUrl: '',
    websiteUrl: ''
  });

  const [fieldStatus, setFieldStatus] = useState<FieldStatusState>({
    name: 'NOT_FOUND',
    email: 'NOT_FOUND',
    jobTitle: 'NOT_FOUND',
    company: 'NOT_FOUND',
    linkedin: 'NOT_FOUND',
    website: 'NOT_FOUND'
  });

  // Duplicate state
  const [duplicateInfo, setDuplicateInfo] = useState<{
    isDuplicate: boolean;
    reason: string | null;
    contactId: string | null;
    existingContact: any | null;
    existingListIds: string[];
  }>({
    isDuplicate: false,
    reason: null,
    contactId: null,
    existingContact: null,
    existingListIds: []
  });

  // Saved contact result for success screen
  const [savedResult, setSavedResult] = useState<{
    contact: any;
    lists: string[];
    isExisting: boolean;
  } | null>(null);

  // Fetch lists on open
  useEffect(() => {
    if (isOpen) {
      fetchLists();
      if (defaultListId) {
        setSelectedListIds([defaultListId]);
      }
    }
  }, [isOpen, defaultListId]);

  const fetchLists = async () => {
    try {
      const res = await apiFetch('/api/lists');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const regularLists = data
            .filter((l: any) => l.type !== 'system' && l.id !== 'suppression-1')
            .map((l: any) => ({ id: l.id, name: l.name }));
          setAvailableLists(regularLists);
        }
      }
    } catch (err) {
      console.error('Failed to load lists:', err);
    }
  };

  const handleReset = () => {
    setStep('input');
    setRawText('');
    setParseError(null);
    setSaveError(null);
    setDuplicateInfo({
      isDuplicate: false,
      reason: null,
      contactId: null,
      existingContact: null,
      existingListIds: []
    });
    setLeadForm({
      firstName: '',
      lastName: '',
      fullName: '',
      email: '',
      jobTitle: '',
      companyName: '',
      linkedinUrl: '',
      websiteUrl: ''
    });
    setFieldStatus({
      name: 'NOT_FOUND',
      email: 'NOT_FOUND',
      jobTitle: 'NOT_FOUND',
      company: 'NOT_FOUND',
      linkedin: 'NOT_FOUND',
      website: 'NOT_FOUND'
    });
  };

  const handleCreateNewList = async () => {
    if (!newListName.trim()) return;
    try {
      const res = await apiFetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newListName.trim(), listType: 'static' })
      });
      if (res.ok) {
        const created = await res.json();
        setAvailableLists(prev => [...prev, { id: created.id, name: created.name }]);
        setSelectedListIds(prev => Array.from(new Set([...prev, created.id])));
        setNewListName('');
        setIsCreatingInlineList(false);
      }
    } catch (err) {
      console.error('Failed to create list:', err);
    }
  };

  const handleParse = async () => {
    if (!rawText.trim()) {
      setParseError('Please paste lead information first.');
      return;
    }
    setIsParsing(true);
    setParseError(null);

    try {
      const res = await apiFetch('/api/contacts/smart-parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText.trim(), useAiFallback: false })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to parse lead information');
      }

      const p = data.parsed || {};
      setLeadForm({
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        fullName: p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim(),
        email: p.email || '',
        jobTitle: p.jobTitle || '',
        companyName: p.companyName || '',
        linkedinUrl: p.linkedinUrl || '',
        websiteUrl: p.websiteUrl || ''
      });

      if (data.fieldStatus) {
        setFieldStatus(data.fieldStatus);
      }

      if (data.duplicate) {
        setDuplicateInfo(data.duplicate);
        if (data.duplicate.isDuplicate && Array.isArray(data.duplicate.existingListIds)) {
          // Pre-select existing contact lists if any, or preserve user selected lists
          setSelectedListIds(prev => Array.from(new Set([...prev, ...data.duplicate.existingListIds])));
        }
      }

      setStep('preview');
    } catch (err: any) {
      setParseError(err.message || 'Error occurred while parsing lead.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload: any = {
        lead: {
          firstName: leadForm.firstName.trim(),
          lastName: leadForm.lastName.trim(),
          fullName: (leadForm.fullName.trim() || `${leadForm.firstName} ${leadForm.lastName}`).trim(),
          email: leadForm.email.trim() || null,
          jobTitle: leadForm.jobTitle.trim() || null,
          companyName: leadForm.companyName.trim() || null,
          linkedinUrl: leadForm.linkedinUrl.trim() || null,
          websiteUrl: leadForm.websiteUrl.trim() || null
        },
        listIds: selectedListIds,
        newListName: newListName.trim() ? newListName.trim() : undefined
      };

      const res = await apiFetch('/api/contacts/smart-add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save lead');
      }

      setSavedResult({
        contact: data.contact,
        lists: data.lists || [],
        isExisting: data.isExisting || false
      });

      if (onSuccess) {
        onSuccess(data.contact);
      }

      setStep('success');
    } catch (err: any) {
      setSaveError(err.message || 'Error saving lead');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const renderBadge = (status: DetectionStatus, value?: string) => {
    if (!value || status === 'NOT_FOUND') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-500">
          — Not found
        </span>
      );
    }
    if (status === 'DETECTED') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3 h-3 text-emerald-600" /> Detected
        </span>
      );
    }
    if (status === 'NEEDS_REVIEW') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3 h-3 text-amber-600" /> Needs review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
        <AlertTriangle className="w-3 h-3 text-rose-600" /> Invalid
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-100/80 text-[#F16F21]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight">Smart Add Lead</h2>
              <p className="text-xs text-gray-500">Fast unstructured lead ingestion & list enrollment</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: INPUT */}
          {step === 'input' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Paste lead information
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setRawText(`vikram@referrush.com\nVikram Pai\nFounder & CEO, ReferRush\nhttps://www.linkedin.com/in/vikram-a-pai/?isSelfProfile=false\nhttps://www.referrush.com/`);
                    }}
                    className="text-xs text-[#F16F21] hover:underline font-medium"
                  >
                    Paste sample lead
                  </button>
                </div>
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  rows={8}
                  placeholder={`email\nname\njob title / company\nLinkedIn URL\ncompany website\n\nExample:\nvikram@referrush.com\nVikram Pai\nFounder & CEO, ReferRush\nhttps://www.linkedin.com/in/vikram-a-pai/\nhttps://www.referrush.com/`}
                  className="w-full p-3.5 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F16F21]/20 focus:border-[#F16F21] outline-none transition-all placeholder:text-gray-400 bg-gray-50/50 focus:bg-white resize-y leading-relaxed"
                />
              </div>

              {parseError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* List Selector Area */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 tracking-wider uppercase">List</span>
                  {!isCreatingInlineList && (
                    <button
                      type="button"
                      onClick={() => setIsCreatingInlineList(true)}
                      className="text-xs font-semibold text-[#F16F21] hover:text-[#d95c14] flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Create new list
                    </button>
                  )}
                </div>

                {isCreatingInlineList ? (
                  <div className="flex items-center gap-2 animate-in fade-in duration-150">
                    <input
                      type="text"
                      placeholder="List name (e.g. Global ChemShow)"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#F16F21] focus:border-[#F16F21] bg-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleCreateNewList}
                      className="px-3 py-1.5 bg-[#14385F] text-white text-xs font-semibold rounded-md hover:bg-[#0f2c4d] transition-colors"
                    >
                      Create List
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingInlineList(false);
                        setNewListName('');
                      }}
                      className="text-gray-400 hover:text-gray-600 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5">
                      {availableLists.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No existing lists found. Create one above.</p>
                      ) : (
                        availableLists.map((l) => {
                          const isSelected = selectedListIds.includes(l.id);
                          return (
                            <button
                              key={l.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedListIds(selectedListIds.filter(id => id !== l.id));
                                } else {
                                  setSelectedListIds([...selectedListIds, l.id]);
                                }
                              }}
                              className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'bg-[#14385F] text-white border-[#14385F] shadow-xs'
                                  : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-300'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                              {l.name}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PREVIEW & REVIEW */}
          {step === 'preview' && (
            <div className="space-y-5">
              {/* Duplicate Notice Banner */}
              {duplicateInfo.isDuplicate && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-1">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Lead already exists</span>
                  </div>
                  <div className="text-xs text-amber-700 pl-6 space-y-0.5">
                    <p className="font-medium text-gray-800">
                      Existing contact: <span className="font-semibold">{duplicateInfo.existingContact?.fullName || 'Existing Lead'}</span>
                      {duplicateInfo.existingContact?.email ? ` (${duplicateInfo.existingContact.email})` : ''}
                    </p>
                    <p className="text-gray-600 text-[11px]">
                      This lead already exists in your workspace. Clicking <strong>Add to List</strong> will safely update any missing fields and assign them to the selected list(s) without duplicating.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Detected Lead</h3>
                  <p className="text-xs text-gray-500">Edit any field before confirming</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to text
                </button>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4">
                
                {/* Full Name */}
                <div className="col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-400" /> Name
                    </label>
                    {renderBadge(fieldStatus.name, leadForm.fullName)}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={leadForm.firstName}
                      onChange={(e) => {
                        const fn = e.target.value;
                        setLeadForm({
                          ...leadForm,
                          firstName: fn,
                          fullName: `${fn} ${leadForm.lastName}`.trim()
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#F16F21]"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={leadForm.lastName}
                      onChange={(e) => {
                        const ln = e.target.value;
                        setLeadForm({
                          ...leadForm,
                          lastName: ln,
                          fullName: `${leadForm.firstName} ${ln}`.trim()
                        });
                      }}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#F16F21]"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="col-span-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-gray-400" /> Email
                    </label>
                    {renderBadge(fieldStatus.email, leadForm.email)}
                  </div>
                  <input
                    type="email"
                    placeholder="vikram@referrush.com"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm({ ...leadForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#F16F21]"
                  />
                  {!leadForm.email && (
                    <p className="text-[11px] text-gray-400 italic">Email not found (can still be saved)</p>
                  )}
                </div>

                {/* Job Title */}
                <div className="col-span-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-gray-400" /> Job Title
                    </label>
                    {renderBadge(fieldStatus.jobTitle, leadForm.jobTitle)}
                  </div>
                  <input
                    type="text"
                    placeholder="Founder & CEO"
                    value={leadForm.jobTitle}
                    onChange={(e) => setLeadForm({ ...leadForm, jobTitle: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#F16F21]"
                  />
                </div>

                {/* Company Name */}
                <div className="col-span-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" /> Company
                    </label>
                    {renderBadge(fieldStatus.company, leadForm.companyName)}
                  </div>
                  <input
                    type="text"
                    placeholder="ReferRush"
                    value={leadForm.companyName}
                    onChange={(e) => setLeadForm({ ...leadForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#F16F21]"
                  />
                </div>

                {/* Website */}
                <div className="col-span-1 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-gray-400" /> Website
                    </label>
                    {renderBadge(fieldStatus.website, leadForm.websiteUrl)}
                  </div>
                  <input
                    type="text"
                    placeholder="https://www.referrush.com"
                    value={leadForm.websiteUrl}
                    onChange={(e) => setLeadForm({ ...leadForm, websiteUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#F16F21]"
                  />
                </div>

                {/* LinkedIn */}
                <div className="col-span-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <LinkedInIcon className="w-3.5 h-3.5 text-blue-600" /> LinkedIn URL
                    </label>
                    {renderBadge(fieldStatus.linkedin, leadForm.linkedinUrl)}
                  </div>
                  <input
                    type="text"
                    placeholder="https://www.linkedin.com/in/vikram-a-pai"
                    value={leadForm.linkedinUrl}
                    onChange={(e) => setLeadForm({ ...leadForm, linkedinUrl: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md outline-none focus:ring-1 focus:ring-[#F16F21]"
                  />
                </div>
              </div>

              {/* Target List Selection in Review */}
              <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Assign to List(s)</span>
                  <span className="text-[11px] text-gray-500">{selectedListIds.length} list(s) selected</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {availableLists.map((l) => {
                    const isSelected = selectedListIds.includes(l.id);
                    return (
                      <button
                        key={l.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedListIds(selectedListIds.filter(id => id !== l.id));
                          } else {
                            setSelectedListIds([...selectedListIds, l.id]);
                          }
                        }}
                        className={`text-xs px-2.5 py-1 rounded-md border font-medium transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-[#14385F] text-white border-[#14385F]'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border-gray-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                        {l.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-700 font-medium">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && savedResult && (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-gray-900">
                  {savedResult.contact.fullName || savedResult.contact.email} {savedResult.isExisting ? 'Updated & Added' : 'Added Successfully'}
                </h3>
                <p className="text-xs text-gray-500">
                  {savedResult.isExisting 
                    ? 'Existing contact details updated and enrolled in list.'
                    : 'Contact saved with source SMART_IMPORT.'}
                </p>
              </div>

              {savedResult.lists.length > 0 && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-700 border border-gray-200">
                  <span>List:</span>
                  <span className="font-semibold text-gray-900">{savedResult.lists.join(', ')}</span>
                </div>
              )}

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Smart Add Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#14385F] text-white rounded-lg text-xs font-semibold hover:bg-[#0f2c4d] transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        {step !== 'success' && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-semibold text-gray-600 hover:text-gray-800 transition-colors px-3 py-2"
            >
              Cancel
            </button>

            {step === 'input' ? (
              <button
                type="button"
                onClick={handleParse}
                disabled={isParsing || !rawText.trim()}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-[#F16F21] text-white hover:bg-[#d95c14] shadow-sm transition-all disabled:opacity-50 cursor-pointer"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Parsing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Parse Lead
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer ${
                  duplicateInfo.isDuplicate 
                    ? 'bg-[#14385F] hover:bg-[#0f2c4d] text-white' 
                    : 'bg-[#F16F21] hover:bg-[#d95c14] text-white'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : duplicateInfo.isDuplicate ? (
                  <>Add to List</>
                ) : (
                  <>Add Lead</>
                )}
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
