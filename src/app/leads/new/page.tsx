"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { ArrowLeft, Save, Building2, User } from 'lucide-react';

export default function AddLeadPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    companyName: '',
    domain: '',
    industry: '',
    companySize: '',
    companyPhone: '',
    city: '',
    linkedinUrl: '',
    personalizedLine: '',
    personalizationTrigger: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await apiFetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        router.push('/leads');
      } else {
        alert('Failed to save contact');
        setLoading(false);
      }
    } catch (err) {
      console.error(err);
      alert('Error saving contact');
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
            <h1 className="font-heading text-2xl font-bold text-secondary">Add New Contact</h1>
            <p className="text-sm text-muted-foreground mt-1">Manually create a contact and organization</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-8">
          
          {/* Contact Details Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-secondary">Contact Details</h2>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">First Name</label>
                <input 
                  type="text" 
                  required
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Rahul"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Last Name</label>
                <input 
                  type="text"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Sharma"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Work Email <span className="text-red-500">*</span></label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="rahul@abc.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Job Title</label>
                <input 
                  type="text" 
                  value={formData.jobTitle}
                  onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="CFO"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">LinkedIn URL</label>
                <input 
                  type="url" 
                  value={formData.linkedinUrl}
                  onChange={e => setFormData({...formData, linkedinUrl: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="https://linkedin.com/in/..."
                />
              </div>
            </div>
          </div>

          {/* Organization Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border bg-muted/20 flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-secondary">Organization Details</h2>
            </div>
            
            <div className="p-6 grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Company Name</label>
                <input 
                  type="text" 
                  value={formData.companyName}
                  onChange={e => setFormData({...formData, companyName: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="ABC Technologies"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Website</label>
                <input 
                  type="text" 
                  value={formData.domain}
                  onChange={e => setFormData({...formData, domain: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="abc.com"
                />
                <p className="text-xs text-muted-foreground mt-1">Used to group contacts from the same company.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Industry</label>
                <select 
                  value={formData.industry}
                  onChange={e => setFormData({...formData, industry: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                >
                  <option value="">Select industry...</option>
                  <option value="IT Services">IT Services</option>
                  <option value="SaaS">SaaS</option>
                  <option value="Finance">Finance</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Retail">Retail</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Company Size</label>
                <select 
                  value={formData.companySize}
                  onChange={e => setFormData({...formData, companySize: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                >
                  <option value="">Select size...</option>
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">Company Phone</label>
                <input 
                  type="text" 
                  value={formData.companyPhone}
                  onChange={e => setFormData({...formData, companyPhone: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-secondary">City</label>
                <input 
                  type="text" 
                  value={formData.city}
                  onChange={e => setFormData({...formData, city: e.target.value})}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm"
                  placeholder="Bengaluru"
                />
              </div>
            </div>
            
            <div className="p-6 pt-0 border-t border-border mt-4">
              <div className="grid grid-cols-2 gap-6 mt-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">Personalized Icebreaker Line</label>
                  <textarea 
                    value={formData.personalizedLine}
                    onChange={e => setFormData({...formData, personalizedLine: e.target.value})}
                    className="w-full h-20 p-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm resize-none"
                    placeholder="e.g. Saw your recent post about sales outreach..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-secondary">Personalization Trigger Event</label>
                  <textarea 
                    value={formData.personalizationTrigger}
                    onChange={e => setFormData({...formData, personalizationTrigger: e.target.value})}
                    className="w-full h-20 p-3 rounded-md border border-input bg-background shadow-sm outline-none focus:ring-1 focus:ring-primary text-sm resize-none"
                    placeholder="e.g. Raised Series A funding recently..."
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-end gap-4 pt-4">
            <Link href="/leads" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={loading}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-6 gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
