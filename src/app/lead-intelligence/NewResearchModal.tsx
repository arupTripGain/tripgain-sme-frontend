"use client";

import React, { useState, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Globe, 
  Clipboard, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Info,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';

interface NewResearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'FILE_UPLOAD' | 'PASTED_TEXT' | 'WEBSITE';

export function NewResearchModal({ isOpen, onClose, onSuccess }: NewResearchModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('FILE_UPLOAD');
  
  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceName, setSourceName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Pasted Text State
  const [pastedText, setPastedText] = useState('');
  const [pastedSourceName, setPastedSourceName] = useState('');

  // Website State
  const [url, setUrl] = useState('');
  const [urlSourceName, setUrlSourceName] = useState('');
  const [batchName, setBatchName] = useState('');

  // Processing & Result State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resultSummary, setResultSummary] = useState<any | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setSelectedFile(null);
    setSourceName('');
    setPastedText('');
    setPastedSourceName('');
    setUrl('');
    setUrlSourceName('');
    setBatchName('');
    setErrorMsg(null);
    setResultSummary(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        setErrorMsg('File size exceeds 25MB limit. Please upload a smaller file.');
        return;
      }
      setSelectedFile(file);
      setErrorMsg(null);
      if (!sourceName) {
        setSourceName(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setResultSummary(null);

    try {
      if (activeTab === 'FILE_UPLOAD') {
        if (!selectedFile) {
          throw new Error('Please select a file to upload.');
        }

        const formData = new FormData();
        formData.append('file', selectedFile);
        if (sourceName.trim()) {
          formData.append('sourceName', sourceName.trim());
        }

        const res = await apiFetch('/api/lead-intelligence/sources/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to process file upload.');
        }

        setResultSummary(data);
        onSuccess();
      } else if (activeTab === 'PASTED_TEXT') {
        if (!pastedText.trim()) {
          throw new Error('Please enter or paste contact text.');
        }

        const res = await apiFetch('/api/lead-intelligence/sources/pasted-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: pastedText.trim(),
            sourceName: pastedSourceName.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to process pasted text.');
        }

        setResultSummary(data);
        onSuccess();
      } else if (activeTab === 'WEBSITE') {
        if (!url.trim()) {
          throw new Error('Please enter a website URL.');
        }

        const res = await apiFetch('/api/lead-intelligence/sources/url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: url.trim(),
            sourceName: urlSourceName.trim() || undefined,
            batchName: batchName.trim() || undefined,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to process website URL.');
        }

        setResultSummary(data);
        onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during extraction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Ingest Leads & Research</h2>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                Phase 1
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Deterministic parsing, suffix normalization, and conservative duplicate checking.
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border px-6 bg-card">
          <button
            type="button"
            onClick={() => { setActiveTab('FILE_UPLOAD'); setErrorMsg(null); setResultSummary(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'FILE_UPLOAD'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            Upload File (CSV, Excel, PDF)
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('PASTED_TEXT'); setErrorMsg(null); setResultSummary(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'PASTED_TEXT'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Clipboard className="w-4 h-4" />
            Pasted Text / TSV
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('WEBSITE'); setErrorMsg(null); setResultSummary(null); }}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'WEBSITE'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="w-4 h-4" />
            Public Website URL
          </button>
        </div>

        {/* Modal Body / Form */}
        <div className="p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3.5 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                <span className="font-semibold">Extraction Warning:</span> {errorMsg}
              </div>
            </div>
          )}

          {resultSummary && (
            <div className={`p-4 rounded-xl border space-y-2 ${
              resultSummary.status === 'FAILED' || (resultSummary.stats?.total === 0 && resultSummary.stats?.errors > 0)
                ? 'bg-destructive/10 border-destructive/20 text-destructive'
                : resultSummary.status === 'PARTIAL'
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                {resultSummary.status === 'FAILED' || (resultSummary.stats?.total === 0 && resultSummary.stats?.errors > 0) ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span>Ingestion Failed — No Records Ingested</span>
                  </>
                ) : resultSummary.status === 'PARTIAL' ? (
                  <>
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    <span>Ingestion Partially Completed</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Ingestion Completed Successfully</span>
                  </>
                )}
              </div>

              {resultSummary.errorMessage && (
                <p className="text-xs opacity-90 leading-relaxed">
                  {resultSummary.errorMessage}
                </p>
              )}

              <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="p-2 rounded bg-card border border-border shadow-xs">
                  <div className="text-muted-foreground">Total Rows</div>
                  <div className="text-base font-bold text-foreground">{resultSummary.stats?.total || 0}</div>
                </div>
                <div className="p-2 rounded bg-card border border-border shadow-xs">
                  <div className="text-emerald-700 font-semibold">Unique</div>
                  <div className="text-base font-bold text-emerald-700">{resultSummary.stats?.valid || 0}</div>
                </div>
                <div className="p-2 rounded bg-card border border-border shadow-xs">
                  <div className="text-amber-700 font-semibold">Duplicates</div>
                  <div className="text-base font-bold text-amber-700">{resultSummary.stats?.duplicates || 0}</div>
                </div>
                <div className="p-2 rounded bg-card border border-border shadow-xs">
                  <div className="text-destructive font-semibold">Errors</div>
                  <div className="text-base font-bold text-destructive">{resultSummary.stats?.errors || 0}</div>
                </div>
              </div>
              {resultSummary.status === 'NEEDS_OCR' && (
                <div className="mt-2 text-xs text-amber-800 bg-amber-100/60 p-2 rounded">
                  ⚠️ Note: Scanned PDF detected. Text extraction requires OCR in Phase 2.
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* TAB 1: FILE UPLOAD */}
            {activeTab === 'FILE_UPLOAD' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Source / Campaign Batch Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., SME Summit Attendee List 2026"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-primary/60 rounded-xl p-8 text-center cursor-pointer transition-colors bg-muted/20 hover:bg-muted/40"
                >
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".csv, .xlsx, .xls, .pdf, .txt"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  <div className="flex flex-col items-center gap-2">
                    {selectedFile ? (
                      <>
                        <FileSpreadsheet className="w-10 h-10 text-primary animate-in zoom-in-75 duration-150" />
                        <span className="text-xs font-bold text-foreground">{selectedFile.name}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Click to choose different file
                        </span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-muted-foreground" />
                        <div className="text-xs font-bold text-foreground">
                          Drag & drop or click to upload
                        </div>
                        <p className="text-[11px] text-muted-foreground max-w-sm">
                          Supports <strong>CSV, XLSX, XLS</strong>, and text-based <strong>PDFs</strong>. Files are processed via multipart upload up to 25MB.
                        </p>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-muted/40 p-2.5 rounded-lg">
                  <Info className="w-3.5 h-3.5 shrink-0 text-primary" />
                  <span>Column headers like Company, Full Name, Work Email, Phone, and City are automatically mapped.</span>
                </div>
              </div>
            )}

            {/* TAB 2: PASTED TEXT */}
            {activeTab === 'PASTED_TEXT' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Batch Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Copied from Google Sheets"
                    value={pastedSourceName}
                    onChange={(e) => setPastedSourceName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Paste Raw Data (TSV, CSV, or Contact Text)
                  </label>
                  <textarea
                    rows={8}
                    value={pastedText}
                    onChange={(e) => setPastedText(e.target.value)}
                    placeholder={`Company Name\tContact Name\tEmail\tPhone\nAcme Corp\tJohn Doe\tjoe@acme.com\t+15551234567\nNextGen Travel\tPriya M\tpriya@nextgen.in\t+919876543210`}
                    className="w-full p-3 font-mono text-xs rounded-lg border border-input bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Supports tab-separated rows copied straight from Excel / Google Sheets or line-by-line contact blocks.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: WEBSITE */}
            {activeTab === 'WEBSITE' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Public Website URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      placeholder="https://companyname.com"
                      value={url}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUrl(val);
                        if (!batchName) {
                          if (val.toLowerCase().includes('bharat-tex')) {
                            setBatchName('Bharat Tex 2026 Exhibitors');
                          } else {
                            try {
                              const u = new URL(val.startsWith('http') ? val : 'https://' + val);
                              const host = u.hostname.replace(/^www\./i, '');
                              setBatchName(`${host.charAt(0).toUpperCase() + host.slice(1)} Directory`);
                            } catch {}
                          }
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-input bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <Globe className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Research Batch Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Bharat Tex 2026 Exhibitors"
                    value={batchName}
                    onChange={(e) => setBatchName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Persistent container grouping all leads discovered during this research run.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Custom Source Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Pre-Fair Directory"
                    value={urlSourceName}
                    onChange={(e) => setUrlSourceName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-input bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="p-3.5 rounded-lg bg-muted/40 border border-border text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    SSRF Security Protected
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Internal loopbacks (127.0.0.1, localhost), private corporate subnets (10.x, 192.168.x, 172.16.x), and cloud metadata endpoints (169.254.x) are strictly blocked. Non-HTTP protocols (file://, javascript://) are prohibited.
                  </p>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-lg border border-border text-foreground hover:bg-muted/80 transition-colors"
              >
                {resultSummary ? 'Done' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 text-xs font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSubmitting ? 'Processing Pipeline...' : 'Start Ingestion'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
