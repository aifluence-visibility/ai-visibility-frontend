import React from "react";
import { useNavigate } from "react-router-dom";

/*
  ValueStrip — top-of-dashboard urgency bar
  Shows: visibility loss | competitor pressure | quick win
  Supports locked mode: blurs exact values, shows teasers
*/
export default function ValueStrip({ vis, trafficLoss, compDom, topComp, quickWins, locked = false, onUnlock, brandName }) {
  const navigate = useNavigate();
  const win = quickWins?.[0];

  return (
    <div className="mx-auto max-w-[1200px] px-4">
    <div className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-500/[0.08] via-orange-500/[0.06] to-red-500/[0.04] px-5 py-3 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-6">
      {/* Visibility loss */}
      <button
        onClick={() => navigate("/app/visibility")}
        className="flex items-center gap-2 group"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/15 text-sm shrink-0">📉</span>
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/70">Losing Today</p>
          {locked ? (
            <div className="relative">
              <p className="text-sm font-black text-red-400 blur-[5px] select-none pointer-events-none opacity-50">{trafficLoss}%</p>
              <span className="absolute inset-0 flex items-center text-[11px] font-bold text-red-400">{brandName || "Your brand"} lost ??% today</span>
            </div>
          ) : (
            <p className="text-sm font-black text-red-400 group-hover:text-red-300 transition-colors">
              {trafficLoss}% <span className="text-xs font-semibold text-slate-500">of queries lost</span>
            </p>
          )}
        </div>
      </button>

      <div className="hidden md:block h-8 w-px bg-slate-700/40" />

      {/* Competitor pressure */}
      <button
        onClick={() => navigate("/app/competitors")}
        className="flex items-center gap-2 group"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/15 text-sm shrink-0">⚔️</span>
        <div className="text-left">
          <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400/70">Gaining On You</p>
          {locked ? (
            <div className="relative">
              <p className="text-sm font-black text-amber-400 blur-[5px] select-none pointer-events-none opacity-50">{compDom}%</p>
              <span className="absolute inset-0 flex items-center text-[11px] font-bold text-orange-400">⚠️ {topComp?.name || "Competitor"} pulling ahead today</span>
            </div>
          ) : (
            <p className="text-sm font-black text-amber-400 group-hover:text-amber-300 transition-colors">
              {compDom}% <span className="text-xs font-semibold text-slate-500">{topComp?.name ? `by ${topComp.name}` : "dominance"}</span>
            </p>
          )}
        </div>
      </button>

      <div className="hidden md:block h-8 w-px bg-slate-700/40" />

      {/* Quick win */}
      {win && (
        <button
          onClick={() => locked && onUnlock ? onUnlock() : navigate("/app/actions")}
          className="flex items-center gap-2 group flex-1 min-w-0"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-sm shrink-0">⚡</span>
          <div className="text-left min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Top Quick Win</p>
            {locked ? (
              <p className="text-sm font-semibold text-red-400 truncate">{brandName || "You"}'re losing traffic on this today</p>
            ) : (
              <p className="text-sm font-semibold text-emerald-400 group-hover:text-emerald-300 transition-colors truncate">
                {win.title}
              </p>
            )}
          </div>
        </button>
      )}

      {/* Upgrade pill when locked */}
      {locked && onUnlock && (
        <>
          <div className="hidden md:block h-8 w-px bg-slate-700/40" />
          <button
            onClick={onUnlock}
            className="shrink-0 rounded-lg bg-gradient-to-r from-red-600 to-orange-500 px-3 py-1.5 text-[11px] font-bold text-white shadow-md hover:shadow-red-500/25 transition-all"
          >
            Recover {brandName || "Your"}'s Traffic →
          </button>
        </>
      )}
    </div>
    </div>
  );
}
