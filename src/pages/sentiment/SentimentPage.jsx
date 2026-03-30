import React, { useMemo } from "react";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import { computeSentimentScore, generateDecisionSummary } from "../../shared/utils/insightEngine";
import { GlassCard, SectionHeader, KpiCard, ScoreGauge, PaywallSection, DecisionSummary } from "../../shared/components";

export default function SentimentPage() {
  const { data, loading, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, brandName } = useAnalysis();

  const sentiment = useMemo(() => computeSentimentScore(data), [data]);
  const posAnalysis = data?.positionAnalysis || {};
  const ctxAnalysis = data?.contextAnalysis || {};
  const topSources = data?.topSources || [];
  const posTotal = Object.values(posAnalysis).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const summary = useMemo(() => generateDecisionSummary(data, "sentiment"), [data]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>;
  if (!hasAnalyzedOnce) return <div className="flex flex-col items-center justify-center py-32 text-center"><span className="text-5xl mb-4">💬</span><p className="text-lg font-bold text-white">Run an analysis first</p></div>;

  const sentLabel = sentiment <= 30 ? "Negative" : sentiment <= 60 ? "Neutral" : "Positive";

  return (
    <div className="space-y-6 max-w-7xl">
      <DecisionSummary summary={summary} />
      <div>
        <h2 className="text-2xl font-black text-white">Sentiment & Positioning</h2>
        <p className="text-sm text-slate-400 mt-1">How AI perceives and positions your brand in recommendations</p>
      </div>

      {/* Hero */}
      <div className="grid md:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex flex-col items-center" glow="bg-blue-500">
          <ScoreGauge score={sentiment} size={180} label={sentLabel} />
          <p className="mt-3 text-xs text-slate-400 text-center">AI sentiment toward {data.brandName}</p>
        </GlassCard>

        <div className="col-span-2 grid grid-cols-2 gap-4">
          <KpiCard label="First Position" value={Math.round((Number(posAnalysis.beginning || 0) / posTotal) * 100)} suffix="%" icon="🥇" color="#22c55e" sub="Mentioned first" />
          <KpiCard label="Last Position" value={Math.round((Number(posAnalysis.end || 0) / posTotal) * 100)} suffix="%" icon="🥉" color="#f97316" sub="Mentioned last" />
          <KpiCard label="Not Mentioned" value={Math.round((Number(posAnalysis.none || 0) / posTotal) * 100)} suffix="%" icon="🚫" color="#ef4444" sub="Absent from response" />
          <KpiCard label="Source Authority" value={topSources.length} icon="📰" color="#3b82f6" sub={`${topSources.filter(s => s.confidence === "high").length} high-confidence`} />
        </div>
      </div>

      {/* Position Breakdown */}
      <GlassCard className="p-6" glow="bg-indigo-500">
        <SectionHeader icon="📍" title="Response Position Map" subtitle="Where AI places your brand within its answers" />
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-4">
            {[
              { key: "beginning", label: "Beginning", color: "bg-emerald-500", icon: "🟢" },
              { key: "middle", label: "Middle", color: "bg-blue-500", icon: "🔵" },
              { key: "end", label: "End", color: "bg-amber-500", icon: "🟡" },
              { key: "none", label: "Absent", color: "bg-red-500", icon: "🔴" },
            ].map(({ key, label, color, icon }) => {
              const val = Number(posAnalysis[key] || 0);
              const pct = Math.round((val / posTotal) * 100);
              return (
                <div key={key} style={{ width: `${Math.max(pct, 5)}%` }} className="text-center">
                  <div className={`h-8 rounded-lg ${color} flex items-center justify-center`}>
                    <span className="text-[10px] font-bold text-white">{pct}%</span>
                  </div>
                  <p className="mt-1 text-[10px] text-slate-400">{label}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-xl bg-slate-900/50 border border-slate-700/30 p-4 mt-4">
            {(posAnalysis.beginning || 0) > (posAnalysis.end || 0) ? (
              <p className="text-sm text-emerald-300">✅ <strong>Good positioning.</strong> Your brand tends to appear early in AI responses, which means higher user attention and consideration.</p>
            ) : (posAnalysis.none || 0) > posTotal * 0.4 ? (
              <p className="text-sm text-red-300">🚨 <strong>Critical positioning gap.</strong> AI frequently omits your brand entirely. Without presence in AI responses, you lose before the conversation starts.</p>
            ) : (
              <p className="text-sm text-amber-300">⚠️ <strong>Weak positioning.</strong> Your brand appears later in AI responses, meaning users have already formed preferences for competitors mentioned first.</p>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Context Format */}
      <GlassCard className="p-6">
        <SectionHeader icon="🧩" title="Content Format Analysis" subtitle="How AI structures mentions of your brand" />
        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            { key: "listFormat", label: "List mentions", icon: "📋", desc: "Included in recommendation lists" },
            { key: "comparisonFormat", label: "Comparisons", icon: "⚖️", desc: "Mentioned in comparison context" },
            { key: "paragraphExplanation", label: "Paragraph", icon: "📝", desc: "Discussed in detail" },
          ].map(({ key, label, icon, desc }) => {
            const val = Number(ctxAnalysis[key] || 0);
            return (
              <GlassCard key={key} className="p-4 text-center">
                <span className="text-2xl">{icon}</span>
                <p className="text-2xl font-black text-white mt-2">{val}</p>
                <p className="text-xs font-semibold text-slate-300 mt-1">{label}</p>
                <p className="text-[10px] text-slate-500 mt-1">{desc}</p>
              </GlassCard>
            );
          })}
        </div>
      </GlassCard>

      {/* Source Authority */}
      <PaywallSection locked={isQuickMode && topSources.length > 2} title={`${brandName}'s authority took another hit`} description={`Low-credibility sources shaped how AI described ${brandName} — the damage compounds daily`} cta="Recover Your Traffic" onUnlock={() => setPremiumModalOpen(true)}>
        <GlassCard className="p-6">
          <SectionHeader icon="📰" title="Source Authority" subtitle="Who cites your brand — and how credible they are" />
          <div className="mt-4 space-y-2">
            {topSources.map((src, i) => {
              const confColor = src.confidence === "high" ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : src.confidence === "medium" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : "text-slate-400 border-slate-600/30 bg-slate-600/10";
              return (
                <div key={i} className="flex items-center gap-4 rounded-xl border border-slate-700/30 bg-slate-900/40 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">{src.name || src.source}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{src.mentionCount} mentions • {src.type}</p>
                  </div>
                  <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${confColor}`}>
                    {src.confidence}
                  </span>
                </div>
              );
            })}
            {topSources.length === 0 && <p className="text-sm text-slate-500">No source data available. Run full analysis for source authority insights.</p>}
          </div>
        </GlassCard>
      </PaywallSection>

      {/* Actions */}
      <GlassCard className="p-6" glow="bg-emerald-500">
        <SectionHeader icon="✅" title="Improve Your Positioning" />
        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
            <span className="text-emerald-400 font-black text-sm">1</span>
            <div>
              <p className="text-sm font-semibold text-white">Create authoritative, citation-ready content</p>
              <p className="text-xs text-slate-400 mt-1">Structured FAQ pages, comparison guides, and expert-reviewed content get cited earlier in AI responses.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
            <span className="text-emerald-400 font-black text-sm">2</span>
            <div>
              <p className="text-sm font-semibold text-white">Build third-party validation</p>
              <p className="text-xs text-slate-400 mt-1">Get reviewed on G2, Capterra, and industry publications. AI systems heavily weight third-party signals.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
            <span className="text-emerald-400 font-black text-sm">3</span>
            <div>
              <p className="text-sm font-semibold text-white">Target "best of" list articles</p>
              <p className="text-xs text-slate-400 mt-1">List format is the #1 context type AI uses for recommendations. Appear in at least 5 industry lists.</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
