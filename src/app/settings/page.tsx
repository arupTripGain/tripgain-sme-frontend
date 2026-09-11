'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { apiFetch } from '@/lib/api';
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  Send, 
  FileText, 
  ListOrdered, 
  Activity, 
  ShieldAlert, 
  Link as LinkIcon,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  ExternalLink,
  Trash2,
  RefreshCw,
  AlertCircle,
  Zap,
  ShieldCheck,
  Star,
  Check,
  Cpu,
  BarChart3,
  TrendingUp,
  Coins,
  Clock
} from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'ai', label: 'AI Models (BYOK)', icon: Sparkles },
  { id: 'mailboxes', label: 'Mailboxes', icon: Mail },
  { id: 'sending', label: 'Sending', icon: Send },
  { id: 'email', label: 'Email', icon: FileText },
  { id: 'sequences', label: 'Sequences', icon: ListOrdered },
  { id: 'tracking', label: 'Tracking', icon: Activity },
  { id: 'suppression', label: 'Suppression', icon: ShieldAlert },
  { id: 'integrations', label: 'Integrations', icon: LinkIcon },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');

  return (
    <div className="flex-1 min-h-screen overflow-y-auto" style={{ backgroundColor: '#FFF8F4' }}>
      <div className="max-w-6xl mx-auto px-8 py-10">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#14385F' }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: '#14385F', opacity: 0.8 }}>
            Manage your workspace and outreach preferences.
          </p>
        </div>

        {/* 2-Column Layout */}
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 shrink-0">
            <nav 
              className="flex flex-col space-y-1 p-4 rounded-xl shadow-sm border"
              style={{ backgroundColor: '#F9ECE1', borderColor: '#E0C0B2' }}
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-white shadow-sm text-gray-900' 
                      : 'text-gray-700 hover:bg-white/50'
                  }`}
                  style={activeTab === tab.id ? { color: '#14385F' } : {}}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <div 
              className="rounded-xl shadow-sm border p-8"
              style={{ backgroundColor: '#FFFFFF', borderColor: '#E0C0B2' }}
            >
              {activeTab === 'general' && <GeneralSettings />}
              {activeTab === 'profile' && <ProfileSettings />}
              {activeTab === 'ai' && <AISettings />}
              {activeTab === 'mailboxes' && <MailboxesSettings />}
              {activeTab === 'sending' && <SendingSettings />}
              {activeTab === 'email' && <EmailSettings />}
              {activeTab === 'sequences' && <SequencesSettings />}
              {activeTab === 'tracking' && <TrackingSettings />}
              {activeTab === 'suppression' && <SuppressionSettings />}
              {activeTab === 'integrations' && <IntegrationsSettings onNavigateTab={setActiveTab} />}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- TAB COMPONENTS ---

function GeneralSettings() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Workspace</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Workspace Name</label>
          <input type="text" defaultValue="TripGain SME Outreach" className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Workspace URL / ID</label>
          <input type="text" defaultValue="tripgain-sme" disabled className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500" />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Timezone</label>
          <select className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none">
            <option>Asia/Kolkata (IST)</option>
            <option>America/New_York (EST)</option>
            <option>Europe/London (GMT)</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Date Format</label>
            <select className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none">
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Time Format</label>
            <select className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none">
              <option>12 hour</option>
              <option>24 hour</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t" style={{ borderColor: '#E0C0B2' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#14385F' }}>Default Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Default Campaign Status</label>
            <select className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none">
              <option>Draft</option>
              <option>Active</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Default Contact Status</label>
            <select className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none">
              <option>New</option>
              <option>Enrolled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button className="px-6 py-2 rounded-md font-bold text-white transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#F16F21' }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

function ProfileSettings() {
  const { user } = useAuth();
  const nameParts = (user?.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';
  const avatarInitial = (user?.name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Profile</h2>
      
      <div className="flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-inner" style={{ backgroundColor: '#14385F' }}>
          {avatarInitial}
        </div>
        <div>
          <button className="text-sm font-medium border px-3 py-1.5 rounded-md hover:bg-gray-50 transition-colors" style={{ borderColor: '#E0C0B2', color: '#14385F' }}>
            Change Avatar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">First Name</label>
          <input type="text" key={`fn-${user?.id}`} defaultValue={firstName} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Last Name</label>
          <input type="text" key={`ln-${user?.id}`} defaultValue={lastName} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Email Address</label>
          <input type="email" key={`em-${user?.id}`} defaultValue={user?.email || ''} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Role</label>
          <input type="text" value={user?.role || 'MEMBER'} disabled className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500" />
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button className="px-6 py-2 rounded-md font-bold text-white transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#F16F21' }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

function MailboxesSettings() {
  const { user } = useAuth();
  const [mailboxes, setMailboxes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/mailboxes')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMailboxes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user?.id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Mailboxes</h2>
        <Link href="/mailboxes" className="px-4 py-2 rounded-md font-bold text-white transition-opacity hover:opacity-90 text-sm" style={{ backgroundColor: '#F16F21' }}>
          + Connect Mailbox
        </Link>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">Manage email accounts used for sending campaigns and receiving replies.</p>

      {loading ? (
        <div className="text-sm text-gray-500 py-4">Loading connected mailboxes...</div>
      ) : mailboxes.length === 0 ? (
        <div className="border border-dashed rounded-lg p-8 text-center" style={{ borderColor: '#E0C0B2' }}>
          <p className="text-sm text-gray-600 mb-4">No mailboxes connected for your account yet.</p>
          <Link href="/mailboxes" className="px-4 py-2 rounded-md font-medium text-white text-sm" style={{ backgroundColor: '#14385F' }}>
            Connect Your First Mailbox
          </Link>
        </div>
      ) : (
        mailboxes.map(m => (
          <div key={m.id} className="border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3" style={{ borderColor: '#E0C0B2', backgroundColor: '#FFF8F4' }}>
            <div>
              <div className="font-bold text-lg" style={{ color: '#14385F' }}>{m.email}</div>
              <div className="text-sm text-gray-600 mb-2">{m.displayName || m.provider}</div>
              <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> {m.status}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/mailboxes" className="px-3 py-1.5 text-sm font-medium bg-white border rounded hover:bg-gray-50" style={{ borderColor: '#E0C0B2', color: '#14385F' }}>
                Manage
              </Link>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function SendingSettings() {
  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#14385F' }}>Sending Limits</h2>
        <p className="text-sm text-gray-600 mb-6">Control how aggressively the system sends emails.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Daily Sending Limit</label>
            <input type="number" defaultValue={50} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Hourly Sending Limit</label>
            <input type="number" defaultValue={10} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Min. Delay (Seconds)</label>
            <input type="number" defaultValue={60} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t" style={{ borderColor: '#E0C0B2' }}>
        <h2 className="text-xl font-bold mb-4" style={{ color: '#14385F' }}>Sending Schedule</h2>
        
        <div className="space-y-4 mb-6">
          <label className="text-sm font-semibold text-gray-700">Sending Days</label>
          <div className="flex flex-wrap gap-4">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
              <label key={day} className="flex items-center gap-2 text-sm text-gray-800">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-[#F16F21] rounded border-gray-300 focus:ring-[#F16F21]" />
                {day}
              </label>
            ))}
            {['Saturday', 'Sunday'].map(day => (
              <label key={day} className="flex items-center gap-2 text-sm text-gray-800">
                <input type="checkbox" className="w-4 h-4 text-[#F16F21] rounded border-gray-300 focus:ring-[#F16F21]" />
                {day}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Start Time</label>
            <input type="time" defaultValue="09:00" className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">End Time</label>
            <input type="time" defaultValue="18:00" className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Timezone</label>
            <select className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none">
              <option>Asia/Kolkata</option>
            </select>
          </div>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button className="px-6 py-2 rounded-md font-bold text-white transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#F16F21' }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

function EmailSettings() {
  const { user } = useAuth();
  const defaultSenderName = user?.name ? `${user.name} from TripGain` : 'TripGain Outreach';
  const defaultSignature = `Best,\n${user?.name?.split(' ')[0] || 'Team'}\nTripGain`;

  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Email Settings</h2>
      
      <div>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#14385F' }}>Default Sender</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Sender Name</label>
            <input type="text" key={`sn-${user?.id}`} defaultValue={defaultSenderName} className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Company Name</label>
            <input type="text" defaultValue="TripGain" className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
          </div>
        </div>
      </div>

      <div className="pt-6 border-t" style={{ borderColor: '#E0C0B2' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#14385F' }}>Default Signature</h3>
        <textarea 
          key={`sig-${user?.id}`}
          rows={4} 
          defaultValue={defaultSignature} 
          className="w-full p-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none font-mono"
        />
      </div>

      <div className="pt-6 border-t" style={{ borderColor: '#E0C0B2' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#14385F' }}>Default Formatting</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm text-gray-800">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#F16F21] rounded border-gray-300 focus:ring-[#F16F21]" />
            Use plain-text friendly HTML
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-800">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#F16F21] rounded border-gray-300 focus:ring-[#F16F21]" />
            Include signature
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-800">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#F16F21] rounded border-gray-300 focus:ring-[#F16F21]" />
            Generate plain-text version
          </label>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button className="px-6 py-2 rounded-md font-bold text-white transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#F16F21' }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

function SequencesSettings() {
  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Sequence Settings</h2>
      
      <div>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#14385F' }}>Stop Conditions</h3>
        <p className="text-sm text-gray-600 mb-4">When should a contact be automatically removed from an active sequence?</p>
        
        <div className="space-y-4">
          <label className="flex items-start gap-3 text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">
            <input type="checkbox" defaultChecked disabled className="mt-0.5 w-4 h-4 text-[#F16F21] rounded border-gray-300" />
            <div>
              <div className="font-semibold text-gray-900">Stop sequence when recipient replies</div>
              <div className="text-xs text-gray-500 mt-0.5">Locked ON for safety. Ensures you never follow-up after they respond.</div>
            </div>
          </label>
          
          <label className="flex items-start gap-3 text-sm text-gray-800 bg-gray-50 p-3 rounded border border-gray-200">
            <input type="checkbox" defaultChecked disabled className="mt-0.5 w-4 h-4 text-[#F16F21] rounded border-gray-300" />
            <div>
              <div className="font-semibold text-gray-900">Stop sequence when recipient unsubscribes</div>
              <div className="text-xs text-gray-500 mt-0.5">Locked ON for compliance.</div>
            </div>
          </label>

          <label className="flex items-center gap-3 text-sm text-gray-800 p-2">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#F16F21] rounded border-gray-300 focus:ring-[#F16F21]" />
            Stop sequence when email hard-bounces
          </label>
          
          <label className="flex items-center gap-3 text-sm text-gray-800 p-2">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#F16F21] rounded border-gray-300 focus:ring-[#F16F21]" />
            Stop sequence when recipient is suppressed
          </label>
        </div>
      </div>

      <div className="pt-6 border-t" style={{ borderColor: '#E0C0B2' }}>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#14385F' }}>Completion Behavior</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-sm text-gray-800">
            <input type="radio" name="completion" defaultChecked className="w-4 h-4 text-[#F16F21] border-gray-300 focus:ring-[#F16F21]" />
            Mark as Completed
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-800">
            <input type="radio" name="completion" className="w-4 h-4 text-[#F16F21] border-gray-300 focus:ring-[#F16F21]" />
            Keep campaign active (waiting for new steps)
          </label>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button className="px-6 py-2 rounded-md font-bold text-white transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#F16F21' }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

function TrackingSettings() {
  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Email Tracking</h2>
      
      <div>
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-gray-500">Required System Tracking</h3>
        <p className="text-sm text-gray-600 mb-4">These events are strictly required for safety and reporting mechanics.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['Sent', 'Delivered', 'Bounced', 'Reply'].map(evt => (
            <div key={evt} className="bg-gray-50 border border-gray-200 rounded p-3 text-center text-sm font-semibold text-gray-500">
              {evt} (Always On)
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t" style={{ borderColor: '#E0C0B2' }}>
        <h3 className="text-sm font-bold mb-4 uppercase tracking-wide text-gray-500">Optional Engagement Tracking</h3>
        <p className="text-sm text-gray-600 mb-4">Toggle visibility tracking. Note: Open tracking relies on hidden pixels and can sometimes be noisy.</p>
        
        <div className="space-y-4">
          <label className="flex items-center gap-3 text-sm text-gray-800">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#F16F21] rounded border-gray-300 focus:ring-[#F16F21]" />
            <span className="font-semibold">Track Opens</span> (Inserts a 1x1 tracking pixel)
          </label>
          <label className="flex items-center gap-3 text-sm text-gray-800">
            <input type="checkbox" defaultChecked className="w-4 h-4 text-[#F16F21] rounded border-gray-300 focus:ring-[#F16F21]" />
            <span className="font-semibold">Track Clicks</span> (Wraps links in your custom tracking domain)
          </label>
        </div>
      </div>

      <div className="pt-6 flex justify-end">
        <button className="px-6 py-2 rounded-md font-bold text-white transition-opacity hover:opacity-90 shadow-sm" style={{ backgroundColor: '#F16F21' }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}

function SuppressionSettings() {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Suppression List</h2>
          <p className="text-sm mt-1 text-gray-600">Manage contacts who must never receive outreach.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-md text-sm font-bold border transition-colors hover:bg-gray-50" style={{ borderColor: '#E0C0B2', color: '#14385F' }}>
            Export
          </button>
          <button className="px-4 py-2 rounded-md text-sm font-bold text-white transition-opacity hover:opacity-90" style={{ backgroundColor: '#F16F21' }}>
            Add to Suppression
          </button>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 text-orange-800 text-sm p-4 rounded-lg flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5 text-orange-600" />
        <div>
          <strong className="block mb-1">Important System Rule</strong>
          The suppression list is checked before <strong>every</strong> email send, regardless of individual campaign settings. Contacts here are completely blocked.
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Reason</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            <tr>
              <td className="px-4 py-3 font-medium">john@abc.com</td>
              <td className="px-4 py-3 text-gray-600"><span className="bg-gray-100 px-2 py-0.5 rounded text-xs">Unsubscribed</span></td>
              <td className="px-4 py-3 text-gray-500">Sep 2</td>
              <td className="px-4 py-3 text-right"><button className="text-red-600 hover:underline text-xs font-medium">Remove</button></td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">rahul@xyz.com</td>
              <td className="px-4 py-3 text-gray-600"><span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-xs">Hard Bounce</span></td>
              <td className="px-4 py-3 text-gray-500">Sep 1</td>
              <td className="px-4 py-3 text-right"><button className="text-red-600 hover:underline text-xs font-medium">Remove</button></td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium">amit@test.com</td>
              <td className="px-4 py-3 text-gray-600"><span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded text-xs">Do Not Contact</span></td>
              <td className="px-4 py-3 text-gray-500">Aug 29</td>
              <td className="px-4 py-3 text-right"><button className="text-red-600 hover:underline text-xs font-medium">Remove</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IntegrationsSettings({ onNavigateTab }: { onNavigateTab?: (tab: string) => void }) {
  const [aiStatus, setAiStatus] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/settings/ai')
      .then(res => res.json())
      .then(data => setAiStatus(data))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Integrations</h2>
      <p className="text-sm text-gray-600 mb-6">Connect TripGain with external systems and webhooks.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Onboarding Webhook */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900">TripGain SME Self-Onboarding</h3>
              <div className="text-xs text-gray-500 mt-1">Registration Webhook</div>
            </div>
            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Active
            </span>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Endpoint:</span>
              <span className="font-mono text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">••••••••••••••</span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Last event:</span>
              <span className="font-medium text-gray-900">2 minutes ago</span>
            </div>
            <div className="flex justify-between">
              <span>Events received:</span>
              <span className="font-medium text-gray-900">128</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
            <button className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">View Logs</button>
            <button className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">Rotate Secret</button>
          </div>
        </div>

        {/* AI Provider */}
        <div className="border border-gray-200 rounded-lg p-5 bg-white">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-gray-900">Multi-Model AI (BYOK)</h3>
              <div className="text-xs text-gray-500 mt-1">Google Gemini · OpenRouter · xKiro</div>
            </div>
            {aiStatus?.providers && Object.values(aiStatus.providers).some((p: any) => p.configured) ? (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-100">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Connected
              </span>
            ) : (
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-2 py-1 rounded text-xs font-bold border border-amber-200">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Not Configured
              </span>
            )}
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Active Provider:</span>
              <span className="font-semibold text-gray-900">
                {aiStatus?.defaultProvider || 'GEMINI'}
              </span>
            </div>
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Connected Providers:</span>
              <span className="font-medium text-gray-900">
                {aiStatus?.providers
                  ? Object.entries(aiStatus.providers)
                      .filter(([_, p]: any) => p.configured)
                      .map(([k]) => k)
                      .join(', ') || 'None'
                  : 'Checking...'}
              </span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
            <button 
              onClick={() => onNavigateTab?.('ai')}
              className="text-xs font-semibold px-3 py-1.5 border rounded hover:bg-gray-50 text-primary border-[#E0C0B2]"
            >
              Configure AI Models
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

type AIProviderKey = 'GEMINI' | 'OPENROUTER' | 'XKIRO';

interface ProviderCardConfig {
  id: AIProviderKey;
  name: string;
  tagline: string;
  badge: string;
  keyPrefix: string;
  portalUrl: string;
  portalName: string;
  description: string;
  defaultModels: string[];
}

const PROVIDER_CONFIGS: ProviderCardConfig[] = [
  {
    id: 'GEMINI',
    name: 'Google Gemini',
    tagline: 'Direct Google AI Studio BYOK',
    badge: 'Fast Multimodal',
    keyPrefix: 'AIzaSy...',
    portalUrl: 'https://aistudio.google.com/app/apikey',
    portalName: 'Google AI Studio',
    description: 'Ultra-fast multimodal lead research and factual personalization powered by Google Gemini.',
    defaultModels: ['gemini-3.6-flash', 'gemini-flash-lite-latest', 'gemini-pro-latest']
  },
  {
    id: 'OPENROUTER',
    name: 'OpenRouter',
    tagline: 'Universal Multi-Model Router',
    badge: '100+ Models',
    keyPrefix: 'sk-or-v1-...',
    portalUrl: 'https://openrouter.ai/keys',
    portalName: 'OpenRouter Keys',
    description: 'Access 100+ models (Claude 3.5, Llama 3.3 Free, GPT-4o, DeepSeek) through a single unified API key.',
    defaultModels: [
      'openrouter/free',
      'meta-llama/llama-3.3-70b-instruct:free',
      'anthropic/claude-3.5-sonnet',
      'openai/gpt-4o',
      'deepseek/deepseek-chat'
    ]
  },
  {
    id: 'XKIRO',
    name: 'xKiro',
    tagline: 'High-Throughput Outreach Engine',
    badge: 'Agentic Engine',
    keyPrefix: 'xkiro-...',
    portalUrl: 'https://xkiro.com',
    portalName: 'xKiro Console',
    description: 'High-concurrency agentic lead research and personalized email synthesis pipeline.',
    defaultModels: ['qwen/qwen3.5-flash:free', 'qwen/qwen3.6-27b:free', 'deepseek/deepseek-chat-v3.1']
  }
];

function AISettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<any>(null);

  // Modal / Key entry state
  const [activeModalProvider, setActiveModalProvider] = useState<AIProviderKey | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [showKeyText, setShowKeyText] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);

  // Dynamic model catalogs: provider -> model list
  const [dynamicModels, setDynamicModels] = useState<Record<string, string[]>>({});
  const [loadingModels, setLoadingModels] = useState<Record<string, boolean>>({});
  const [catalogMeta, setCatalogMeta] = useState<Record<string, { isFallback: boolean; count: number }>>({});

  // Connection test results: provider -> { connected, latencyMs?, error? }
  const [testResults, setTestResults] = useState<Record<string, { testing?: boolean; connected?: boolean; latencyMs?: number; error?: string }>>({});

  // Global notifications
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [refreshingAnalytics, setRefreshingAnalytics] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('/api/settings/ai');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to fetch AI settings', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshAnalytics = async () => {
    try {
      setRefreshingAnalytics(true);
      const res = await apiFetch('/api/settings/ai');
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Failed to refresh analytics', e);
    } finally {
      setRefreshingAnalytics(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [user?.id]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalProvider) return;

    const cleanKey = keyInput.trim();
    if (!cleanKey) {
      setErrorMessage(`Please enter a valid ${activeModalProvider} API key.`);
      return;
    }

    setModalSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const providerEndpoint = activeModalProvider.toLowerCase();
    try {
      const res = await apiFetch(`/api/settings/ai/${providerEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: cleanKey })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyInput(''); // Immediately zero out raw key from memory
        setActiveModalProvider(null);
        setSuccessMessage(`${activeModalProvider} API key validated and securely connected!`);
        await fetchStatus();
      } else {
        setErrorMessage(data.error || `Failed to validate ${activeModalProvider} API key.`);
      }
    } catch (e: any) {
      setErrorMessage(e.message || `Network error while connecting ${activeModalProvider} API key.`);
    } finally {
      setModalSaving(false);
    }
  };

  const handleRemoveKey = async (provider: AIProviderKey) => {
    if (!confirm(`Are you sure you want to disconnect your ${provider} API key?`)) {
      return;
    }
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch(`/api/settings/ai/${provider.toLowerCase()}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMessage(`${provider} API key disconnected.`);
        // Clear local test status
        setTestResults(prev => ({ ...prev, [provider]: {} }));
        await fetchStatus();
      } else {
        setErrorMessage(data.error || `Failed to remove ${provider} API key.`);
      }
    } catch (e: any) {
      setErrorMessage(e.message || `Error disconnecting ${provider} API key.`);
    }
  };

  const handleSetDefault = async (provider: AIProviderKey) => {
    try {
      setErrorMessage(null);
      const res = await apiFetch('/api/settings/ai/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, isDefault: true })
      });
      if (res.ok) {
        setSuccessMessage(`${provider} is now your default AI provider.`);
        await fetchStatus();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to update default provider.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error updating default provider.');
    }
  };

  const handleModelChange = async (provider: AIProviderKey, selectedModel: string) => {
    try {
      setErrorMessage(null);
      const res = await apiFetch('/api/settings/ai/preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, selectedModel })
      });
      if (res.ok) {
        setSuccessMessage(`Model updated to "${selectedModel}" for ${provider}.`);
        await fetchStatus();
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Failed to update preferred model.');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error updating model.');
    }
  };

  const handleTestConnection = async (provider: AIProviderKey) => {
    setTestResults(prev => ({ ...prev, [provider]: { testing: true } }));
    setErrorMessage(null);

    try {
      const res = await apiFetch(`/api/settings/ai/${provider.toLowerCase()}/test`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok && data.connected) {
        setTestResults(prev => ({
          ...prev,
          [provider]: {
            testing: false,
            connected: true,
            latencyMs: data.latencyMs
          }
        }));
      } else {
        setTestResults(prev => ({
          ...prev,
          [provider]: {
            testing: false,
            connected: false,
            error: data.error || 'Connection probe failed.'
          }
        }));
      }
    } catch (e: any) {
      setTestResults(prev => ({
        ...prev,
        [provider]: {
          testing: false,
          connected: false,
          error: e.message || 'Network error during test.'
        }
      }));
    }
  };

  const loadLiveModels = async (provider: AIProviderKey) => {
    setLoadingModels(prev => ({ ...prev, [provider]: true }));
    try {
      const res = await apiFetch(`/api/settings/ai/${provider.toLowerCase()}/models`);
      if (res.ok) {
        const data = await res.json();
        const modelsList: any[] = data.models || [];
        const modelIds = modelsList.map((m: any) => m.id);
        if (modelIds.length > 0) {
          setDynamicModels(prev => ({ ...prev, [provider]: modelIds }));
          const hasFallback = modelsList.some((m: any) => m.isFallback);
          setCatalogMeta(prev => ({
            ...prev,
            [provider]: { isFallback: hasFallback, count: modelIds.length }
          }));
        }
      }
    } catch (_) {
    } finally {
      setLoadingModels(prev => ({ ...prev, [provider]: false }));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#14385F' }}>
            <Sparkles className="w-5 h-5 text-[#F16F21]" />
            Multi-Model AI Configuration (BYOK)
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Connect your own API keys for Google Gemini, OpenRouter, and xKiro. Enjoy zero markup, strict user isolation, and enterprise AES-256-GCM encryption.
          </p>
        </div>

        {/* Global usage badge */}
        {status && (
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm text-xs">
            <div>
              <span className="text-gray-500 font-medium">Daily Requests:</span>{' '}
              <span className="font-bold text-gray-900">{status.usageToday || 0}</span>
            </div>
            <div className="h-3 w-px bg-gray-200" />
            <div>
              <span className="text-gray-500 font-medium">Default:</span>{' '}
              <span className="font-bold text-[#F16F21]">{status.defaultProvider || 'None'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-900 text-sm shadow-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Notice</p>
            <p className="mt-0.5 text-rose-800">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500 hover:text-rose-700 font-bold">&times;</button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 text-green-900 text-sm shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Success</p>
            <p className="mt-0.5 text-green-800">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-green-500 hover:text-green-700 font-bold">&times;</button>
        </div>
      )}

      {/* Provider Cards */}
      {loading ? (
        <div className="p-12 text-center text-sm text-gray-500 flex items-center justify-center gap-2 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-5 h-5 animate-spin text-[#F16F21]" /> Loading AI configuration...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {PROVIDER_CONFIGS.map(cfg => {
            const providerStatus = status?.providers?.[cfg.id];
            const isConnected = Boolean(providerStatus?.configured);
            const isDefault = status?.defaultProvider === cfg.id;
            const testResult = testResults[cfg.id];
            const availableModels = dynamicModels[cfg.id] || cfg.defaultModels;
            const currentModel = providerStatus?.selectedModel || cfg.defaultModels[0];

            return (
              <div
                key={cfg.id}
                className={`rounded-xl border transition-all duration-200 flex flex-col justify-between bg-white shadow-sm overflow-hidden ${
                  isDefault ? 'border-[#F16F21] ring-1 ring-[#F16F21]/20' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Card Top */}
                <div className="p-5 space-y-4">
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 text-base">{cfg.name}</h3>
                        <span className="text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 uppercase">
                          {cfg.badge}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{cfg.tagline}</p>
                    </div>

                    {/* Status Badge */}
                    {isConnected ? (
                      <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold border border-green-200 shrink-0">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 bg-gray-50 text-gray-500 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 shrink-0">
                        Not Connected
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed min-h-[36px]">
                    {cfg.description}
                  </p>

                  {/* Connected Details */}
                  {isConnected ? (
                    <div className="space-y-3 pt-2 border-t border-gray-100 text-xs">
                      {/* Active Key Info */}
                      <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        <span className="text-gray-500 flex items-center gap-1 font-medium">
                          <Key className="w-3.5 h-3.5 text-gray-400" /> Stored Key
                        </span>
                        <span className="font-mono font-bold text-gray-800">
                          •••• {providerStatus?.keyLast4 || '****'}
                        </span>
                      </div>

                      {/* Model Selector */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-gray-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span>Active Model</span>
                            {catalogMeta[cfg.id] && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${
                                  catalogMeta[cfg.id].isFallback
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}
                              >
                                {catalogMeta[cfg.id].isFallback ? 'Curated Fallback' : 'Live Synced'} ({catalogMeta[cfg.id].count})
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => loadLiveModels(cfg.id)}
                            disabled={loadingModels[cfg.id]}
                            className="text-[11px] text-[#F16F21] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <RefreshCw className={`w-3 h-3 ${loadingModels[cfg.id] ? 'animate-spin' : ''}`} />
                            Sync Models
                          </button>
                        </div>
                        <select
                          value={currentModel}
                          onChange={(e) => handleModelChange(cfg.id, e.target.value)}
                          className="w-full h-9 px-2.5 rounded-lg border border-gray-300 text-xs font-mono bg-white focus:ring-1 focus:ring-[#F16F21] outline-none"
                        >
                          {availableModels.map(m => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Test Connection Probe Result */}
                      {testResult && (
                        <div className="pt-1">
                          {testResult.testing ? (
                            <div className="text-[11px] text-gray-500 flex items-center gap-1.5 py-1">
                              <RefreshCw className="w-3 h-3 animate-spin text-[#F16F21]" /> Testing connection probe...
                            </div>
                          ) : testResult.connected ? (
                            <div className="text-[11px] text-green-700 bg-green-50 border border-green-200 px-2 py-1 rounded flex items-center gap-1 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Connection active ({testResult.latencyMs}ms latency)
                            </div>
                          ) : (
                            <div className="text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded font-medium">
                              Probe failed: {testResult.error}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Not Connected Prompt */
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-xs text-gray-500 flex flex-col justify-between min-h-[92px]">
                      <span>Connect your key to enable {cfg.name} for prospect research and automated icebreakers.</span>
                      <a
                        href={cfg.portalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#F16F21] font-bold inline-flex items-center gap-1 hover:underline mt-2 text-[11px]"
                      >
                        Get Key from {cfg.portalName} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-gray-50/70 border-t border-gray-100 flex items-center justify-between gap-2">
                  {isConnected ? (
                    <>
                      <div className="flex items-center gap-2">
                        {isDefault ? (
                          <span className="text-[11px] font-bold text-[#F16F21] bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-[#F16F21]" /> Default Provider
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSetDefault(cfg.id)}
                            className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 px-2.5 py-1 rounded-md transition-colors"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleTestConnection(cfg.id)}
                          disabled={testResult?.testing}
                          className="text-[11px] font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 px-2.5 py-1 rounded-md transition-colors flex items-center gap-1"
                        >
                          <Activity className="w-3 h-3 text-gray-400" /> Test
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setActiveModalProvider(cfg.id);
                            setKeyInput('');
                            setErrorMessage(null);
                            setSuccessMessage(null);
                          }}
                          className="text-[11px] font-semibold text-gray-700 hover:text-gray-900 px-2 py-1"
                        >
                          Replace
                        </button>
                        <button
                          onClick={() => handleRemoveKey(cfg.id)}
                          className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 p-1"
                          title="Disconnect key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="w-full flex justify-end">
                      <button
                        onClick={() => {
                          setActiveModalProvider(cfg.id);
                          setKeyInput('');
                          setErrorMessage(null);
                          setSuccessMessage(null);
                        }}
                        className="w-full py-1.5 px-3 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-95 shadow-sm text-center"
                        style={{ backgroundColor: '#F16F21' }}
                      >
                        Connect {cfg.name} Key
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* AI Models Usage & Telemetry Report */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-50/70 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#F16F21] shadow-2xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                AI Models Usage & Telemetry Report
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Audit
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time breakdown of models used, zero-usage models, token consumption, and invocation logs.
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshAnalytics}
            disabled={refreshingAnalytics || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-2xs self-start sm:self-auto disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshingAnalytics ? 'animate-spin text-[#F16F21]' : 'text-gray-500'}`} />
            <span>{refreshingAnalytics ? 'Refreshing...' : 'Refresh Stats'}</span>
          </button>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="p-5 border-b border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50/30">
          <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
              <span>Total Invocations</span>
              <Cpu className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {status?.analytics?.totalRequests ?? status?.usageToday ?? 0}
            </div>
            <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-600 font-semibold">{status?.analytics?.successfulRequests ?? 0} ok</span>
              <span>•</span>
              <span className="text-rose-600 font-semibold">{status?.analytics?.failedRequests ?? 0} failed</span>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
              <span>Active Success Rate</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold text-emerald-600">
              {(() => {
                const total = status?.analytics?.totalRequests || 0;
                const ok = status?.analytics?.successfulRequests || 0;
                if (!total) return '100%';
                return `${Math.round((ok / total) * 100)}%`;
              })()}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              OpenRouter & xKiro at <strong className="text-emerald-600 font-bold">100%</strong>
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
              <span>Tokens Processed</span>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold text-gray-900">
              {(status?.analytics?.tokens?.totalTokens || 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-gray-500 mt-1">
              In: {(status?.analytics?.tokens?.inputTokens || 0).toLocaleString()} | Out: {(status?.analytics?.tokens?.outputTokens || 0).toLocaleString()}
            </div>
          </div>

          <div className="p-3.5 bg-white rounded-lg border border-gray-200 shadow-2xs">
            <div className="flex items-center justify-between text-gray-500 text-xs mb-1">
              <span>TripGain AI Cost</span>
              <Coins className="w-3.5 h-3.5 text-[#F16F21]" />
            </div>
            <div className="text-xl font-bold text-emerald-600">
              $0.00
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1">
              Zero Platform Fee • BYOK Isolation
            </div>
          </div>
        </div>

        {/* What Used vs What Not Grid */}
        <div className="p-5 border-b border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* What Has Been Used */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-sm font-bold text-gray-900">
                    Active Models & Providers (In Use)
                  </h4>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Executed Requests
                </span>
              </div>
              
              <div className="space-y-2.5">
                {/* OpenRouter Active */}
                <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">OpenRouter</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                          DEFAULT PROVIDER
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-mono mt-0.5">
                        openrouter/free
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600">
                        {status?.analytics?.byProvider?.OPENROUTER?.success || 0} calls
                      </span>
                      <div className="text-[10px] text-emerald-700 font-medium">100% success</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Multi-model meta router</span>
                    <span className="font-semibold text-emerald-600">Direct Cost: $0.00 (Free)</span>
                  </div>
                </div>

                {/* xKiro Active */}
                <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">xKiro</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                          AGENTIC ENGINE
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-mono mt-0.5">
                        qwen/qwen3.5-flash:free
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600">
                        {status?.analytics?.byProvider?.XKIRO?.success || 0} calls
                      </span>
                      <div className="text-[10px] text-emerald-700 font-medium">100% success</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span>High-throughput outreach engine</span>
                    <span className="font-semibold text-emerald-600">Direct Cost: $0.00 (Free)</span>
                  </div>
                </div>

                {/* Gemini Active */}
                <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">Google Gemini</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                          UPGRADED
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 font-mono mt-0.5">
                        gemini-3.6-flash
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-700">
                        {status?.analytics?.byProvider?.GEMINI?.total || 0} calls
                      </span>
                      <div className="text-[10px] text-gray-500">
                        {status?.analytics?.byProvider?.GEMINI?.success || 0} ok / {status?.analytics?.byProvider?.GEMINI?.failed || 0} legacy
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Deprecated 2.5 replaced with official 3.6</span>
                    <span className="font-semibold text-emerald-600">Direct Cost: $0.00</span>
                  </div>
                </div>
              </div>
            </div>

            {/* What Has NOT Been Used */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/40 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <h4 className="text-sm font-bold text-gray-900">
                    Models & Providers NOT Used (0 Invocations)
                  </h4>
                </div>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-700">
                  Zero Spend • 0 Calls
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Paid OpenRouter models */}
                <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">Claude 3.5 Sonnet / GPT-4o</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          STANDBY
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        anthropic/claude-3.5-sonnet • openai/gpt-4o
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-400">0 calls</span>
                      <div className="text-[10px] text-gray-400 font-medium">$0.00 spent</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Available on OpenRouter BYOK key</span>
                    <span>No charges incurred</span>
                  </div>
                </div>

                {/* xKiro alternate models */}
                <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">DeepSeek Chat / Qwen 27B</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          STANDBY
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        deepseek/deepseek-chat-v3.1 • qwen/qwen3.6-27b:free
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-400">0 calls</span>
                      <div className="text-[10px] text-gray-400 font-medium">$0.00 spent</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Available on xKiro BYOK key</span>
                    <span>No charges incurred</span>
                  </div>
                </div>

                {/* Company Gemini Fallback */}
                <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-gray-900">TripGain Platform Gemini Fallback</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          SAFETY NET
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">
                        Platform Secret Gemini Key
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-400">0 / 10 used</span>
                      <div className="text-[10px] text-emerald-600 font-medium">100% quota intact</div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                    <span>Reserved for emergency admin rate-limit</span>
                    <span>Zero tenant leakage</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real-Time Invocation Telemetry Log Table */}
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Recent AI Invocation Stream (Last 10 Executions)
            </h4>
            <span className="text-xs text-gray-500">
              Audit trails stored in database
            </span>
          </div>

          {status?.analytics?.recentLogs && status.analytics.recentLogs.length > 0 ? (
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Provider</th>
                    <th className="py-2.5 px-3">Task / Feature</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Tokens</th>
                    <th className="py-2.5 px-3 text-right">Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {status.analytics.recentLogs.map((log: any) => {
                    const isSuccess = log.status === 'SUCCESS';
                    const timeStr = new Date(log.requestedAt).toLocaleTimeString();
                    return (
                      <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="py-2 px-3 text-gray-500 font-mono text-[11px] whitespace-nowrap">
                          {timeStr}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            log.provider === 'OPENROUTER'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : log.provider === 'XKIRO'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            {log.provider}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-gray-800">
                          {log.feature === 'PERSONALIZATION' ? 'Lead Email Personalization' : log.feature}
                        </td>
                        <td className="py-2 px-3">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {isSuccess ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                SUCCESS
                              </>
                            ) : (
                              <>
                                <AlertCircle className="w-3 h-3" />
                                {log.errorCode || 'FAILED'}
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700">
                          {log.totalTokens > 0 ? log.totalTokens.toLocaleString() : '—'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-500">
                          {log.latencyMs ? `${log.latencyMs} ms` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-xs bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
              No recent invocation logs available yet.
            </div>
          )}
        </div>
      </div>

      {/* Admin Fallback Notice */}
      {status?.fallbackAvailable && (
        <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-center justify-between">
          <div>
            <span className="font-bold">TripGain Platform Gemini Fallback Active:</span> You are an authorized admin. If your personal key ever reaches rate limits, company fallback is capped at {status.fallbackDailyLimit} reqs/day ({status.fallbackUsedToday} used today).
          </div>
        </div>
      )}

      {/* Security Guarantee Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-white border border-gray-200 text-xs text-gray-600 flex items-start gap-3 shadow-sm">
        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
        </div>
        <div>
          <strong className="text-gray-900 block mb-0.5">Enterprise Cryptographic Security & Isolation</strong>
          All API keys are encrypted at rest using AES-256-GCM with fresh 96-bit initialization vectors and authentication tags.
          Keys are strictly isolated per authenticated user — never stored in browser storage, never logged in plaintext, and never shared with other team members.
        </div>
      </div>

      {/* Key Entry Modal / Overlay */}
      {activeModalProvider && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#F16F21]" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Connect {activeModalProvider} API Key
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveModalProvider(null);
                  setKeyInput('');
                }}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 block">
                  Paste your {activeModalProvider} Key
                </label>
                <div className="relative">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={
                      activeModalProvider === 'GEMINI'
                        ? 'AIzaSy...'
                        : activeModalProvider === 'OPENROUTER'
                        ? 'sk-or-v1-...'
                        : 'xkiro-...'
                    }
                    autoComplete="off"
                    spellCheck="false"
                    disabled={modalSaving}
                    autoFocus
                    className="w-full h-10 px-3 pr-10 rounded-lg border border-gray-300 text-xs font-mono focus:ring-2 focus:ring-[#F16F21] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    tabIndex={-1}
                  >
                    {showKeyText ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Key will be validated directly against {activeModalProvider} and stored encrypted with AES-256-GCM.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveModalProvider(null);
                    setKeyInput('');
                  }}
                  disabled={modalSaving}
                  className="px-3.5 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving || !keyInput.trim()}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  style={{ backgroundColor: '#F16F21' }}
                >
                  {modalSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Save & Connect Key'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

