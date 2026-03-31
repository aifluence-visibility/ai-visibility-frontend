import React from "react";
import {
  RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line,
} from "recharts";

/* ─── Glass Card ─── */
export function GlassCard({ children, className = "", glow = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#111827] shadow-xl shadow-black/30 backdrop-blur-sm ${className}`}>
      {glow && <div className={`pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-20 blur-3xl ${glow}`} />}
      {children}
    </div>
  );
}

/* ─── Section Header ─── */
export function SectionHeader({ icon, title, subtitle, badge, badgeColor = "text-indigo-400" }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 text-lg">{icon}</span>}
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {badge && <span className={`text-xs font-semibold ${badgeColor}`}>{badge}</span>}
    </div>
  );
}

/* ─── Score Gauge ─── */
const gaugeColor = (s) => (s <= 30 ? "#ef4444" : s <= 60 ? "#eab308" : "#22c55e");
const gaugeLabel = (s) => (s <= 30 ? "Critical" : s <= 60 ? "Needs Work" : "Healthy");

export function ScoreGauge({ score, size = 220, label }) {
  const color = gaugeColor(score);
  const text = label || gaugeLabel(score);
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: size, height: size }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={20} data={[{ value: score, fill: color }]} startAngle={210} endAngle={-30}>
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
            <RadialBar background={{ fill: "#1e293b" }} dataKey="value" cornerRadius={12} angleAxisId={0} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tabular-nums" style={{ color }}>{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">out of 100</span>
          <span className="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}>{text}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Card ─── */
export function KpiCard({ label, value, suffix = "", color = "#3b82f6", icon, sub, pulse, delta }) {
  const glowMap = { "#ef4444": "bg-red-500", "#22c55e": "bg-emerald-500", "#eab308": "bg-amber-500" };
  return (
    <GlassCard className="p-5" glow={glowMap[color] || "bg-indigo-500"}>
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-black tabular-nums tracking-tight" style={{ color }}>
        {value}{suffix}
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        {delta !== undefined && <span className={`text-[10px] font-bold ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>{delta >= 0 ? "+" : ""}{delta}%</span>}
        {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
      </div>
      {pulse && <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
    </GlassCard>
  );
}

/* ─── Competitor Bar Chart ─── */
export function CompetitorBarChart({ competitors, brandName, brandMentions, total }) {
  const chartData = competitors.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    fullName: c.name, pct: total > 0 ? Math.round((c.mentionCount / total) * 100) : 0,
    isBrand: c.name.toLowerCase() === (brandName || "").toLowerCase(),
  }));
  if (!chartData.some((d) => d.isBrand) && brandName) {
    chartData.push({ name: brandName.length > 12 ? brandName.slice(0, 12) + "…" : brandName, fullName: brandName, pct: total > 0 ? Math.round((brandMentions / total) * 100) : 0, isBrand: true });
  }
  const ChartTip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (<div className="rounded-lg border border-slate-600/80 bg-slate-800/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-sm"><p className="font-bold">{d.fullName}</p><p className="text-slate-300">Share: <span className="font-semibold text-white">{d.pct}%</span></p>{d.isBrand && <p className="mt-1 text-[10px] font-semibold text-blue-400">YOUR BRAND</p>}</div>);
  };
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 12, left: 0 }}>
        <defs>
          <linearGradient id="barBrand" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" /><stop offset="100%" stopColor="#6366f1" /></linearGradient>
          <linearGradient id="barComp" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} /><stop offset="100%" stopColor="#dc2626" stopOpacity={0.6} /></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
        <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
        <Bar dataKey="pct" radius={[8, 8, 0, 0]} maxBarSize={44}>
          {chartData.map((entry, idx) => <Cell key={idx} fill={entry.isBrand ? "url(#barBrand)" : "url(#barComp)"} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Trend Line Chart ─── */
export function TrendLineChart({ trend }) {
  if (!trend || trend.length < 2) return <p className="text-sm text-slate-500">Not enough data for trend.</p>;
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#e2e8f0" }} itemStyle={{ color: "#818cf8" }} />
        <Line type="monotone" dataKey="total" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4, fill: "#818cf8", strokeWidth: 2, stroke: "#0f172a" }} activeDot={{ r: 7, fill: "#818cf8", stroke: "#0f172a", strokeWidth: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── Insight Card ─── */
export function InsightCard({ icon, title, value, description, impact = "medium", action, locked, onUnlock }) {
  const impactColor = { high: "border-red-500/30 text-red-400", medium: "border-amber-500/30 text-amber-400", low: "border-emerald-500/30 text-emerald-400" };
  return (
    <GlassCard className={`p-5 ${locked ? "relative" : ""}`}>
      <div className="flex items-start justify-between">
        {icon && <span className="text-lg">{icon}</span>}
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${impactColor[impact] || impactColor.medium}`}>{impact}</span>
      </div>
      <p className="mt-3 text-sm font-bold text-white">{title}</p>
      {value && <p className="mt-1 text-2xl font-black text-white">{value}</p>}
      <p className="mt-2 text-xs text-slate-400">{description}</p>
      {action && <p className="mt-2 text-xs font-semibold text-emerald-400">→ {action}</p>}
      {locked && (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-center">
          <p className="text-xs font-bold text-amber-200">Unlock today’s full insight and next actions.</p>
          <button onClick={onUnlock} className="mt-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-[10px] font-bold text-slate-950">Unlock Insight</button>
        </div>
      )}
    </GlassCard>
  );
}

/* ─── Status Badge ─── */
export function StatusBadge({ label }) {
  const colorMap = { Critical: "border-red-500/40 bg-red-500/15 text-red-300", High: "border-amber-500/40 bg-amber-500/15 text-amber-300", Medium: "border-blue-500/40 bg-blue-500/15 text-blue-300", Low: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300" };
  return <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colorMap[label] || colorMap.Medium}`}>{label}</span>;
}

/* ─── Priority Score Badge ─── */
export function PriorityScore({ score }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#eab308" : "#22c55e";
  return (
    <div className="relative h-8 w-8">
      <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
        <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${score * 0.94} 100`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color }}>{score}</span>
    </div>
  );
}

