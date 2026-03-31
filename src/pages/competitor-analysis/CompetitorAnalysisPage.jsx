import React, { useMemo } from "react";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import {
  computeCompetitorDominance, getCompetitorVsYou, getShockMetrics,
  generateDecisionSummary,
} from "../../shared/utils/insightEngine";
import { GlassCard, SectionHeader, KpiCard, CompetitorBarChart, PaywallSection, StatusBadge, DecisionSummary } from "../../shared/components";

export default function CompetitorAnalysisPage() {
  const { data, loading, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, brandName } = useAnalysis();

  const compDom = useMemo(() => computeCompetitorDominance(data), [data]);
  const cvsy = useMemo(() => getCompetitorVsYou(data), [data]);
  const shock = useMemo(() => getShockMetrics(data), [data]);
  const competitors = data?.topCompetitors || [];
    const competitorCount = Math.max(1, competitors.length);
  const total = (data?.competitorMentionTotal || 0) + (data?.totalMentions || 0);
  const summary = useMemo(() => generateDecisionSummary(data, "competitors"), [data]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>;
  if (!hasAnalyzedOnce) return <div className="flex flex-col items-center justify-center py-32 text-center"><span className="text-5xl mb-4">⚔️</span><p className="text-lg font-bold text-white">Run an analysis first</p></div>;

  return (
    <div className="space-y-6 max-w-7xl">
      <DecisionSummary summary={summary} />
      <div>
        <h2 className="text-2xl font-black text-white">Competitor Analysis</h2>
        <p className="text-sm text-slate-400 mt-1">Who owns your market in AI recommendations — and how to fight back</p>
      </div>

      {/* Hero KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Competitors Detected" value={competitorCount} icon="⚔️" color="#ef4444" />
        <KpiCard label="Top Competitor Share" value={compDom} suffix="%" icon="👑" color="#f97316" sub={cvsy.competitor} />
        <KpiCard label="Your Share" value={cvsy.yourVisibility} suffix="%" icon="🎯" color="#3b82f6" sub={data.brandName} />
        <KpiCard label="Dominance Ratio" value={`${cvsy.ratio}x`} icon="📊" color="#ef4444" sub={`${cvsy.competitor} vs you`} pulse={cvsy.ratio >= 3} />
      </div>

      {/* You vs #1 */}
      <GlassCard className="p-6" glow="bg-red-500">
        <SectionHeader icon="🥊" title={`${data.brandName} vs ${cvsy.competitor}`} subtitle="Head-to-head visibility comparison" />
        <div className="mt-6 space-y-4">
          {/* Brand bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-blue-400">{data.brandName}</span>
              <span className="text-sm font-bold text-blue-400">{cvsy.yourVisibility}%</span>
            </div>
            <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all" style={{ width: `${cvsy.yourVisibility}%` }} />
            </div>
          </div>
          {/* Competitor bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-semibold text-red-400">{cvsy.competitor}</span>
              <span className="text-sm font-bold text-red-400">{cvsy.competitorVisibility}%</span>
            </div>
            <div className="h-4 rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all" style={{ width: `${cvsy.competitorVisibility}%` }} />
            </div>
          </div>

          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 mt-4">
            <p className="text-sm text-red-300 font-semibold">⚠️ {cvsy.competitor} appears {cvsy.ratio}x more often than {data.brandName}</p>
            <p className="text-xs text-slate-400 mt-1">
              This means when potential customers ask AI for recommendations, {cvsy.competitor} is mentioned ~{shock.competitorAppearsPct}% of the time while you appear ~{shock.brandAppearsPct}%.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Full competitor chart */}
      <GlassCard className="p-6" glow="bg-rose-500">
        <SectionHeader icon="📊" title="AI Share of Voice" subtitle="How mentions are distributed across competitors" />
        <div className="mt-4">
          <CompetitorBarChart competitors={competitors} brandName={data.brandName} brandMentions={data.totalMentions || 0} total={total} />
        </div>
        <div className="mt-4 rounded-xl border border-slate-700/40 bg-slate-900/45 p-3 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">What this means</p>
          <p className="text-xs text-slate-300">Competitor share-of-voice is concentrated, which means recommendation wins are currently compounding for the top players.</p>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Why it matters</p>
          <p className="text-xs text-slate-300">If concentration stays high, your brand is less likely to be surfaced in decision-stage prompts where conversions happen.</p>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">What to do</p>
          <p className="text-xs text-slate-300">Attack the top competitor's winning prompts first, then build source diversity (list + Reddit + reviews) to reduce dominance concentration.</p>
        </div>
      </GlassCard>

      {/* Competitor detail table */}
      <PaywallSection locked={isQuickMode} title={`Competitors took more of ${brandName}'s traffic`} description={`They gained ground while ${brandName} stood still`} cta="Stop Losing Visibility" onUnlock={() => setPremiumModalOpen(true)} ctaColor="from-red-600 to-orange-500">
        <GlassCard className="p-6">
          <SectionHeader icon="📋" title="Competitor Profiles" subtitle="Detailed analysis of each competitor's AI presence" />
          <div className="mt-4 space-y-3">
            {competitors.map((comp, i) => {
              const mentionCountDisplay = Math.max(1, Number(comp.mentionCount) || 0);
              const pct = Math.max(3, total > 0 ? Math.round((mentionCountDisplay / total) * 100) : 3);
              return (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-700/30 bg-slate-900/40 p-4 hover:border-slate-600/50 transition-colors">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400 font-black text-sm shrink-0">
                    #{i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{comp.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{mentionCountDisplay} mentions • {pct}% share</p>
                    {comp.whyItAppears && <p className="text-[11px] text-slate-400 mt-1 truncate">{comp.whyItAppears}</p>}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-red-500" style={{ width: `${pct}%` }} />
                    </div>
                    <StatusBadge label={pct > 30 ? "Critical" : pct > 15 ? "High" : "Medium"} />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </PaywallSection>

      {/* What to do */}
      <GlassCard className="p-6" glow="bg-emerald-500">
        <SectionHeader icon="✅" title="How To Fight Back" subtitle="Strategic actions to reduce competitor dominance" />
        <div className="mt-3 space-y-2">
          {competitors[0] && (
            <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
              <span className="text-emerald-400 font-black text-sm">1</span>
              <div>
                <p className="text-sm font-semibold text-white">Create "{data.brandName} vs {competitors[0].name}" page</p>
                <p className="text-xs text-slate-400 mt-1">Capture head-to-head comparison queries. This is the #1 format AI cites.</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
            <span className="text-emerald-400 font-black text-sm">2</span>
            <div>
              <p className="text-sm font-semibold text-white">Get listed in "best of" roundup articles</p>
              <p className="text-xs text-slate-400 mt-1">AI systems heavily cite list-format content. Appearing alongside competitors is the fastest path to parity.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
            <span className="text-emerald-400 font-black text-sm">3</span>
            <div>
              <p className="text-sm font-semibold text-white">Publish differentiation content</p>
              <p className="text-xs text-slate-400 mt-1">Create content that clearly positions your unique strengths vs competitors. AI needs structured signals to cite you differently.</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
