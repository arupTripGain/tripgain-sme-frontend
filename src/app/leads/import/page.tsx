"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import Papa from 'papaparse';
import { ArrowLeft, UploadCloud, CheckCircle2, AlertCircle, Play, FileSpreadsheet, List as ListIcon, Database } from 'lucide-react';

const SYSTEM_FIELDS = [
  { key: 'firstName', label: 'First Name', required: false },
  { key: 'lastName', label: 'Last Name', required: false },
  { key: 'email', label: 'Work Email', required: true },
  { key: 'jobTitle', label: 'Job Title', required: false },
  { key: 'companyName', label: 'Company Name', required: false },
  { key: 'domain', label: 'Website', required: false },
  { key: 'industry', label: 'Industry', required: false },
  { key: 'companySize', label: 'Company Size (Employees)', required: false },
  { key: 'companyPhone', label: 'Company Phone', required: false },
  { key: 'linkedinUrl', label: 'LinkedIn URL', required: false },
  { key: 'city', label: 'City', required: false },
  { key: 'personalizedLine', label: 'Custom Icebreaker', required: false },
  { key: 'personalizationTrigger', label: 'Personalization Trigger', required: false }
];

export default function ImportCSVPage() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  
  // PapaParse results
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  
  // Mappings: systemFieldKey -> csvHeader
  const [mappings, setMappings] = useState<Record<string, string>>({});
  
  // List details
  const [lists, setLists] = useState<any[]>([]);
  const [listMode, setListMode] = useState<'existing' | 'new'>('new');
  const [selectedListId, setSelectedListId] = useState('');
  const [newListName, setNewListName] = useState('');
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [report, setReport] = useState<any>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch('/api/lists')
      .then(res => res.json())
      .then(data => setLists(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    
    setFile(uploadedFile);
    
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvHeaders(results.meta.fields || []);
        setCsvData(results.data);
        
        // Auto-mapping heuristics
        const initialMap: Record<string, string> = {};
        const headersLower = (results.meta.fields || []).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
        
        SYSTEM_FIELDS.forEach(sys => {
          const sysLower = sys.key.toLowerCase();
          const matchIndex = headersLower.findIndex(h => h.includes(sysLower) || sysLower.includes(h) || (sysLower === 'email' && h.includes('mail')));
          if (matchIndex >= 0) {
            initialMap[sys.key] = (results.meta.fields || [])[matchIndex];
          }
        });
        
        setMappings(initialMap);
        setStep(2);
      }
    });
  };

  const handleImport = async () => {
    setIsImporting(true);
    
    // Transform CSV data to mapped JSON
    const payloadContacts = csvData.map(row => {
      const contact: any = {};
      Object.entries(mappings).forEach(([sysKey, csvHeader]) => {
        if (csvHeader) {
          contact[sysKey] = row[csvHeader];
        }
      });
      return contact;
    });

    try {
      const res = await apiFetch('/api/contacts/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contacts: payloadContacts,
          listId: listMode === 'existing' ? selectedListId : undefined,
          newListName: listMode === 'new' ? newListName : undefined
        })
      });
      
      const stats = await res.json();
      setReport(stats);
      setStep(5);
    } catch (err) {
      console.error(err);
      alert('Failed to import contacts.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa]">
      
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-secondary">CSV Import Wizard</h1>
            <p className="text-sm text-muted-foreground mt-1">Bulk upload and map your contacts</p>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* Stepper UI */}
          <div className="flex items-center justify-between px-4 pb-8 border-b border-border mb-8">
            {['Upload CSV', 'Map Columns', 'Preview', 'Select List', 'Result'].map((label, index) => (
              <div key={label} className={`flex items-center gap-3 ${step > index + 1 ? 'text-primary' : step === index + 1 ? 'text-secondary font-bold' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 ${step > index + 1 ? 'bg-primary border-primary text-primary-foreground' : step === index + 1 ? 'border-primary text-primary' : 'border-border'}`}>
                  {step > index + 1 ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                </div>
                <span className="text-sm hidden sm:block">{label}</span>
                {index < 4 && <div className={`w-12 h-px bg-border hidden md:block mx-4 ${step > index + 1 ? 'bg-primary' : ''}`}></div>}
              </div>
            ))}
          </div>

          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div 
              className="border-2 border-dashed border-border rounded-xl bg-card hover:bg-muted/10 transition-colors cursor-pointer flex flex-col items-center justify-center py-32 px-12 text-center"
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-6">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-secondary mb-2">Click or drag CSV to upload</h3>
              <p className="text-muted-foreground">Upload your CSV file containing contact details. Max size 10MB.</p>
            </div>
          )}

          {/* STEP 2: MAPPING */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-secondary">Map CSV Columns to System Fields</h3>
                </div>
                <div className="p-6 space-y-4">
                  {SYSTEM_FIELDS.map(sys => (
                    <div key={sys.key} className="flex items-center gap-6 p-4 rounded-lg border border-border bg-background">
                      <div className="w-1/3">
                        <span className="font-medium text-sm text-secondary">{sys.label}</span>
                        {sys.required && <span className="text-red-500 ml-1">*</span>}
                      </div>
                      <div className="w-8 flex justify-center text-muted-foreground">→</div>
                      <div className="w-2/3">
                        <select 
                          className="w-full h-10 px-3 rounded-md border border-input text-sm focus:ring-1 focus:ring-primary outline-none"
                          value={mappings[sys.key] || ''}
                          onChange={(e) => setMappings({...mappings, [sys.key]: e.target.value})}
                        >
                          <option value="">-- Ignore --</option>
                          {csvHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button onClick={() => setStep(1)} className="px-6 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors">Back</button>
                <button 
                  onClick={() => setStep(3)} 
                  disabled={!mappings['email']}
                  className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-secondary">Data Preview (First 3 rows)</h3>
                  </div>
                  <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">{csvData.length} total rows detected</span>
                </div>
                <div className="overflow-x-auto p-6">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground">
                        {SYSTEM_FIELDS.filter(f => mappings[f.key]).map(f => (
                          <th key={f.key} className="pb-3 px-4 font-medium">{f.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvData.slice(0, 3).map((row, i) => (
                        <tr key={i} className="border-b border-border last:border-0">
                          {SYSTEM_FIELDS.filter(f => mappings[f.key]).map(f => (
                            <td key={f.key} className="py-3 px-4 text-secondary">{row[mappings[f.key]] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button onClick={() => setStep(2)} className="px-6 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors">Back</button>
                <button onClick={() => setStep(4)} className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Continue to List</button>
              </div>
            </div>
          )}

          {/* STEP 4: LIST SELECTION */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-muted/30 px-6 py-4 border-b border-border flex items-center gap-2">
                  <ListIcon className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-secondary">Target Audience List</h3>
                </div>
                <div className="p-8 max-w-md mx-auto space-y-8 text-center">
                  
                  <div className="flex bg-muted p-1 rounded-lg">
                    <button 
                      onClick={() => setListMode('new')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${listMode === 'new' ? 'bg-card shadow text-primary' : 'text-muted-foreground'}`}
                    >Create New List</button>
                    <button 
                      onClick={() => setListMode('existing')}
                      className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${listMode === 'existing' ? 'bg-card shadow text-primary' : 'text-muted-foreground'}`}
                    >Existing List</button>
                  </div>

                  {listMode === 'new' ? (
                    <div className="space-y-2 text-left">
                      <label className="text-sm font-medium text-secondary">List Name</label>
                      <input 
                        type="text" 
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        placeholder="e.g. Q3 SaaS CFOs"
                        className="w-full h-11 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2 text-left">
                      <label className="text-sm font-medium text-secondary">Select List</label>
                      <select 
                        value={selectedListId}
                        onChange={e => setSelectedListId(e.target.value)}
                        className="w-full h-11 px-3 rounded-md border border-input focus:ring-1 focus:ring-primary outline-none"
                      >
                        <option value="">-- Choose a list --</option>
                        {lists.filter(l => l.type !== 'system').map(l => (
                          <option key={l.id} value={l.id}>{l.name} ({l.contacts} contacts)</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end gap-4">
                <button onClick={() => setStep(3)} className="px-6 py-2 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors" disabled={isImporting}>Back</button>
                <button 
                  onClick={handleImport} 
                  disabled={isImporting || (listMode === 'new' ? !newListName : !selectedListId)}
                  className="px-6 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isImporting ? 'Processing...' : <><Play className="w-4 h-4 fill-current" /> Start Import</>}
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: REPORT */}
          {step === 5 && report && (
            <div className="space-y-6">
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="bg-green-500/10 px-6 py-8 border-b border-border flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white mb-4 shadow-lg shadow-green-500/20">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold text-green-700">Import Complete!</h2>
                  <p className="text-green-600 mt-2">Successfully processed {report.total} rows from your CSV.</p>
                </div>
                
                <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="bg-background rounded-lg border border-border p-4 text-center">
                    <div className="text-3xl font-bold text-secondary mb-1">{report.new}</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">New Contacts</div>
                  </div>
                  <div className="bg-background rounded-lg border border-border p-4 text-center">
                    <div className="text-3xl font-bold text-blue-500 mb-1">{report.updated}</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Updated / Added</div>
                  </div>
                  <div className="bg-background rounded-lg border border-border p-4 text-center">
                    <div className="text-3xl font-bold text-amber-500 mb-1">{report.duplicates}</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Duplicates Skipped</div>
                  </div>
                  <div className="bg-background rounded-lg border border-border p-4 text-center">
                    <div className="text-3xl font-bold text-red-500 mb-1">{report.invalid}</div>
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Invalid Rows</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center pt-4">
                <Link href="/leads" className="px-8 py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm">
                  View Leads Dashboard
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