/* ─── Opportunity List ─── */
export function OpportunityList({ items, locked, onUnlock }) {
  return (
    <div className="space-y-2">
      {items.map((opp) => {
        const diffColor = opp.difficulty === "Easy" ? "text-emerald-400" : opp.difficulty === "Medium" ? "text-amber-400" : "text-red-400";
        return (
          <div key={opp.query} className="flex items-center gap-4 rounded-xl border border-slate-700/40 bg-slate-900/50 px-4 py-3 hover:border-slate-600/60 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{opp.query}</p>
              <p className="text-[11px] text-slate-500">{opp.competitor} dominates at {opp.dominancePct}%</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <p className={`text-xs font-bold ${diffColor}`}>{opp.difficulty}</p>
              <StatusBadge label={opp.impact} />
            </div>
          </div>
        );
      })}
      {locked && (
        <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 p-4 text-center">
          <p className="text-xs font-bold text-amber-200">Unlock deeper opportunity scoring and strategy recommendations.</p>
          <button onClick={onUnlock} className="mt-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-[10px] font-bold text-slate-950">Unlock Strategy</button>
        </div>
      )}
    </div>
  );
}

/* ─── Paywall Section Wrapper ─── */
export function PaywallSection({ locked, title, description, cta = "Recover Your Traffic", onUnlock, children, ctaColor = "from-red-600 to-orange-500" }) {
  return (
    <div>
      {children}
      {locked && (
        <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-amber-400/30 bg-amber-500/10 text-center px-4 py-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 mb-3">
            <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <p className="text-sm font-bold text-white">{title || "Unlock premium insights"}</p>
          <p className="mt-1 text-xs text-slate-300 font-medium">{description || "Get full visibility intelligence and execution guidance."}</p>
          <p className="mt-2 text-xs font-bold text-amber-200">Your competitors may already be gaining visibility while you're not.</p>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">Takes 30 seconds · No setup required · Cancel anytime</p>
          <button onClick={onUnlock} className={`mt-4 rounded-xl bg-gradient-to-r ${ctaColor} px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-red-500/25 hover:shadow-xl transition-all`}>{cta}</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DECISION ENGINE COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

/* ─── Decision Summary ─── */
export function DecisionSummary({ summary }) {
  if (!summary) return null;
  return (
    <GlassCard className="p-5 border-l-4 border-l-blue-500" glow="bg-blue-500">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">🧠</span>
        <h3 className="text-sm font-black uppercase tracking-wider text-blue-400">Decision Summary</h3>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-1">What is happening</p>
          <p className="text-xs text-slate-300 leading-relaxed">{summary.what}</p>
        </div>
        <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-1">Why it matters</p>
          <p className="text-xs text-slate-300 leading-relaxed">{summary.why}</p>
        </div>
        <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 p-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-1">What to do next</p>
          <p className="text-xs text-slate-300 leading-relaxed">{summary.action}</p>
        </div>
      </div>
    </GlassCard>
  );
}

/* ─── Action Mode Toggle ─── */
export function ActionModeToggle({ actionMode, setActionMode }) {
  return (
    <div className="inline-flex rounded-xl border border-slate-700/50 bg-slate-900/80 p-1">
      <button
        onClick={() => setActionMode(false)}
        className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
          !actionMode
            ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-white border border-blue-500/30 shadow"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        📊 View Data
      </button>
      <button
        onClick={() => setActionMode(true)}
        className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${
          actionMode
            ? "bg-gradient-to-r from-emerald-600/30 to-cyan-600/20 text-white border border-emerald-500/30 shadow"
            : "text-slate-400 hover:text-slate-200"
        }`}
      >
        🚀 Take Action
      </button>
    </div>
  );
}

export { default as DemoConversionCta } from "./DemoConversionCta";
export { default as HighConversionPaywall } from "./HighConversionPaywall";

/* ─── Structured Action Card ─── */
export function ActionCard({ action, index, onApply, locked, onUnlock }) {
  const impactColorMap = { Critical: "bg-red-500/15 text-red-400 border-red-500/30", High: "bg-amber-500/15 text-amber-400 border-amber-500/30", Medium: "bg-blue-500/15 text-blue-400 border-blue-500/30", Low: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  const effortColorMap = { Low: "text-emerald-400", Medium: "text-amber-400", High: "text-red-400" };
  return (
    <GlassCard className={`p-5 ${locked ? "relative" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700/40 to-slate-800/40 border border-slate-600/30 shrink-0">
          <span className="text-lg font-black text-white">{index + 1}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${impactColorMap[action.impact] || impactColorMap.Medium}`}>
              {action.impact} impact
            </span>
            <span className={`text-[10px] font-bold ${effortColorMap[action.effort] || "text-slate-400"}`}>
              💪 {action.effort} effort
            </span>
            {action.timeframe && <span className="text-[10px] text-slate-500">⏱ {action.timeframe}</span>}
          </div>
          <p className="text-sm font-bold text-white">{action.title}</p>
          <p className="text-xs text-slate-400 mt-1">{action.explanation}</p>
          {action.expectedImpact && (
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15 px-3 py-1.5">
              <span className="text-[10px]">📈</span>
              <p className="text-[11px] font-semibold text-emerald-400">{action.expectedImpact}</p>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center gap-2 shrink-0">
          <PriorityScore score={action.priorityScore || 50} />
          {onApply && (
            <button onClick={() => onApply(action)} className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors">
              Apply
            </button>
          )}
        </div>
      </div>
      {locked && (
        <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-center">
          <p className="text-xs font-bold text-amber-200">Unlock this action with full execution details.</p>
          <button onClick={onUnlock} className="mt-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-1.5 text-[10px] font-bold text-slate-950">Get Action Plan</button>
        </div>
      )}
    </GlassCard>
  );
}

/* ─── Risk Card ─── */
export function RiskCard({ risk, index }) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/15 text-red-400 font-black text-sm shrink-0">
        ⚠️
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <StatusBadge label={risk.impact === "Critical" ? "Critical" : "High"} />
          <span className="text-[10px] font-bold text-slate-500">Priority: {risk.priorityScore}</span>
        </div>
        <p className="text-sm font-bold text-white">{risk.title}</p>
        <p className="text-xs text-slate-400 mt-1">{risk.explanation}</p>
        {risk.expectedImpact && (
          <p className="text-[11px] font-semibold text-red-400 mt-2">⚠ {risk.expectedImpact}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Impact Simulator Panel ─── */
export function ImpactSimulator({ simulation, catalog, appliedActions, onToggleAction, locked, onUnlock }) {
  if (locked) {
    return (
      <GlassCard className="p-6">
        <SectionHeader icon="🧪" title="Impact Simulator" subtitle="Model what happens if you apply strategies" />
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-900/50 p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">+26</p>
            <p className="text-xs text-slate-400">visibility points</p>
          </div>
          <div className="rounded-xl bg-slate-900/50 p-4 text-center">
            <p className="text-2xl font-black text-emerald-400">+$2,400</p>
            <p className="text-xs text-slate-400">monthly revenue</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 p-3 text-center">
          <p className="text-xs font-bold text-amber-200">Unlock simulator controls and scenario projections.</p>
          <button onClick={onUnlock} className="mt-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all">Recover Your Traffic</button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6" glow="bg-emerald-500">
      <SectionHeader icon="🧪" title="Impact Simulator" subtitle="Toggle actions to model projected visibility and revenue recovery" />
      {/* Action toggles */}
      <div className="mt-4 flex flex-wrap gap-2">
        {catalog.map((a) => {
          const active = appliedActions.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => onToggleAction(a.id)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                active
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-slate-700/50 bg-slate-900/50 text-slate-400 hover:border-slate-600/50"
              }`}
            >
              {a.icon} {a.label}
            </button>
          );
        })}
      </div>

      {/* Results */}
      {simulation && (
        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visibility</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-lg font-black text-slate-400">{simulation.current.visibility}</span>
              <span className="text-slate-600">→</span>
              <span className="text-lg font-black text-emerald-400">{simulation.projected.visibility}</span>
            </div>
            <p className="text-[10px] font-bold text-emerald-400">+{simulation.delta.visibility} pts</p>
          </div>
          <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Traffic</p>
            <p className="text-lg font-black text-emerald-400 mt-1">+{simulation.delta.traffic.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500">visitors/mo recovered</p>
          </div>
          <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Revenue</p>
            <p className="text-lg font-black text-emerald-400 mt-1">+${simulation.delta.revenue.toLocaleString()}</p>
            <p className="text-[10px] text-slate-500">/mo recovered</p>
          </div>
          <div className="rounded-xl bg-slate-900/60 border border-slate-700/30 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Comp. Pressure</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-lg font-black text-slate-400">{simulation.current.competitorDominance}%</span>
              <span className="text-slate-600">→</span>
              <span className="text-lg font-black text-emerald-400">{simulation.projected.competitorDominance}%</span>
            </div>
            <p className="text-[10px] font-bold text-emerald-400">-{simulation.delta.competitorDominance} pts</p>
          </div>
        </div>
      )}

      {simulation && simulation.actionsApplied > 0 && (
        <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center">
          <p className="text-xs text-emerald-300 font-semibold">
            {simulation.actionsApplied} action{simulation.actionsApplied > 1 ? "s" : ""} applied • Results expected in ~{simulation.timelineWeeks} weeks • Confidence: {simulation.confidence}
          </p>
        </div>
      )}
    </GlassCard>
  );
}

/* ─── Feature Gate ─── */
const PLAN_LABELS = { pro: "Pro", enterprise: "Enterprise" };
const PLAN_ORDER = ["pro", "enterprise"];

export function FeatureGate({ feature, plan = "pro", planFeatures = [], children, requiredPlan }) {
  const allowed = planFeatures.includes(feature);

  if (allowed) return <>{children}</>;

  const upgradeTo = requiredPlan || PLAN_ORDER.find(p => p !== plan && PLAN_ORDER.indexOf(p) > PLAN_ORDER.indexOf(plan)) || "pro";

  return (
    <div className="rounded-2xl overflow-hidden">
      <div>
        {children}
      </div>
      <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border border-slate-700/50 bg-[#0F1629]/90 p-8 text-center max-w-sm shadow-2xl mx-auto">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30">
            <span className="text-2xl">🔒</span>
          </div>
          <h3 className="text-lg font-bold text-white mb-1">{PLAN_LABELS[upgradeTo]} Feature</h3>
          <p className="text-sm text-slate-400 mb-4">
            Upgrade to <span className="font-semibold text-cyan-400">{PLAN_LABELS[upgradeTo]}</span> to unlock this feature.
          </p>
          <button className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-blue-500/25 transition-all">
            Upgrade to {PLAN_LABELS[upgradeTo]}
          </button>
        </div>
    </div>
  );
}
