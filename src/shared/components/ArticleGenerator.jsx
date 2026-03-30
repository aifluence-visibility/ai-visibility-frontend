import React, { useState, useCallback } from "react";
import { GENERATE_ARTICLE_URL } from "../../api";
import { GlassCard, SectionHeader, PaywallSection } from "./index";

export default function ArticleGenerator({ data, locked, onUnlock }) {
  const [strategyInput, setStrategyInput] = useState("");
  const [article, setArticle] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    const text = strategyInput.trim();
    if (text.length < 10) return;

    setLoading(true);
    setError("");
    setArticle("");

    try {
      const res = await fetch(GENERATE_ARTICLE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strategy: text, analysisData: data }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error: ${res.status}`);
      }

      const json = await res.json();
      setArticle(json.article || "No article generated.");
    } catch (err) {
      setError(err?.message || "Failed to generate article.");
    } finally {
      setLoading(false);
    }
  }, [strategyInput, data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    generate();
  };

  const wordCount = article ? article.split(/\s+/).filter(Boolean).length : 0;

  const generatorContent = (
    <GlassCard className="p-6" glow="bg-indigo-500">
      <SectionHeader
        icon="📝"
        title="AI Article Generator"
        subtitle="Paste a content strategy — get a full SEO + AI-optimized article ready to publish"
      />

      {/* Input */}
      {!article && !loading && (
        <form onSubmit={handleSubmit} className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Paste your content strategy below
          </p>
          <textarea
            value={strategyInput}
            onChange={(e) => setStrategyInput(e.target.value)}
            placeholder={"Paste the content strategy from the Content Strategy Generator (title, outline, key points, FAQ, strategy angle)…"}
            maxLength={3000}
            rows={6}
            className="w-full rounded-xl border border-slate-700/50 bg-slate-900/80 px-4 py-3 text-xs text-white placeholder-slate-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 resize-y transition-all"
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-slate-600">{strategyInput.length}/3000 characters</span>
            <button
              type="submit"
              disabled={strategyInput.trim().length < 10}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-indigo-500/25 transition-all disabled:opacity-40"
            >
              Generate Full Article
            </button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex flex-col items-center gap-3 py-12">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">Writing your article (this takes ~15-30s)…</p>
          <p className="text-[10px] text-slate-600">Optimizing for Google + AI visibility simultaneously</p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">{error}</p>
          <button onClick={generate} className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300">
            Try again →
          </button>
        </div>
      )}

      {/* Generated article */}
      {article && !loading && (
        <div className="mt-6">
          {/* Stats bar */}
          <div className="mb-4 flex items-center gap-4 rounded-lg border border-indigo-500/20 bg-indigo-500/5 px-4 py-2">
            <span className="text-[10px] font-bold text-indigo-400">📝 Article generated</span>
            <span className="text-[10px] text-slate-500">~{wordCount} words</span>
            <span className="text-[10px] text-slate-500">SEO + AI optimized</span>
            <span className="text-[10px] text-emerald-400 font-bold">✓ Ready to publish</span>
          </div>

          {/* Article content */}
          <div className="rounded-xl border border-slate-700/30 bg-slate-950/60 p-6 max-h-[600px] overflow-y-auto scrollbar-thin">
            <ArticleRenderer content={article} />
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-slate-700/30 pt-4">
            <button
              onClick={() => navigator.clipboard?.writeText(article)}
              className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-500 px-5 py-2 text-xs font-bold text-white shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              📋 Copy Article
            </button>
            <button
              onClick={() => {
                const blob = new Blob([article], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `${data?.brandName || "article"}-ai-visibility.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="rounded-lg border border-slate-700/50 px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ⬇️ Download .md
            </button>
            <button
              onClick={generate}
              className="rounded-lg border border-slate-700/50 px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ↻ Regenerate
            </button>
            <button
              onClick={() => { setArticle(""); }}
              className="rounded-lg border border-slate-700/50 px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← New strategy
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
        title={`Without content, ${data?.brandName || "your brand"} loses more rankings`}
        description="Your competitors are already taking these positions."
        cta="Stop Losing Visibility"
        onUnlock={onUnlock}
        ctaColor="from-red-600 to-orange-500"
      >
        {generatorContent}
      </PaywallSection>
    );
  }

  return generatorContent;
}

