import React, { useState, useCallback } from "react";
import { CONTENT_STRATEGY_URL } from "../../api";
import { GlassCard, SectionHeader, PaywallSection } from "./index";

export default function ContentStrategyGenerator({ data, actions, locked, onUnlock }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = useCallback(
    async (action) => {
      if (!action) return;
      setSelectedAction(action);
      setLoading(true);
      setError("");
      setContent("");

      try {
        const res = await fetch(CONTENT_STRATEGY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: `${action.title}${action.description ? ` — ${action.description}` : ""}`,
            analysisData: data,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Server error: ${res.status}`);
        }

        const json = await res.json();
        setContent(json.content || "No content generated.");
      } catch (err) {
        setError(err?.message || "Failed to generate content strategy.");
      } finally {
        setLoading(false);
      }
    },
    [data]
  );

  const topActions = (actions || []).slice(0, 6);

  const generatorContent = (
    <GlassCard className="p-6" glow="bg-cyan-500">
      <SectionHeader
        icon="✍️"
        title="AI Content Strategy Generator"
        subtitle="Pick an action — get a full SEO + AI-optimized content plan to outrank competitors"
      />

      {/* Action picker */}
      {!content && !loading && (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
            Select an action to generate content for
          </p>
          {topActions.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {topActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => generate(action)}
                  className="group flex items-start gap-3 rounded-xl border border-slate-700/50 bg-slate-900/50 p-4 text-left hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-400 font-black text-xs shrink-0 group-hover:bg-cyan-500/25">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{action.title}</p>
                    {action.impact && (
                      <span className={`text-[10px] font-bold ${action.impact === "Critical" ? "text-red-400" : action.impact === "High" ? "text-orange-400" : "text-amber-400"}`}>
                        ● {action.impact} impact
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No actions available. Run an analysis first.</p>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex flex-col items-center gap-3 py-8">
          <div className="h-8 w-8 rounded-full border-2 border-cyan-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">
            Generating AI-optimized content strategy for "{selectedAction?.title}"…
          </p>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => selectedAction && generate(selectedAction)}
            className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300"
          >
            Try again →
          </button>
        </div>
      )}

      {/* Generated content */}
      {content && !loading && (
        <div className="mt-6">
          {/* Selected action label */}
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-2">
            <span className="text-xs text-cyan-400">✍️ Content plan for:</span>
            <span className="text-xs font-bold text-white">{selectedAction?.title}</span>
          </div>

          {/* Rendered sections */}
          <div className="space-y-4">
            <ContentSections content={content} />
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center gap-3 border-t border-slate-700/30 pt-4">
            <button
              onClick={() => {
                setContent("");
                setSelectedAction(null);
              }}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ← Pick another action
            </button>
            <button
              onClick={() => selectedAction && generate(selectedAction)}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              ↻ Regenerate
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(content)}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              📋 Copy all
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
        title={`Competitors published while ${data?.brandName || "your brand"} waited`}
        description="Your competitors are already taking these positions."
        cta="Unlock Full Strategy"
        onUnlock={onUnlock}
        ctaColor="from-red-600 to-orange-500"
      >
        {generatorContent}
      </PaywallSection>
    );
  }

  return generatorContent;
}

/* ── Section renderer ── */
const SECTION_CONFIG = [
  { key: "title", emoji: "📝", label: "Blog Title", heading: /###\s*Title/i, border: "border-cyan-500/20", bg: "bg-cyan-500/5", labelColor: "text-cyan-400", bold: true },
  { key: "outline", emoji: "📑", label: "Outline", heading: /###\s*Outline/i, border: "border-blue-500/20", bg: "bg-blue-500/5", labelColor: "text-blue-400" },
  { key: "points", emoji: "🎯", label: "Key Points", heading: /###\s*Key Points/i, border: "border-purple-500/20", bg: "bg-purple-500/5", labelColor: "text-purple-400" },
  { key: "faq", emoji: "❓", label: "FAQ", heading: /###\s*FAQ/i, border: "border-amber-500/20", bg: "bg-amber-500/5", labelColor: "text-amber-400" },
  { key: "angle", emoji: "🏆", label: "Strategy Angle", heading: /###\s*Strategy Angle/i, border: "border-emerald-500/20", bg: "bg-emerald-500/5", labelColor: "text-emerald-400" },
];

function ContentSections({ content }) {
  const parsed = parseSections(content);

  return SECTION_CONFIG.map((cfg) => {
    const text = parsed[cfg.key];
    if (!text) return null;
    return (
      <div key={cfg.key} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
        <p className={`text-[10px] font-black uppercase tracking-widest ${cfg.labelColor} mb-2`}>
          {cfg.emoji} {cfg.label}
        </p>
        <div className={`text-xs leading-relaxed ${cfg.bold ? "text-base font-bold text-white" : "text-slate-200"}`}>
          <InlineMarkdown text={text} />
        </div>
      </div>
    );
  });
}

function parseSections(text) {
  const sections = {};
  for (let i = 0; i < SECTION_CONFIG.length; i++) {
    const cfg = SECTION_CONFIG[i];
    const match = text.match(cfg.heading);
    if (!match) continue;
    const startIdx = match.index + match[0].length;
    // Find next section heading or end
    let endIdx = text.length;
    for (let j = i + 1; j < SECTION_CONFIG.length; j++) {
      const nextMatch = text.slice(startIdx).match(SECTION_CONFIG[j].heading);
      if (nextMatch) {
        endIdx = startIdx + nextMatch.index;
        break;
      }
    }
    sections[cfg.key] = text.slice(startIdx, endIdx).trim();
  }
  return sections;
}

function InlineMarkdown({ text }) {
  const lines = text.split("\n");
  const elements = [];
  let list = [];
  let lk = 0;

  const flush = () => {
    if (list.length > 0) {
      elements.push(
        <ul key={`ul-${lk++}`} className="space-y-1 ml-2">
          {list.map((li, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-slate-600 shrink-0">•</span>
              <span>{bold(li)}</span>
            </li>
          ))}
        </ul>
      );
      list = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^#{1,4}\s/.test(line)) {
      flush();
      elements.push(
        <p key={i} className="font-bold text-white text-sm mt-3 mb-1">
          {bold(line.replace(/^#{1,4}\s+/, ""))}
        </p>
      );
    } else if (/^[-*]\s/.test(line) || /^\d+\.\s/.test(line)) {
      list.push(line.replace(/^[-*]\s+|^\d+\.\s+/, ""));
    } else if (line.trim() === "") {
      flush();
    } else {
      flush();
      elements.push(<p key={i} className="mt-1">{bold(line)}</p>);
    }
  }
  flush();
  return <>{elements}</>;
}

function bold(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    /^\*\*(.+)\*\*$/.test(p) ? <strong key={i} className="text-white">{p.slice(2, -2)}</strong> : p
  );
}
