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
  DecisionSummary, RiskCard, ImpactSimulator, DemoConversionCta,
} from "../../shared/components";
import StrategyAdvisor from "../../shared/components/StrategyAdvisor";
import ContentStrategyGenerator from "../../shared/components/ContentStrategyGenerator";
import ArticleGenerator from "../../shared/components/ArticleGenerator";

export default function ActionsPage() {
  const { data, loading, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, appliedActions, toggleAppliedAction, brandName, isDemoMode } = useAnalysis();

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
  const conceptKey = (text) => {
    const t = String(text || "").toLowerCase();
    if (/(comparison|vs )/.test(t)) return "comparison";
    if (/(faq|q&a|schema)/.test(t)) return "faq";
    if (/(query|prompt)/.test(t)) return "query";
    if (/(review|authority|citation|press)/.test(t)) return "authority";
    if (/(list|roundup)/.test(t)) return "list";
    if (/(content hub|content system|content)/.test(t)) return "content-system";
    return t.split(" ").slice(0, 3).join("-");
  };

  const seenConcepts = new Set();
  const dedupeByConcept = (items) => items.filter((item) => {
    const key = conceptKey(item.title);
    if (seenConcepts.has(key)) return false;
    seenConcepts.add(key);
    return true;
  });

  const actions = [
    ...quickWins.map((w, i) => ({
      ...w,
      priority: i === 0 ? 95 : i === 1 ? 85 : 70 - i * 5,
      category: "Action",
      categoryColor: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    })),
    ...patterns.filter(p => p.impact === "high").map((p) => ({
      title: p.action,
      description: p.explanation,
      timeframe: "1-2 weeks",
      impact: "High",
      effort: "Medium",
      priority: 75,
      category: "Action",
      categoryColor: "bg-red-500/15 text-red-400 border-red-500/30",
    })),
    ...(data.recommendations || []).map((rec, i) => ({
      title: rec,
      description: "Strategic recommendation based on your analysis.",
      timeframe: "Ongoing",
      impact: i === 0 ? "High" : "Medium",
      effort: "Medium",
      priority: 60 - i * 5,
      category: "Action",
      categoryColor: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    })),
  ].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  const distinctActions = dedupeByConcept(actions);
  const toDecisionCertainty = (action) => {
    const priorityScore = action.priorityScore ?? action.priority ?? 70;
    const effortLevel = String(action.effortLevel || action.effort || "medium").toLowerCase();
    const impactLevel = String(action.impactLevel || action.impact || "medium").toLowerCase();
    const effortPenalty = effortLevel === "high" ? 10 : effortLevel === "medium" ? 5 : 0;
    const impactBoost = impactLevel === "high" ? 8 : impactLevel === "medium" ? 4 : 1;
    const successProbability = Math.max(52, Math.min(95, priorityScore - effortPenalty + impactBoost));
    const confidenceLevel = successProbability >= 75 ? "high" : successProbability >= 62 ? "medium" : "low";
    let reasoning = "Balanced action with moderate effort and measurable upside.";
    if (/comparison|vs /i.test(action.title)) reasoning = "Competitors dominate comparison queries and structured comparison pages are highly citable by AI systems.";
    else if (/faq|schema|q&a/i.test(action.title)) reasoning = "FAQ and schema content is quickly extractable by AI and improves citation eligibility within days.";
    else if (/authority|review|citation|press/i.test(action.title)) reasoning = "Third-party signals improve trust weighting, which raises recommendation probability in AI answers.";
    else if (/query|prompt/i.test(action.title)) reasoning = "This directly targets active lost prompts where competitor dominance is already proven.";

    return {
      ...action,
      priorityScore,
      effortLevel,
      impactLevel,
      successProbability,
      confidenceLevel,
      reasoning,
    };
  };

  const top3Actions = distinctActions.slice(0, 3).map((action) => ({
    ...action,
  })).map(toDecisionCertainty);

  const withResultProjection = (action) => {
    const impactWeight = action.impactLevel === "high" ? 1 : action.impactLevel === "medium" ? 0.72 : 0.5;
    const effortPenalty = action.effortLevel === "high" ? 0.82 : action.effortLevel === "medium" ? 0.92 : 1;
    const confidenceWeight = action.confidenceLevel === "high" ? 1 : action.confidenceLevel === "medium" ? 0.9 : 0.8;

    const visibilityDelta = Math.max(4, Math.round((action.priorityScore / 100) * 22 * impactWeight * effortPenalty * confidenceWeight));
    const beforeVisibility = Math.max(3, vis);
    const afterVisibility = Math.min(95, beforeVisibility + visibilityDelta);

    const baselineTraffic = Math.max(300, Math.round((data?.totalMentions || 2) * Math.max(8, data?.responseCount || data?.promptCount || 8) * 9));
    const trafficMultiplier = 1 + (visibilityDelta / 100) * 1.7;
    const afterTraffic = Math.round(baselineTraffic * trafficMultiplier);

    return {
      ...action,
      resultProjection: {
        beforeVisibility,
        afterVisibility,
        visibilityDelta: afterVisibility - beforeVisibility,
        beforeTraffic: baselineTraffic,
        afterTraffic,
        trafficDelta: afterTraffic - baselineTraffic,
      },
    };
  };

  const top3ProjectedActions = top3Actions.map(withResultProjection);
  const bestBetAction = [...top3Actions].sort((a, b) => b.successProbability - a.successProbability)[0] || null;
  const bestBetProjectedAction = top3ProjectedActions.find((item) => item.title === bestBetAction?.title) || null;
  const quickWins48h = top3ProjectedActions.filter((action) => /24-48h|48h|1 day|2 day|3 days/i.test(String(action.timeframe || ""))).slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl">
      <DecisionSummary summary={summary} />
      <div>
        <h2 className="text-2xl font-black text-white">Recommended Actions</h2>
        <p className="text-sm text-slate-400 mt-1">Decision-first action layer: exactly what to execute first</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Priority Score" value={priority} suffix="/100" color={priority >= 70 ? "#ef4444" : "#eab308"} icon="🔥" sub="Urgency to act" />
        <KpiCard label="Actions Available" value={distinctActions.length} icon="📋" color="#3b82f6" sub="Sorted by impact" />
        <KpiCard label="Quick Wins" value={quickWins.length} icon="⚡" color="#22c55e" sub="Start this week" />
        <KpiCard label="Traffic to Recover" value={trafficLoss} suffix="%" icon="📈" color="#f97316" sub="Lost query traffic" />
      </div>

      {/* Top 3 Decisions */}
      <GlassCard className="p-6" glow="bg-red-500">
        <SectionHeader icon="🎯" title="Top 3 Actions to Execute Now" subtitle="Highest impact + lowest effort + fastest results" badge="Only 3" badgeColor="text-red-300" />
        {bestBetProjectedAction && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">Highest Impact Move</p>
            <p className="mt-1 text-sm font-black text-white">{bestBetProjectedAction.title}</p>
            <p className="mt-1 text-xs text-slate-300">Success Probability: <span className="font-bold text-emerald-300">{bestBetProjectedAction.successProbability}%</span> · Confidence: <span className="font-bold text-cyan-300 uppercase">{bestBetProjectedAction.confidenceLevel}</span></p>
            <p className="mt-1 text-xs text-slate-400">Reason: {bestBetProjectedAction.reasoning}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2 text-center">
                <p className="text-[10px] text-slate-500">Visibility</p>
                <p className="text-xs font-bold text-cyan-300">{bestBetProjectedAction.resultProjection.beforeVisibility} → {bestBetProjectedAction.resultProjection.afterVisibility}</p>
              </div>
              <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2 text-center">
                <p className="text-[10px] text-slate-500">Traffic</p>
                <p className="text-xs font-bold text-indigo-300">{bestBetProjectedAction.resultProjection.beforeTraffic.toLocaleString()} → {bestBetProjectedAction.resultProjection.afterTraffic.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
        {isDemoMode && (
          <DemoConversionCta
            className="mt-4"
            title="Want this for your brand?"
            subtitle="You are viewing a sample report. Your competitors may already be gaining visibility. Enter your brand to unlock your own highest-impact move."
          />
        )}
        <div className="mt-4 space-y-3">
          {top3ProjectedActions.map((action, idx) => (
            <div key={`top-action-${idx}`} className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white">Action {idx + 1}: {action.title}</p>
                  <p className="mt-2 text-xs text-slate-300"><span className="font-bold text-slate-200">What:</span> {action.title}</p>
                  <p className="mt-1 text-xs text-slate-300"><span className="font-bold text-slate-200">Why:</span> {action.description}</p>
                  <p className="mt-1 text-xs text-slate-300"><span className="font-bold text-slate-200">Success Probability:</span> {action.successProbability}%</p>
                  <p className="mt-1 text-xs text-slate-300"><span className="font-bold text-slate-200">Confidence:</span> <span className="uppercase">{action.confidenceLevel}</span></p>
                  <p className="mt-1 text-xs text-slate-400"><span className="font-bold text-slate-300">Reason:</span> {action.reasoning}</p>
                </div>
                <PriorityScore score={action.priorityScore} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2 text-center">
                  <p className="text-[10px] text-slate-500">Visibility</p>
                  <p className="text-xs font-bold text-cyan-300">{action.resultProjection.beforeVisibility} → {action.resultProjection.afterVisibility}</p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(100, action.resultProjection.afterVisibility)}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-emerald-300">+{action.resultProjection.visibilityDelta}</p>
                </div>
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2 text-center">
                  <p className="text-[10px] text-slate-500">Traffic</p>
                  <p className="text-xs font-bold text-indigo-300">{action.resultProjection.beforeTraffic.toLocaleString()} → {action.resultProjection.afterTraffic.toLocaleString()}</p>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-400"
                      style={{ width: `${Math.min(100, Math.round((action.resultProjection.afterTraffic / Math.max(action.resultProjection.afterTraffic, action.resultProjection.beforeTraffic)) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-emerald-300">+{action.resultProjection.trafficDelta.toLocaleString()}</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
                  <p className="text-[10px] text-slate-500">Impact</p>
                  <p className="text-xs font-bold text-emerald-300">{action.impactLevel}</p>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-center">
                  <p className="text-[10px] text-slate-500">Effort</p>
                  <p className="text-xs font-bold text-amber-300">{action.effortLevel}</p>
                </div>
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-2 text-center">
                  <p className="text-[10px] text-slate-500">Priority</p>
                  <p className="text-xs font-bold text-cyan-300">{action.priorityScore}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {isDemoMode && (
          <DemoConversionCta
            className="mt-4"
            title="Want this for your brand?"
            subtitle="These are Lumora AI's top actions. Your real Top Actions would be generated from your actual query losses, competitors, and visibility gaps."
          />
        )}
      </GlassCard>

      {/* Quick Wins — 48h */}
      <GlassCard className="p-6" glow="bg-emerald-500">
        <SectionHeader icon="⚡" title="Quick Wins (48h)" subtitle="Actions executable in 1-2 days with visible results" badge="Fast track" badgeColor="text-emerald-400" />
        <div className="mt-4 space-y-3">
          {(quickWins48h.length ? quickWins48h : top3ProjectedActions.slice(0, 2)).map((win, i) => (
            <div key={i} className="flex items-start gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 hover:border-emerald-500/40 transition-colors">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 font-black text-lg shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{win.title}</p>
                <p className="text-xs text-slate-400 mt-1">{win.description}</p>
                <div className="mt-2 flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-500">⏱ {win.timeframe}</span>
                  <span className={`text-[10px] font-bold ${(win.impactLevel || "").toLowerCase() === "high" || win.impact === "Critical" ? "text-red-400" : "text-amber-400"}`}>● {(win.impactLevel || win.impact || "medium")} impact</span>
                  <span className="text-[10px] font-bold text-slate-500">💪 {win.effortLevel || win.effort || "medium"} effort</span>
                  <span className="text-[10px] font-bold text-cyan-300">{win.successProbability || 70}% success</span>
                </div>
                <p className="mt-1 text-[10px] text-slate-400">Result preview: {win.resultProjection.beforeVisibility} → {win.resultProjection.afterVisibility} visibility • {win.resultProjection.beforeTraffic.toLocaleString()} → {win.resultProjection.afterTraffic.toLocaleString()} traffic</p>
              </div>
              <PriorityScore score={win.priorityScore || (95 - i * 10)} />
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Full Action Plan */}
      <PaywallSection locked={isQuickMode} title={`Another day without action cost ${brandName} traffic`} description={`Competitors executed their strategy — ${brandName}'s gap grew wider`} cta="Unlock Full Strategy" onUnlock={() => setPremiumModalOpen(true)}>
        <GlassCard className="p-6">
          <SectionHeader icon="📋" title="Decision Backlog" subtitle="Internally ranked, but only top 3 surfaced as primary decisions" badge={`${distinctActions.length} ranked`} />
          <div className="mt-4 space-y-3">
            {distinctActions.map((action, i) => (
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
          <SectionHeader icon="🎯" title="Strategy Execution Plan" subtitle="HOW to execute in weekly tracks with measurable outcomes" />
          <div className="mt-3 space-y-3">
            {strategicActions.map((action, i) => (
              <GlassCard key={i} className="p-5 border border-cyan-500/20">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-white">{action.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{action.explanation}</p>
                  </div>
                  <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300">{action.timeframe}</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {(action.executionSteps || []).map((step, idx) => (
                    <p key={`${action.title}-${idx}`} className="text-xs text-slate-300">{idx + 1}. {step}</p>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-center">
                    <p className="text-[10px] text-slate-500">Visibility</p>
                    <p className="text-xs font-bold text-emerald-300">{action.expectedImpact}</p>
                  </div>
                  <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-2 text-center">
                    <p className="text-[10px] text-slate-500">Traffic Gain</p>
                    <p className="text-xs font-bold text-blue-300">+{Number(action.expectedTrafficGain || 0).toLocaleString()}/mo</p>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-center">
                    <p className="text-[10px] text-slate-500">Revenue Impact</p>
                    <p className="text-xs font-bold text-amber-300">+${Number(action.expectedRevenueImpact || 0).toLocaleString()}/mo</p>
                  </div>
                </div>
              </GlassCard>
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
