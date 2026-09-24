"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Send, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

export interface SendingQueueData {
  timezone: string;
  // 5 distinguished core metrics for Live Sending-Plan View
  currentlyEligibleQueue?: number;
  todaySendCapacity?: number;
  sentToday?: number;
  remainingTodayCapacity?: number;
  remainingSendableToday?: number;
  todaySendable?: number;
  futureQueue?: number;

  // Time-bucket structures (backward compatible)
  today: {
    date: string;
    capacity?: number;
    planned: number;
    sent: number;
    sendable?: number;
    remainingSendableToday?: number;
    queued: number;
    progressPercent: number;
  };
  tomorrow: {
    date: string;
    queued: number;
    rolloverQueue?: number;
    scheduled?: number;
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

  const fetchQueue = useCallback(async (isBackground = false, forceRefresh = false) => {
    if (!isBackground) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const url = forceRefresh ? '/api/dashboard/sending-queue?force=true' : '/api/dashboard/sending-queue';
      const res = await apiFetch(url);
      if (res.status === 401) {
        // Not authenticated yet or redirecting; quietly exit
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json: SendingQueueData = await res.json();
      setData(json);
    } catch (err: any) {
      console.warn('Failed to load sending queue summary:', err?.message || err);
      setError('Queue data unavailable');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // 45-second periodic background polling for live updates
    const interval = setInterval(() => {
      fetchQueue(true, false);
    }, 45000);
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
              <p className="text-xs text-muted-foreground">Live sending plan & quota pipeline</p>
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
            onClick={() => fetchQueue(false, true)}
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

  // Extract the 5 core live sending-plan metrics
  const currentlyEligibleQueue = data.currentlyEligibleQueue ?? data.today?.queued ?? 0;
  const todaySendCapacity = data.todaySendCapacity ?? data.today?.capacity ?? 0;
  const sentToday = data.sentToday ?? data.today?.sent ?? 0;
  const remainingSendableToday = data.remainingSendableToday ?? data.todaySendable ?? data.today?.sendable ?? 0;
  const futureQueue = data.futureQueue ?? Math.max(0, currentlyEligibleQueue - remainingSendableToday);

  // Realistic today plan = sent + sendable (NOT total campaign contacts)
  const plannedToday = data.today?.planned ?? (sentToday + remainingSendableToday);
  const progressPercent = data.today?.progressPercent ?? (plannedToday > 0 ? Math.round((sentToday / plannedToday) * 100) : 0);

  // Tomorrow and 3-day projection
  const queuedTomorrow = data.tomorrow?.queued ?? 0;
  const tomorrowRollover = data.tomorrow?.rolloverQueue ?? futureQueue;
  const tomorrowScheduled = data.tomorrow?.scheduled ?? 0;

  const queuedNext3Days = data.next3Days?.totalQueued ?? 0;
  const next3DaysList = Array.isArray(data.next3Days?.days) ? data.next3Days.days.filter((d) => d.queued > 0) : [];

  return (
    <div className="rounded-lg border border-border bg-card p-6 shadow-sm mb-8">
      {/* Component Title & Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Send className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading text-lg font-bold text-secondary leading-tight">Sending Queue</h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Plan
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Live sending plan & quota pipeline</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => fetchQueue(true, true)}
          disabled={refreshing}
          title="Force refresh sending queue"
          aria-label="Force refresh sending queue"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2.5 py-1.5 rounded-md hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* 5 Distinguished Core Metrics Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-5 p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
        <div className="space-y-0.5">
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">1. Eligible Queue</span>
          <span className="font-bold text-foreground font-mono text-sm">{currentlyEligibleQueue.toLocaleString()}</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">2. Today's Quota</span>
          <span className="font-bold text-foreground font-mono text-sm">{todaySendCapacity.toLocaleString()}</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">3. Sent Today</span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono text-sm">{sentToday.toLocaleString()}</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">4. Sendable Today</span>
          <span className="font-bold text-primary font-mono text-sm">{remainingSendableToday.toLocaleString()}</span>
        </div>
        <div className="space-y-0.5 col-span-2 sm:col-span-1">
          <span className="text-muted-foreground block text-[10px] uppercase tracking-wider font-semibold">5. Rollover Queue</span>
          <span className="font-bold text-amber-600 dark:text-amber-400 font-mono text-sm">{futureQueue.toLocaleString()}</span>
        </div>
      </div>

      {/* Three Primary Time Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD A: TODAY (Live Sending Plan) */}
        <div className="rounded-lg border border-border/80 bg-background/50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                TODAY · SENDING PLAN
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                Cap: {todaySendCapacity.toLocaleString()}
              </span>
            </div>
            <div className="font-heading text-xl font-bold text-foreground">
              {remainingSendableToday > 0 ? (
                <span>{remainingSendableToday.toLocaleString()} sendable today</span>
              ) : sentToday > 0 ? (
                <span>Quota fulfilled today</span>
              ) : (
                <span>0 emails scheduled</span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              <span>
                <strong className="text-foreground font-semibold">{sentToday.toLocaleString()}</strong> sent ·{' '}
                <strong className="text-foreground font-semibold">{todaySendCapacity.toLocaleString()}</strong> daily quota
              </span>
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
              <span>{plannedToday > 0 ? `${sentToday.toLocaleString()} / ${plannedToday.toLocaleString()} targeted` : '0 / 0'}</span>
              <span className="font-semibold text-foreground">{progressPercent}% completed</span>
            </div>
          </div>
        </div>

        {/* CARD B: TOMORROW & ROLLOVER */}
        <div className="rounded-lg border border-border/80 bg-background/50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                TOMORROW & ROLLOVER
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
                {tomorrowRollover > 0 ? `+${tomorrowRollover.toLocaleString()} rollover` : ''}
              </span>
            </div>
            <div className="font-heading text-xl font-bold text-foreground">
              {`${queuedTomorrow.toLocaleString()} queued`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {tomorrowRollover > 0 ? (
                <span>
                  <strong className="text-foreground font-semibold">{tomorrowRollover.toLocaleString()}</strong> rollover from today
                  {tomorrowScheduled > 0 ? ` · ${tomorrowScheduled.toLocaleString()} scheduled` : ''}
                </span>
              ) : queuedTomorrow > 0 ? (
                <span>{queuedTomorrow.toLocaleString()} scheduled for sending</span>
              ) : (
                <span>Nothing scheduled</span>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50 text-[11px] flex items-center justify-between">
            <span className="text-muted-foreground">Pipeline status</span>
            <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Rollover preserved
            </span>
          </div>
        </div>

        {/* CARD C: NEXT 3 DAYS */}
        <div className="rounded-lg border border-border/80 bg-background/50 p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                NEXT 3 DAYS PIPELINE
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                3-Day Horizon
              </span>
            </div>
            <div className="font-heading text-xl font-bold text-foreground">
              {`${queuedNext3Days.toLocaleString()} queued`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Projected queue distribution across upcoming business days
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50">
            {next3DaysList.length === 0 ? (
              <div className="text-xs text-muted-foreground py-1">Nothing scheduled in window</div>
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
