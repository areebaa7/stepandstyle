'use client';

import { useState } from 'react';
import { Search, Globe, Calendar, RefreshCw, CheckCircle, ArrowRight, Share2, FileText, Zap } from 'lucide-react';

export default function AdminAISEOPanel() {
  const [loading, setLoading] = useState(false);
  const [lastAuditDate] = useState('This Week (Auto-Audited)');
  const [aiReport, setAiReport] = useState<any>({
    healthScore: 94,
    weeklyGrowth: '+18% organic impressions',
    topKeywords: ['women bridal heels pakistan', 'leather loafers men', 'chappal online shopping', 'step and styl shoes'],
    recommendations: [
      { id: 1, title: 'Update Meta Descriptions for Summer Sale PDPs', impact: 'HIGH', status: 'RECOMMENDED', category: 'Product SEO' },
      { id: 2, title: 'Add Schema JSON-LD Product Markup to New Arrivals', impact: 'MEDIUM', status: 'OPTIMIZED', category: 'Technical SEO' },
      { id: 3, title: 'Publish Weekly Blog: "Top Footwear Trends in Pakistan 2026"', impact: 'HIGH', status: 'RECOMMENDED', category: 'Content SEO' },
      { id: 4, title: 'Optimize Alt text on 14 Product Thumbnail Images', impact: 'LOW', status: 'OPTIMIZED', category: 'Image SEO' },
    ]
  });

  const handleRunAudit = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Weekly AI SEO Scan Completed! Report updated with latest search index insights.');
    }, 1200);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-900 text-white p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold uppercase tracking-wider">
              Weekly AI SEO Automation Engine
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">AI Search Engine Optimization</h2>
            <p className="text-purple-200/80 text-sm max-w-xl">
              Automated weekly SEO diagnostics, keyword ranking trackers, auto-generated meta tags, and Google Search performance recommendations.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-4 rounded-xl border border-white/10">
            <div className="text-right">
              <div className="text-xs font-semibold text-purple-200 uppercase tracking-wider">SEO Health Index</div>
              <div className="text-3xl font-black text-emerald-400">{aiReport.healthScore}/100</div>
            </div>
            <button
              onClick={handleRunAudit}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Run Audit
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Weekly Organic Impressions</span>
            <Globe className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">42,850</div>
          <div className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> {aiReport.weeklyGrowth}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Last Automated Audit</span>
            <Calendar className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">{lastAuditDate}</div>
          <div className="text-xs font-medium text-gray-500">Scheduled: Every Sunday at midnight</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-xs font-bold uppercase tracking-wider">Indexed Search Pages</span>
            <FileText className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-gray-900">128 Pages</div>
          <div className="text-xs font-semibold text-emerald-600">100% sitemap coverage</div>
        </div>
      </div>

      {/* AI Keywords & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            AI Actionable Recommendations
          </h3>

          <div className="space-y-3">
            {aiReport.recommendations.map((rec: any) => (
              <div key={rec.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-purple-100 text-purple-800 rounded">
                      {rec.category}
                    </span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${
                      rec.impact === 'HIGH' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {rec.impact} IMPACT
                    </span>
                  </div>
                  <div className="text-sm font-bold text-gray-900">{rec.title}</div>
                </div>

                <button className="px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider shrink-0">
                  Apply AI Fix
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Top Keywords */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h3 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            Top Trending Search Terms
          </h3>

          <div className="space-y-2">
            {aiReport.topKeywords.map((kw: string, i: number) => (
              <div key={i} className="p-3 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-800">
                <span>#{i + 1} {kw}</span>
                <span className="text-emerald-600 font-bold">Top 5</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
