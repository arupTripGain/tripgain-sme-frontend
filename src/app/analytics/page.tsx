'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { 
  BarChart, TrendingUp, TrendingDown, Mail, CheckCircle2, 
  CornerUpLeft, Star, Users, Briefcase, Filter, Search, 
  Activity, AlertTriangle, UserX, Inbox
} from 'lucide-react';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch('/api/analytics')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load analytics:', err);
        setLoading(false);
      });
  }, [user?.id]);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Analytics...</div>;

  return (
    <div className="flex-1 bg-[#FAFAFA] min-h-screen overflow-y-auto pb-20">
      
      {/* HEADER & FILTERS */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 px-8 py-5">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <BarChart className="w-6 h-6 text-blue-600" /> Analytics
            </h1>
            <p className="text-sm text-gray-500 mt-1">Track outreach activity, engagement, and campaign performance.</p>
          </div>
          <div className="flex items-center gap-3">
            <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
              <option>Last 7 Days</option>
              <option>Today</option>
              <option>Last 30 Days</option>
              <option>All Time</option>
            </select>
            <select className="bg-white border border-gray-200 text-sm rounded-lg px-3 py-2 shadow-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none">
              <option>All Campaigns</option>
              <option>Finance Heads</option>
              <option>Bengaluru IT Founders</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 mt-8 space-y-10">
        
        {/* 1. KPI CARDS */}
        <section>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Total Contacts" value={data.overview.contacts.value} trend={data.overview.contacts.trend} positive={true} />
            <KpiCard title="Emails Sent" value={data.overview.sent.value} trend={data.overview.sent.trend} positive={true} />
            <KpiCard title="Delivered" value={data.overview.delivered.value} trend={data.overview.delivered.trend} positive={true} />
            <KpiCard title="Replies" value={data.overview.replies.value} trend={data.overview.replies.trend} positive={true} />
            <KpiCard title="Positive Replies" value={data.overview.positiveReplies.value} trend={data.overview.positiveReplies.trend} positive={true} />
            <KpiCard title="Unsubscribed" value={data.overview.unsubscribed.value} trend={data.overview.unsubscribed.trend} positive={false} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 2. OUTREACH FUNNEL */}
          <section className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Outreach Funnel
            </h2>
            <div className="space-y-3">
              {data.funnel.map((step: any, idx: number) => {
                const max = parseInt(data.funnel[0].value.replace(/,/g, '')) || 0;
                const val = parseInt(step.value.replace(/,/g, '')) || 0;
                const pct = max === 0 ? 0 : (val / max) * 100;
                return (
                  <div key={idx} className="relative">
                    <div className="flex justify-between items-center mb-1 text-xs font-semibold">
                      <span className="text-gray-500">{step.label}</span>
                      <span className="text-gray-900">{step.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. CAMPAIGN PERFORMANCE */}
          <section className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-0 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Campaign Performance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3">Campaign</th>
                    <th className="px-6 py-3 text-right">Contacts</th>
                    <th className="px-6 py-3 text-right">Sent</th>
                    <th className="px-6 py-3 text-right">Delivered</th>
                    <th className="px-6 py-3 text-right">Replies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.campaignPerformance.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{c.name}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{c.contacts}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{c.sent}</td>
                      <td className="px-6 py-4 text-right text-gray-600">{c.delivered}</td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">{c.replies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* 4. CAMPAIGN COMPARISON */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6">Campaign Comparison</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center gap-2 text-green-700 font-bold mb-1">
                  <Star className="w-4 h-4 fill-current" /> Best Reply Rate
                </div>
                <div className="text-sm font-semibold text-gray-900">{data.campaignComparison.best.name}</div>
                <div className="text-xl font-bold text-green-700">{data.campaignComparison.best.metric}</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                <div className="flex items-center gap-2 text-orange-700 font-bold mb-1">
                  <AlertTriangle className="w-4 h-4" /> Needs Attention
                </div>
                <div className="text-sm font-semibold text-gray-900">{data.campaignComparison.attention.name}</div>
                <div className="text-sm font-bold text-orange-700">{data.campaignComparison.attention.metric}</div>
              </div>
            </div>

            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-semibold">
                <tr>
                  <th className="px-4 py-2 rounded-l-lg">Campaign</th>
                  <th className="px-4 py-2 text-right">Reply Rate</th>
                  <th className="px-4 py-2 text-right rounded-r-lg">Positive Reply</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.campaignComparison.list.map((c: any, i: number) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-700">{c.replyRate}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{c.positiveReplyRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 5 & 6. SEQUENCE PERFORMANCE & DROPOFF */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Sequence Performance</h2>
            <div className="overflow-x-auto mb-6">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-500 font-semibold border-b border-gray-100">
                  <tr>
                    <th className="py-2">Step</th>
                    <th className="py-2 text-right">Sent</th>
                    <th className="py-2 text-right">Delivered</th>
                    <th className="py-2 text-right">Replies</th>
                    <th className="py-2 text-right">Reply Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.sequencePerformance.map((s: any, i: number) => (
                    <tr key={i}>
                      <td className="py-3 font-medium text-gray-900">{s.step}</td>
                      <td className="py-3 text-right text-gray-500">{s.sent}</td>
                      <td className="py-3 text-right text-gray-500">{s.delivered}</td>
                      <td className="py-3 text-right font-semibold text-blue-600">{s.replies}</td>
                      <td className="py-3 text-right font-bold text-gray-900">{s.replyRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-8 mt-auto pt-6 border-t border-gray-100">
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Sequence Drop-Off</h3>
                <div className="space-y-2">
                  {data.sequenceDropoff.funnel.map((f: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-10 text-xs font-bold text-gray-400 text-right">{f.percentage}%</div>
                      <div className="flex-1 bg-gray-100 h-1.5 rounded-full">
                        <div className="bg-gray-800 h-1.5 rounded-full" style={{ width: `${f.percentage}%` }}></div>
                      </div>
                      <div className="w-24 text-xs font-medium text-gray-600">{f.label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Stop Reasons</h3>
                <div className="space-y-2 text-xs">
                  {data.sequenceDropoff.reasons.map((r: any, i: number) => (
                    <div key={i} className="flex justify-between border-b border-gray-50 pb-1">
                      <span className="text-gray-500">{r.reason}</span>
                      <span className="font-semibold text-gray-900">{r.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 7. REPLY ANALYTICS */}
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <CornerUpLeft className="w-4 h-4" /> Reply Analytics
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <div className="text-xs text-gray-500 font-semibold uppercase">Total Replies</div>
                <div className="text-2xl font-bold text-gray-900">{data.replyAnalytics.total}</div>
                <div className="text-sm text-gray-500">{data.replyAnalytics.rate} Rate</div>
              </div>
              <div>
                <div className="text-xs text-green-600 font-semibold uppercase">Positive</div>
                <div className="text-2xl font-bold text-green-700">{data.replyAnalytics.positive}</div>
                <div className="text-sm text-green-600">{data.replyAnalytics.positiveRate} of replies</div>
              </div>
            </div>
            <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">Classification</h3>
            <div className="space-y-2">
              {data.replyAnalytics.types.map((t: any, i: number) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 rounded hover:bg-gray-50 transition-colors">
                  <span className="text-gray-700 font-medium flex items-center gap-2">
                    {t.type === 'Interested' && <Star className="w-3.5 h-3.5 text-green-500 fill-current" />}
                    {t.type !== 'Interested' && <span className="w-1.5 h-1.5 rounded-full bg-gray-300 ml-1 mr-1"></span>}
                    {t.type}
                  </span>
                  <span className="font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-full text-xs">{t.count}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 8. AUDIENCE PERFORMANCE */}
          <section className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
              <Users className="w-4 h-4" /> Audience Performance
            </h2>
            <div className="grid grid-cols-3 gap-8">
              
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 border-b border-gray-100 pb-2">By Industry</h3>
                <div className="space-y-3">
                  {data.demographics.industry.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 truncate pr-2">{d.name}</span>
                      <span className="font-semibold text-blue-600">{d.rate}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 border-b border-gray-100 pb-2">By Job Title</h3>
                <div className="space-y-3">
                  {data.demographics.jobTitle.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 truncate pr-2">{d.name}</span>
                      <span className="font-semibold text-blue-600">{d.rate}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase mb-4 border-b border-gray-100 pb-2">By Company Size</h3>
                <div className="space-y-3">
                  {data.demographics.companySize.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 truncate pr-2">{d.name}</span>
                      <span className="font-semibold text-blue-600">{d.rate}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>

        </div>

        {/* 10. MAILBOX & DELIVERABILITY */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <Inbox className="w-4 h-4" /> Mailbox Performance & Deliverability
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> 
                <span className="font-semibold text-green-800">System Healthy</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            
            <div className="lg:col-span-2 p-6">
              <table className="w-full text-sm text-left">
                <thead className="text-gray-500 font-semibold mb-2">
                  <tr>
                    <th className="pb-3">Mailbox</th>
                    <th className="pb-3 text-right">Sent</th>
                    <th className="pb-3 text-right">Delivered</th>
                    <th className="pb-3 text-right">Bounced</th>
                    <th className="pb-3 text-right">Replies</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.mailboxPerformance.map((m: any, i: number) => (
                    <tr key={i}>
                      <td className="py-3 font-medium text-gray-900">{m.email}</td>
                      <td className="py-3 text-right text-gray-500">{m.sent}</td>
                      <td className="py-3 text-right text-gray-500">{m.delivered}</td>
                      <td className="py-3 text-right text-red-500 font-medium">{m.bounced}</td>
                      <td className="py-3 text-right font-semibold text-blue-600">{m.replies}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-gray-50/50">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Deliverability</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <div className="text-xs text-gray-500">Delivered</div>
                  <div className="text-xl font-bold text-gray-900">{data.deliverability.delivered}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Bounce Rate</div>
                  <div className="text-xl font-bold text-red-600">{data.deliverability.bounceRate}</div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Hard Bounce</span><span className="font-medium text-gray-900">{data.deliverability.breakdown.hardBounce}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Soft Bounce</span><span className="font-medium text-gray-900">{data.deliverability.breakdown.softBounce}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Spam Complaint</span><span className="font-bold text-red-600">{data.deliverability.breakdown.spamComplaint}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Unsubscribed</span><span className="font-medium text-orange-600">{data.deliverability.breakdown.unsubscribed}</span></div>
              </div>
            </div>

          </div>
        </section>

        {/* 14. RECENT ACTIVITY */}
        <section className="pb-12">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Activity className="w-4 h-4" /> Recent Activity
          </h2>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="space-y-4">
              {data.recentActivity.map((a: any, i: number) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="w-20 text-xs font-semibold text-gray-400 pt-0.5 shrink-0">{a.time}</div>
                  <div className="flex-1 text-sm text-gray-700">
                    {a.text.includes('Reply') ? <span className="font-medium text-blue-700">{a.text}</span> : 
                     a.text.includes('CSV') ? <span className="text-gray-900">{a.text}</span> :
                     a.text.includes('suppression') ? <span className="text-red-600">{a.text}</span> :
                     a.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}

// KPI CARD COMPONENT
function KpiCard({ title, value, trend, positive }: { title: string, value: string, trend: string, positive: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">{title}</div>
      <div>
        <div className="text-2xl font-bold text-gray-900 mb-2">{value}</div>
        <div className={`text-xs font-semibold inline-flex items-center gap-1 px-2 py-0.5 rounded ${positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {trend.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : trend.startsWith('-') ? <TrendingDown className="w-3 h-3" /> : null}
          {trend}
        </div>
      </div>
    </div>
  );
}
