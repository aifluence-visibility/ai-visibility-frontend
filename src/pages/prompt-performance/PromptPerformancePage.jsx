import React, { useMemo } from "react";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import { getTopCompetitor, generateDecisionSummary } from "../../shared/utils/insightEngine";
import { GlassCard, SectionHeader, KpiCard, StatusBadge, PaywallSection, DecisionSummary } from "../../shared/components";

export default function PromptPerformancePage() {
  const { data, loading, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, brandName } = useAnalysis();

  const topComp = useMemo(() => getTopCompetitor(data), [data]);
  const queryInsights = data?.queryInsights || [];
  const detail = data?.detail || {};
  const globalResults = detail.globalResults || [];

  const missedQueries = queryInsights;
  const summary = useMemo(() => generateDecisionSummary(data, "prompts"), [data]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>;
  if (!hasAnalyzedOnce) return <div className="flex flex-col items-center justify-center py-32 text-center"><span className="text-5xl mb-4">🔍</span><p className="text-lg font-bold text-white">Run an analysis first</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <DecisionSummary summary={summary} />
      <div>
        <h2 className="text-2xl font-black text-white">Prompt Performance</h2>
        <p className="text-sm text-slate-400 mt-1">How your brand performs across individual AI prompts</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Total Prompts" value={data.promptCount || 0} icon="🔍" color="#3b82f6" sub="Queries analyzed" />
        <KpiCard label="Brand Mentioned" value={data.totalMentions || 0} icon="✅" color="#22c55e" sub={`${data.responseCount || 0} responses checked`} />
        <KpiCard label="Missed Queries" value={missedQueries.length} icon="❌" color="#ef4444" sub="Competitor-only queries" pulse={missedQueries.length > 3} />
        <KpiCard label="Loss Rate" value={data.queryTrafficLossPct || 0} suffix="%" icon="📉" color="#f97316" />
      </div>

      {/* Missed Queries — Critical */}
      <GlassCard className="p-6" glow="bg-red-500">
        <SectionHeader icon="🚨" title="Queries Where You're Missing" subtitle="AI recommends competitors — never you" badge={`${missedQueries.length} gaps`} badgeColor="text-red-400" />
        <div className="mt-4 space-y-2">
          {missedQueries.length === 0 ? (
            <p className="text-sm text-slate-400">No missed queries detected. Great coverage!</p>
          ) : (
            missedQueries.slice(0, isQuickMode ? 3 : 20).map((q, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">"{q.query}"</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {q.topCompetitor} dominates with {q.topCompetitorMentions} mentions ({q.dominancePct}%)
                  </p>
                </div>
                <StatusBadge label={q.dominancePct > 70 ? "Critical" : q.dominancePct > 40 ? "High" : "Medium"} />
              </div>
            ))
          )}
          {isQuickMode && missedQueries.length > 3 && (
            <div className="relative mt-2">
              <div className="blur-sm pointer-events-none space-y-2">
                {missedQueries.slice(3, 6).map((q, i) => (
                  <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-700/30 bg-slate-900/40 px-4 py-3">
                    <p className="text-sm text-slate-400">{q.query}</p>
                  </div>
                ))}
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <svg className="h-5 w-5 text-red-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                <p className="text-xs font-bold text-white">+{missedQueries.length - 3} queries where {brandName} doesn't appear</p>
                <button onClick={() => setPremiumModalOpen(true)} className="mt-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-1.5 text-[10px] font-bold text-white">See {brandName}'s lost queries</button>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Per-Prompt Detail */}
      <PaywallSection locked={isQuickMode} title={`AI recommended competitors over ${brandName}`} description={`AI has been sending ${brandName}'s potential customers elsewhere — this happens hundreds of times per day`} cta="Unlock Full Strategy" onUnlock={() => setPremiumModalOpen(true)}>
        <GlassCard className="p-6">
          <SectionHeader icon="📋" title="Detailed Prompt Results" subtitle="Every prompt analyzed with full AI response context" />
          <div className="mt-4 space-y-3">
            {globalResults.slice(0, 10).map((result, i) => {
              const prompt = result?.prompt || result?.query || `Prompt ${i + 1}`;
              const mentioned = result?.brandMentioned || (result?.mentions > 0);
              const competitors = result?.competitors || [];
              return (
                <div key={i} className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white flex-1">"{prompt}"</p>
                    <span className={`shrink-0 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${mentioned ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-red-500/15 text-red-400 border border-red-500/30"}`}>
                      {mentioned ? "✓ Mentioned" : "✗ Absent"}
                    </span>
                  </div>
                  {competitors.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {competitors.slice(0, 5).map((c, ci) => (
                        <span key={ci} className="rounded-md bg-slate-800/80 border border-slate-700/40 px-2 py-0.5 text-[10px] text-slate-400">
                          {typeof c === "string" ? c : c?.name || "Competitor"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {globalResults.length === 0 && (
              <p className="text-sm text-slate-500">Detailed prompt results available in full analysis mode.</p>
            )}
          </div>
        </GlassCard>
      </PaywallSection>

      {/* What to do */}
      <GlassCard className="p-6" glow="bg-emerald-500">
        <SectionHeader icon="✅" title="What To Do Next" />
        <div className="mt-3 space-y-2">
          {missedQueries.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
              <span className="text-emerald-400 font-black text-sm">1</span>
              <p className="text-sm text-slate-300">Create dedicated content for: "{missedQueries[0]?.query}"</p>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
            <span className="text-emerald-400 font-black text-sm">{missedQueries.length > 0 ? "2" : "1"}</span>
            <p className="text-sm text-slate-300">Build comparison pages targeting "{data.brandName} vs {topComp?.name || "competitor"}" queries</p>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
            <span className="text-emerald-400 font-black text-sm">{missedQueries.length > 0 ? "3" : "2"}</span>
            <p className="text-sm text-slate-300">Publish structured FAQ pages with Q&A format AI can directly cite</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
