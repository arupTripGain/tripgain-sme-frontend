"use client";

import { useState } from 'react';
import { X, ShieldAlert, Loader2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface AddSuppressionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultEmail?: string;
}

export default function AddSuppressionModal({
  isOpen,
  onClose,
  onSuccess,
  defaultEmail = ''
}: AddSuppressionModalProps) {
  const [emailInput, setEmailInput] = useState(defaultEmail);
  const [reason, setReason] = useState('do_not_contact');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please enter at least one email address.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await apiFetch('/api/suppression', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailInput.trim(),
          reason,
          notes: notes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add to suppression list');
      }

      setSuccessMessage(data.message || `Successfully suppressed ${data.count || 1} email address(es).`);
      setTimeout(() => {
        setEmailInput('');
        setNotes('');
        setSuccessMessage(null);
        onClose();
        if (onSuccess) onSuccess();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'An error occurred while adding to suppression list');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border bg-gradient-to-r from-orange-50 via-white to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center text-primary shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#F16F21]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-secondary">Add to Suppression List</h3>
              <p className="text-xs text-muted-foreground">Block email addresses from all future outreach</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
              Email Address(es) <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="e.g. user@example.com (or multiple separated by commas or new lines)"
              className="w-full p-3 text-xs bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
              required
            />
            <span className="text-[11px] text-muted-foreground block">
              You can paste a single email or multiple separated by lines or commas.
            </span>
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
              Suppression Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-10 px-3 text-xs bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="do_not_contact">Do Not Contact (Manual Exclusion)</option>
              <option value="unsubscribe">Unsubscribed / Opt-Out</option>
              <option value="hard_bounce">Hard Bounce / Invalid</option>
              <option value="spam_complaint">Spam Complaint</option>
              <option value="competitor">Competitor / Internal</option>
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary uppercase tracking-wider block">
              Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Requested removal via phone / CEO request"
              className="w-full h-10 px-3 text-xs bg-white border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Warning notice */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-[11px] text-amber-800 leading-relaxed">
            <strong>System Rule:</strong> Suppressed emails are immediately purged from active queues and permanently blocked across all General Campaigns and Bulk Email dispatches.
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-secondary border border-input bg-white hover:bg-muted rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold bg-[#F16F21] hover:bg-[#F16F21]/90 text-white rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Add to Suppression List
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
