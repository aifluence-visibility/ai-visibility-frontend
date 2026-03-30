import React, { useMemo } from "react";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import {
  computeOpportunityScore, detectMissingPatterns, getTopCompetitor,
  generateDecisionSummary,
} from "../../shared/utils/insightEngine";
import { GlassCard, SectionHeader, KpiCard, StatusBadge, PaywallSection, DecisionSummary } from "../../shared/components";

export default function OpportunitiesPage() {
  const { data, loading, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, brandName } = useAnalysis();

  const opp = useMemo(() => computeOpportunityScore(data), [data]);
  const patterns = useMemo(() => detectMissingPatterns(data), [data]);
  const topComp = useMemo(() => getTopCompetitor(data), [data]);
  const queryInsights = data?.queryInsights || [];
  const summary = useMemo(() => generateDecisionSummary(data, "opportunities"), [data]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>;
  if (!hasAnalyzedOnce) return <div className="flex flex-col items-center justify-center py-32 text-center"><span className="text-5xl mb-4">💡</span><p className="text-lg font-bold text-white">Run an analysis first</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <DecisionSummary summary={summary} />
      <div>
        <h2 className="text-2xl font-black text-white">Missing Opportunities</h2>
        <p className="text-sm text-slate-400 mt-1">Gaps in your visibility that competitors are exploiting</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <KpiCard label="Opportunity Score" value={opp} suffix="/100" color="#22c55e" icon="💡" sub="Growth potential" />
        <KpiCard label="Gaps Detected" value={patterns.length} icon="🕳️" color="#ef4444" sub="Visibility patterns" />
        <KpiCard label="Missed Queries" value={queryInsights.length} icon="❌" color="#f97316" sub="Competitor-only queries" />
      </div>

      {/* Pattern Cards */}
      <div className="space-y-4">
        <SectionHeader icon="🔍" title="Visibility Gap Patterns" subtitle="Why AI doesn't recommend your brand" />
        {patterns.slice(0, isQuickMode ? 2 : patterns.length).map((p, i) => {
          const impactColors = { high: "border-red-500/30 bg-red-500/5", medium: "border-amber-500/30 bg-amber-500/5", low: "border-emerald-500/30 bg-emerald-500/5" };
          return (
            <GlassCard key={i} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge label={p.impact === "high" ? "Critical" : p.impact === "medium" ? "High" : "Medium"} />
                    <span className="text-[10px] uppercase tracking-wider text-slate-600 font-semibold">{p.category?.replace("-", " ")}</span>
                  </div>
                  <p className="text-sm font-bold text-white">{p.title}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{p.explanation}</p>
                </div>
              </div>
              <div className={`mt-4 rounded-xl ${impactColors[p.impact] || impactColors.medium} border p-3`}>
                <p className="text-xs font-semibold text-emerald-300">💡 Recommended Action</p>
                <p className="text-xs text-slate-300 mt-1">{p.action}</p>
              </div>
            </GlassCard>
          );
        })}
        {isQuickMode && patterns.length > 2 && (
          <div className="relative">
            <div className="blur-sm pointer-events-none space-y-4">
              {patterns.slice(2, 4).map((p, i) => (
                <GlassCard key={i} className="p-5">
                  <p className="text-sm font-bold text-white">{p.title}</p>
                  <p className="text-xs text-slate-400 mt-2">{p.explanation}</p>
                </GlassCard>
              ))}
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <svg className="h-5 w-5 text-red-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              <p className="text-xs font-bold text-white">+{patterns.length - 2} more gaps costing {brandName} traffic</p>
              <button onClick={() => setPremiumModalOpen(true)} className="mt-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-1.5 text-[10px] font-bold text-white">See {brandName}'s missing gaps</button>
            </div>
          </div>
        )}
      </div>

      {/* Query Opportunity Table */}
      <PaywallSection locked={isQuickMode && queryInsights.length > 3} title={`${brandName} lost these queries to competitors`} description={`Every query below sent traffic to competitors instead of ${brandName}`} cta="Recover Your Traffic" onUnlock={() => setPremiumModalOpen(true)}>
        <GlassCard className="p-6">
          <SectionHeader icon="🎯" title="Query-Level Opportunities" subtitle="Each query represents a conversion opportunity you're losing" />
          <div className="mt-4 space-y-2">
            {queryInsights.map((q, i) => {
              const diffLevel = q.dominancePct > 70 ? "Hard" : q.dominancePct > 40 ? "Medium" : "Easy";
              const diffColor = diffLevel === "Easy" ? "text-emerald-400" : diffLevel === "Medium" ? "text-amber-400" : "text-red-400";
              return (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-700/30 bg-slate-900/40 px-4 py-3 hover:border-slate-600/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">"{q.query}"</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{q.topCompetitor} at {q.dominancePct}% dominance</p>
                  </div>
                  <span className={`text-xs font-bold ${diffColor}`}>{diffLevel}</span>
                  <StatusBadge label={q.dominancePct > 60 ? "Critical" : "High"} />
                </div>
              );
            })}
            {queryInsights.length === 0 && <p className="text-sm text-slate-500">No missed queries detected.</p>}
          </div>
        </GlassCard>
      </PaywallSection>

      {/* What to do */}
      <GlassCard className="p-6" glow="bg-emerald-500">
        <SectionHeader icon="✅" title="Priority Actions" subtitle="Capture these opportunities before competitors strengthen their hold" />
        <div className="mt-3 space-y-2">
          {queryInsights.slice(0, 2).map((q, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
              <span className="text-emerald-400 font-black text-sm">{i + 1}</span>
              <div>
                <p className="text-sm font-semibold text-white">Target "{q.query}" with dedicated content</p>
                <p className="text-xs text-slate-400 mt-1">Currently dominated by {q.topCompetitor}. A comparison page can recover this query in 2-4 weeks.</p>
              </div>
            </div>
          ))}
          {topComp && (
            <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
              <span className="text-emerald-400 font-black text-sm">{Math.min(3, queryInsights.length + 1)}</span>
              <div>
                <p className="text-sm font-semibold text-white">Publish "{data.brandName} vs {topComp.name}" comparison</p>
                <p className="text-xs text-slate-400 mt-1">Head-to-head comparison content is the #1 format AI cites for recommendation queries.</p>
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
