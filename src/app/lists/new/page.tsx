"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, Save, Building2, Plus, Trash2 } from 'lucide-react';

export default function CreateListPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [listName, setListName] = useState('');
  const [description, setDescription] = useState('');
  const [listType, setListType] = useState<'static' | 'dynamic'>('static');
  
  // Dynamic Rules state
  const [rules, setRules] = useState({
    industry: '',
    city: '',
    jobTitle: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Clean up empty rules
    const cleanRules: any = {};
    if (rules.industry) cleanRules.industry = rules.industry;
    if (rules.city) cleanRules.city = rules.city;
    if (rules.jobTitle) cleanRules.jobTitle = rules.jobTitle;

    try {
      const res = await apiFetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: listName,
          description,
          listType,
          rules: listType === 'dynamic' ? cleanRules : undefined
        })
      });
      
      if (res.ok) {
        const list = await res.json();
        router.push(`/lists/${list.id}`);
      } else {
        alert('Failed to create list');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating list');
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col w-full bg-[#fafafa]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-8 py-6 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/leads" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="font-heading text-2xl font-bold text-secondary">Create Audience List</h1>
            <p className="text-sm text-muted-foreground mt-1">Organize contacts into targeted campaign audiences</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden p-6 space-y-6">
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">List Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={listName}
                  onChange={e => setListName(e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="e.g. Q3 Bengaluru IT Founders"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Description</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full p-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm min-h-[80px] resize-none"
                  placeholder="Optional context about this audience..."
                />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-border">
              <label className="text-sm font-medium text-secondary">List Type</label>
              
              <div className="grid grid-cols-2 gap-4">
                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${listType === 'static' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'}`}
                  onClick={() => setListType('static')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${listType === 'static' ? 'border-primary' : 'border-muted-foreground'}`}>
                      {listType === 'static' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="font-semibold text-secondary">Static List</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">Manually add and remove contacts via imports or selection.</p>
                </div>

                <div 
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${listType === 'dynamic' ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/50'}`}
                  onClick={() => setListType('dynamic')}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${listType === 'dynamic' ? 'border-primary' : 'border-muted-foreground'}`}>
                      {listType === 'dynamic' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <span className="font-semibold text-secondary">Dynamic Segment</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">Automatically enroll contacts that match specific data rules.</p>
                </div>
              </div>
            </div>

            {/* Dynamic Rule Builder */}
            {listType === 'dynamic' && (
              <div className="mt-6 pt-6 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-bold text-secondary uppercase tracking-wider">Enrollment Rules</h3>
                </div>
                
                <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-4">
                    <div className="w-1/3">
                      <label className="text-xs font-medium text-muted-foreground">Industry Contains</label>
                      <input 
                        type="text" 
                        value={rules.industry}
                        onChange={e => setRules({...rules, industry: e.target.value})}
                        className="w-full h-9 px-3 mt-1 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                        placeholder="e.g. IT Services"
                      />
                    </div>
                    
                    <div className="font-bold text-xs text-muted-foreground mt-5">AND</div>
                    
                    <div className="w-1/3">
                      <label className="text-xs font-medium text-muted-foreground">City Equals</label>
                      <input 
                        type="text" 
                        value={rules.city}
                        onChange={e => setRules({...rules, city: e.target.value})}
                        className="w-full h-9 px-3 mt-1 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                        placeholder="e.g. Bengaluru"
                      />
                    </div>

                    <div className="font-bold text-xs text-muted-foreground mt-5">AND</div>
                    
                    <div className="w-1/3">
                      <label className="text-xs font-medium text-muted-foreground">Job Title Contains</label>
                      <input 
                        type="text" 
                        value={rules.jobTitle}
                        onChange={e => setRules({...rules, jobTitle: e.target.value})}
                        className="w-full h-9 px-3 mt-1 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                        placeholder="e.g. Founder"
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground italic">
                    Note: Leave a field blank to ignore that filter.
                  </div>
                </div>
              </div>
            )}
            
          </div>
          
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link href="/leads" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={loading || !listName}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Audience'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
