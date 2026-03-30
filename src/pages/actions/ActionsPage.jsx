import React, { useMemo } from "react";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import {
  computePriorityScore, computeVisibilityScore, generateQuickWins,
  detectMissingPatterns, getTopCompetitor, computeTrafficLossPct,
  generateDecisionSummary, generateStrategicActions,
  generateRisks, simulateActionImpact, ACTION_CATALOG,
} from "../../shared/utils/insightEngine";
import {
  GlassCard, SectionHeader, KpiCard, PriorityScore, PaywallSection,
  DecisionSummary, ActionCard, RiskCard, ImpactSimulator,
} from "../../shared/components";
import StrategyAdvisor from "../../shared/components/StrategyAdvisor";
import ContentStrategyGenerator from "../../shared/components/ContentStrategyGenerator";
import ArticleGenerator from "../../shared/components/ArticleGenerator";

export default function ActionsPage() {
  const { data, loading, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, appliedActions, toggleAppliedAction, brandName } = useAnalysis();

  const priority = useMemo(() => computePriorityScore(data), [data]);
  const vis = useMemo(() => computeVisibilityScore(data), [data]);
  const trafficLoss = useMemo(() => computeTrafficLossPct(data), [data]);
  const quickWins = useMemo(() => generateQuickWins(data), [data]);
  const patterns = useMemo(() => detectMissingPatterns(data), [data]);
  const topComp = useMemo(() => getTopCompetitor(data), [data]);
  const strategicActions = useMemo(() => generateStrategicActions(data), [data]);
  const risks = useMemo(() => generateRisks(data), [data]);
  const summary = useMemo(() => generateDecisionSummary(data, "actions"), [data]);
  const simulation = useMemo(() => simulateActionImpact(data, appliedActions), [data, appliedActions]);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" /></div>;
  if (!hasAnalyzedOnce) return <div className="flex flex-col items-center justify-center py-32 text-center"><span className="text-5xl mb-4">🚀</span><p className="text-lg font-bold text-white">Run an analysis first</p></div>;

  // Build full action plan
  const actions = [
    ...quickWins.map((w, i) => ({
      ...w,
      priority: i === 0 ? 95 : i === 1 ? 85 : 70 - i * 5,
      category: "Quick Win",
      categoryColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    })),
    ...patterns.filter(p => p.impact === "high").map((p) => ({
      title: p.action,
      description: p.explanation,
      timeframe: "1-2 weeks",
      impact: "High",
      effort: "Medium",
      priority: 75,
      category: "Gap Fix",
      categoryColor: "bg-red-500/15 text-red-400 border-red-500/30",
    })),
    ...(data.recommendations || []).map((rec, i) => ({
      title: rec,
      description: "Strategic recommendation based on your analysis.",
      timeframe: "Ongoing",
      impact: i === 0 ? "High" : "Medium",
      effort: "Medium",
      priority: 60 - i * 5,
      category: "Strategic",
      categoryColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    })),
  ].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  return (
    <div className="space-y-6 max-w-7xl">
      <DecisionSummary summary={summary} />
      <div>
        <h2 className="text-2xl font-black text-white">Recommended Actions</h2>
        <p className="text-sm text-slate-400 mt-1">Prioritized actions to improve your visibility — sorted by impact</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Priority Score" value={priority} suffix="/100" color={priority >= 70 ? "#ef4444" : "#eab308"} icon="🔥" sub="Urgency to act" />
        <KpiCard label="Actions Available" value={actions.length} icon="📋" color="#3b82f6" sub="Sorted by impact" />
        <KpiCard label="Quick Wins" value={quickWins.length} icon="⚡" color="#22c55e" sub="Start this week" />
        <KpiCard label="Traffic to Recover" value={trafficLoss} suffix="%" icon="📈" color="#f97316" sub="Lost query traffic" />
      </div>

      {/* Quick Wins — This Week */}
      <GlassCard className="p-6" glow="bg-emerald-500">
        <SectionHeader icon="⚡" title="This Week — Quick Wins" subtitle="Highest-impact actions you can start immediately" badge="Start here" badgeColor="text-emerald-400" />
        <div className="mt-4 space-y-3">
          {quickWins.map((win, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 hover:border-emerald-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 font-black text-lg shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{win.title}</p>
                <p className="text-xs text-slate-400 mt-1">{win.description}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-500">⏱ {win.timeframe}</span>
                  <span className={`text-[10px] font-bold ${win.impact === "Critical" ? "text-red-400" : "text-amber-400"}`}>● {win.impact} impact</span>
                  <span className="text-[10px] font-bold text-slate-500">💪 {win.effort} effort</span>
                </div>
              </div>
              <PriorityScore score={95 - i * 10} />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Full Action Plan */}
      <PaywallSection locked={isQuickMode} title={`Another day without action cost ${brandName} traffic`} description={`Competitors executed their strategy — ${brandName}'s gap grew wider`} cta="Unlock Full Strategy" onUnlock={() => setPremiumModalOpen(true)}>
        <GlassCard className="p-6">
          <SectionHeader icon="📋" title="Complete Action Plan" subtitle="All actions prioritized by impact and effort" badge={`${actions.length} actions`} />
          <div className="mt-4 space-y-3">
            {actions.map((action, i) => (
              <div key={i} className="flex items-start gap-4 rounded-xl border border-slate-700/30 bg-slate-900/40 p-4 hover:border-slate-600/50 transition-colors">
                <PriorityScore score={action.priority || 50} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold ${action.categoryColor}`}>{action.category}</span>
                    <span className={`text-[10px] font-bold ${action.impact === "Critical" || action.impact === "High" ? "text-red-400" : "text-amber-400"}`}>● {action.impact}</span>
                  </div>
                  <p className="text-sm font-semibold text-white">{action.title}</p>
                  <p className="text-xs text-slate-400 mt-1">{action.description}</p>
                  <div className="mt-2 flex items-center gap-4">
                    <span className="text-[10px] text-slate-500">⏱ {action.timeframe}</span>
                    <span className="text-[10px] text-slate-500">💪 {action.effort}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </PaywallSection>

      {/* Monitoring */}
      <GlassCard className="p-6" glow="bg-blue-500">
        <SectionHeader icon="📊" title="Monitor Your Progress" subtitle="Track these metrics weekly to measure improvement" />
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { metric: "Visibility Score", current: vis, target: Math.min(85, vis + 35), unit: "/100" },
            { metric: "Traffic Loss", current: trafficLoss, target: Math.max(0, trafficLoss - 25), unit: "%" },
            { metric: "Competitor Gap", current: topComp ? `${topComp.mentionCount}x` : "N/A", target: "< 2x", unit: "" },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-4 text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{item.metric}</p>
              <div className="flex items-center justify-center gap-3 mt-2">
                <div>
                  <p className="text-xs text-slate-500">Current</p>
                  <p className="text-lg font-black text-red-400">{item.current}{item.unit}</p>
                </div>
                <span className="text-slate-600">→</span>
                <div>
                  <p className="text-xs text-slate-500">Target</p>
                  <p className="text-lg font-black text-emerald-400">{item.target}{item.unit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ── Structured Strategic Actions (paywalled) ── */}
      <PaywallSection locked={isQuickMode} title={`${brandName} lost more revenue`} description={`See exactly how much revenue ${brandName} lost and what it takes to recover`} cta="Recover Your Traffic" onUnlock={() => setPremiumModalOpen(true)}>
        <div>
          <SectionHeader icon="🎯" title="Strategic Actions" subtitle="Medium to long-term strategies for sustained visibility growth" />
          <div className="mt-3 space-y-3">
            {strategicActions.map((action, i) => (
              <ActionCard key={i} action={action} index={i} />
            ))}
          </div>
        </div>
      </PaywallSection>

      {/* ── Risk Assessment ── */}
      <div>
        <SectionHeader icon="⚠️" title="Risk Assessment" subtitle="What happens if you don't act" />
        <div className="mt-3 space-y-3">
          {risks.map((r, i) => (
            <RiskCard key={i} risk={r} index={i} />
          ))}
        </div>
      </div>

      {/* ── Impact Simulator ── */}
      <ImpactSimulator
        simulation={simulation}
        catalog={ACTION_CATALOG}
        appliedActions={appliedActions}
        onToggleAction={toggleAppliedAction}
        locked={isQuickMode}
        onUnlock={() => setPremiumModalOpen(true)}
      />

      {/* ── AI Content Strategy Generator ── */}
      <ContentStrategyGenerator
        data={data}
        actions={[...quickWins.map(w => ({ title: w.title, description: w.description, impact: w.impact })), ...strategicActions.map(a => ({ title: a.title, description: a.explanation, impact: a.impact }))]}
        locked={isQuickMode}
        onUnlock={() => setPremiumModalOpen(true)}
      />

      {/* ── AI Article Generator ── */}
      <ArticleGenerator data={data} locked={isQuickMode} onUnlock={() => setPremiumModalOpen(true)} />

      {/* ── AI Strategy Advisor ── */}
      <StrategyAdvisor data={data} locked={isQuickMode} onUnlock={() => setPremiumModalOpen(true)} />
    </div>
  );
}
