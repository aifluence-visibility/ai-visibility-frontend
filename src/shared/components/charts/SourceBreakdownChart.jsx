import React from "react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from "recharts";

const SOURCE_META = {
  Reddit: { color: "#ff4500", bg: "bg-orange-500/15", border: "border-orange-500/30", text: "text-orange-300", icon: "👾" },
  Blog: { color: "#3b82f6", bg: "bg-blue-500/15", border: "border-blue-500/30", text: "text-blue-300", icon: "📝" },
  List: { color: "#a855f7", bg: "bg-fuchsia-500/15", border: "border-fuchsia-500/30", text: "text-fuchsia-300", icon: "📋" },
  News: { color: "#f59e0b", bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-300", icon: "📰" },
  Docs: { color: "#10b981", bg: "bg-emerald-500/15", border: "border-emerald-500/30", text: "text-emerald-300", icon: "📚" },
};

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const meta = SOURCE_META[d.type] || SOURCE_META.Blog;
  return (
    <div className="rounded-xl border border-slate-600/70 bg-[#0f172a]/95 px-4 py-3 text-xs shadow-2xl backdrop-blur-sm min-w-[140px]">
      <p className="font-black text-sm text-white">{meta.icon} {d.type}</p>
      <p className="mt-1 text-slate-300">Citations: <span className="font-bold text-white">{d.count}</span></p>
      <p className="text-slate-400">Share: <span className="font-bold" style={{ color: meta.color }}>{d.pct}%</span></p>
    </div>
  );
}

export function SourceBreakdownChart({ sourceData, className = "" }) {
  if (!sourceData?.chartData?.length) return null;
  const { chartData } = sourceData;
  const ranked = [...chartData].sort((a, b) => b.count - a.count);
  const dominant = ranked[0];
  const missing = ranked[ranked.length - 1];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="52%"
              outerRadius="80%"
              dataKey="count"
              nameKey="type"
              paddingAngle={3}
              strokeWidth={0}
            >
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={(SOURCE_META[entry.type] || SOURCE_META.Blog).color}
                  opacity={entry.count === 0 ? 0.25 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Source breakdown grid */}
      <div className="grid grid-cols-2 gap-2">
        {chartData.map((entry) => {
          const meta = SOURCE_META[entry.type] || SOURCE_META.Blog;
          return (
            <div key={entry.type} className={`flex items-center gap-2 rounded-lg border ${meta.border} ${meta.bg} px-3 py-2`}>
              <span className="text-base">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] font-bold ${meta.text}`}>{entry.type}</p>
                <p className="text-[10px] text-slate-500">{entry.pct}% of citations</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl border border-slate-700/40 bg-slate-900/45 p-3 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">What this means</p>
        <p className="text-xs text-slate-300">AI currently trusts {dominant?.type} most ({dominant?.pct || 0}%) while {missing?.type} is underrepresented ({missing?.pct || 0}%).</p>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Why it matters</p>
        <p className="text-xs text-slate-300">An unbalanced source mix makes your visibility fragile; if the dominant source weakens, recommendation share can drop fast.</p>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">What to do</p>
        <p className="text-xs text-slate-300">Keep dominant momentum, then close the weakest source gap with 2 targeted content assets and 2 third-party mentions this sprint.</p>
      </div>
    </div>
  );
}

export function SourceInsightCard({ sourceData, className = "" }) {
  if (!sourceData) return null;
  const { dominant, missing, dominantInsight, missingInsight } = sourceData;
  const domMeta = SOURCE_META[dominant?.charAt(0).toUpperCase() + dominant?.slice(1)] || SOURCE_META.Blog;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Dominant source */}
      <div className={`rounded-xl border ${domMeta.border} ${domMeta.bg} p-4`}>
        <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${domMeta.text} mb-1.5`}>
          {domMeta.icon} Dominant source: {dominant}
        </p>
        <p className="text-xs text-slate-300 leading-relaxed">{dominantInsight}</p>
      </div>

      {/* Missing source */}
      <div className="rounded-xl border border-slate-600/40 bg-slate-900/50 p-4">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-300 mb-1.5">
          ⚠️ Missing source: {missing}
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">{missingInsight}</p>
      </div>
    </div>
  );
}
