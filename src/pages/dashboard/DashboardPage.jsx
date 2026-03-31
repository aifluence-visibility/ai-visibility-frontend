import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { PLAN_DETAILS, getLaunchCountdownLabel } from "../../shared/utils/pricing";

function scoreBand(score) {
  if (score < 35) return { label: "CRITICAL", tone: "text-red-300" };
  if (score < 60) return { label: "NEEDS WORK", tone: "text-amber-300" };
  return { label: "HEALTHY", tone: "text-emerald-300" };
}

function DemoContextBlock() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-violet-400/15 bg-violet-400/5 p-4">
      <span className="text-base mt-0.5">ℹ️</span>
      <div>
        <p className="text-sm font-bold text-violet-200">This is a sample report.</p>
        <p className="mt-1 text-xs text-slate-400">Your real report will include:</p>
        <ul className="mt-1.5 space-y-0.5 text-xs text-slate-300">
          <li>• Your real competitors — not Nexvia AI, Stratify AI, or Dataflare</li>
          <li>• Your real missing queries — the prompts where your brand loses traffic daily</li>
          <li>• Your real visibility gaps — by country, source, and content type</li>
        </ul>
      </div>
    </div>
  );
}

function DemoUpgradeCTA({ navigate }) {
  const countdownLabel = getLaunchCountdownLabel();
  return (
    <div className="rounded-[28px] border border-violet-500/30 bg-gradient-to-r from-violet-950/60 to-indigo-950/40 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-rose-200">
              🔒 Your brand is not analyzed yet
            </span>
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-amber-200">
              ⏱ {countdownLabel} · Price increases after launch
            </span>
          </div>
          <p className="text-lg font-black text-white">Unlock your real AI visibility report</p>
          <p className="mt-1 text-sm text-slate-400">
            You are viewing Lumora AI (sample). Your real report will show your actual competitors, your specific visibility gaps, and your custom 7-day recovery plan.
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="shrink-0 rounded-2xl bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 px-6 py-3.5 text-sm font-black text-white shadow-[0_16px_45px_rgba(139,92,246,0.3)] transition hover:scale-[1.01] hover:shadow-[0_20px_60px_rgba(139,92,246,0.4)] whitespace-nowrap"
        >
          Analyze my brand →
        </button>
      </div>
    </div>
  );
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
    isDemoMode,
  } = useAnalysis();

  const navigate = useNavigate();

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

  const promptRows = useMemo(() => {
    if (Array.isArray(data?.promptRows) && data.promptRows.length) return data.promptRows;
    const industry = data?.industry || "software";
    return [
      {
        prompt: `best ${industry} tools`,
        status: "Not seen",
        brandMentions: 0,
        competitors: (data?.topCompetitors || []).slice(0, 3).map((comp) => comp?.name).filter(Boolean),
      },
      {
        prompt: `${data?.brandName || "your brand"} alternatives`,
        status: "Not seen",
        brandMentions: 0,
        competitors: (data?.topCompetitors || []).slice(0, 3).map((comp) => comp?.name).filter(Boolean),
      },
    ];
  }, [data]);

  const dashboardCompetitorInsights = useMemo(() => {
    if (Array.isArray(competitorInsights) && competitorInsights.length) return competitorInsights;
    const fallbackNames = (data?.topCompetitors || []).map((comp) => comp?.name).filter(Boolean);
    return fallbackNames.map((name, idx) => ({
      name,
      rank: idx + 1,
      mentionCount: data?.topCompetitors?.[idx]?.mentionCount || 1,
      frequency: data?.topCompetitors?.[idx]?.appearanceRate || 35,
      advantageReason: `${name} has stronger citation presence across AI recommendation prompts right now.`,
      action: `Create one structured comparison page against ${name} and publish citation-ready proof points.`,
      topPrompts: promptRows.slice(0, 2).map((row) => row.prompt),
      topSources: ["Comparison blogs", "Reddit"],
      shareGap: 12,
      source: "detected",
    }));
  }, [competitorInsights, data, promptRows]);

  useEffect(() => {
    console.info("[Dashboard] final props", {
      source: data?.dataSource || "api",
      fallbackInjected: Boolean(data?.fallbackInjected),
      hasAnalyzedOnce,
      brandName: data?.brandName,
      promptRows: promptRows.length,
      competitors: dashboardCompetitorInsights.length,
      countryRows: countryData?.chartData?.length || 0,
      trendRows: trendData?.length || 0,
      sourceRows: sourceData?.chartData?.length || 0,
      insightRows: allInsights?.length || 0,
      gapSections: {
        content: gapData?.missingContent?.length || 0,
        sources: gapData?.missingSources?.length || 0,
        regions: gapData?.missingRegions?.length || 0,
        prompts: gapData?.missingPrompts?.length || 0,
      },
    });
  }, [
    data,
    hasAnalyzedOnce,
    promptRows,
    dashboardCompetitorInsights,
    countryData,
    trendData,
    sourceData,
    allInsights,
    gapData,
  ]);

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
              {/* ── Demo Insights Panel (only in demo mode) ── */}
              {isDemoMode && Array.isArray(data?.demoInsights) && data.demoInsights.length > 0 && (
                <div className="rounded-[28px] border border-violet-500/20 bg-gradient-to-br from-violet-950/40 via-slate-900 to-slate-900 p-6 shadow-[0_0_60px_rgba(139,92,246,0.08)]">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-400/12 text-base">🔍</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300/80">Demo Report</p>
                        <p className="text-base font-black text-white">4 Key Visibility Gaps — Lumora AI</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">Sample data</span>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {data.demoInsights.map((ins) => {
                      const severityStyle = ins.severity === "critical"
                        ? { border: "border-red-500/25", bg: "bg-red-500/8", badge: "bg-red-500/15 text-red-300 border-red-500/30", label: "CRITICAL" }
                        : ins.severity === "high"
                        ? { border: "border-amber-500/25", bg: "bg-amber-500/8", badge: "bg-amber-500/15 text-amber-300 border-amber-500/30", label: "HIGH" }
                        : { border: "border-cyan-500/20", bg: "bg-cyan-500/6", badge: "bg-cyan-500/12 text-cyan-300 border-cyan-500/25", label: "MEDIUM" };
                      return (
                        <div key={ins.id} className={`rounded-2xl border ${severityStyle.border} ${severityStyle.bg} p-5`}>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <p className="font-black text-white leading-snug">{ins.title}</p>
                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wide ${severityStyle.badge}`}>{severityStyle.label}</span>
                          </div>
                          <div className="space-y-2 text-xs leading-5">
                            <p><span className="font-black uppercase tracking-wide text-slate-400">What: </span><span className="text-slate-300">{ins.what}</span></p>
                            <p><span className="font-black uppercase tracking-wide text-slate-400">Why: </span><span className="text-slate-300">{ins.why}</span></p>
                            <p><span className="font-black uppercase tracking-wide text-slate-400">Source: </span><span className="text-slate-400 italic">{ins.source}</span></p>
                            <p className="rounded-xl border border-white/6 bg-white/[0.03] p-3"><span className="font-black uppercase tracking-wide text-cyan-400">Action: </span><span className="text-slate-200">{ins.action}</span></p>
                            <p className="font-bold text-emerald-300">↑ {ins.impact}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
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
                <div className="flex min-h-[214px] w-full items-center justify-center">
                  <ScoreGauge score={vis} size={206} showCenterBadge={false} />
                </div>
                <div className="mt-3 flex flex-col items-center gap-1.5">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-[950] uppercase tracking-[0.24em] backdrop-blur-sm shadow-[0_0_16px_rgba(148,163,184,0.12)] ${
                    band.label === "HEALTHY"
                      ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-200"
                      : band.label === "NEEDS WORK"
                      ? "border-amber-400/30 bg-amber-400/12 text-amber-200"
                      : "border-red-400/30 bg-red-400/12 text-red-200"
                  }`}
                  >
                    {band.label}
                  </span>
                  <p className="text-[11px] text-slate-500">Current visibility health across tracked AI systems</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3">
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
                    Upgrade to PRO (${PLAN_DETAILS.pro.originalPrice} → ${PLAN_DETAILS.pro.launchPrice}/month)
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
              subtitle={`${dashboardCompetitorInsights.length} competitors identified - ranked by AI share-of-voice`}
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

          <CompetitorInsightCards competitorInsights={dashboardCompetitorInsights} brandName={data.brandName} />

          <GlassCard className="p-6" glow="bg-rose-500">
            <SectionHeader icon="📋" title="Full Competitor Analysis" subtitle="Click any row to see why they win and how to fight back" />
            <div className="mt-4">
              <CompetitorTable competitors={dashboardCompetitorInsights} brandName={data.brandName} totalMentions={data.totalMentions} competitorMentionTotal={data.competitorMentionTotal} />
            </div>
          </GlassCard>
        </div>
      )}

      {activeSection === "regions" && (
        <div className="space-y-6">
          {isDemoMode && <DemoContextBlock />}
          {isDemoMode && <DemoUpgradeCTA navigate={navigate} />}

          <div className="grid gap-4 md:grid-cols-2">
            <GlassCard className="border border-amber-400/20 p-6" glow="bg-amber-500">
              <SectionHeader icon="🔒" title="AI Strategy Add-on" subtitle="7-Day Recovery Plan + Source roadmap" />
                        {isDemoMode && <DemoUpgradeCTA navigate={navigate} />}
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
                  {isDemoMode && <DemoUpgradeCTA navigate={navigate} />}
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
                    {isDemoMode && <DemoUpgradeCTA navigate={navigate} />}
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