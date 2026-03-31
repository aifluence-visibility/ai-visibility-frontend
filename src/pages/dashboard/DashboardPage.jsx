import React, { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import { GlassCard, KpiCard, ScoreGauge, SectionHeader, CompetitorBarChart } from "../../shared/components";
import { computeVisibilityScore, computeCompetitorDominance, computeTrafficLossPct } from "../../shared/utils/insightEngine";

function scoreBand(score) {
  if (score < 35) return { label: "LOW", tone: "text-red-300" };
  if (score < 70) return { label: "MEDIUM", tone: "text-amber-300" };
  return { label: "HIGH", tone: "text-emerald-300" };
}

export default function DashboardPage() {
  const {
    data,
    hasAnalyzedOnce,
    loading,
    brandName,
    isQuickMode,
    isProSubscriber,
    isStrategyAddonEnabled,
    analysisHistory,
    upgradeToPro,
    unlockStrategyAddon,
    setPremiumModalOpen,
  } = useAnalysis();

  const vis = useMemo(() => computeVisibilityScore(data), [data]);
  const compDom = useMemo(() => computeCompetitorDominance(data), [data]);
  const trafficLoss = useMemo(() => computeTrafficLossPct(data), [data]);
  const band = useMemo(() => scoreBand(vis), [vis]);
  const regionRows = useMemo(() => data.regionVisibility || [], [data.regionVisibility]);
  const promptRows = useMemo(() => data.promptRows || [], [data.promptRows]);
  const topCompetitors = useMemo(() => data.topCompetitors || [], [data.topCompetitors]);
  const opportunities = useMemo(() => (data.queryInsights || []).slice(0, 6), [data.queryInsights]);

  if (loading && !hasAnalyzedOnce) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="text-sm text-slate-400">Preparing your AI visibility dashboard…</p>
      </div>
    );
  }

  if (!hasAnalyzedOnce) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <span className="text-5xl">📊</span>
        <p className="text-lg font-bold text-white">Run your first paid AI visibility analysis</p>
        <p className="max-w-md text-sm text-slate-400">
          AI is deciding for your customers. We show where you are invisible.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-7">
      <GlassCard className="border border-red-500/30 p-6" glow="bg-red-500">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-red-300">AI decision risk</p>
            <h1 className="mt-2 text-3xl font-bold tracking-[-0.03em] text-white md:text-4xl">
              You are missing from {trafficLoss}% of AI answers
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Your competitors are being recommended instead of you.
            </p>
          </div>
          <button
            onClick={() => setPremiumModalOpen(true)}
            className="rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:shadow-red-500/30"
          >
            Recover your AI visibility
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="AI Visibility Score" value={vis} suffix="/100" color={vis < 35 ? "#f87171" : vis < 70 ? "#fbbf24" : "#34d399"} icon="🎯" sub={`Status: ${band.label}`} />
        <KpiCard label="Answers Missing" value={trafficLoss} suffix="%" color="#f87171" icon="📉" sub="You are not being recommended" />
        <KpiCard label="Competitor Pressure" value={compDom} suffix="%" color="#fb923c" icon="⚔️" sub="AI recommendation concentration" />
        <KpiCard label="Detected Competitors" value={data.detectedCompetitors?.length || 0} color="#60a5fa" icon="🧠" sub={`${data.detectedOnlyCount || 0} not in your input list`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-6" glow="bg-indigo-500">
          <SectionHeader icon="🎯" title="AI Visibility Score" subtitle="Overall recommendation presence" />
          <div className="mt-4 flex flex-col items-center">
            <ScoreGauge score={vis} />
            <p className={`mt-3 text-xs font-black tracking-[0.22em] ${band.tone}`}>{band.label}</p>
          </div>
          <p className="mt-4 text-sm text-slate-400">
            AI is deciding for your customers. We show where you are invisible.
          </p>
        </GlassCard>

        <GlassCard className="p-6" glow="bg-cyan-500">
          <SectionHeader icon="🌍" title="Visibility by Region" subtitle="Auto-scanned: US, UK, Germany" />
          <div className="mt-4 h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regionRows} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="region" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: 12 }} />
                <Bar dataKey="score" fill="#22d3ee" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-sm text-slate-400">{data.regionInsight}</p>
        </GlassCard>
      </div>

      <GlassCard className="p-6" glow="bg-rose-500">
        <SectionHeader icon="⚔️" title="Competitor Analysis" subtitle="AI-detected + user-provided competitors" />
        <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <CompetitorBarChart
              competitors={topCompetitors}
              brandName={data.brandName}
              brandMentions={data.totalMentions || 0}
              total={(data.competitorMentionTotal || 0) + (data.totalMentions || 0)}
            />
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-cyan-300/80">Your competitors</p>
              <p className="mt-2 text-sm text-slate-300">{(data.userCompetitors || []).join(", ") || "None provided"}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300/80">AI detected</p>
              <p className="mt-2 text-sm text-slate-300">{(data.detectedCompetitors || []).slice(0, 8).join(", ") || "No strong competitor mentions"}</p>
            </div>
            <p className="text-sm text-amber-200">We found {data.detectedOnlyCount || 0} competitors you didn’t include.</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6" glow="bg-violet-500">
        <SectionHeader icon="🧾" title="Prompt-Level Analysis" subtitle="Where you are seen vs not seen" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-slate-700/40 text-left text-[11px] uppercase tracking-[0.16em] text-slate-500">
                <th className="py-3 pr-3">Prompt</th>
                <th className="py-3 pr-3">Status</th>
                <th className="py-3 pr-3">Brand Mentions</th>
                <th className="py-3">Appearing Competitors</th>
              </tr>
            </thead>
            <tbody>
              {promptRows.map((row) => (
                <tr key={row.prompt} className="border-b border-slate-800/40">
                  <td className="py-3 pr-3 text-slate-200">{row.prompt}</td>
                  <td className="py-3 pr-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${row.status === "Seen" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-slate-300">{row.brandMentions}</td>
                  <td className="py-3 text-slate-400">{row.competitors?.join(", ") || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard className="p-6" glow="bg-emerald-500">
        <SectionHeader icon="💡" title="Where You Are Missing" subtitle="Gaps, weak areas, and quick wins" />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {opportunities.map((item) => (
            <div key={item.query} className="rounded-xl border border-slate-700/40 bg-slate-900/45 p-4">
              <p className="text-sm font-semibold text-white">{item.query}</p>
              <p className="mt-1 text-xs text-slate-400">Top competitor: {item.topCompetitor} ({item.dominancePct || 0}% share)</p>
              <p className="mt-2 text-xs text-amber-200">Quick win: build targeted page + citation-ready proof.</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        <GlassCard className="p-6 border border-amber-400/30" glow="bg-amber-500">
          <SectionHeader icon="🔒" title="Unlock AI Strategy" subtitle="AI Strategy & 7-Day Recovery Plan add-on" />
          {isStrategyAddonEnabled ? (
            <div className="mt-4 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
              <p className="text-sm font-bold text-emerald-200">AI Strategy add-on active</p>
              <p className="mt-1 text-xs text-slate-300">Your strategy recommendations are unlocked in the Actions and Recovery sections.</p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• What content to create first</li>
                <li>• Which prompts to target now</li>
                <li>• How to outperform competitors</li>
              </ul>
              <button
                onClick={unlockStrategyAddon}
                className="mt-4 rounded-xl bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg transition hover:shadow-amber-500/30"
              >
                Unlock Strategy
              </button>
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6" glow="bg-blue-500">
          <SectionHeader icon="📚" title="History & Tracking" subtitle="Saved reports and trend continuity" />
          {!isProSubscriber ? (
            <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/10 p-4">
              <p className="text-sm font-semibold text-white">PRO required for full history and ongoing tracking.</p>
              <button
                onClick={upgradeToPro}
                className="mt-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white"
              >
                Upgrade to PRO ($29/month)
              </button>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {(analysisHistory || []).slice(0, 5).map((item, idx) => (
                <div key={`${item.timestamp}-${idx}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
                  <span className="text-slate-200">{item.brandName}</span>
                  <span className="text-cyan-300">{item.score}/100</span>
                </div>
              ))}
              {!analysisHistory?.length && <p className="text-sm text-slate-400">Your first saved report will appear here.</p>}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}