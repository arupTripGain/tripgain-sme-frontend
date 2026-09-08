'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  Send, 
  FileText, 
  ListOrdered, 
  Activity, 
  ShieldAlert, 
  Link as LinkIcon 
} from 'lucide-react';

const TABS = [
  { id: 'general', label: 'General', icon: SettingsIcon },
  { id: 'profile', label: 'Profile', icon: User },
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
              {activeTab === 'mailboxes' && <MailboxesSettings />}
              {activeTab === 'sending' && <SendingSettings />}
              {activeTab === 'email' && <EmailSettings />}
              {activeTab === 'sequences' && <SequencesSettings />}
              {activeTab === 'tracking' && <TrackingSettings />}
              {activeTab === 'suppression' && <SuppressionSettings />}
              {activeTab === 'integrations' && <IntegrationsSettings />}
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
  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Profile</h2>
      
      <div className="flex items-center gap-6 mb-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-inner" style={{ backgroundColor: '#14385F' }}>
          A
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
          <input type="text" defaultValue="Arup" className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Last Name</label>
          <input type="text" defaultValue="Nirala" className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Email Address</label>
          <input type="email" defaultValue="arup@tripgain.com" className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-gray-700">Role</label>
          <input type="text" defaultValue="Admin" disabled className="w-full h-10 px-3 rounded-md border border-gray-200 bg-gray-50 text-sm text-gray-500" />
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
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Mailboxes</h2>
        <Link href="/settings/mailboxes" className="px-4 py-2 rounded-md font-bold text-white transition-opacity hover:opacity-90 text-sm" style={{ backgroundColor: '#F16F21' }}>
          + Connect Mailbox
        </Link>
      </div>
      
      <p className="text-sm text-gray-600 mb-6">Manage email accounts used for sending campaigns and receiving replies.</p>

      <div className="border rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: '#E0C0B2', backgroundColor: '#FFF8F4' }}>
        <div>
          <div className="font-bold text-lg" style={{ color: '#14385F' }}>arup@tripgain.com</div>
          <div className="text-sm text-gray-600 mb-2">Google Workspace</div>
          <div className="flex items-center gap-2 text-xs font-semibold text-green-700">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Connected
          </div>
          <div className="text-xs text-gray-500 mt-1">Last synced: 2 minutes ago</div>
        </div>
        <div className="flex gap-2">
          <Link href="/settings/mailboxes" className="px-3 py-1.5 text-sm font-medium bg-white border rounded hover:bg-gray-50" style={{ borderColor: '#E0C0B2', color: '#14385F' }}>
            Manage
          </Link>
          <button className="px-3 py-1.5 text-sm font-medium bg-white border border-red-200 text-red-600 rounded hover:bg-red-50">
            Disconnect
          </button>
        </div>
      </div>
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
  return (
    <div className="space-y-8 animate-in fade-in">
      <h2 className="text-xl font-bold" style={{ color: '#14385F' }}>Email Settings</h2>
      
      <div>
        <h3 className="text-sm font-bold mb-4" style={{ color: '#14385F' }}>Default Sender</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Sender Name</label>
            <input type="text" defaultValue="Arup from TripGain" className="w-full h-10 px-3 rounded-md border border-gray-300 text-sm focus:ring-2 focus:ring-[#F16F21] outline-none" />
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
          rows={4} 
          defaultValue="Best,&#10;Arup&#10;TripGain" 
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

function IntegrationsSettings() {
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
              <h3 className="font-bold text-gray-900">AI Provider</h3>
              <div className="text-xs text-gray-500 mt-1">Classification & Drafting</div>
            </div>
            <span className="flex items-center gap-1.5 bg-green-50 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-100">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Connected
            </span>
          </div>

          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex justify-between border-b border-gray-50 pb-2">
              <span>Model:</span>
              <span className="font-medium text-gray-900">TripGain Internal</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
            <button className="text-xs font-semibold px-3 py-1.5 border border-gray-200 rounded hover:bg-gray-50">Configure</button>
          </div>
        </div>

      </div>
    </div>
  );
}
