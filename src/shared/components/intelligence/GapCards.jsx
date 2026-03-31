import React, { useState } from "react";

const IMPACT_STYLE = {
  Critical: "border-red-500/40 bg-red-500/10 text-red-300",
  High: "border-amber-500/40 bg-amber-500/10 text-amber-300",
  Medium: "border-blue-500/40 bg-blue-500/10 text-blue-300",
  Low: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
};

const EFFORT_STYLE = {
  Low: "text-emerald-400",
  Medium: "text-amber-400",
  High: "text-red-400",
};

function ContentGapCard({ item, idx }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-[#111827] to-[#0f172a] overflow-hidden shadow-xl">
      <button
        className="w-full text-left px-5 py-4 hover:bg-white/[0.015] transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/25 text-sm font-black text-red-400 shrink-0 mt-0.5">
              {idx + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${IMPACT_STYLE[item.impact] || IMPACT_STYLE.High}`}>
                  {item.impact}
                </span>
                <span className={`text-[10px] font-bold ${EFFORT_STYLE[item.effort] || EFFORT_STYLE.Medium}`}>
                  Effort: {item.effort}
                </span>
                {item.lostVisits > 0 && (
                  <span className="text-[10px] font-bold text-slate-500">
                    ~{item.lostVisits.toLocaleString()} visits/mo
                  </span>
                )}
              </div>
              <p className="text-sm font-bold text-white">{item.title}</p>
            </div>
          </div>
          <svg className={`h-4 w-4 text-slate-500 shrink-0 mt-1 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-slate-700/30">
          <p className="mt-3 text-xs text-slate-400 leading-relaxed">{item.reason}</p>
          <div className="mt-3 rounded-xl border border-emerald-400/20 bg-emerald-500/5 p-3">
            <p className="text-[10px] font-black text-emerald-300 mb-1 uppercase tracking-wide">Fix</p>
            <p className="text-xs text-slate-300 leading-relaxed">{item.fix}</p>
          </div>
        </div>
      )}
    </div>
  );
}

function SourceGapCard({ item }) {
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-gradient-to-br from-[#111827] to-[#0f172a] p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3 mb-3">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${IMPACT_STYLE[item.impact] || IMPACT_STYLE.High}`}>
          {item.impact}
        </span>
        <span className={`text-[10px] font-bold ${EFFORT_STYLE[item.effort] || EFFORT_STYLE.Medium}`}>
          Effort: {item.effort}
        </span>
      </div>
      <p className="text-sm font-bold text-white">{item.title}</p>
      <p className="mt-2 text-xs text-slate-400 leading-relaxed">{item.reason}</p>
      <div className="mt-3 rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
        <p className="text-[10px] font-black text-cyan-300 mb-1 uppercase tracking-wide">Action</p>
        <p className="text-xs text-slate-300 leading-relaxed">{item.fix}</p>
      </div>
    </div>
  );
}

function RegionGapCard({ item }) {
  const FLAG = { US: "🇺🇸", UK: "🇬🇧", DE: "🇩🇪", Germany: "🇩🇪", FR: "🇫🇷", AU: "🇦🇺", CA: "🇨🇦" };
  return (
    <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/5 to-[#0f172a] p-5 shadow-xl">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{FLAG[item.country] || "🌍"}</span>
        <div>
          <p className="text-sm font-black text-white">{item.country}</p>
          <p className="text-[11px] text-amber-300 font-semibold">Currently {item.currentScore}/100</p>
        </div>
        <div className="ml-auto rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black text-amber-200">
          +{item.impact}
        </div>
      </div>
      <div className="rounded-xl border border-amber-400/15 bg-amber-500/5 p-3">
        <p className="text-xs text-slate-300 leading-relaxed">{item.action}</p>
      </div>
    </div>
  );
}

function PromptGapCard({ item }) {
  return (
    <div className={`rounded-2xl border overflow-hidden shadow-xl ${item.impact === "Critical" ? "border-red-500/30" : "border-amber-500/25"}`}>
      <div className={`px-5 py-4 ${item.impact === "Critical" ? "bg-red-500/5" : "bg-amber-500/5"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${IMPACT_STYLE[item.impact] || IMPACT_STYLE.High}`}>
                {item.impact}
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">{item.dominance}% competitor dominance</span>
            </div>
            <p className="text-sm font-bold text-white">"{item.prompt}"</p>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[11px] text-slate-500">Dominated by:</span>
          <span className="text-[11px] font-bold text-red-300">{item.dominatedBy}</span>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-slate-700/30 bg-slate-900/40">
        <p className="text-xs text-slate-300 leading-relaxed">{item.action}</p>
      </div>
    </div>
  );
}

export function GapCards({ gapData, className = "" }) {
  const [activeTab, setActiveTab] = useState("content");

  if (!gapData) return null;
  const { missingContent, missingSources, missingRegions, missingPrompts } = gapData;

  const tabs = [
    { key: "content", label: "Content gaps", count: missingContent?.length || 0, icon: "📄" },
    { key: "sources", label: "Source gaps", count: missingSources?.length || 0, icon: "🔗" },
    { key: "regions", label: "Region gaps", count: missingRegions?.length || 0, icon: "🌍" },
    { key: "prompts", label: "Prompt gaps", count: missingPrompts?.length || 0, icon: "🎯" },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Tab navigation */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all ${
              activeTab === tab.key
                ? "border-indigo-500/50 bg-indigo-500/15 text-indigo-300"
                : "border-slate-700/40 bg-slate-900/40 text-slate-500 hover:border-slate-600/60 hover:text-slate-300"
            }`}
          >
            {tab.icon} {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${activeTab === tab.key ? "bg-indigo-500/30 text-indigo-200" : "bg-slate-700/50 text-slate-500"}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content gap cards */}
      {activeTab === "content" && (
        <div className="space-y-3">
          {(missingContent || []).map((item, idx) => (
            <ContentGapCard key={idx} item={item} idx={idx} />
          ))}
          {!missingContent?.length && <p className="text-sm text-slate-500">No content gaps identified.</p>}
        </div>
      )}

      {/* Source gap cards */}
      {activeTab === "sources" && (
        <div className="grid gap-3 md:grid-cols-2">
          {(missingSources || []).map((item, idx) => (
            <SourceGapCard key={idx} item={item} />
          ))}
        </div>
      )}

      {/* Region gap cards */}
      {activeTab === "regions" && (
        <div className="grid gap-3 md:grid-cols-2">
          {(missingRegions || []).map((item, idx) => (
            <RegionGapCard key={idx} item={item} />
          ))}
        </div>
      )}

      {/* Prompt gap cards */}
      {activeTab === "prompts" && (
        <div className="space-y-3">
          {(missingPrompts || []).map((item, idx) => (
            <PromptGapCard key={idx} item={item} />
          ))}
          {!missingPrompts?.length && (
            <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/5 p-6 text-center">
              <span className="text-3xl mb-2 block">✅</span>
              <p className="text-sm font-bold text-emerald-200">No missed prompts detected</p>
              <p className="text-xs text-slate-400 mt-1">Your brand appears in all analyzed prompts.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
