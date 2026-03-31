import React, { useState } from "react";

const IMPACT_STYLE = {
  high: { badge: "border-red-500/40 bg-red-500/10 text-red-300", glow: "border-red-500/25", accent: "text-red-300", dot: "bg-red-400" },
  medium: { badge: "border-amber-500/40 bg-amber-500/10 text-amber-300", glow: "border-amber-500/25", accent: "text-amber-300", dot: "bg-amber-400" },
  low: { badge: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300", glow: "border-emerald-500/25", accent: "text-emerald-300", dot: "bg-emerald-400" },
};

/**
 * InsightCardV2
 * Strict format: { title, what, why, source, action, impact, impactPoints }
 */
export function InsightCardV2({ insight, index = 0 }) {
  const [expanded, setExpanded] = useState(false);
  if (!insight) return null;

  const {
    title,
    what,
    why,
    source,
    pattern,
    risk,
    riskLevel,
    action,
    actionSteps,
    expectedImpact,
    estimatedLoss,
    competitorDominancePct,
    impact = "medium",
    impactPoints,
  } = insight;
  const style = IMPACT_STYLE[impact] || IMPACT_STYLE.medium;
  const riskTone = riskLevel === "high" ? "border-red-500/35 bg-red-500/10 text-red-300" : riskLevel === "medium" ? "border-amber-500/35 bg-amber-500/10 text-amber-300" : "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
  const steps = (actionSteps && actionSteps.length ? actionSteps : [action]).filter(Boolean);

  return (
    <div className={`rounded-2xl border ${style.glow} bg-gradient-to-br from-[#111827] to-[#0f172a] overflow-hidden shadow-xl`}>
      <button
        className="w-full text-left px-5 py-4 hover:bg-white/[0.015] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`flex h-7 w-7 items-center justify-center rounded-xl border ${style.badge} text-[11px] font-black shrink-0 mt-0.5`}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${style.badge}`}>
                  {impact} impact
                </span>
                {riskLevel && (
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${riskTone}`}>
                    {riskLevel} risk
                  </span>
                )}
                {impactPoints && (
                  <span className="text-[10px] font-bold text-emerald-400">
                    +{impactPoints} pts potential
                  </span>
                )}
                {typeof competitorDominancePct === "number" && (
                  <span className="text-[10px] font-bold text-rose-300">{competitorDominancePct}% competitor dominance</span>
                )}
              </div>
              <p className="text-sm font-bold text-white leading-snug">{title}</p>
            </div>
          </div>
          <svg className={`h-4 w-4 text-slate-500 shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/30 space-y-3">
          {/* WHAT */}
          <div className="mt-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500 mb-1.5">WHAT</p>
            <p className="text-xs text-slate-300 leading-relaxed">{what}</p>
          </div>

          {/* WHY */}
          <div className="rounded-xl border border-slate-700/30 bg-slate-900/50 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-400 mb-1.5">WHY</p>
            <p className="text-xs text-slate-300 leading-relaxed">{why}</p>
            {pattern && <p className="mt-2 text-[11px] text-slate-400">Pattern: {pattern}</p>}
          </div>

          {/* SOURCE */}
          {source && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">SOURCE:</span>
              <span className="text-[11px] text-slate-500 italic">{source}</span>
            </div>
          )}

          {/* RISK */}
          {risk && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-300 mb-1.5">RISK</p>
              <p className="text-xs text-red-200/85 leading-relaxed">{risk}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-red-200/80">
                {typeof estimatedLoss === "number" && <span>Estimated loss: {estimatedLoss.toLocaleString()} visits/mo</span>}
                {typeof competitorDominancePct === "number" && <span>Dominance: {competitorDominancePct}%</span>}
              </div>
            </div>
          )}

          {/* ACTION */}
          <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/5 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300 mb-1.5">ACTION</p>
            <div className="space-y-1.5">
              {steps.map((step, idx) => (
                <p key={`${idx}-${step}`} className="text-xs text-emerald-200/80 leading-relaxed font-medium">{idx + 1}. {step}</p>
              ))}
            </div>
          </div>

          {/* IMPACT */}
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-300 mb-1.5">IMPACT</p>
            <p className="text-xs text-cyan-200/80 leading-relaxed">{expectedImpact || `+${impactPoints || 10} visibility points possible`}</p>
          </div>
        </div>
      )}

      {/* Always-visible collapsed preview */}
      {!expanded && (
        <div className="px-5 pb-4">
          <p className="text-xs text-slate-600 line-clamp-1">{what}</p>
          <button
            className={`mt-2 text-[11px] font-bold ${style.accent} hover:opacity-80 transition-opacity`}
            onClick={() => setExpanded(true)}
          >
            See analysis + action →
          </button>
        </div>
      )}
    </div>
  );
}

export function InsightFeed({ insights, className = "" }) {
  if (!insights?.length) return null;
  return (
    <div className={`space-y-3 ${className}`}>
      {insights.map((insight, i) => (
        <InsightCardV2 key={i} insight={insight} index={i} />
      ))}
    </div>
  );
}
