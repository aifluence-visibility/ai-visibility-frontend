import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

const FLAG_MAP = { US: "🇺🇸", UK: "🇬🇧", DE: "🇩🇪", FR: "🇫🇷", AU: "🇦🇺", CA: "🇨🇦" };

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-600/70 bg-[#0f172a]/95 px-4 py-3 text-xs text-white shadow-2xl backdrop-blur-sm">
      <p className="font-black text-sm">{FLAG_MAP[d.country] || "🌍"} {d.name}</p>
      <p className="mt-1 text-slate-300">Visibility: <span className="font-bold text-white">{d.score}/100</span></p>
      {d.isOpportunity && (
        <p className="mt-1.5 inline-flex rounded-full bg-amber-400/15 border border-amber-400/30 px-2 py-0.5 text-[10px] font-black text-amber-200">
          🎯 Best opportunity
        </p>
      )}
      {d.isStrongest && (
        <p className="mt-1.5 inline-flex rounded-full bg-emerald-400/15 border border-emerald-400/30 px-2 py-0.5 text-[10px] font-black text-emerald-200">
          ✅ Strongest market
        </p>
      )}
      {d.isWeakest && !d.isOpportunity && (
        <p className="mt-1.5 inline-flex rounded-full bg-red-400/15 border border-red-400/30 px-2 py-0.5 text-[10px] font-black text-red-300">
          ⚠️ Weakest market
        </p>
      )}
    </div>
  );
}

export function CountryVisibilityChart({ countryData, className = "" }) {
  const fallbackChartData = [
    { country: "US", name: "United States", score: 38, isOpportunity: false, isStrongest: true, isWeakest: false },
    { country: "UK", name: "United Kingdom", score: 31, isOpportunity: true, isStrongest: false, isWeakest: false },
    { country: "DE", name: "Germany", score: 24, isOpportunity: false, isStrongest: false, isWeakest: true },
  ];
  const { opportunityCountry, opportunityReason, insight } = countryData || {};
  const chartData = countryData?.chartData?.length ? countryData.chartData : fallbackChartData;
  const resolvedOpportunityCountry = opportunityCountry || "UK";
  const resolvedOpportunityReason = opportunityReason || "UK has weak visibility but high upside. Localized comparison content can move this quickly.";
  const resolvedInsight = insight || "Regional visibility is uneven. Prioritize the weakest market first to improve overall recommendation share.";

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="barStrong" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
                <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barOpportunity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                <stop offset="100%" stopColor="#d97706" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barWeak" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f87171" stopOpacity={1} />
                <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="barDefault" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="country"
              tick={({ x, y, payload }) => {
                return (
                  <text x={x} y={y + 14} textAnchor="middle" fontSize={11} fill="#94a3b8">
                    {FLAG_MAP[payload.value] || ""} {payload.value}
                  </text>
                );
              }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <ReferenceLine y={50} stroke="#334155" strokeDasharray="4 4" label={{ value: "avg", fill: "#475569", fontSize: 10, position: "right" }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
            <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={48}>
              {chartData.map((entry, idx) => {
                const fill = entry.isStrongest
                  ? "url(#barStrong)"
                  : entry.isOpportunity
                  ? "url(#barOpportunity)"
                  : entry.isWeakest
                  ? "url(#barWeak)"
                  : "url(#barDefault)";
                return <Cell key={idx} fill={fill} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[11px]">
        <span className="flex items-center gap-1.5 text-cyan-300"><span className="h-2.5 w-2.5 rounded-sm bg-cyan-400 inline-block" /> Strongest market</span>
        <span className="flex items-center gap-1.5 text-amber-300"><span className="h-2.5 w-2.5 rounded-sm bg-amber-400 inline-block" /> Best opportunity</span>
        <span className="flex items-center gap-1.5 text-red-300"><span className="h-2.5 w-2.5 rounded-sm bg-red-400 inline-block" /> Weakest market</span>
      </div>

      {/* Opportunity callout */}
      {resolvedOpportunityCountry && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-400/8 p-3">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-amber-300 mb-1">
            🎯 Priority: {FLAG_MAP[resolvedOpportunityCountry] || ""} {resolvedOpportunityCountry}
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">{resolvedOpportunityReason}</p>
        </div>
      )}

      {/* Main insight */}
      {resolvedInsight && (
        <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700/40 pt-3">{resolvedInsight}</p>
      )}

      <div className="rounded-xl border border-slate-700/40 bg-slate-900/45 p-3 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">What this means</p>
        <p className="text-xs text-slate-300">Country performance is uneven: strongest market is scaling while weakest markets are suppressing total AI recommendation share.</p>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Why it matters</p>
        <p className="text-xs text-slate-300">When one market underperforms, competitor narratives become the default answer in that region and spill into adjacent prompts.</p>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">What to do</p>
        <p className="text-xs text-slate-300">Prioritize {resolvedOpportunityCountry} with localized comparison pages, local proof, and regional citations before competitors harden their lead.</p>
      </div>
    </div>
  );
}
