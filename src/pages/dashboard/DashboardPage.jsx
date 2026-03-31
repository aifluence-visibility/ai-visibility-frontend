import React, { useMemo, useState } from "react";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import { GlassCard, KpiCard, ScoreGauge, SectionHeader } from "../../shared/components";
import {
  computeVisibilityScore,
  computeCompetitorDominance,
  computeTrafficLossPct,
  getShockMetrics,
} from "../../shared/utils/insightEngine";
import {
  generateCountryVisibility,
  generateTrendData,
  detectSources,
  generateCompetitorInsights,
  generateAllInsights,
  generateGapAnalysis,
} from "../../shared/utils/dataEngines";
import { CountryVisibilityChart } from "../../shared/components/charts/CountryVisibilityChart";
import { VisibilityTrendChart } from "../../shared/components/charts/VisibilityTrendChart";
import { SourceBreakdownChart, SourceInsightCard } from "../../shared/components/charts/SourceBreakdownChart";
import { CompetitorTable, CompetitorInsightCards } from "../../shared/components/intelligence/CompetitorTable";
import { GapCards } from "../../shared/components/intelligence/GapCards";
import { ActionSimulator } from "../../shared/components/intelligence/ActionSimulator";
import { InsightCardV2 } from "../../shared/components/intelligence/InsightCardV2";
import { PremiumGate } from "../../shared/components/intelligence/PremiumGate";

function scoreBand(score) {
  if (score < 35) return { label: "CRITICAL", tone: "text-red-300" };
  if (score < 60) return { label: "NEEDS WORK", tone: "text-amber-300" };
  return { label: "HEALTHY", tone: "text-emerald-300" };
}

