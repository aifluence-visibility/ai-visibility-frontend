import React, { useState, useCallback, useEffect } from "react";
import { PERFORMANCE_TRACKER_URL } from "../../api";
import { GlassCard, SectionHeader, PaywallSection } from "./index";

const STORAGE_KEY = "ai-vis-baseline";

function loadBaseline() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveBaseline(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...data,
      _savedAt: new Date().toISOString(),
    }));
  } catch { /* quota exceeded — ignore */ }
}

function clearBaseline() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export default function PerformanceTracker({ data, locked, onUnlock }) {
  const [baseline, setBaseline] = useState(() => loadBaseline());
  const [strategyText, setStrategyText] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync baseline from localStorage on mount
  useEffect(() => { setBaseline(loadBaseline()); }, []);

  const handleSaveBaseline = () => {
    if (!data?.brandName) return;
    saveBaseline(data);
    setBaseline({ ...data, _savedAt: new Date().toISOString() });
    setAnalysis("");
  };

  const handleClearBaseline = () => {
    clearBaseline();
    setBaseline(null);
    setAnalysis("");
  };

  const compare = useCallback(async () => {
    if (!baseline || !data?.brandName) return;

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const res = await fetch(PERFORMANCE_TRACKER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beforeData: baseline,
          afterData: data,
          strategyText: strategyText.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error: ${res.status}`);
      }

      const json = await res.json();
      setAnalysis(json.analysis || "No analysis generated.");
    } catch (err) {
      setError(err?.message || "Failed to analyze performance.");
    } finally {
      setLoading(false);
    }
  }, [baseline, data, strategyText]);

  const savedAt = baseline?._savedAt
    ? new Date(baseline._savedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : null;

  // Quick delta metrics
  const deltas = baseline && data?.brandName ? {
    vis: (data.visibilityScore || 0) - (baseline.visibilityScore || 0),
    mentions: (data.totalMentions || 0) - (baseline.totalMentions || 0),
    pressure: (data.competitorPressureScore || 0) - (baseline.competitorPressureScore || 0),
    traffic: (data.queryTrafficLossPct || 0) - (baseline.queryTrafficLossPct || 0),
  } : null;

  const trackerContent = (
    <GlassCard className="p-6" glow="bg-green-500">
      <SectionHeader
        icon="📊"
        title="Performance Tracker"
        subtitle="Save a baseline → apply strategies → re-analyze → measure real impact"
      />

      {/* Step 1: Baseline */}
      <div className="mt-5">
        {!baseline ? (
          <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-900/40 p-6 text-center">
            <span className="text-3xl">📌</span>
            <p className="mt-2 text-sm font-bold text-white">Save Your Baseline</p>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              Snapshot your current analysis as the "before" state. After applying strategies and re-analyzing, compare to measure real impact.
            </p>
            <button
              onClick={handleSaveBaseline}
              disabled={!data?.brandName}
              className="mt-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-green-500/25 transition-all disabled:opacity-40"
            >
              📌 Save Current as Baseline
            </button>
          </div>
        ) : (
          <>
            {/* Baseline info */}
            <div className="flex items-center justify-between rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">📌</span>
                <div>
                  <p className="text-xs font-bold text-white">Baseline saved: {baseline.brandName}</p>
                  <p className="text-[10px] text-slate-500">
                    {savedAt} · Score: {baseline.visibilityScore || 0}/100 · Mentions: {baseline.totalMentions || 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveBaseline}
                  className="rounded-lg border border-slate-700/50 px-2.5 py-1 text-[10px] font-semibold text-slate-500 hover:text-white transition-colors"
                  title="Update baseline with current data"
                >
                  ↻ Update
                </button>
                <button
                  onClick={handleClearBaseline}
                  className="rounded-lg border border-slate-700/50 px-2.5 py-1 text-[10px] text-slate-500 hover:text-red-400 transition-colors"
                >
                  ✕ Clear
                </button>
              </div>
            </div>

            {/* Quick deltas */}
            {deltas && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                <DeltaCard label="Visibility" before={baseline.visibilityScore || 0} after={data.visibilityScore || 0} delta={deltas.vis} suffix="/100" positive={deltas.vis > 0} />
                <DeltaCard label="Mentions" before={baseline.totalMentions || 0} after={data.totalMentions || 0} delta={deltas.mentions} positive={deltas.mentions > 0} />
                <DeltaCard label="Competitor Pressure" before={baseline.competitorPressureScore || 0} after={data.competitorPressureScore || 0} delta={deltas.pressure} suffix="%" positive={deltas.pressure < 0} invert />
                <DeltaCard label="Traffic Loss" before={baseline.queryTrafficLossPct || 0} after={data.queryTrafficLossPct || 0} delta={deltas.traffic} suffix="%" positive={deltas.traffic < 0} invert />
              </div>
            )}

            {/* Strategy input + Compare button */}
            {!analysis && !loading && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                  What strategy did you apply? (optional)
                </p>
                <textarea
                  value={strategyText}
                  onChange={(e) => setStrategyText(e.target.value)}
                  placeholder="e.g., Published 3 comparison articles, added structured FAQ to homepage, created AI-optimized landing pages…"
                  maxLength={1000}
                  rows={2}
                  className="w-full rounded-xl border border-slate-700/50 bg-slate-900/80 px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 resize-none transition-all"
                />
                <button
                  onClick={compare}
                  className="mt-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-green-500/25 transition-all"
                >
                  📊 Analyze Performance Change
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex flex-col items-center gap-3 py-8">
          <div className="h-8 w-8 rounded-full border-2 border-green-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">Analyzing before vs. after performance…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={compare} className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300">Retry →</button>
        </div>
      )}

      {/* AI Analysis result */}
      {analysis && !loading && (
        <div className="mt-6 rounded-xl border border-green-500/20 bg-green-500/5 p-6">
          <AnalysisRenderer content={analysis} />

          <div className="mt-4 flex items-center gap-3 border-t border-slate-700/30 pt-4">
            <button
              onClick={() => setAnalysis("")}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Back to tracker
            </button>
            <button
              onClick={compare}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ↻ Re-analyze
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(analysis)}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              📋 Copy
            </button>
          </div>
        </div>
      )}
    </GlassCard>
  );

  if (locked) {
    return (
      <PaywallSection
        locked
        title={`${data?.brandName || "Your brand"} is losing traffic and can't see it`}
        description="Your competitors are already taking these positions."
        cta="Recover Your Traffic"
        onUnlock={onUnlock}
        ctaColor="from-red-600 to-orange-500"
      >
        {trackerContent}
      </PaywallSection>
    );
  }

  return trackerContent;
}

/* ── Delta card ── */
function DeltaCard({ label, before, after, delta, suffix = "", positive, invert }) {
  const isGood = invert ? delta < 0 : delta > 0;
  const isNeutral = delta === 0;
  const color = isNeutral ? "text-slate-400" : isGood ? "text-emerald-400" : "text-red-400";
  const sign = delta > 0 ? "+" : "";

  return (
    <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-3 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <div className="mt-1 flex items-center justify-center gap-1.5">
        <span className="text-xs text-slate-500">{before}{suffix}</span>
        <span className="text-slate-600">→</span>
        <span className="text-xs font-bold text-white">{after}{suffix}</span>
      </div>
      <p className={`mt-1 text-sm font-black ${color}`}>
        {isNeutral ? "—" : `${sign}${delta}${suffix}`}
      </p>
    </div>
  );
}

/* ── Section-aware Markdown renderer ── */
const SECTION_STYLES = {
  "performance change": { border: "border-blue-500/20", bg: "bg-blue-500/5", labelColor: "text-blue-400" },
  "key insight": { border: "border-amber-500/20", bg: "bg-amber-500/5", labelColor: "text-amber-400" },
  "what worked": { border: "border-emerald-500/20", bg: "bg-emerald-500/5", labelColor: "text-emerald-400" },
  "what didn't work": { border: "border-red-500/20", bg: "bg-red-500/5", labelColor: "text-red-400" },
  "next best actions": { border: "border-purple-500/20", bg: "bg-purple-500/5", labelColor: "text-purple-400" },
  "impact summary": { border: "border-cyan-500/20", bg: "bg-cyan-500/5", labelColor: "text-cyan-400" },
};

function AnalysisRenderer({ content }) {
  // Split by ### headings
  const sections = [];
  const parts = content.split(/(?=^###\s)/m);

  for (const part of parts) {
    const headingMatch = part.match(/^###\s*(.*)/);
    if (headingMatch) {
      const title = headingMatch[1].trim();
      const body = part.slice(headingMatch[0].length).trim();
      sections.push({ title, body });
    } else if (part.trim()) {
      sections.push({ title: null, body: part.trim() });
    }
  }

  return (
    <div className="space-y-3">
      {sections.map((sec, i) => {
        const key = sec.title
          ? sec.title.replace(/[^\w\s]/g, "").trim().toLowerCase()
          : "";
        const style = Object.entries(SECTION_STYLES).find(([k]) => key.includes(k))?.[1]
          || { border: "border-slate-700/20", bg: "bg-slate-900/30", labelColor: "text-slate-400" };

        return (
          <div key={i} className={`rounded-xl border ${style.border} ${style.bg} p-4`}>
            {sec.title && (
              <p className={`text-xs font-black ${style.labelColor} mb-2`}>{sec.title}</p>
            )}
            <div className="text-xs text-slate-300 leading-relaxed space-y-1">
              {sec.body.split("\n").map((line, li) => {
                if (/^[-*]\s/.test(line)) {
                  return (
                    <div key={li} className="flex gap-2 ml-1">
                      <span className="text-slate-600 shrink-0">•</span>
                      <span>{boldInline(line.replace(/^[-*]\s+/, ""))}</span>
                    </div>
                  );
                }
                if (line.trim() === "" || line.trim() === "---") return null;
                return <p key={li}>{boldInline(line)}</p>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function boldInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    /^\*\*(.+)\*\*$/.test(p) ? <strong key={i} className="text-white">{p.slice(2, -2)}</strong> : p
  );
}
