import React, { useState, useEffect, useCallback } from "react";
import { CRITICAL_INSIGHT_URL } from "../../api";
import { GlassCard } from "./index";

export default function CriticalInsight({ data }) {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);

  const fetchInsight = useCallback(async () => {
    if (!data?.brandName || !data?.visibilityScore) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(CRITICAL_INSIGHT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisData: data }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error: ${res.status}`);
      }

      const json = await res.json();
      setInsight(json.insight || "");
    } catch (err) {
      setError(err?.message || "Failed to generate insight.");
    } finally {
      setLoading(false);
    }
  }, [data]);

  // Auto-fetch on mount when data is available
  useEffect(() => {
    if (data?.brandName && data?.hasAnalyzedOnce !== false) {
      fetchInsight();
    }
  }, [data?.brandName, data?.visibilityScore]); // eslint-disable-line react-hooks/exhaustive-deps

  if (dismissed) return null;

  // Parse the markdown sections
  const sections = parseInsight(insight);

  return (
    <GlassCard className="relative overflow-hidden border-red-500/30 bg-gradient-to-br from-red-500/5 via-[#0f172a] to-orange-500/5" glow="bg-red-500">
      {/* Pulse accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15 animate-pulse">
              <span className="text-xl">🚨</span>
            </div>
            <div>
              <h3 className="text-base font-black text-white">Critical Insight</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400/70">AI Decision Engine — #1 Priority</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {insight && !loading && (
              <button
                onClick={fetchInsight}
                className="rounded-lg border border-slate-700/50 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 hover:text-white transition-colors"
                title="Regenerate"
              >
                ↻
              </button>
            )}
            <button
              onClick={() => setDismissed(true)}
              className="rounded-lg border border-slate-700/50 px-2.5 py-1.5 text-[10px] text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-6 flex items-center gap-3 py-4">
            <div className="h-5 w-5 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400 animate-pulse">Detecting your #1 priority…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="mt-4">
            <p className="text-xs text-red-400">{error}</p>
            <button onClick={fetchInsight} className="mt-1 text-xs font-semibold text-red-400 hover:text-red-300">Retry →</button>
          </div>
        )}

        {/* Insight content */}
        {insight && !loading && (
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {/* Critical Insight */}
            {sections.critical && (
              <div className="md:col-span-2 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                <p className="text-sm font-bold text-white leading-relaxed">{sections.critical}</p>
              </div>
            )}

            {/* What You Should Do */}
            {sections.action && (
              <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">🔥 What You Should Do</p>
                <p className="text-xs text-slate-200 leading-relaxed">{sections.action}</p>
              </div>
            )}

            {/* Why This Matters */}
            {sections.why && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">📊 Why This Matters</p>
                <p className="text-xs text-slate-200 leading-relaxed">{sections.why}</p>
              </div>
            )}

            {/* Expected Impact */}
            {sections.impact && (
              <div className="md:col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">Expected Impact</p>
                  <p className="text-sm font-bold text-emerald-300">{sections.impact}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

function parseInsight(text) {
  if (!text) return {};

  const sections = {};
  const criticalMatch = text.match(/###\s*🚨\s*Critical Insight\s*\n+([\s\S]*?)(?=\n###|\n---|\s*$)/i);
  const actionMatch = text.match(/###\s*🔥\s*What You Should Do\s*\n+([\s\S]*?)(?=\n###|\n---|\s*$)/i);
  const whyMatch = text.match(/###\s*📊\s*Why This Matters\s*\n+([\s\S]*?)(?=\n###|\n---|\s*$)/i);
  const impactMatch = text.match(/###\s*📈\s*Expected Impact\s*\n+([\s\S]*?)(?=\n###|\n---|\s*$)/i);

  if (criticalMatch) sections.critical = criticalMatch[1].trim();
  if (actionMatch) sections.action = actionMatch[1].trim();
  if (whyMatch) sections.why = whyMatch[1].trim();
  if (impactMatch) sections.impact = impactMatch[1].trim();

  return sections;
}
