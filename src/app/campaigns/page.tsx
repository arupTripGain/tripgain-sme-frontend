"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Megaphone, Users, Mail, Trash2, AlertTriangle, Loader2, User, Rocket, Play, Pause, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export default function CampaignsPage() {
  const { user } = useAuth();
  const [scope, setScope] = useState<'my' | 'all'>('my');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  const handleDuplicate = async (campaignId: string) => {
    setActionLoadingId(campaignId);
    try {
      const res = await apiFetch(`/api/campaigns/${campaignId}/duplicate`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to duplicate campaign');
      }
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleLaunch = async (campaignId: string) => {
    if (!confirm('Launch campaign and sequence all eligible leads now?')) return;
    setActionLoadingId(campaignId);
    try {
      const res = await apiFetch(`/api/campaigns/${campaignId}/activate`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to launch campaign');
      }
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to launch campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePause = async (campaignId: string) => {
    if (!confirm('Pause this campaign? Active enrollments will be held until resumed.')) return;
    setActionLoadingId(campaignId);
    try {
      const res = await apiFetch(`/api/campaigns/${campaignId}/pause`, {
        method: 'POST'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to pause campaign');
      }
      fetchCampaigns();
    } catch (err: any) {
      alert(err.message || 'Failed to pause campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const fetchCampaigns = () => {
    setLoading(true);
    apiFetch(`/api/campaigns?scope=${scope}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        setCampaigns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCampaigns();
  }, [scope, user]);

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await apiFetch(`/api/campaigns/${deleteTarget.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete campaign');
      }
      setDeleteTarget(null);
      fetchCampaigns();
    } catch (err: any) {
      console.error(err);
      setDeleteError(err.message || 'Error deleting campaign');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-secondary">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage your outreach sequences {user ? `(${user.name || user.email})` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'ADMIN' && (
            <div className="flex items-center bg-muted p-1 rounded-lg border text-xs font-semibold">
              <button
                type="button"
                onClick={() => setScope('my')}
                className={cn("px-3 py-1.5 rounded-md transition-all", scope === 'my' ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground")}
              >
                My Campaigns
              </button>
              <button
                type="button"
                onClick={() => setScope('all')}
                className={cn("px-3 py-1.5 rounded-md transition-all", scope === 'all' ? "bg-background text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground")}
              >
                All Team Campaigns
              </button>
            </div>
          )}
          <Link 
            href="/campaigns/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground animate-pulse">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-16 text-center shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <Megaphone className="h-16 w-16 mx-auto text-primary/20 mb-6 group-hover:text-primary/50 transition-colors duration-500 transform group-hover:scale-110" />
          <h3 className="font-heading text-xl font-bold text-secondary mb-3">No campaigns yet</h3>
          <p className="text-muted-foreground text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            Create your first campaign to start sequencing leads, sending automated outreach, and generating pipeline.
          </p>
          <Link 
            href="/campaigns/new"
            className="inline-flex items-center justify-center rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 h-12 px-8 gap-2 shadow-sm transition-all"
          >
            <Plus className="h-5 w-5" />
            Create Your First Campaign
          </Link>
        </div>
      ) : (
        <div className="grid gap-5">
          {campaigns.map(campaign => (
            <div 
              key={campaign.id} 
              onClick={() => router.push(`/campaigns/${campaign.id}`)}
              className="block rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-all hover:border-primary/30 group relative overflow-hidden cursor-pointer"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-transparent group-hover:bg-primary transition-colors"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10 flex items-center justify-center text-primary shrink-0 shadow-inner">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-heading text-lg font-bold text-secondary group-hover:text-primary transition-colors">
                        {campaign.name}
                      </h3>
                      {campaign.status === 'active' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-600/20 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                          Active
                        </span>
                      ) : campaign.status === 'paused' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20 shadow-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Paused
                        </span>
                      ) : campaign.status === 'draft' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-400/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                          Draft
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                          {campaign.status}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm text-muted-foreground font-medium">
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-slate-400" /> 
                        <span className="text-secondary">{campaign.enrolledCount ?? campaign._count?.enrollments ?? campaign._count?.leads ?? 0}</span> Enrolled
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4 text-slate-400" /> 
                        <span className="text-secondary">{campaign.stepsCount ?? campaign.sequences?.[0]?.steps?.length ?? 0}</span> Steps
                      </span>
                      <span className="flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-md border border-border">
                        Created {new Date(campaign.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {campaign.owner && (
                        <span className="flex items-center gap-1.5 text-xs bg-primary/10 text-primary font-semibold px-2.5 py-1 rounded-md border border-primary/20">
                          <User className="h-3.5 w-3.5" />
                          {campaign.owner}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-8 pl-17 md:pl-0">
                  <div className="grid grid-cols-2 gap-8 text-center border-r border-border pr-8 hidden sm:grid">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Sent</p>
                      <p className="text-lg font-bold text-secondary">{campaign.sentCount ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Replies</p>
                      <p className="text-lg font-bold text-green-600">{campaign.replyRate ?? 0}%</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunch(campaign.id);
                        }}
                        disabled={actionLoadingId === campaign.id}
                        title="Launch Campaign & Sequence Leads"
                        className="inline-flex items-center justify-center rounded-full text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-1.5 shadow-sm transition-all disabled:opacity-50"
                      >
                        {actionLoadingId === campaign.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Rocket className="h-3.5 w-3.5" />
                        )}
                        Launch
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunch(campaign.id);
                        }}
                        disabled={actionLoadingId === campaign.id}
                        title="Resume Campaign"
                        className="inline-flex items-center justify-center rounded-full text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white h-10 px-4 gap-1.5 shadow-sm transition-all disabled:opacity-50"
                      >
                        {actionLoadingId === campaign.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        Resume
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePause(campaign.id);
                        }}
                        disabled={actionLoadingId === campaign.id}
                        title="Pause Campaign"
                        className="inline-flex items-center justify-center rounded-full text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 border border-amber-300 h-10 px-3.5 gap-1.5 shadow-xs transition-all disabled:opacity-50"
                      >
                        {actionLoadingId === campaign.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Pause className="h-3.5 w-3.5" />
                        )}
                        Pause
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/campaigns/${campaign.id}`);
                      }}
                      className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors border border-input bg-card shadow-sm hover:bg-muted hover:border-primary/30 h-10 px-6 text-secondary hover:text-primary"
                    >
                      View Dashboard
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(campaign.id);
                      }}
                      disabled={actionLoadingId === campaign.id}
                      title="Duplicate Campaign"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 border border-input hover:border-primary/20 h-10 w-10 transition-all shadow-sm disabled:opacity-50"
                    >
                      {actionLoadingId === campaign.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(campaign);
                      }}
                      title="Delete Campaign"
                      className="inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-red-600 hover:bg-red-50 border border-input hover:border-red-200 h-10 w-10 transition-all shadow-sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-secondary font-heading">Delete Campaign?</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-secondary">"{deleteTarget.name}"</span>?
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All enrolled leads, sequence steps, and dispatch logs for this campaign will be permanently removed.
                </p>
                {deleteError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                    {deleteError}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => { setDeleteTarget(null); setDeleteError(null); }}
                className="rounded-xl border border-input bg-background hover:bg-muted px-4 py-2 text-sm font-medium text-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    Delete Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

