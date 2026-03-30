import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";

/*
  GuidedGrowthFlow — Impact-Driven Flow
  Each step shows: impact %, estimated traffic gain, urgency level,
  a result statement, and a motivating CTA.
  Values derived from real analysis data.
*/

// ── Impact calculation helpers ──

function clamp(v, min = 0, max = 100) { return Math.max(min, Math.min(max, Math.round(v))); }

function calcImpact(data) {
  const vis = Number(data?.visibilityScore ?? 0);
  const loss = Number(data?.queryTrafficLossPct ?? 0);
  const comp = Number(data?.competitorPressureScore ?? 0);
  const mentions = Number(data?.totalMentions ?? 0);
  const responses = Math.max(1, Number(data?.responseCount ?? 1));
  const queries = data?.queryInsights?.length ?? 0;
  const hasBaseline = !!localStorage.getItem("ai-vis-baseline");

  // Base traffic estimate: ~120 visits per mention gap, scaled by loss %
  const baseTraffic = Math.max(50, Math.round((loss / 100) * responses * 120));

  return {
    vis, loss, comp, mentions, queries, hasBaseline, baseTraffic,
  };
}

function urgency(score) {
  if (score >= 70) return { level: "high", label: "HIGH", color: "text-red-400", bg: "bg-red-500/15 border-red-500/30" };
  if (score >= 40) return { level: "medium", label: "MED", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30" };
  return { level: "low", label: "LOW", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30" };
}

// ── Step definitions (impact-driven) ──

function buildSteps(data) {
  const m = calcImpact(data);
  const steps = [];

  // 1. Low visibility → Opportunities
  if (m.vis < 50) {
    const impactPct = clamp(Math.round((50 - m.vis) * 1.4 + m.loss * 0.5));
    const trafficGain = Math.round(m.baseTraffic * (impactPct / 100) * 1.2);
    const urg = urgency(clamp(100 - m.vis));
    steps.push({
      id: "low-vis", priority: 1, icon: "🎯", color: "red",
      title: "Fix Visibility Gaps",
      action: "Audit & fill missing AI query opportunities",
      result: `Recover up to ${trafficGain.toLocaleString()} visits/mo by appearing in ${Math.max(1, Math.round(m.queries * 0.6))} more queries`,
      impactPct, trafficGain, urgency: urg,
      cta: "View Opportunities", to: "/app/opportunities",
    });
  }

  // 2. Missing queries → Content
  if (m.loss > 20 || m.queries > 0) {
    const impactPct = clamp(Math.round(m.loss * 0.8 + m.queries * 5));
    const trafficGain = Math.round(m.baseTraffic * (impactPct / 100));
    const urg = urgency(clamp(m.loss + m.queries * 8));
    steps.push({
      id: "missing-queries", priority: 2, icon: "✍️", color: "amber",
      title: "Create Missing Content",
      action: `Publish content for ${Math.max(1, m.queries)} uncovered queries`,
      result: `Capture ~${trafficGain.toLocaleString()} visits/mo competitors currently own`,
      impactPct, trafficGain, urgency: urg,
      cta: "Go to Actions", to: "/app/actions",
    });
  }

  // 3. No tracking → Growth Impact
  if (!m.hasBaseline) {
    const impactPct = 15; // awareness / measurement value
    const trafficGain = 0; // not direct traffic but essential
    const urg = urgency(50); // always medium priority
    steps.push({
      id: "no-tracking", priority: 3, icon: "📈", color: "emerald",
      title: "Start Tracking Progress",
      action: "Set baseline to measure every future improvement",
      result: "Track ROI and prove results week-over-week",
      impactPct, trafficGain, urgency: urg,
      cta: "Set Baseline", to: "/app/growth",
    });
  }

  // 4. High competitor pressure
  if (m.comp > 40) {
    const impactPct = clamp(Math.round(m.comp * 0.7 + 10));
    const trafficGain = Math.round(m.baseTraffic * (impactPct / 100) * 0.8);
    const urg = urgency(clamp(m.comp));
    steps.push({
      id: "competitor-pressure", priority: 4, icon: "⚔️", color: "orange",
      title: "Counter Competitor Dominance",
      action: "Build comparison content and structured data",
      result: `Reduce competitor share by ~${clamp(Math.round(m.comp * 0.3))}% and reclaim ${trafficGain.toLocaleString()} visits/mo`,
      impactPct, trafficGain, urgency: urg,
      cta: "Competitor Analysis", to: "/app/competitors",
    });
  }

  // 5. Sentiment / positioning
  if (data?.positionAnalysis && Object.keys(data.positionAnalysis).length > 0) {
    const impactPct = clamp(20 + Math.round(m.comp * 0.2));
    const trafficGain = Math.round(m.baseTraffic * 0.15);
    const urg = urgency(35);
    steps.push({
      id: "sentiment", priority: 5, icon: "💬", color: "blue",
      title: "Improve Brand Positioning",
      action: "Fix how AI describes your brand in responses",
      result: `Improve conversion by ~${impactPct}% through better framing`,
      impactPct, trafficGain, urgency: urg,
      cta: "View Sentiment", to: "/app/sentiment",
    });
  }

  // 6. Fallback — strategy
  steps.push({
    id: "strategy", priority: 6, icon: "🧠", color: "cyan",
    title: "Get AI Strategy",
    action: "Generate personalized next-move recommendations",
    result: "Get a data-backed action plan tailored to your gaps",
    impactPct: 25, trafficGain: Math.round(m.baseTraffic * 0.2), urgency: urgency(30),
    cta: "Strategy Advisor", to: "/app/actions",
  });

  return steps.sort((a, b) => a.priority - b.priority).slice(0, 3);
}

// ── Colors ──

const COLOR_MAP = {
  red:     { bg: "bg-red-500/10",     border: "border-red-500/25",     text: "text-red-400",     hoverBorder: "hover:border-red-500/40",     btnBg: "from-red-600 to-red-500",     impactBg: "bg-red-500/15 border-red-500/30 text-red-400" },
  amber:   { bg: "bg-amber-500/10",   border: "border-amber-500/25",   text: "text-amber-400",   hoverBorder: "hover:border-amber-500/40",   btnBg: "from-amber-600 to-amber-500",   impactBg: "bg-amber-500/15 border-amber-500/30 text-amber-400" },
  emerald: { bg: "bg-emerald-500/10",  border: "border-emerald-500/25",  text: "text-emerald-400",  hoverBorder: "hover:border-emerald-500/40",  btnBg: "from-emerald-600 to-emerald-500",  impactBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" },
  orange:  { bg: "bg-orange-500/10",  border: "border-orange-500/25",  text: "text-orange-400",  hoverBorder: "hover:border-orange-500/40",  btnBg: "from-orange-600 to-orange-500",  impactBg: "bg-orange-500/15 border-orange-500/30 text-orange-400" },
  blue:    { bg: "bg-blue-500/10",    border: "border-blue-500/25",    text: "text-blue-400",    hoverBorder: "hover:border-blue-500/40",    btnBg: "from-blue-600 to-blue-500",    impactBg: "bg-blue-500/15 border-blue-500/30 text-blue-400" },
  cyan:    { bg: "bg-cyan-500/10",    border: "border-cyan-500/25",    text: "text-cyan-400",    hoverBorder: "hover:border-cyan-500/40",    btnBg: "from-cyan-600 to-cyan-500",    impactBg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400" },
};

// ── Component ──

export default function GuidedGrowthFlow({ data, locked = false, onUnlock }) {
  const navigate = useNavigate();
  const brand = data?.brandName || "Your brand";

  const steps = useMemo(() => buildSteps(data), [data]);

  const completedKey = "ai-vis-flow-completed";
  const completed = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(completedKey)) || []; } catch { return []; }
  }, []);
  const completedCount = steps.filter((s) => completed.includes(s.id)).length;

  // Total projected impact across all steps
  const totalTraffic = steps.reduce((s, st) => s + (st.trafficGain || 0), 0);

  const handleStepClick = (step) => {
    const prev = (() => { try { return JSON.parse(localStorage.getItem(completedKey)) || []; } catch { return []; } })();
    if (!prev.includes(step.id)) {
      localStorage.setItem(completedKey, JSON.stringify([...prev, step.id]));
    }
    navigate(step.to);
  };

  if (steps.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-700/40 bg-[#0D1220] p-5">
      {/* Header + Progress */}
      <div className="flex items-start md:items-center justify-between mb-4 flex-col md:flex-row gap-3 md:gap-0">
        <div>
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <span className="text-base">🚀</span> {brand}'s Growth Path
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete these steps to recover up to{" "}
            {locked
              ? <span className="font-bold text-red-400">??? visits lost this week — {brand} isn't recovering</span>
              : <span className="font-bold text-emerald-400">{totalTraffic.toLocaleString()} visits/mo</span>
            }
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {steps.map((s, i) => (
              <div
                key={s.id}
                className={`h-2 rounded-full transition-all ${
                  completed.includes(s.id) ? "w-8 bg-emerald-500" : i === completedCount ? "w-8 bg-blue-500 animate-pulse" : "w-6 bg-slate-700"
                }`}
              />
            ))}
          </div>
          <span className="text-[10px] font-bold text-slate-500">{completedCount}/{steps.length}</span>
        </div>
      </div>

      {/* Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step, i) => {
          const c = COLOR_MAP[step.color] || COLOR_MAP.blue;
          const done = completed.includes(step.id);
          const isCurrent = !done && i === completedCount;

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step)}
              className={`group relative rounded-xl border p-4 text-left transition-all ${c.border} ${c.hoverBorder} ${
                done ? "bg-slate-900/30 opacity-60" : isCurrent ? `${c.bg}` : "bg-slate-900/40"
              }`}
            >
              {/* Top row: step number + urgency + impact */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-black ${
                    done ? "bg-emerald-500/20 text-emerald-400" : `${c.bg} ${c.text}`
                  }`}>
                    {done ? "✓" : i + 1}
                  </span>
                  <span className="text-base">{step.icon}</span>
                  {isCurrent && (
                    <span className="rounded-md bg-blue-500/15 border border-blue-500/25 px-1.5 py-0.5 text-[9px] font-bold text-blue-400 uppercase">Now</span>
                  )}
                </div>

                {/* Urgency badge */}
                <span className={`rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${step.urgency.bg}`}>
                  {step.urgency.label}
                </span>
              </div>

              {/* Title — always visible */}
              <h3 className={`text-sm font-bold ${done ? "text-slate-500 line-through" : "text-white"}`}>
                {step.title}
              </h3>

              {/* Action — always visible */}
              <p className="text-xs text-slate-400 mt-1">{step.action}</p>

              {/* Impact metrics row — locked: blurred with teaser */}
              {locked ? (
                <div className="relative mt-3">
                  <div className="flex items-center gap-2 blur-[5px] pointer-events-none select-none opacity-50">
                    <span className={`rounded-lg border px-2 py-1 text-xs font-black ${c.impactBg}`}>
                      +{step.impactPct}%
                    </span>
                    {step.trafficGain > 0 && (
                      <span className="text-[11px] font-semibold text-emerald-400">
                        +{step.trafficGain.toLocaleString()} visits/mo
                      </span>
                    )}
                  </div>
                  <div className="absolute inset-0 flex items-center">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-red-400">
                      {brand} lost +??% today — competitors gained
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-3">
                  <span className={`rounded-lg border px-2 py-1 text-xs font-black ${c.impactBg}`}>
                    +{step.impactPct}%
                  </span>
                  {step.trafficGain > 0 && (
                    <span className="text-[11px] font-semibold text-emerald-400">
                      +{step.trafficGain.toLocaleString()} visits/mo
                    </span>
                  )}
                </div>
              )}

              {/* Result statement — locked: blurred */}
              {locked ? (
                <div className="relative mt-2">
                  <p className="text-[11px] text-slate-500 italic leading-snug blur-[4px] pointer-events-none select-none opacity-40">{step.result}</p>
                  <p className="absolute inset-0 text-[10px] text-red-400 flex items-center">See {brand}'s daily loss breakdown</p>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 mt-2 italic leading-snug">{step.result}</p>
              )}

              {/* CTA */}
              <div className={`mt-3 inline-flex items-center gap-1 rounded-lg bg-gradient-to-r ${c.btnBg} px-3 py-1.5 text-xs font-bold text-white shadow-md group-hover:shadow-lg transition-shadow`}>
                {step.cta} <span className="text-[10px] opacity-70">→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Unlock CTA when locked */}
      {locked && onUnlock && (
        <div className="mt-4 rounded-xl bg-gradient-to-r from-red-600/10 to-orange-600/10 border border-red-500/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            <p className="text-xs text-slate-300"><span className="font-bold text-red-400">{brand} is losing traffic today</span> — see your per-day visitor loss, revenue impact, and {brand}'s recovery plan</p>
          </div>
          <button
            onClick={onUnlock}
            className="shrink-0 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-4 py-2 text-xs font-bold text-white shadow-lg hover:shadow-red-500/25 transition-all"
          >
            Recover {brand}'s Traffic
          </button>
        </div>
      )}
    </div>
  );
}
