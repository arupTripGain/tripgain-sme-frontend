"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export interface SendingQueueData {
  timezone: string;
  today: {
    date: string;
    planned: number;
    sent: number;
    queued: number;
    progressPercent: number;
  };
  tomorrow: {
    date: string;
    queued: number;
  };
  next3Days: {
    totalQueued: number;
    days: Array<{
      date: string;
      label?: string;
      queued: number;
    }>;
  };
}

export function SendingQueue() {
  const [data, setData] = useState<SendingQueueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchQueue = useCallback(async (isBackground = false) => {
    if (!isBackground) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const res = await apiFetch('/api/dashboard/sending-queue');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: SendingQueueData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Failed to load sending queue summary:', err);
      setError('Queue data unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Conservative 60-second periodic refresh
    const interval = setInterval(() => {
      fetchQueue(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // Loading skeleton state
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm mb-8 animate-pulse">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-muted" />
            <div>
              <div className="h-5 w-36 bg-muted rounded mb-1" />
              <div className="h-3 w-48 bg-muted rounded" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4 h-36 flex flex-col justify-between" />
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4 h-36 flex flex-col justify-between" />
          <div className="rounded-lg border border-border/50 bg-muted/20 p-4 h-36 flex flex-col justify-between" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 shadow-sm mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold text-secondary leading-tight">Sending Queue</h2>
              <p className="text-xs text-muted-foreground">Your email sending pipeline</p>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Queue data unavailable</span>
          </div>
          <button
            type="button"
            onClick={() => fetchQueue(false)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-2.5 py-1 transition-colors"
            aria-label="Retry loading sending queue"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { today, tomorrow, next3Days } = data;
  const totalToday = today?.planned ?? 0;
  const sentToday = today?.sent ?? 0;
  const queuedToday = today?.queued ?? 0;
  const progressPercent = today?.progressPercent ?? 0;

  const queuedTomorrow = tomorrow?.queued ?? 0;
  const queuedNext3Days = next3Days?.totalQueued ?? 0;
  const next3DaysList = Array.isArray(next3Days?.days) ? next3Days.days.filter((d) => d.queued > 0) : [];

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm mb-8">
      {/* Component Title & Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-bold text-secondary leading-tight">Sending Queue</h2>
            <p className="text-xs text-muted-foreground">Your email sending pipeline</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchQueue(true)}
          disabled={refreshing}
          title="Refresh sending queue"
          aria-label="Refresh sending queue"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Three Primary Time Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD A: TODAY */}
        <div className="rounded-lg border border-border/80 bg-background/50 p-4 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-1.5">
              TODAY
            </div>
            <div className="font-heading text-xl font-bold text-foreground">
              {totalToday > 0 ? `${totalToday.toLocaleString()} emails planned` : '0 emails planned'}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalToday > 0 ? (
                <span>
                  <strong className="text-foreground font-semibold">{sentToday.toLocaleString()}</strong> sent ·{' '}
                  <strong className="text-foreground font-semibold">{queuedToday.toLocaleString()}</strong> queued
                </span>
              ) : (
                'No emails scheduled'
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50">
            <div
              className="w-full bg-muted rounded-full h-2 overflow-hidden"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Today sending progress"
            >
              <div
                className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-muted-foreground mt-1.5">
              <span>{totalToday > 0 ? `${sentToday.toLocaleString()} / ${totalToday.toLocaleString()}` : '0 / 0'}</span>
              <span className="font-semibold text-foreground">{progressPercent}% completed</span>
            </div>
          </div>
        </div>

        {/* CARD B: TOMORROW */}
        <div className="rounded-lg border border-border/80 bg-background/50 p-4 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-1.5">
              TOMORROW
            </div>
            <div className="font-heading text-xl font-bold text-foreground">
              {`${queuedTomorrow.toLocaleString()} queued`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {queuedTomorrow > 0 ? `${queuedTomorrow.toLocaleString()} scheduled for sending` : 'Nothing scheduled'}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 text-[11px] flex items-center justify-between">
            <span className="text-muted-foreground">Pipeline status</span>
            <span className={queuedTomorrow > 0 ? 'text-emerald-700 font-medium' : 'text-muted-foreground'}>
              {queuedTomorrow > 0 ? 'Scheduled' : 'No scheduled sends'}
            </span>
          </div>
        </div>

        {/* CARD C: NEXT 3 DAYS */}
        <div className="rounded-lg border border-border/80 bg-background/50 p-4 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase mb-1.5">
              NEXT 3 DAYS
            </div>
            <div className="font-heading text-xl font-bold text-foreground">
              {`${queuedNext3Days.toLocaleString()} queued`}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50">
            {next3DaysList.length === 0 ? (
              <div className="text-xs text-muted-foreground py-1">Nothing scheduled</div>
            ) : (
              <div className="space-y-1.5">
                {next3DaysList.map((day) => (
                  <div key={day.date} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{day.label || day.date}</span>
                    <span className="font-semibold text-foreground font-mono">{day.queued.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
