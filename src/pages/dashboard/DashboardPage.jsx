import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import {
  computeVisibilityScore, computeCompetitorDominance,
  computePriorityScore, computeTrafficLossPct, computeRiskScore, getTopCompetitor, getShockMetrics,
  getCompetitorVsYou, generateDecisionSummary,
  generateStructuredQuickWins, generateStrategicActions, generateRisks,
  simulateActionImpact, ACTION_CATALOG, generateRecoveryPlan,
} from "../../shared/utils/insightEngine";
import {
  GlassCard, SectionHeader, ScoreGauge, KpiCard, CompetitorBarChart, TrendLineChart,
  PaywallSection, DecisionSummary, ActionCard, RiskCard, ImpactSimulator,
} from "../../shared/components";
import StrategyAdvisor from "../../shared/components/StrategyAdvisor";
import CriticalInsight from "../../shared/components/CriticalInsight";
import PortfolioAnalyzer from "../../shared/components/PortfolioAnalyzer";
import ValueStrip from "../../shared/components/ValueStrip";
import GuidedGrowthFlow from "../../shared/components/GuidedGrowthFlow";
import RecoveryPlanSection from "../recovery-plan/RecoveryPlanPage";

export default function DashboardPage() {
  const { data, loading, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, actionMode, appliedActions, toggleAppliedAction, brandName } = useAnalysis();
  const navigate = useNavigate();

  const vis = useMemo(() => computeVisibilityScore(data), [data]);
  const compDom = useMemo(() => computeCompetitorDominance(data), [data]);
  const priority = useMemo(() => computePriorityScore(data), [data]);
  const risk = useMemo(() => computeRiskScore(data), [data]);
  const trafficLoss = useMemo(() => computeTrafficLossPct(data), [data]);
  const topComp = useMemo(() => getTopCompetitor(data), [data]);
  const shock = useMemo(() => getShockMetrics(data), [data]);
  const dailyLostTraffic = useMemo(() => Math.round(shock.estimatedLostTraffic / 30), [shock]);
  const dailyLostRevenue = useMemo(() => Math.round(shock.estimatedMonthlyLoss / 30), [shock]);
  const weeklyLostRevenue = useMemo(() => Math.round(shock.estimatedMonthlyLoss / 4.3), [shock]);
  const quickWins = useMemo(() => generateStructuredQuickWins(data), [data]);
  const strategicActions = useMemo(() => generateStrategicActions(data), [data]);
  const risks = useMemo(() => generateRisks(data), [data]);
  const cvsy = useMemo(() => getCompetitorVsYou(data), [data]);
  const summary = useMemo(() => generateDecisionSummary(data, "dashboard"), [data]);
  const simulation = useMemo(() => simulateActionImpact(data, appliedActions), [data, appliedActions]);
  const recoveryPlan = useMemo(() => generateRecoveryPlan(data), [data]);

  const recoveryRef = useRef(null);
  const [showRecoveryToast, setShowRecoveryToast] = useState(false);
  const [recoveryHighlight, setRecoveryHighlight] = useState(false);
  const hasShownToast = useRef(false);

  const scrollToRecovery = useCallback(() => {
    setShowRecoveryToast(false);
    recoveryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    setRecoveryHighlight(true);
    setTimeout(() => setRecoveryHighlight(false), 3000);
  }, []);

  useEffect(() => {
    if (hasAnalyzedOnce && data && !loading && !hasShownToast.current) {
      hasShownToast.current = true;
      const timer = setTimeout(() => {
        setShowRecoveryToast(true);
        setRecoveryHighlight(true);
        setTimeout(() => setRecoveryHighlight(false), 4000);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [hasAnalyzedOnce, data, loading]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-400">Analyzing visibility…</p>
      </div>
    );
  }

  if (!hasAnalyzedOnce) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <span className="text-5xl">📊</span>
        <p className="text-lg font-bold text-white">No analysis yet</p>
        <p className="text-sm text-slate-400 max-w-md">Enter your brand name and run an analysis to see your Lumio dashboard.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl">
      {/* ── Value Strip — urgency bar ── */}
      <ValueStrip vis={vis} trafficLoss={trafficLoss} compDom={compDom} topComp={topComp} quickWins={quickWins} locked={isQuickMode} onUnlock={() => setPremiumModalOpen(true)} brandName={brandName} />

      {/* ── Guided Growth Flow — Next Steps ── */}
      <GuidedGrowthFlow data={data} locked={isQuickMode} onUnlock={() => setPremiumModalOpen(true)} />

      {/* ── Decision Summary ── */}
      <DecisionSummary summary={summary} />

      {/* ── Critical Insight (AI Decision Engine) ── */}
      <CriticalInsight data={data} />

      {/* ── Hero KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard label="Visibility Score" value={vis} suffix="/100" color={vis <= 30 ? "#ef4444" : vis <= 60 ? "#eab308" : "#22c55e"} icon="🎯" sub={vis < 50 ? "Critical — competitors gaining daily" : "Room to grow"} />
        <KpiCard label="Traffic Loss" value={trafficLoss} suffix="%" color="#ef4444" icon="📉" sub={`~${dailyLostTraffic} visits lost today`} pulse={trafficLoss > 30} />
        <KpiCard label="Competitor Pressure" value={compDom} suffix="%" color="#f97316" icon="⚔️" sub={topComp ? `${topComp.name} gaining this week` : "No competitor data"} />
        <KpiCard label="Risk Score" value={risk} suffix="/100" color={risk >= 70 ? "#ef4444" : "#eab308"} icon="⚠️" sub="Growing every day you wait" />
        <KpiCard label="Priority Score" value={priority} suffix="/100" color={priority >= 70 ? "#ef4444" : "#eab308"} icon="🔥" sub="Act today — not next week" />
      </div>

      {/* ── DATA MODE: Analytics ── */}
      {!actionMode && (
        <>
          {/* Two-Col: Gauge + Shock */}
          <div className="grid md:grid-cols-2 gap-4">
            <GlassCard className="p-6 flex flex-col items-center" glow="bg-indigo-500">
              <SectionHeader icon="🎯" title="Lumio Score" subtitle="How visible your brand is in AI-generated recommendations" />
              <div className="mt-4">
                <ScoreGauge score={vis} />
              </div>
              <p className="mt-4 text-xs text-slate-400 text-center max-w-xs">{data.summaryInsight}</p>
              <button onClick={() => navigate("/app/visibility")} className="mt-3 text-xs font-semibold text-blue-400 hover:text-blue-300">View detailed breakdown →</button>
            </GlassCard>

            <GlassCard className="p-6" glow="bg-red-500">
              <SectionHeader icon="⚡" title={`What ${brandName} Is Losing`} subtitle="Estimated impact of low visibility" />
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Your brand appears</span>
                  <span className="text-xl font-black text-red-400">{shock.brandAppearsPct}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{cvsy.competitor} appears</span>
                  <span className="text-xl font-black text-emerald-400">{shock.competitorAppearsPct}%</span>
                </div>
                <div className="h-px bg-slate-700/50" />
                {/* Traffic & revenue — blurred when locked */}
                {isQuickMode ? (
                  <div className="relative">
                    <div className="space-y-4 blur-[6px] pointer-events-none select-none opacity-40">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Est. lost traffic/mo</span>
                        <span className="text-lg font-bold text-red-400">{shock.estimatedLostTraffic.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-400">Est. revenue impact/mo</span>
                        <span className="text-lg font-bold text-red-400">${shock.estimatedMonthlyLoss.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <svg className="h-5 w-5 text-red-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      <p className="text-xs font-bold text-white">You are losing traffic every day you are not visible in AI search.</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Your competitors are already taking these positions.</p>
                      <button onClick={() => setPremiumModalOpen(true)} className="mt-2 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-1.5 text-[11px] font-bold text-white shadow-md hover:shadow-red-500/25 transition-all">
                        Recover Your Traffic →
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Est. lost traffic/mo</span>
                      <span className="text-lg font-bold text-red-400">{shock.estimatedLostTraffic.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Est. revenue impact/mo</span>
                      <span className="text-lg font-bold text-red-400">${shock.estimatedMonthlyLoss.toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => navigate("/app/growth")} className="mt-4 text-xs font-semibold text-red-400 hover:text-red-300">See full growth impact →</button>
            </GlassCard>
          </div>

          {/* Competitor Overview */}
          <GlassCard className="p-6" glow="bg-rose-500">
            <SectionHeader icon="⚔️" title={`Who AI Recommends Instead of ${brandName}`} subtitle="Competitor landscape" badge={`${data.topCompetitors?.length || 0} competitors`} />
            <div className="mt-4">
              <CompetitorBarChart competitors={data.topCompetitors || []} brandName={data.brandName} brandMentions={data.totalMentions || 0} total={(data.competitorMentionTotal || 0) + (data.totalMentions || 0)} />
            </div>
            <button onClick={() => navigate("/app/competitors")} className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300">Deep dive into competitors →</button>
          </GlassCard>

          {/* Trend */}
          <PaywallSection locked={isQuickMode} title={`${brandName}'s visibility dropped again today`} description={`Without trend data, you can't see how fast ${brandName} is falling behind this week`} cta="Stop Losing Visibility" onUnlock={() => setPremiumModalOpen(true)}>
            <GlassCard className="p-6">
              <SectionHeader icon="📈" title="Prompt-by-Prompt Trend" subtitle="Visibility across analyzed prompts" />
              <div className="mt-4">
                <TrendLineChart trend={data.trend} />
              </div>
            </GlassCard>
          </PaywallSection>
        </>
      )}

      {/* ── ACTION MODE: Quick Wins + Strategic Actions + Risks + Simulator ── */}
      {actionMode && (
        <>
          {/* Quick Wins */}
          <div>
            <SectionHeader icon="⚡" title="Quick Wins — This Week" subtitle="Highest-impact actions you can start immediately" />
            <div className="mt-3 space-y-3">
              {quickWins.map((win, i) => (
                <ActionCard key={i} action={win} index={i} />
              ))}
            </div>
          </div>

          {/* Strategic Actions — Paywalled */}
          <PaywallSection locked={isQuickMode} title={`${brandName} lost revenue again today`} description={`Competitors executed their strategy today while ${brandName} waited`} cta="Recover Your Traffic" onUnlock={() => setPremiumModalOpen(true)}>
            <div>
              <SectionHeader icon="🎯" title="Strategic Actions" subtitle="Medium to long-term strategies for sustained visibility growth" />
              <div className="mt-3 space-y-3">
                {strategicActions.map((action, i) => (
                  <ActionCard key={i} action={action} index={quickWins.length + i} />
                ))}
              </div>
            </div>
          </PaywallSection>

          {/* Risks */}
          <div>
            <SectionHeader icon="⚠️" title="Risk Assessment" subtitle="What happens if you don't act" />
            <div className="mt-3 space-y-3">
              {risks.map((risk, i) => (
                <RiskCard key={i} risk={risk} index={i} />
              ))}
            </div>
          </div>

          {/* Impact Simulator */}
          <ImpactSimulator
            simulation={simulation}
            catalog={ACTION_CATALOG}
            appliedActions={appliedActions}
            onToggleAction={toggleAppliedAction}
            locked={isQuickMode}
            onUnlock={() => setPremiumModalOpen(true)}
          />
        </>
      )}

      {/* ── Quick Wins (always visible, data mode) ── */}
      {!actionMode && (
        <GlassCard className="p-6" glow="bg-emerald-500">
            <SectionHeader icon="⚡" title={`Quick Wins for ${brandName} — Start Here`} subtitle="Highest-impact actions you can take this week" />
          <div className="mt-4 space-y-3">
            {quickWins.map((win, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl border border-slate-700/40 bg-slate-900/50 p-4 hover:border-emerald-500/30 transition-colors">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 font-black text-sm shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white">{win.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{win.explanation}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[10px] font-bold text-slate-500">⏱ {win.timeframe}</span>
                    <span className={`text-[10px] font-bold ${win.impact === "Critical" ? "text-red-400" : "text-amber-400"}`}>● {win.impact}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate("/app/actions")} className="mt-4 text-xs font-semibold text-emerald-400 hover:text-emerald-300">See all recommended actions →</button>
        </GlassCard>
      )}

      {/* ── 7-Day Recovery Plan ── */}
      <div ref={recoveryRef} className={`transition-all duration-1000 rounded-2xl ${recoveryHighlight ? "ring-2 ring-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)]" : ""}`}>
        <RecoveryPlanSection plan={recoveryPlan} vis={vis} shock={shock} brandName={brandName} locked={isQuickMode} onUnlock={() => setPremiumModalOpen(true)} />
      </div>

      {/* ── Recovery Plan Toast ── */}
      {showRecoveryToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-[#111827]/95 backdrop-blur-lg shadow-2xl shadow-emerald-500/10 px-5 py-4 max-w-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 shrink-0">
              <span className="text-lg">📋</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">Your recovery plan is ready</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Personalized 7-day action plan for {brandName}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={scrollToRecovery} className="rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:shadow-emerald-500/25 transition-all">
                View plan
              </button>
              <button onClick={() => setShowRecoveryToast(false)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700/50 transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Portfolio Analyzer ── */}
      <PortfolioAnalyzer data={data} locked={isQuickMode} onUnlock={() => setPremiumModalOpen(true)} />

      {/* ── AI Strategy Advisor ── */}
      <StrategyAdvisor data={data} locked={isQuickMode} onUnlock={() => setPremiumModalOpen(true)} />
    </div>
  );
}
