import React, { useState } from "react";
import { GlassCard } from "../../shared/components";

const DAY_COLORS = [
  { border: "border-red-500/30", bg: "bg-red-500/10", accent: "text-red-400", glow: "bg-red-500", badge: "bg-red-500/15 text-red-400 border-red-500/30" },
  { border: "border-orange-500/30", bg: "bg-orange-500/10", accent: "text-orange-400", glow: "bg-orange-500", badge: "bg-orange-500/15 text-orange-400 border-orange-500/30" },
  { border: "border-amber-500/30", bg: "bg-amber-500/10", accent: "text-amber-400", glow: "bg-amber-500", badge: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { border: "border-cyan-500/30", bg: "bg-cyan-500/10", accent: "text-cyan-400", glow: "bg-cyan-500", badge: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" },
  { border: "border-blue-500/30", bg: "bg-blue-500/10", accent: "text-blue-400", glow: "bg-blue-500", badge: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { border: "border-purple-500/30", bg: "bg-purple-500/10", accent: "text-purple-400", glow: "bg-purple-500", badge: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
  { border: "border-emerald-500/30", bg: "bg-emerald-500/10", accent: "text-emerald-400", glow: "bg-emerald-500", badge: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
];

const IMPACT_COLORS = {
  high: "bg-red-500/15 text-red-400 border-red-500/30",
  medium: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

export default function RecoveryPlanSection({ plan, vis, shock, brandName, locked, onUnlock }) {
  const [expandedDays, setExpandedDays] = useState({ 0: true });
  const toggleDay = (i) => setExpandedDays(prev => ({ ...prev, [i]: !prev[i] }));

  if (!plan || plan.length === 0) return null;

  const totalTrafficGain = plan.reduce((sum, d) => sum + (d.trafficGain || 0), 0);
  const totalRevenueRecovery = Math.round(shock.estimatedMonthlyLoss * 0.45);
  const totalActions = plan.reduce((sum, d) => sum + d.actions.length, 0);

  return (
    <div className="space-y-4">
      {/* ── Impact-Driven Header ── */}
      <GlassCard className="p-6 border-l-4 border-l-emerald-500" glow="bg-emerald-500">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-lg mt-0.5">📋</span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-200">Most Valuable</span>
              <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Pro feature</span>
            </div>
            <h3 className="text-base font-black text-white">7-Day AI Visibility Recovery Plan</h3>
            <p className="text-xs text-slate-400 mt-0.5">Personalized execution plan based on {brandName}'s analysis</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-center">
            <p className="text-xl font-black text-emerald-400">+{totalTrafficGain.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Visits/month</p>
          </div>
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 text-center">
            <p className="text-xl font-black text-emerald-400">${totalRevenueRecovery.toLocaleString()}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Revenue recovery</p>
          </div>
          <div className="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3 text-center">
            <p className="text-xl font-black text-blue-400">{Math.min(85, vis + 25)}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Target score</p>
          </div>
          <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-center">
            <p className="text-xl font-black text-amber-400">{totalActions}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Actions in 7 days</p>
          </div>
        </div>
      </GlassCard>

      {/* ── Day 1 — always visible (free teaser) ── */}
      <DayCard
        day={plan[0]}
        index={0}
        color={DAY_COLORS[0]}
        expanded={!!expandedDays[0]}
        onToggle={() => toggleDay(0)}
      />

      {/* ── Days 2-7 — add-on preview (no blur) ── */}
      <div className="space-y-4">
        {plan.slice(1).map((day, i) => (
          <DayCard
            key={day.day}
            day={day}
            color={DAY_COLORS[i + 1]}
            expanded={!locked && !!expandedDays[i + 1]}
            onToggle={() => toggleDay(i + 1)}
          />
        ))}
      </div>
      {locked ? (
        <GlassCard className="p-6 border border-amber-400/30" glow="bg-amber-500">
          <div className="text-center">
            <div className="mx-auto mb-3 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Strategy Add-on</div>
            <p className="text-lg font-black text-white">Your recovery plan is ready</p>
            <p className="mt-2 text-sm text-slate-400">Unlock detailed execution for Days 2–7 and turn visibility gaps into weekly wins.</p>
            <button
              onClick={onUnlock}
              className="mt-5 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-6 py-3 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl"
            >
              Unlock Strategy ($19/month)
            </button>
          </div>
        </GlassCard>
      ) : null}

      {/* ── Sticky CTA bar ── */}
      <GlassCard className={`p-5 border ${locked ? "border-amber-400/20" : "border-emerald-500/20"}`} glow={locked ? "bg-amber-500" : "bg-emerald-500"}>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <p className="text-sm font-bold text-white">{locked ? "Your recovery plan is ready. Unlock to recover your traffic." : "Your full recovery plan is unlocked."}</p>
            <p className="text-xs text-slate-400 mt-0.5">{locked ? "The premium 7-Day Recovery Plan is the fastest path to reclaim lost AI demand." : "Use the full 7-day sequence to execute, track progress, and recover visibility."}</p>
            <p className={`text-[11px] font-medium mt-1 ${locked ? "text-amber-200/90" : "text-emerald-300/90"}`}>{locked ? "Add the 7-Day Recovery Plan for just $19/month." : "Keep moving day by day until the visibility gap closes."}</p>
          </div>
          {locked ? (
            <button
              onClick={onUnlock}
              className="rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 px-8 py-3 text-sm font-black text-slate-950 shadow-lg hover:shadow-amber-500/25 hover:shadow-xl transition-all whitespace-nowrap shrink-0"
            >
                Unlock for $19/month
            </button>
          ) : (
            <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-300">Full plan active</div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

function DayCard({ day, color, expanded, onToggle }) {
  const impactStyle = IMPACT_COLORS[day.impactLevel] || IMPACT_COLORS.medium;

  return (
    <GlassCard className={`overflow-hidden ${color.border} border`} glow={color.glow}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${color.bg} border ${color.border} shrink-0`}>
          <span className="text-xl">{day.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${color.badge}`}>
              Day {day.day}
            </span>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${impactStyle}`}>
              {day.impactLevel} impact
            </span>
            {day.trafficGain > 0 && (
              <span className="text-[10px] font-bold text-emerald-400">+{day.trafficGain.toLocaleString()} visits</span>
            )}
          </div>
          <p className="text-sm font-bold text-white">{day.title}</p>
          <p className="text-xs text-slate-400 mt-0.5">{day.theme}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden md:block text-right max-w-[180px]">
            <p className={`text-[11px] font-semibold ${color.accent} leading-tight`}>{day.estimatedImpact}</p>
          </div>
          <svg
            className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-700/30">
          <div className={`mt-4 mb-3 flex items-center gap-2 rounded-lg ${color.bg} border ${color.border} px-3 py-2`}>
            <span className="text-xs">📈</span>
            <p className={`text-[11px] font-semibold ${color.accent}`}>Estimated impact: {day.estimatedImpact}</p>
          </div>
          <div className="space-y-2.5">
            {day.actions.map((action, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${color.bg} border ${color.border} shrink-0 mt-0.5`}>
                  <span className={`text-[10px] font-black ${color.accent}`}>{i + 1}</span>
                </div>
                <p className="text-[13px] text-slate-300 leading-relaxed">{action}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlassCard>
  );
}
