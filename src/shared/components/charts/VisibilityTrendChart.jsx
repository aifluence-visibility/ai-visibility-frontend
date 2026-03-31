import React from "react";
import {
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";

function CustomTooltip({ active, payload, label, brandName }) {
  if (!active || !payload?.length) return null;
  const userEntry = payload.find((p) => p.dataKey === "userScore");
  const compEntry = payload.find((p) => p.dataKey === "competitorAvg");
  return (
    <div className="rounded-xl border border-slate-600/70 bg-[#0f172a]/95 px-4 py-3 text-xs shadow-2xl backdrop-blur-sm">
      <p className="font-bold text-slate-300 mb-2">{label}</p>
      {userEntry && (
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 inline-block" />
          <span className="text-slate-300">{brandName || "You"}</span>
          <span className="ml-auto font-black text-cyan-300">{userEntry.value}/100</span>
        </div>
      )}
      {compEntry && (
        <div className="flex items-center gap-2 mt-1">
          <span className="h-2 w-2 rounded-full bg-red-400 inline-block" />
          <span className="text-slate-300">Competitor avg</span>
          <span className="ml-auto font-black text-red-300">{compEntry.value}/100</span>
        </div>
      )}
      {userEntry && compEntry && (
        <div className="mt-2 border-t border-slate-700/50 pt-2">
          <p className={`text-[10px] font-bold ${compEntry.value - userEntry.value > 10 ? "text-red-300" : "text-amber-300"}`}>
            Gap: {compEntry.value - userEntry.value} points behind
          </p>
        </div>
      )}
    </div>
  );
}

export function VisibilityTrendChart({ trendData, brandName, className = "" }) {
  if (!trendData || trendData.length < 2) {
    return <p className="text-sm text-slate-500 py-8 text-center">Not enough data for trend analysis.</p>;
  }

  const currentGap = trendData.length
    ? trendData[trendData.length - 1].competitorAvg - trendData[trendData.length - 1].userScore
    : 0;
  const startGap = trendData[0].competitorAvg - trendData[0].userScore;
  const gapTrend = currentGap < startGap ? "closing" : "widening";

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="gradUser" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#f87171" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip brandName={brandName} />} cursor={{ stroke: "#334155", strokeWidth: 1 }} />
            <Area
              type="monotoneX"
              dataKey="competitorAvg"
              stroke="#f87171"
              strokeWidth={2}
              fill="url(#gradComp)"
              dot={false}
              activeDot={{ r: 5, fill: "#f87171", stroke: "#0f172a", strokeWidth: 2 }}
            />
            <Area
              type="monotoneX"
              dataKey="userScore"
              stroke="#22d3ee"
              strokeWidth={2.5}
              fill="url(#gradUser)"
              dot={false}
              activeDot={{ r: 6, fill: "#22d3ee", stroke: "#0f172a", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend + gap summary */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <span className="h-0.5 w-6 rounded-full bg-cyan-400 inline-block" />
            {brandName || "You"}
          </span>
          <span className="flex items-center gap-1.5 text-red-300">
            <span className="h-0.5 w-6 rounded-full bg-red-400 inline-block" />
            Competitor avg
          </span>
        </div>
        <div className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black ${gapTrend === "closing" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-red-500/40 bg-red-500/10 text-red-300"}`}>
          Gap {gapTrend === "closing" ? "▼ closing" : "▲ widening"} — {currentGap} pts
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/40 bg-slate-900/45 p-3 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">What this means</p>
        <p className="text-xs text-slate-300">Your trajectory is {gapTrend === "closing" ? "improving" : "falling behind"} against competitor average with a current {currentGap}-point recommendation gap.</p>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Why it matters</p>
        <p className="text-xs text-slate-300">If this trend keeps widening, AI answers will reinforce competitor preference and conversion-stage prompts will become harder to recover.</p>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">What to do</p>
        <p className="text-xs text-slate-300">Ship one comparison page + one FAQ block + one external citation cycle this week to compress the gap and shift recommendation probability.</p>
      </div>
    </div>
  );
}
