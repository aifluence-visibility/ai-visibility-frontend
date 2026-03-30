import React, { useMemo } from "react";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import {
  computeVisibilityScore, computeGrowthProjections, getShockMetrics, getCompetitorVsYou,
  generateDecisionSummary, simulateActionImpact, ACTION_CATALOG,
} from "../../shared/utils/insightEngine";
import { GlassCard, SectionHeader, KpiCard, TrendLineChart, PaywallSection, DecisionSummary, ImpactSimulator } from "../../shared/components";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import PerformanceTracker from "../../shared/components/PerformanceTracker";

export default function GrowthImpactPage() {
  const { data, loading, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, appliedActions, toggleAppliedAction, brandName } = useAnalysis();

  const vis = useMemo(() => computeVisibilityScore(data), [data]);
  const growth = useMemo(() => computeGrowthProjections(data), [data]);
  const shock = useMemo(() => getShockMetrics(data), [data]);
  const cvsy = useMemo(() => getCompetitorVsYou(data), [data]);
  const summary = useMemo(() => generateDecisionSummary(data, "growth"), [data]);
  const simulation = useMemo(() => simulateActionImpact(data, appliedActions), [data, appliedActions]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>;
  if (!hasAnalyzedOnce) return <div className="flex flex-col items-center justify-center py-32 text-center"><span className="text-5xl mb-4">📈</span><p className="text-lg font-bold text-white">Run an analysis first</p></div>;

  const projectionData = [
    { period: "Now", traffic: 0, revenue: 0 },
    { period: "30 days", traffic: growth.projectedRecovery30d, revenue: growth.revenueRecovery30d },
    { period: "90 days", traffic: growth.projectedRecovery90d, revenue: growth.revenueRecovery90d },
    { period: "180 days", traffic: growth.projectedRecovery180d, revenue: growth.revenueRecovery180d },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <DecisionSummary summary={summary} />
      <div>
        <h2 className="text-2xl font-black text-white">Growth Impact</h2>
        <p className="text-sm text-slate-400 mt-1">Revenue projections if you fix your visibility gaps</p>
      </div>

      {/* Loss KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Monthly Lost Traffic" value={shock.estimatedLostTraffic.toLocaleString()} icon="📉" color="#ef4444" sub="Visits going to competitors" pulse />
        <KpiCard label="Monthly Revenue Loss" value={`$${shock.estimatedMonthlyLoss.toLocaleString()}`} icon="💸" color="#ef4444" sub="Estimated from traffic gap" />
        <KpiCard label="ROI Multiplier" value={`${growth.roiMultiplier}x`} icon="🎯" color="#22c55e" sub="Expected return on fix" />
        <KpiCard label="Visibility Target" value={growth.visibilityTarget} suffix="/100" icon="📈" color="#3b82f6" sub={`From ${vis} → ${growth.visibilityTarget}`} />
      </div>

      {/* The cost of inaction */}
      <GlassCard className="p-6" glow="bg-red-500">
        <SectionHeader icon="💀" title="The Cost of Doing Nothing" subtitle="What happens if you don't fix your visibility" />
        <div className="mt-4 grid md:grid-cols-3 gap-4">
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5 text-center">
            <p className="text-3xl font-black text-red-400">${(shock.estimatedMonthlyLoss * 12).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Annual revenue loss</p>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5 text-center">
            <p className="text-3xl font-black text-red-400">{(shock.estimatedLostTraffic * 12).toLocaleString()}</p>
            <p className="text-xs text-slate-400 mt-1">Annual lost visitors</p>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-5 text-center">
            <p className="text-3xl font-black text-red-400">{cvsy.ratio}x</p>
            <p className="text-xs text-slate-400 mt-1">{cvsy.competitor} advantage grows</p>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400 text-center">Every month you wait, competitors strengthen their AI presence while yours decays.</p>
      </GlassCard>

      {/* Recovery Projections */}
      <PaywallSection locked={isQuickMode} title={`${brandName} lost revenue again — $?? since this morning`} description={`See how much traffic and revenue ${brandName} lost and your 30/90/180-day recovery forecast`} cta="Recover Your Traffic" onUnlock={() => setPremiumModalOpen(true)}>
        <GlassCard className="p-6" glow="bg-emerald-500">
          <SectionHeader icon="📈" title="Recovery Timeline" subtitle="Projected traffic and revenue recovery if you act now" />
          <div className="mt-4 grid md:grid-cols-3 gap-4 mb-6">
            {[
              { period: "30 days", traffic: growth.projectedRecovery30d, revenue: growth.revenueRecovery30d, color: "#eab308" },
              { period: "90 days", traffic: growth.projectedRecovery90d, revenue: growth.revenueRecovery90d, color: "#3b82f6" },
              { period: "180 days", traffic: growth.projectedRecovery180d, revenue: growth.revenueRecovery180d, color: "#22c55e" },
            ].map((p) => (
              <div key={p.period} className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-5 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{p.period}</p>
                <p className="text-2xl font-black mt-2" style={{ color: p.color }}>+{p.traffic.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-0.5">visitors recovered</p>
                <p className="text-lg font-bold mt-2" style={{ color: p.color }}>+${p.revenue.toLocaleString()}</p>
                <p className="text-[10px] text-slate-500">revenue recovered/mo</p>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={projectionData} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="period" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="traffic" stroke="#22c55e" strokeWidth={2.5} fill="url(#areaGradient)" dot={{ r: 5, fill: "#22c55e", strokeWidth: 2, stroke: "#0f172a" }} />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>
      </PaywallSection>

      {/* Trend */}
      <GlassCard className="p-6">
        <SectionHeader icon="📊" title="Current Visibility Trend" subtitle="Prompt-by-prompt visibility pattern" />
        <div className="mt-4">
          <TrendLineChart trend={data.trend} />
        </div>
      </GlassCard>

      {/* Take action */}
      <GlassCard className="p-6" glow="bg-emerald-500">
        <SectionHeader icon="🚨" title="You are losing traffic every day you are not visible in AI search" subtitle="Your competitors are already taking these positions" />
        <div className="mt-4 rounded-xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 p-6 text-center">
          <p className="text-lg font-bold text-red-400">{brandName} is losing ${growth.revenueRecovery180d.toLocaleString()}/mo to competitors</p>
          <p className="text-sm text-slate-400 mt-2">
            That's {growth.projectedRecovery180d.toLocaleString()} visitors going to competitors instead of {brandName} — and it compounds daily.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <button onClick={() => setPremiumModalOpen(true)} className="rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-red-500/25 transition-all">
              Recover Your Traffic
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ── Impact Simulator ── */}
      <ImpactSimulator
        simulation={simulation}
        catalog={ACTION_CATALOG}
        appliedActions={appliedActions}
        onToggleAction={toggleAppliedAction}
        locked={isQuickMode}
        onUnlock={() => setPremiumModalOpen(true)}
      />

      {/* ── Performance Tracker ── */}
      <PerformanceTracker data={data} locked={isQuickMode} onUnlock={() => setPremiumModalOpen(true)} />
    </div>
  );
}
