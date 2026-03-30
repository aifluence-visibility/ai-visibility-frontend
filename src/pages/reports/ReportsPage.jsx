import React, { useState } from "react";
import { GlassCard, SectionHeader } from "../../shared/components";
import { useWorkspace } from "../../shared/hooks/useWorkspace";
import { BASE_URL } from "../../api";

const STORAGE_KEY = "ai-vis-portfolio";

function loadPortfolio() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; }
}

function renderMarkdown(md) {
  if (!md) return null;
  return md.split("\n").map((line, i) => {
    // Headers
    if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-black text-white mt-6 mb-2">{line.slice(2)}</h1>;
    if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold text-white mt-5 mb-2 border-b border-slate-700/40 pb-1">{line.slice(3)}</h2>;
    if (line.startsWith("### ")) return <h3 key={i} className="text-base font-bold text-white mt-4 mb-1">{line.slice(4)}</h3>;
    // Table rows
    if (line.startsWith("|")) {
      if (line.replace(/[|\-\s]/g, "") === "") return null; // separator
      const cells = line.split("|").filter(Boolean).map(c => c.trim());
      const isHeader = md.split("\n")[i + 1]?.match(/^\|[\s-|]+$/);
      return (
        <div key={i} className={`grid gap-2 text-xs py-1.5 border-b border-slate-800/30 ${isHeader ? "font-bold text-slate-300" : "text-slate-400"}`}
          style={{ gridTemplateColumns: `repeat(${cells.length}, 1fr)` }}>
          {cells.map((c, j) => <span key={j}>{c}</span>)}
        </div>
      );
    }
    // Bold in line
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>');
    // Bullets
    if (line.match(/^[-•]\s/)) return <li key={i} className="text-sm text-slate-300 ml-4 mb-1 list-disc" dangerouslySetInnerHTML={{ __html: formatted.slice(2) }} />;
    // Numbered
    if (line.match(/^\d+\.\s/)) return <li key={i} className="text-sm text-slate-300 ml-4 mb-1 list-decimal" dangerouslySetInnerHTML={{ __html: formatted.replace(/^\d+\.\s/, "") }} />;
    // Italic line
    if (line.startsWith("*") && line.endsWith("*")) return <p key={i} className="text-xs text-slate-500 italic mb-2">{line.slice(1, -1)}</p>;
    // Empty line
    if (!line.trim()) return <div key={i} className="h-2" />;
    // Normal paragraph
    return <p key={i} className="text-sm text-slate-300 mb-1" dangerouslySetInnerHTML={{ __html: formatted }} />;
  });
}

export default function ReportsPage() {
  const { plan, hasFeature } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [reportType, setReportType] = useState("weekly");

  const portfolio = loadPortfolio();

  const handleGenerate = async () => {
    if (portfolio.length < 1) return;
    setLoading(true); setError(""); setReport(null);
    try {
      const res = await fetch(`${BASE_URL}/generate-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brands: portfolio, reportType }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Report generation failed.");
      setReport(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!report?.report) return;
    const blob = new Blob([report.report], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ai-visibility-${reportType}-report-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-white">Executive Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">Generate AI-powered portfolio reports for leadership</p>
      </div>

      {/* ── Portfolio Summary ── */}
      <GlassCard className="p-6">
        <SectionHeader icon="📊" title="Portfolio Brands" subtitle={`${portfolio.length} brand${portfolio.length !== 1 ? "s" : ""} in portfolio`} />
        {portfolio.length === 0 ? (
          <div className="mt-4 rounded-xl bg-slate-900/60 border border-slate-700/30 p-6 text-center">
            <p className="text-sm text-slate-400">No brands in portfolio yet.</p>
            <p className="text-xs text-slate-500 mt-1">Run analyses from the Dashboard to build your portfolio.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {portfolio.map((b, i) => (
              <div key={i} className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-3 text-center">
                <p className="text-sm font-bold text-white truncate">{b.brandName}</p>
                <p className="text-[10px] text-slate-500">{b.industry || "General"}</p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-lg font-black text-cyan-400">{b.visibilityScore || 0}</span>
                  <span className="text-[10px] text-slate-500">visibility</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* ── Generate Report ── */}
      <GlassCard className="p-6" glow="bg-blue-500">
        <SectionHeader icon="📋" title="Generate Report" subtitle="Create a comprehensive visibility report" />
        <div className="mt-4 flex items-center gap-3">
          <select
            value={reportType} onChange={e => setReportType(e.target.value)}
            className="rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-2.5 text-sm text-white"
          >
            <option value="weekly">Weekly Report</option>
            <option value="monthly">Monthly Report</option>
          </select>
          <button
            onClick={handleGenerate}
            disabled={loading || portfolio.length < 1}
            className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-40"
          >
            {loading ? "Generating…" : `Generate ${reportType === "monthly" ? "Monthly" : "Weekly"} Report`}
          </button>
        </div>
        {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
        {loading && (
          <div className="mt-4 flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <p className="text-xs text-slate-400">Analyzing portfolio and generating executive report…</p>
          </div>
        )}
      </GlassCard>

      {/* ── Report Output ── */}
      {report && (
        <GlassCard className="p-6" glow="bg-emerald-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <SectionHeader icon="📑" title={`${report.type} Report`} subtitle={`Generated ${new Date(report.generatedAt).toLocaleString()} • ${report.brandCount} brands`} />
            </div>
            <button
              onClick={handleDownload}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              ⬇ Download .md
            </button>
          </div>
          <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-6 overflow-x-auto">
            {renderMarkdown(report.report)}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
