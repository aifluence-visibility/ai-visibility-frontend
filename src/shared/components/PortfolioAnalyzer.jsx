import React, { useState, useCallback, useEffect } from "react";
import { PORTFOLIO_ANALYSIS_URL } from "../../api";
import { GlassCard, SectionHeader, PaywallSection } from "./index";

const STORAGE_KEY = "ai-vis-portfolio";

function loadPortfolio() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function savePortfolio(brands) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(brands));
  } catch { /* ignore */ }
}

export default function PortfolioAnalyzer({ data, locked, onUnlock }) {
  const [brands, setBrands] = useState(() => loadPortfolio());
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { savePortfolio(brands); }, [brands]);

  const addCurrentBrand = () => {
    if (!data?.brandName) return;
    // Don't add duplicates
    if (brands.some(b => b.brandName === data.brandName)) {
      // Update existing
      setBrands(prev => prev.map(b => b.brandName === data.brandName ? snapshotBrand(data) : b));
    } else {
      setBrands(prev => [...prev, snapshotBrand(data)]);
    }
    setAnalysis("");
  };

  const removeBrand = (name) => {
    setBrands(prev => prev.filter(b => b.brandName !== name));
    setAnalysis("");
  };

  const clearAll = () => {
    setBrands([]);
    setAnalysis("");
  };

  const analyze = useCallback(async () => {
    if (brands.length < 2) return;

    setLoading(true);
    setError("");
    setAnalysis("");

    try {
      const res = await fetch(PORTFOLIO_ANALYSIS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brands }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error: ${res.status}`);
      }

      const json = await res.json();
      setAnalysis(json.analysis || "No analysis generated.");
    } catch (err) {
      setError(err?.message || "Failed to analyze portfolio.");
    } finally {
      setLoading(false);
    }
  }, [brands]);

  const canAdd = data?.brandName && !brands.some(b => b.brandName === data.brandName);
  const canUpdate = data?.brandName && brands.some(b => b.brandName === data.brandName);

  const analyzerContent = (
    <GlassCard className="p-6" glow="bg-amber-500">
      <SectionHeader
        icon="🏢"
        title="Portfolio Analyzer"
        subtitle="Compare multiple brands — identify your strongest performer, biggest risk, and where to focus"
      />

      {/* Instructions */}
      <div className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-300/80">
          <strong className="text-amber-300">How it works:</strong> Run an analysis for each brand in your portfolio, then click "Add to Portfolio" to save each one. Once you have 2+ brands, run the portfolio comparison.
        </p>
      </div>

      {/* Add current brand */}
      <div className="mt-4 flex items-center gap-3">
        {canAdd && (
          <button
            onClick={addCurrentBrand}
            className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-amber-500/25 transition-all"
          >
            + Add "{data.brandName}" to Portfolio
          </button>
        )}
        {canUpdate && (
          <button
            onClick={addCurrentBrand}
            className="rounded-xl border border-amber-500/30 px-5 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/10 transition-all"
          >
            ↻ Update "{data.brandName}" data
          </button>
        )}
        {!data?.brandName && (
          <p className="text-xs text-slate-500">Run an analysis first to add a brand.</p>
        )}
      </div>

      {/* Brand cards */}
      {brands.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Portfolio ({brands.length} brand{brands.length !== 1 ? "s" : ""})
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {brands.map((b) => (
              <div
                key={b.brandName}
                className="group flex items-center justify-between rounded-xl border border-slate-700/40 bg-slate-900/50 px-4 py-3 hover:border-amber-500/30 transition-all"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{b.brandName}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-slate-500">{b.industry}</span>
                    <span className={`text-[10px] font-bold ${b.visibilityScore <= 30 ? "text-red-400" : b.visibilityScore <= 60 ? "text-amber-400" : "text-emerald-400"}`}>
                      Score: {b.visibilityScore}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {b.totalMentions} mentions
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeBrand(b.brandName)}
                  className="ml-2 text-slate-600 hover:text-red-400 transition-colors text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            {brands.length >= 2 && !analysis && !loading && (
              <button
                onClick={analyze}
                className="rounded-xl bg-gradient-to-r from-amber-600 to-orange-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-amber-500/25 transition-all"
              >
                🏢 Analyze Portfolio ({brands.length} brands)
              </button>
            )}
            {brands.length < 2 && (
              <p className="text-[10px] text-slate-500">Add at least 2 brands to compare.</p>
            )}
            <button
              onClick={clearAll}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-[10px] text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Comparison table */}
      {brands.length >= 2 && !analysis && !loading && (
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-700/30">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/30 bg-slate-900/60">
                <th className="px-3 py-2 text-left font-bold text-slate-400">Brand</th>
                <th className="px-3 py-2 text-center font-bold text-slate-400">Visibility</th>
                <th className="px-3 py-2 text-center font-bold text-slate-400">Mentions</th>
                <th className="px-3 py-2 text-center font-bold text-slate-400">Comp. Pressure</th>
                <th className="px-3 py-2 text-center font-bold text-slate-400">Traffic Loss</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((b) => (
                <tr key={b.brandName} className="border-b border-slate-800/30 hover:bg-slate-900/40">
                  <td className="px-3 py-2 font-semibold text-white">{b.brandName}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-bold ${b.visibilityScore <= 30 ? "text-red-400" : b.visibilityScore <= 60 ? "text-amber-400" : "text-emerald-400"}`}>
                      {b.visibilityScore}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-slate-300">{b.totalMentions}</td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-bold ${b.competitorPressureScore >= 60 ? "text-red-400" : "text-amber-400"}`}>
                      {b.competitorPressureScore}%
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`font-bold ${b.queryTrafficLossPct >= 50 ? "text-red-400" : "text-amber-400"}`}>
                      {b.queryTrafficLossPct}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex flex-col items-center gap-3 py-8">
          <div className="h-8 w-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">Analyzing {brands.length} brands across your portfolio…</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={analyze} className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300">Retry →</button>
        </div>
      )}

      {/* AI Analysis */}
      {analysis && !loading && (
        <div className="mt-6">
          <PortfolioRenderer content={analysis} />

          <div className="mt-4 flex items-center gap-3 border-t border-slate-700/30 pt-4">
            <button
              onClick={() => setAnalysis("")}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Back to portfolio
            </button>
            <button
              onClick={analyze}
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
        title={`Blind spots cost ${data?.brandName || "your brands"} traffic`}
        description="Your competitors are already taking these positions."
        cta="Recover Your Traffic"
        onUnlock={onUnlock}
        ctaColor="from-red-600 to-orange-500"
      >
        {analyzerContent}
      </PaywallSection>
    );
  }

  return analyzerContent;
}