export default function DashboardPage() {
  const {
    data,
    hasAnalyzedOnce,
    loading,
    isProSubscriber,
    isStrategyAddonEnabled,
    analysisHistory,
    upgradeToPro,
    unlockStrategyAddon,
    setPremiumModalOpen,
  } = useAnalysis();

  const [activeSection, setActiveSection] = useState("overview");

  const vis = useMemo(() => computeVisibilityScore(data), [data]);
  const compDom = useMemo(() => computeCompetitorDominance(data), [data]);
  const trafficLoss = useMemo(() => computeTrafficLossPct(data), [data]);
  const shock = useMemo(() => getShockMetrics(data), [data]);
  const band = useMemo(() => scoreBand(vis), [vis]);

  const countryData = useMemo(() => generateCountryVisibility(data), [data]);
  const trendData = useMemo(() => generateTrendData(data), [data]);
  const sourceData = useMemo(() => detectSources(data), [data]);
  const competitorInsights = useMemo(() => generateCompetitorInsights(data), [data]);
  const allInsights = useMemo(() => generateAllInsights(data), [data]);
  const gapData = useMemo(() => generateGapAnalysis(data), [data]);

  const promptRows = data?.promptRows || [];

  if (loading && !hasAnalyzedOnce) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-32">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
        <p className="text-sm text-slate-400">Processing AI visibility intelligence...</p>
      </div>
    );
  }

  if (!hasAnalyzedOnce) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
        <span className="text-5xl">🧠</span>
        <p className="text-lg font-bold text-white">Your AI Visibility Intelligence Dashboard</p>
        <p className="max-w-md text-sm text-slate-400">
          Run your first analysis to unlock competitor intelligence, region visibility, prompt-level gaps, and your 7-day recovery plan.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl space-y-7">
      <GlassCard className="border border-red-500/30 p-6" glow="bg-red-500">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="inline-flex rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.2em] text-red-300">AI Decision Risk</span>
              {trafficLoss > 50 && <span className="inline-flex rounded-full border border-orange-400/40 bg-orange-400/10 px-2.5 py-0.5 text-[10px] font-black text-orange-300">URGENT</span>}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white md:text-4xl">
              {trafficLoss}% of AI answers send traffic to competitors
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              ~{shock.estimatedLostTraffic.toLocaleString()} visitors/mo + ~${shock.estimatedMonthlyLoss.toLocaleString()}/mo going to <span className="font-bold text-red-300">{data.topCompetitors?.[0]?.name || "competitors"}</span> instead of {data.brandName}.
            </p>
          </div>
          <button
            onClick={() => setPremiumModalOpen(true)}
            className="shrink-0 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 px-6 py-3 text-sm font-black text-white shadow-lg transition hover:shadow-red-500/30"
          >
            Recover AI visibility →
          </button>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="AI Visibility Score" value={vis} suffix="/100" color={vis < 35 ? "#f87171" : vis < 70 ? "#fbbf24" : "#34d399"} icon="🎯" sub={`Status: ${band.label}`} />
        <KpiCard label="Est. Monthly Loss" value={`$${(shock.estimatedMonthlyLoss / 1000).toFixed(1)}k`} color="#f87171" icon="💸" sub="Revenue to competitors" suffix="" />
        <KpiCard label="Competitor Pressure" value={compDom} suffix="%" color="#fb923c" icon="⚔️" sub={`${data.topCompetitors?.[0]?.name || "Competitor"} dominance`} />
        <KpiCard label="Countries Below 50" value={countryData?.chartData?.filter((country) => country.score < 50).length || 0} color="#818cf8" icon="🌍" sub={`Opportunity: ${countryData?.opportunityCountry || "None"}`} />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "overview", label: "Overview", icon: "📊" },
          { key: "competitors", label: "Competitors", icon: "⚔️" },
          { key: "regions", label: "Regions & Trends", icon: "🌍" },
          { key: "sources", label: "Sources", icon: "🔗" },
          { key: "insights", label: "Intelligence", icon: "🧠" },
          { key: "gaps", label: "Gap Analysis", icon: "🕳️" },
          { key: "simulator", label: "Simulator", icon: "⚡" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key)}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
              activeSection === tab.key
                ? "border-cyan-500/50 bg-cyan-500/15 text-cyan-300"
                : "border-slate-700/40 bg-slate-900/40 text-slate-500 hover:border-slate-600/60 hover:text-slate-300"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeSection === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6" glow="bg-indigo-500">
              <SectionHeader icon="🎯" title="AI Visibility Score" subtitle="Overall recommendation presence across AI systems" />
              <div className="mt-4 flex flex-col items-center">
                <ScoreGauge score={vis} />
                <p className={`mt-2 text-xs font-black tracking-[0.22em] ${band.tone}`}>{band.label}</p>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {(data.regionVisibility || []).map((region) => (
                  <div key={region.region} className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-3 text-center">
                    <p className="text-xs font-black text-white">{region.score}</p>
                    <p className="text-[10px] text-slate-500">{region.region}</p>
                  </div>
                ))}
              </div>
            </GlassCard>

            <GlassCard className="p-6" glow="bg-blue-500">
              <SectionHeader icon="📈" title="Visibility Trend" subtitle="Your score vs competitor average - 8 weeks" />
              <div className="mt-4">
                <VisibilityTrendChart trendData={trendData} brandName={data.brandName} />
              </div>
            </GlassCard>
          </div>

          <GlassCard className="p-6" glow="bg-violet-500">
            <SectionHeader icon="🧾" title="Prompt-Level Analysis" subtitle="Where AI recommends you vs where it recommends competitors" />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-700/40 text-left text-[10px] uppercase tracking-[0.18em] text-slate-600">
                    <th className="py-3 pr-3">Prompt</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3 pr-3">Brand hits</th>
                    <th className="py-3">Competitors appearing</th>
                  </tr>
                </thead>
                <tbody>
                  {promptRows.map((row) => (
                    <tr key={row.prompt} className="border-b border-slate-800/40 transition-colors hover:bg-white/[0.01]">
                      <td className="max-w-[260px] truncate py-3 pr-3 text-slate-200">{row.prompt}</td>
                      <td className="py-3 pr-3">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ${row.status === "Seen" ? "bg-emerald-500/15 text-emerald-300" : "bg-red-500/15 text-red-300"}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="py-3 pr-3 tabular-nums text-slate-300">{row.brandMentions}</td>
                      <td className="py-3 text-xs text-slate-500">{row.competitors?.slice(0, 3).join(", ") || "-"}</td>
                    </tr>
                  ))}
                  {!promptRows.length && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-slate-500">No prompt data yet - run full analysis.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>

          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard className="border border-amber-400/20 p-6" glow="bg-amber-500">
              <SectionHeader icon="🔒" title="AI Strategy Add-on" subtitle="7-Day Recovery Plan + Source roadmap" />
              {isStrategyAddonEnabled ? (
                <div className="mt-4 rounded-xl border border-emerald-400/25 bg-emerald-500/8 p-4">
                  <p className="text-sm font-bold text-emerald-200">Strategy add-on active ✓</p>
                  <p className="mt-1 text-xs text-slate-400">Full recovery plan unlocked in the Recovery section.</p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <ul className="space-y-1.5 text-sm text-slate-300">
                    {["What content to create first", "Which prompts to target now", "7-day day-by-day execution plan", "Region-specific strategy"].map((item) => (
                      <li key={item} className="flex items-center gap-2"><span className="text-amber-300">✓</span> {item}</li>
                    ))}
                  </ul>
                  <button onClick={unlockStrategyAddon} className="w-full rounded-xl bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 px-5 py-2.5 text-sm font-black text-slate-950 shadow-lg">
                    Unlock Strategy ($19/month)
                  </button>
                </div>
              )}
            </GlassCard>

            <GlassCard className="p-6" glow="bg-blue-500">
              <SectionHeader icon="📚" title="Analysis History" subtitle="Track visibility improvements over time" />
              {!isProSubscriber ? (
                <div className="mt-4 rounded-xl border border-cyan-400/20 bg-cyan-500/8 p-4">
                  <p className="text-sm font-semibold text-white">PRO required for history tracking.</p>
                  <button onClick={upgradeToPro} className="mt-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-2 text-sm font-bold text-white">
                    Upgrade to PRO ($29/month)
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {(analysisHistory || []).slice(0, 5).map((item, index) => (
                    <div key={`${item.timestamp}-${index}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                      <div>
                        <span className="text-sm font-semibold text-slate-200">{item.brandName}</span>
                        {item.strongestRegion && <span className="ml-2 text-[10px] text-slate-500">{item.strongestRegion}</span>}
                      </div>
                      <span className="text-sm font-black text-cyan-300">{item.score}/100</span>
                    </div>
                  ))}
                  {!analysisHistory?.length && <p className="text-sm text-slate-500">First report appears here after analysis.</p>}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}

      {activeSection === "competitors" && (
        <div className="space-y-6">
          <GlassCard className="p-6" glow="bg-red-500">
            <SectionHeader
              icon="⚔️"
              title="Competitor Intelligence"
              subtitle={`${competitorInsights.length} competitors identified - ranked by AI share-of-voice`}
              badge={`${data.detectedOnlyCount || 0} not in your list`}
              badgeColor="text-amber-400"
            />
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="rounded-xl border border-slate-700/40 bg-slate-900/50 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Your list</p>
                <p className="mt-0.5 text-sm text-slate-200">{(data.userCompetitors || []).join(", ") || "None provided"}</p>
              </div>
              <div className="rounded-xl border border-amber-400/20 bg-amber-500/5 px-3 py-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">AI-detected</p>
                <p className="mt-0.5 text-sm text-slate-200">{(data.detectedCompetitors || []).slice(0, 5).join(", ") || "None"}</p>
              </div>
            </div>
          </GlassCard>

          <CompetitorInsightCards competitorInsights={competitorInsights} brandName={data.brandName} />

          <GlassCard className="p-6" glow="bg-rose-500">
            <SectionHeader icon="📋" title="Full Competitor Analysis" subtitle="Click any row to see why they win and how to fight back" />
            <div className="mt-4">
              <CompetitorTable competitors={competitorInsights} brandName={data.brandName} totalMentions={data.totalMentions} competitorMentionTotal={data.competitorMentionTotal} />
            </div>
          </GlassCard>
        </div>
      )}

      {activeSection === "regions" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6" glow="bg-cyan-500">
              <SectionHeader icon="🌍" title="Country Visibility Engine" subtitle={`Strongest: ${countryData.strongestCountry} · Opportunity: ${countryData.opportunityCountry}`} />
              <div className="mt-4">
                <CountryVisibilityChart countryData={countryData} />
              </div>
            </GlassCard>

            <GlassCard className="p-6" glow="bg-blue-500">
              <SectionHeader icon="📈" title="Visibility Trend" subtitle="Your trajectory vs competitor average" />
              <div className="mt-4">
                <VisibilityTrendChart trendData={trendData} brandName={data.brandName} />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {(data.regionVisibility || []).map((region) => (
                  <div key={region.region} className={`rounded-xl border p-3 text-center ${region.region === data.strongestRegion ? "border-cyan-400/30 bg-cyan-500/8" : region.region === data.weakestRegion ? "border-red-400/30 bg-red-500/8" : "border-slate-700/40 bg-slate-900/40"}`}>
                    <p className={`text-lg font-black ${region.region === data.strongestRegion ? "text-cyan-300" : region.region === data.weakestRegion ? "text-red-300" : "text-white"}`}>{region.score}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{region.region}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          <GlassCard className="border border-amber-400/25 p-6" glow="bg-amber-500">
            <div className="flex items-start gap-4">
              <span className="mt-1 text-3xl">🎯</span>
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-300">Priority Opportunity</p>
                <p className="mt-1 text-lg font-black text-white">{countryData.opportunityCountry} - Untapped AI market</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{countryData.opportunityReason}</p>
                <p className="mt-3 text-xs leading-relaxed text-slate-400">{countryData.insight}</p>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {activeSection === "sources" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <GlassCard className="p-6" glow="bg-indigo-500">
              <SectionHeader icon="🔗" title="Source Breakdown" subtitle="What content types AI uses to cite your brand" />
              <div className="mt-4">
                <SourceBreakdownChart sourceData={sourceData} />
              </div>
            </GlassCard>

            <GlassCard className="p-6" glow="bg-purple-500">
              <SectionHeader icon="💡" title="Source Intelligence" subtitle="What dominates - and what's critically missing" />
              <div className="mt-4">
                <SourceInsightCard sourceData={sourceData} />
              </div>
              <div className="mt-5 rounded-xl border border-slate-700/30 bg-slate-900/40 p-4">
                <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Source distribution</p>
                <div className="space-y-2">
                  {(sourceData.chartData || []).map((source) => (
                    <div key={source.type} className="flex items-center gap-3">
                      <p className="w-12 shrink-0 text-xs text-slate-400">{source.type}</p>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                        <div className="h-full rounded-full transition-all" style={{ width: `${source.pct}%`, background: source.color }} />
                      </div>
                      <p className="w-8 text-right text-[10px] font-bold text-slate-400">{source.pct}%</p>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          </div>

          {(data.topSources || []).length > 0 && (
            <GlassCard className="p-6" glow="bg-cyan-500">
              <SectionHeader icon="📎" title="Top Citation Domains" subtitle="Specific domains where AI finds references to your brand" />
              <div className="mt-4 space-y-2">
                {data.topSources.map((source) => (
                  <div key={source.name} className="flex items-center gap-4 rounded-xl border border-slate-700/30 bg-slate-900/40 px-4 py-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/50 bg-slate-800 text-xs font-black text-slate-400">
                      {source.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{source.name}</p>
                      <p className="text-[11px] text-slate-500">{source.mentionCount} mentions</p>
                    </div>
                    <span className={`text-xs font-bold ${source.confidence === "high" ? "text-emerald-300" : source.confidence === "medium" ? "text-amber-300" : "text-slate-500"}`}>
                      {source.confidence} confidence
                    </span>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {activeSection === "insights" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-white">AI Visibility Intelligence Feed</h2>
            <p className="mt-1 text-sm text-slate-400">6 data-backed insights - each tells you what is happening, why it happens, and exactly what to do</p>
          </div>
          <PremiumGate
            locked={!isStrategyAddonEnabled}
            title="Unlock Full Visibility Intelligence"
            description="All 6 strategic insights with specific actions, data sources, and impact estimates."
            cta="Unlock Strategy ($19/month)"
            onUnlock={unlockStrategyAddon}
            badge="Strategy Intelligence"
            previewRows={2}
          >
            {allInsights.map((insight, index) => (
              <InsightCardV2 key={index} insight={insight} index={index} />
            ))}
          </PremiumGate>
        </div>
      )}

      {activeSection === "gaps" && (
        <div className="space-y-6">
          <GlassCard className="border border-red-500/25 p-6" glow="bg-red-500">
            <div className="flex items-start gap-4">
              <span className="text-3xl">🕳️</span>
              <div>
                <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-red-300">Gap Analysis Engine</p>
                <p className="text-lg font-black text-white">
                  {(gapData?.missingContent?.length || 0) + (gapData?.missingSources?.length || 0) + (gapData?.missingPrompts?.length || 0)} visibility gaps detected
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Each gap = active decisions happening right now without {data.brandName} being recommended.
                </p>
              </div>
            </div>
          </GlassCard>
          <PremiumGate
            locked={!isStrategyAddonEnabled}
            title="Unlock Full Gap Analysis"
            description="Content, source, region, and prompt gaps - with specific fix instructions."
            cta="Unlock Strategy ($19/month)"
            onUnlock={unlockStrategyAddon}
            badge="Strategy Add-on"
            previewRows={1}
          >
            <GapCards gapData={gapData} />
          </PremiumGate>
        </div>
      )}

      {activeSection === "simulator" && (
        <div className="space-y-6">
          <GlassCard className="border border-indigo-500/25 p-6" glow="bg-indigo-500">
            <div className="flex items-start gap-4">
              <span className="text-3xl">⚡</span>
              <div>
                <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-300">Multi-Action Impact Simulator</p>
                <p className="text-lg font-black text-white">Select actions to simulate compounding impact</p>
                <p className="mt-1 text-sm text-slate-400">
                  Based on {data.brandName}'s current score ({vis}/100). Results combine - not override.
                </p>
              </div>
            </div>
          </GlassCard>
          <ActionSimulator data={data} />
        </div>
      )}
    </div>
  );
}