import React, { useState, useCallback } from "react";
import { STRATEGY_ADVISOR_URL } from "../../api";
import { GlassCard, SectionHeader, PaywallSection } from "./index";

const SUGGESTED_QUESTIONS = [
  "How do I beat my top competitor in AI recommendations?",
  "What content should I create first to improve visibility?",
  "Why am I invisible and what's the fastest fix?",
  "What is the ROI of fixing my visibility?",
  "How do I get mentioned in comparison queries?",
];

export default function StrategyAdvisor({ data, locked, onUnlock }) {
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askQuestion = useCallback(
    async (q) => {
      const text = (q || question).trim();
      if (!text || text.length < 3) return;

      setLoading(true);
      setError("");
      setResponse("");

      try {
        const res = await fetch(STRATEGY_ADVISOR_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text, analysisData: data }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Server error: ${res.status}`);
        }

        const json = await res.json();
        setResponse(json.strategy || "No strategy generated.");
      } catch (err) {
        setError(err?.message || "Failed to get strategy. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [question, data]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    askQuestion();
  };

  const handleSuggestion = (q) => {
    setQuestion(q);
    askQuestion(q);
  };

  const advisorContent = (
    <GlassCard className="p-6" glow="bg-purple-500">
      <SectionHeader
        icon="🧠"
        title="AI Strategy Advisor"
        subtitle="Ask any question — get $100k-consultant-level strategy tied to your data"
      />

      {/* Question input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a strategy question about your visibility..."
          maxLength={500}
          className="flex-1 rounded-xl border border-slate-700/50 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-purple-500/50 focus:outline-none focus:ring-1 focus:ring-purple-500/30 transition-all"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || question.trim().length < 3}
          className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-40 shrink-0"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              Thinking…
            </span>
          ) : (
            "Ask"
          )}
        </button>
      </form>

      {/* Suggested questions */}
      {!response && !loading && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
            Suggested questions
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(q)}
                className="rounded-lg border border-slate-700/50 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-400 hover:border-purple-500/40 hover:text-purple-300 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => askQuestion()}
            className="mt-2 text-xs font-semibold text-red-400 hover:text-red-300"
          >
            Try again →
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-6 flex flex-col items-center gap-3 py-8">
          <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">
            Generating strategy tied to your data…
          </p>
        </div>
      )}

      {/* Response */}
      {response && !loading && (
        <div className="mt-6 rounded-xl border border-purple-500/20 bg-purple-500/5 p-6">
          <div className="prose prose-invert prose-sm max-w-none [&_h3]:text-base [&_h3]:font-black [&_h3]:text-white [&_h3]:mt-5 [&_h3]:mb-2 [&_h4]:text-sm [&_h4]:font-bold [&_h4]:text-slate-200 [&_h4]:mt-3 [&_h4]:mb-1 [&_ul]:space-y-1 [&_li]:text-slate-300 [&_li]:text-xs [&_p]:text-xs [&_p]:text-slate-300 [&_strong]:text-white">
            <MarkdownRenderer content={response} />
          </div>

          {/* Actions */}
          <div className="mt-4 flex items-center gap-3 border-t border-slate-700/30 pt-4">
            <button
              onClick={() => {
                setResponse("");
                setQuestion("");
              }}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              Ask another question
            </button>
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(response);
                }
              }}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              📋 Copy strategy
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
        title={`${data?.brandName || "Your brand"} is not visible in AI search`}
        description="Your competitors are already taking these positions."
        cta="Unlock Full Strategy"
        onUnlock={onUnlock}
        ctaColor="from-red-600 to-orange-500"
      >
        {advisorContent}
      </PaywallSection>
    );
  }

  return advisorContent;
}

/* ── Minimal Markdown renderer ── */
function MarkdownRenderer({ content }) {
  const lines = content.split("\n");
  const elements = [];
  let listItems = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${listKey++}`}>
          {listItems.map((li, i) => (
            <li key={i}>{renderInline(li)}</li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^####\s/.test(line)) {
      flushList();
      elements.push(<h4 key={i}>{renderInline(line.replace(/^####\s+/, ""))}</h4>);
    } else if (/^###\s/.test(line)) {
      flushList();
      elements.push(<h3 key={i}>{renderInline(line.replace(/^###\s+/, ""))}</h3>);
    } else if (/^[-*]\s/.test(line)) {
      listItems.push(line.replace(/^[-*]\s+/, ""));
    } else if (/^\d+\.\s/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s+/, ""));
    } else if (line.trim() === "---") {
      flushList();
      // skip horizontal rules
    } else if (line.trim() === "") {
      flushList();
    } else {
      flushList();
      elements.push(<p key={i}>{renderInline(line)}</p>);
    }
  }
  flushList();

  return <>{elements}</>;
}

function renderInline(text) {
  // Bold: **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (/^\*\*(.+)\*\*$/.test(part)) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}
