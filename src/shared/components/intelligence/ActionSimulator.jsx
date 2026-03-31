import React, { useState, useMemo } from "react";
import { simulateImpact, SIMULATOR_ACTIONS } from "../../utils/dataEngines";

const CONFIDENCE_STYLE = {
  0: { label: "No selection", color: "text-slate-500", bg: "bg-slate-700/50", border: "border-slate-700/40" },
  low: { label: "Low confidence", color: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-500/30" },
  medium: { label: "Medium confidence", color: "text-blue-300", bg: "bg-blue-500/15", border: "border-blue-500/30" },
  high: { label: "High confidence", color: "text-emerald-300", bg: "bg-emerald-500/15", border: "border-emerald-500/30" },
};

function ConfidenceMeter({ score }) {
  const width = `${Math.min(score, 100)}%`;
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#3b82f6" : "#f59e0b";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Confidence score</span>
        <span className="text-sm font-black" style={{ color }}>{score > 0 ? `${score}%` : "—"}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: score > 0 ? width : "0%", background: `linear-gradient(90deg, ${color}aa, ${color})` }}
        />
      </div>
    </div>
  );
}

function DeltaMetric({ label, value, prefix = "+", suffix = "", color = "#22c55e", isEmpty }) {
  return (
    <div className="text-center">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{label}</p>
      {isEmpty ? (
        <p className="text-2xl font-black text-slate-600">—</p>
      ) : (
        <p className="text-2xl font-black" style={{ color }}>
          {value > 0 ? prefix : ""}{typeof value === "number" ? value.toLocaleString() : value}{suffix}
        </p>
      )}
    </div>
  );
}

export function ActionSimulator({ data, className = "" }) {
  const [selected, setSelected] = useState([]);

  const toggleAction = (key) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const result = useMemo(() => simulateImpact(selected, data), [selected, data]);
  const isEmpty = selected.length === 0;

  const confidenceLevel = result.confidenceScore >= 70 ? "high" : result.confidenceScore >= 35 ? "medium" : result.confidenceScore > 0 ? "low" : 0;
  const confStyle = CONFIDENCE_STYLE[confidenceLevel] || CONFIDENCE_STYLE[0];

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Action selection */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {SIMULATOR_ACTIONS.map((action) => {
          const isSelected = selected.includes(action.key);
          return (
            <button
              key={action.key}
              onClick={() => toggleAction(action.key)}
              className={`relative rounded-2xl border p-4 text-left transition-all duration-200 ${
                isSelected
                  ? "border-indigo-500/60 bg-indigo-500/15 shadow-lg shadow-indigo-500/10"
                  : "border-slate-700/50 bg-gradient-to-br from-[#111827] to-[#0f172a] hover:border-slate-600/70 hover:bg-white/[0.015]"
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-white">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{action.icon}</span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${
                  action.visibilityDelta >= 14 ? "border-red-500/40 bg-red-500/10 text-red-300" :
                  action.visibilityDelta >= 10 ? "border-amber-500/40 bg-amber-500/10 text-amber-300" :
                  "border-blue-500/40 bg-blue-500/10 text-blue-300"
                }`}>
                  +{action.visibilityDelta} vis pts
                </span>
              </div>
              <p className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>{action.label}</p>
              <p className="mt-1 text-[11px] text-slate-500">{action.description}</p>
              <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-600">
                <span>⏱ {action.timeframeWeeks < 1 ? "3-5 days" : `${action.timeframeWeeks}w`}</span>
                <span>Traffic: +{Math.round(action.trafficPctGain * 100)}%</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Results panel */}
      <div className={`rounded-2xl border ${isEmpty ? "border-slate-700/40 bg-slate-900/40" : "border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-[#0f172a]"} p-6 transition-all duration-300`}>
        {isEmpty ? (
          <div className="text-center py-4">
            <p className="text-sm font-bold text-slate-400">Select actions above to simulate impact</p>
            <p className="text-xs text-slate-600 mt-1">Combine multiple actions for compounding effect</p>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">Impact simulation</p>
                <p className="text-sm text-slate-400 mt-0.5">{selected.length} action{selected.length > 1 ? "s" : ""} selected • {result.timeframeWeeks > 0 ? `${result.timeframeWeeks} weeks` : "~3 days"} to see results</p>
              </div>
              <div className={`rounded-xl border ${confStyle.border} ${confStyle.bg} px-3 py-1.5`}>
                <p className={`text-[11px] font-black ${confStyle.color}`}>{confStyle.label}</p>
              </div>
            </div>

            {/* KPI grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <DeltaMetric
                label="Visibility pts"
                value={result.visibilityDelta}
                suffix=" pts"
                color="#818cf8"
              />
              <DeltaMetric
                label="Projected score"
                value={result.projectedScore}
                suffix="/100"
                prefix=""
                color="#22d3ee"
              />
              <DeltaMetric
                label="Traffic gain"
                value={result.trafficDelta}
                suffix="/mo"
                color="#22c55e"
              />
              <DeltaMetric
                label="Revenue gain"
                value={result.revenueDelta}
                prefix="$"
                suffix="/mo"
                color="#f59e0b"
              />
            </div>

            <ConfidenceMeter score={result.confidenceScore} />

            {selected.length > 2 && (
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3 text-center">
                <p className="text-xs font-bold text-emerald-300">
                  💡 Combining {selected.length} actions creates a compounding visibility moat. Results appear within {result.timeframeWeeks} weeks.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
