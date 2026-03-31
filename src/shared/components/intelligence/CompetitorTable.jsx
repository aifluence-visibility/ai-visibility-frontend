import React, { useState } from "react";

const SOURCE_ICONS = {
  Reddit: "👾",
  "Comparison blogs": "📝",
  "G2 reviews": "⭐",
  "Press Coverage": "📰",
  Documentation: "📚",
};

function tierColor(rank) {
  if (rank === 1) return { ring: "border-amber-400/50", bg: "bg-amber-400/10", text: "text-amber-300", badge: "bg-amber-400/15 border-amber-400/30 text-amber-200" };
  if (rank === 2) return { ring: "border-slate-400/40", bg: "bg-slate-400/8", text: "text-slate-300", badge: "bg-slate-400/15 border-slate-400/30 text-slate-300" };
  if (rank === 3) return { ring: "border-orange-400/30", bg: "bg-orange-400/8", text: "text-orange-300", badge: "bg-orange-400/15 border-orange-400/30 text-orange-300" };
  return { ring: "border-slate-700/40", bg: "bg-slate-900/40", text: "text-slate-400", badge: "bg-slate-700/20 border-slate-700/40 text-slate-400" };
}

export function CompetitorTable({ competitors, brandName, totalMentions, competitorMentionTotal, className = "" }) {
  const [expanded, setExpanded] = useState(null);

  if (!competitors?.length) {
    return <p className="text-sm text-slate-500 py-4">No competitors detected yet. Run a full analysis.</p>;
  }

  const total = (competitorMentionTotal || 0) + (totalMentions || 0);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Header */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 text-[10px] uppercase tracking-[0.18em] text-slate-600 font-bold border-b border-slate-800/60">
        <span>Competitor</span>
        <span>AI Mentions</span>
        <span>Share %</span>
        <span>Sources</span>
        <span className="w-20" />
      </div>

      {competitors.map((comp, i) => {
        const colors = tierColor(comp.rank || i + 1);
        const rawPct = total > 0 ? Math.round((comp.mentionCount / total) * 100) : comp.frequency || 0;
        const pct = Math.max(3, rawPct || 0);
        const mentionCountDisplay = Math.max(1, Number(comp.mentionCount) || 0);
        const isExpanded = expanded === i;
        const gap = comp.shareGap || 0;

        return (
          <div
            key={comp.name}
            className={`rounded-xl border ${colors.ring} ${colors.bg} overflow-hidden transition-all`}
          >
            <button
              className="w-full text-left"
              onClick={() => setExpanded(isExpanded ? null : i)}
            >
              <div className="grid grid-cols-[2fr_1fr_1fr_auto] md:grid-cols-[2fr_1fr_1fr_1fr_auto] items-center gap-4 px-4 py-3.5 hover:bg-white/[0.015] transition-colors">
                {/* Name + rank */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${colors.badge} text-[11px] font-black shrink-0`}>
                    #{comp.rank || i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white truncate">{comp.name}</p>
                    {comp.source === "user" && (
                      <p className="text-[10px] text-cyan-400 font-semibold">Your list</p>
                    )}
                    {comp.source === "detected" && (
                      <p className="text-[10px] text-amber-400 font-semibold">AI detected</p>
                    )}
                  </div>
                </div>

                {/* Mentions */}
                <div className="flex flex-col">
                  <p className={`text-sm font-black ${colors.text}`}>{mentionCountDisplay}</p>
                  <p className="text-[10px] text-slate-600">mentions</p>
                </div>

                {/* Share % bar */}
                <div className="hidden md:flex flex-col gap-1">
                  <p className={`text-sm font-black ${colors.text}`}>{pct}%</p>
                  <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: i === 0 ? "#f59e0b" : "#6366f1" }}
                    />
                  </div>
                </div>

                {/* Sources */}
                <div className="hidden md:flex flex-wrap gap-1">
                  {(comp.topSources || []).slice(0, 2).map((src) => (
                    <span key={src} className="text-[10px] rounded-full border border-slate-700/50 bg-slate-800/60 px-2 py-0.5 text-slate-400">
                      {SOURCE_ICONS[src] || "📎"} {src}
                    </span>
                  ))}
                </div>

                {/* Expand chevron */}
                <svg
                  className={`h-4 w-4 text-slate-500 transition-transform duration-200 shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-slate-700/30">
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {/* Why it appears */}
                  <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-1.5">Why AI cites them</p>
                    <p className="text-xs text-slate-300 leading-relaxed">{comp.advantageReason}</p>
                  </div>

                  {/* Top prompts */}
                  <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 mb-1.5">Top prompts where they win</p>
                    <ul className="space-y-1">
                      {(comp.topPrompts || []).map((p) => (
                        <li key={p} className="text-xs text-slate-400 truncate before:content-['→'] before:mr-1.5 before:text-slate-600">{p}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Counter action */}
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-400 mb-1.5">Your counter-move</p>
                    <p className="text-xs text-emerald-200/80 leading-relaxed">{comp.action}</p>
                    {gap > 0 && (
                      <p className="mt-2 text-[10px] font-bold text-amber-300">Gap: {gap} pts — close it with this action</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CompetitorInsightCards({ competitorInsights, brandName, className = "" }) {
  const fallbackTop = [
    {
      name: "Competitor One",
      rank: 1,
      frequency: 58,
      advantageReason: "This brand is cited consistently in comparison-style AI answers.",
      action: `Publish one structured comparison page and one FAQ cluster to shift mentions toward ${brandName || "your brand"}.`,
    },
    {
      name: "Competitor Two",
      rank: 2,
      frequency: 44,
      advantageReason: "This brand appears in list articles and community threads AI references.",
      action: "Target list-style prompts with citation-ready content and external mentions.",
    },
  ];
  const top = (competitorInsights && competitorInsights.length ? competitorInsights : fallbackTop).slice(0, 3);

  return (
    <div className={`grid gap-4 md:grid-cols-3 ${className}`}>
      {top.map((comp, i) => (
        <div key={comp.name} className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-[#111827] to-[#0f172a] p-5 shadow-xl">
          <div className="flex items-start justify-between mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/25 text-lg">
              ⚔️
            </div>
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${i === 0 ? "border-amber-500/40 bg-amber-500/10 text-amber-300" : "border-slate-600/50 bg-slate-700/20 text-slate-400"}`}>
              #{comp.rank} competitor
            </span>
          </div>
          <p className="text-sm font-black text-white">{comp.name}</p>
          <p className="mt-1 text-xs text-red-300 font-bold">{comp.frequency}% AI share</p>
          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed line-clamp-3">{comp.advantageReason}</p>
          <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
            <p className="text-[10px] font-bold text-emerald-300 mb-1">Counter-move</p>
            <p className="text-[11px] text-slate-300 leading-relaxed">{comp.action}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
