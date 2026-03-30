import React, { useMemo } from "react";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import {
  computeVisibilityScore, computeOpportunityScore, computeSentimentScore,
  computeCompetitorDominance, computeTrafficLossPct, getCompetitorVsYou,
  generateDecisionSummary,
} from "../../shared/utils/insightEngine";
import { GlassCard, SectionHeader, ScoreGauge, PaywallSection, DecisionSummary } from "../../shared/components";
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";

function MiniGauge({ score, label, color, size = 110 }) {
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="68%" outerRadius="100%" barSize={10} data={[{ value: score, fill: color }]} startAngle={210} endAngle={-30}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
            <RadialBar background={{ fill: "#1e293b" }} dataKey="value" cornerRadius={10} angleAxisId={0} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black tabular-nums" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="mt-1 text-[11px] font-semibold text-slate-400">{label}</span>
    </div>
  );
}

export default function VisibilityScorePage() {
  const { data, loading, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, brandName } = useAnalysis();

  const vis = useMemo(() => computeVisibilityScore(data), [data]);
  const opp = useMemo(() => computeOpportunityScore(data), [data]);
  const sentiment = useMemo(() => computeSentimentScore(data), [data]);
  const compDom = useMemo(() => computeCompetitorDominance(data), [data]);
  const trafficLoss = useMemo(() => computeTrafficLossPct(data), [data]);
  const cvsy = useMemo(() => getCompetitorVsYou(data), [data]);
  const summary = useMemo(() => generateDecisionSummary(data, "visibility"), [data]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>;
  if (!hasAnalyzedOnce) return <div className="flex flex-col items-center justify-center py-32 text-center"><span className="text-5xl mb-4">🎯</span><p className="text-lg font-bold text-white">Run an analysis first</p></div>;

  const categoryScores = data.globalCategoryScores || {};
  const categories = Object.entries(categoryScores).map(([name, val]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    score: typeof val === "number" ? val : Number(val?.score ?? val?.percentage ?? 0),
  })).filter(c => c.score > 0);

  const posAnalysis = data.positionAnalysis || {};
  const ctxAnalysis = data.contextAnalysis || {};

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Decision Summary */}
      <DecisionSummary summary={summary} />

      {/* Hero */}
      <div className="text-center mb-2">
        <h2 className="text-2xl font-black text-white">Lumio Score</h2>
        <p className="text-sm text-slate-400 mt-1">How your brand performs across AI recommendation engines</p>
      </div>

      {/* Main score + sub-scores */}
      <div className="grid md:grid-cols-3 gap-6">
        <GlassCard className="p-8 flex flex-col items-center col-span-1" glow="bg-indigo-500">
          <ScoreGauge score={vis} size={200} />
          <p className="mt-4 text-xs text-slate-400 text-center max-w-xs">{data.summaryInsight}</p>
        </GlassCard>

        <div className="col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          <GlassCard className="p-4 flex flex-col items-center justify-center">
            <MiniGauge score={opp} label="Opportunity" color="#22c55e" />
          </GlassCard>
          <GlassCard className="p-4 flex flex-col items-center justify-center">
            <MiniGauge score={sentiment} label="Sentiment" color="#3b82f6" />
          </GlassCard>
          <GlassCard className="p-4 flex flex-col items-center justify-center">
            <MiniGauge score={Math.min(compDom, 99)} label="Comp Pressure" color="#ef4444" />
          </GlassCard>
          <GlassCard className="p-4 flex flex-col items-center justify-center">
            <MiniGauge score={trafficLoss} label="Traffic Loss" color="#f97316" />
          </GlassCard>
        </div>
      </div>

      {/* What this means */}
      <GlassCard className="p-6" glow="bg-blue-500">
        <SectionHeader icon="📋" title="What This Means" subtitle="Decision-ready interpretation of your scores" />
        <div className="mt-4 space-y-3">
          {vis < 40 && (
            <div className="flex items-start gap-3 rounded-xl bg-red-500/5 border border-red-500/20 p-4">
              <span className="text-base">🔴</span>
              <div><p className="text-sm font-semibold text-red-300">Critical visibility gap</p><p className="text-xs text-slate-400 mt-1">AI systems rarely mention {data.brandName}. When users ask about your category, competitors own the conversation.</p></div>
            </div>
          )}
          {compDom > 50 && (
            <div className="flex items-start gap-3 rounded-xl bg-amber-500/5 border border-amber-500/20 p-4">
              <span className="text-base">⚠️</span>
              <div><p className="text-sm font-semibold text-amber-300">{cvsy.competitor} dominates {compDom}% of mentions</p><p className="text-xs text-slate-400 mt-1">A single competitor controls the AI narrative. Without counter-positioning, they'll keep growing while you stall.</p></div>
            </div>
          )}
          {trafficLoss > 20 && (
            <div className="flex items-start gap-3 rounded-xl bg-orange-500/5 border border-orange-500/20 p-4">
              <span className="text-base">📉</span>
              <div><p className="text-sm font-semibold text-orange-300">{trafficLoss}% of queries show no brand presence</p><p className="text-xs text-slate-400 mt-1">These are high-intent queries where potential customers are actively looking for solutions like yours — but AI never suggests you.</p></div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Category breakdown */}
      <PaywallSection locked={isQuickMode && categories.length > 2} title={`${brandName} is invisible in key categories`} description={`Competitors won queries ${brandName} should own — every day without this data is more traffic gone`} cta="Recover Your Traffic" onUnlock={() => setPremiumModalOpen(true)}>
        <GlassCard className="p-6">
          <SectionHeader icon="📊" title="Category Scores" subtitle="Performance by query type" />
          <div className="mt-4 space-y-3">
            {(categories.length > 0 ? categories : [
              { name: "Generic", score: Math.round(vis * 0.8) },
              { name: "Comparison", score: Math.round(vis * 0.5) },
              { name: "Brand", score: Math.round(vis * 1.2) },
              { name: "Niche", score: Math.round(vis * 0.6) },
            ]).map((cat) => {
              const barColor = cat.score <= 30 ? "bg-red-500" : cat.score <= 60 ? "bg-amber-500" : "bg-emerald-500";
              return (
                <div key={cat.name} className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-slate-300 w-28 shrink-0">{cat.name}</span>
                  <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(100, cat.score)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white w-8 text-right">{Math.min(100, Math.round(cat.score))}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </PaywallSection>

      {/* Position & Context */}
      <div className="grid md:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <SectionHeader icon="📍" title="Position Analysis" subtitle="Where your brand appears in AI responses" />
          <div className="mt-4 space-y-3">
            {[
              { key: "beginning", label: "Beginning (best)", color: "bg-emerald-500" },
              { key: "middle", label: "Middle", color: "bg-blue-500" },
              { key: "end", label: "End", color: "bg-amber-500" },
              { key: "none", label: "Not mentioned", color: "bg-red-500" },
            ].map(({ key, label, color }) => {
              const val = Number(posAnalysis[key] || 0);
              const total = Object.values(posAnalysis).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
              const pct = Math.round((val / total) * 100);
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-32 shrink-0">{label}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-white w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <SectionHeader icon="🧩" title="Context Analysis" subtitle="How AI formats your brand mentions" />
          <div className="mt-4 space-y-3">
            {[
              { key: "listFormat", label: "In lists", icon: "📋" },
              { key: "comparisonFormat", label: "In comparisons", icon: "⚖️" },
              { key: "paragraphExplanation", label: "In paragraphs", icon: "📝" },
            ].map(({ key, label, icon }) => {
              const val = Number(ctxAnalysis[key] || 0);
              return (
                <div key={key} className="flex items-center gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 px-4 py-3">
                  <span className="text-base">{icon}</span>
                  <span className="flex-1 text-sm text-slate-300">{label}</span>
                  <span className="text-lg font-black text-white">{val}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* What to do next */}
      <GlassCard className="p-6" glow="bg-emerald-500">
        <SectionHeader icon="✅" title="What To Do Next" subtitle="Top priority actions based on your score" />
        <div className="mt-4 space-y-2">
          {(data.recommendations || []).slice(0, 3).map((rec, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-slate-900/50 border border-slate-700/30 p-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-black shrink-0">{i + 1}</div>
              <p className="text-sm text-slate-300">{rec}</p>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