/* ── Article Markdown Renderer ── */
function ArticleRenderer({ content }) {
  const lines = content.split("\n");
  const elements = [];
  let list = [];
  let listType = "ul";
  let lk = 0;

  const flush = () => {
    if (list.length > 0) {
      const Tag = listType;
      elements.push(
        <Tag key={`list-${lk++}`} className={`space-y-1.5 my-3 ${listType === "ol" ? "list-decimal" : ""} ml-4`}>
          {list.map((li, i) => (
            <li key={i} className="text-xs text-slate-300 leading-relaxed pl-1">
              {inlineFmt(li)}
            </li>
          ))}
        </Tag>
      );
      list = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^#\s/.test(line)) {
      flush();
      elements.push(
        <h1 key={i} className="text-xl font-black text-white mt-2 mb-4 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
          {inlineFmt(line.replace(/^#\s+/, ""))}
        </h1>
      );
    } else if (/^##\s/.test(line)) {
      flush();
      elements.push(
        <h2 key={i} className="text-base font-black text-white mt-6 mb-2 pb-2 border-b border-slate-800/60">
          {inlineFmt(line.replace(/^##\s+/, ""))}
        </h2>
      );
    } else if (/^###\s/.test(line)) {
      flush();
      elements.push(
        <h3 key={i} className="text-sm font-bold text-slate-200 mt-4 mb-1">
          {inlineFmt(line.replace(/^###\s+/, ""))}
        </h3>
      );
    } else if (/^####\s/.test(line)) {
      flush();
      elements.push(
        <h4 key={i} className="text-xs font-bold text-slate-300 mt-3 mb-1">
          {inlineFmt(line.replace(/^####\s+/, ""))}
        </h4>
      );
    } else if (/^[-*]\s/.test(line)) {
      listType = "ul";
      list.push(line.replace(/^[-*]\s+/, ""));
    } else if (/^\d+\.\s/.test(line)) {
      listType = "ol";
      list.push(line.replace(/^\d+\.\s+/, ""));
    } else if (line.trim() === "---") {
      flush();
      elements.push(<hr key={i} className="my-4 border-slate-800/50" />);
    } else if (/^\|/.test(line) && line.includes("|")) {
      // Table row — collect
      flush();
      const tableLines = [];
      let j = i;
      while (j < lines.length && /^\|/.test(lines[j])) {
        tableLines.push(lines[j]);
        j++;
      }
      elements.push(<MdTable key={i} rows={tableLines} />);
      i = j - 1;
    } else if (line.trim() === "") {
      flush();
    } else {
      flush();
      elements.push(
        <p key={i} className="text-xs text-slate-300 leading-relaxed my-2">
          {inlineFmt(line)}
        </p>
      );
    }
  }
  flush();

  return <div className="article-content">{elements}</div>;
}

function MdTable({ rows }) {
  if (rows.length < 2) return null;
  const parse = (row) =>
    row.split("|").map((c) => c.trim()).filter(Boolean);
  const headers = parse(rows[0]);
  const isSep = (r) => /^[\s|:-]+$/.test(r);
  const dataRows = rows.slice(isSep(rows[1]) ? 2 : 1).filter((r) => !isSep(r));

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-slate-700/30">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-700/30 bg-slate-900/60">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-bold text-slate-300">
                {inlineFmt(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, ri) => (
            <tr key={ri} className="border-b border-slate-800/30 hover:bg-slate-900/40">
              {parse(row).map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-slate-400">
                  {inlineFmt(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function inlineFmt(text) {
  // Bold + Italic
  const parts = text.split(/(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*\*(.+)\*\*\*$/.test(p)) return <strong key={i} className="text-white italic">{p.slice(3, -3)}</strong>;
    if (/^\*\*(.+)\*\*$/.test(p)) return <strong key={i} className="text-white">{p.slice(2, -2)}</strong>;
    if (/^\*(.+)\*$/.test(p)) return <em key={i} className="text-slate-200">{p.slice(1, -1)}</em>;
    return p;
  });
}