function snapshotBrand(data) {
  return {
    brandName: data.brandName,
    industry: data.industry || "",
    visibilityScore: data.visibilityScore || 0,
    competitorPressureScore: data.competitorPressureScore || 0,
    totalMentions: data.totalMentions || 0,
    promptCount: data.promptCount || 0,
    responseCount: data.responseCount || 0,
    queryTrafficLossPct: data.queryTrafficLossPct || 0,
    topCompetitors: (data.topCompetitors || []).slice(0, 5).map(c => ({
      name: c.name, mentionCount: c.mentionCount || 0, appearanceRate: c.appearanceRate || 0,
    })),
    topSources: (data.topSources || []).slice(0, 5).map(s => ({
      name: s.name, mentionCount: s.mentionCount || 0,
    })),
    summaryInsight: data.summaryInsight || "",
  };
}

/* ── Section-aware renderer ── */
const SECTION_STYLES = {
  "portfolio summary": { border: "border-amber-500/20", bg: "bg-amber-500/5", labelColor: "text-amber-400" },
  "top performer": { border: "border-emerald-500/20", bg: "bg-emerald-500/5", labelColor: "text-emerald-400" },
  "at risk": { border: "border-red-500/20", bg: "bg-red-500/5", labelColor: "text-red-400" },
  "biggest opportunity": { border: "border-orange-500/20", bg: "bg-orange-500/5", labelColor: "text-orange-400" },
  "recommended focus": { border: "border-purple-500/20", bg: "bg-purple-500/5", labelColor: "text-purple-400" },
};

function PortfolioRenderer({ content }) {
  const sections = [];
  const parts = content.split(/(?=^###\s)/m);

  for (const part of parts) {
    const headingMatch = part.match(/^###\s*(.*)/);
    if (headingMatch) {
      sections.push({ title: headingMatch[1].trim(), body: part.slice(headingMatch[0].length).trim() });
    } else if (part.trim()) {
      sections.push({ title: null, body: part.trim() });
    }
  }

  return (
    <div className="space-y-3">
      {sections.map((sec, i) => {
        const key = sec.title ? sec.title.replace(/[^\w\s]/g, "").trim().toLowerCase() : "";
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
                      <span>{boldText(line.replace(/^[-*]\s+/, ""))}</span>
                    </div>
                  );
                }
                if (line.trim() === "" || line.trim() === "---") return null;
                return <p key={li}>{boldText(line)}</p>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function boldText(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    /^\*\*(.+)\*\*$/.test(p) ? <strong key={i} className="text-white">{p.slice(2, -2)}</strong> : p
  );
}
