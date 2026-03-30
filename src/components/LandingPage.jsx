import React, { useEffect, useRef, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from "recharts";
import { LumioMark } from "../shared/components/LumioLogo";

/* ══════════════════════════════ STATIC DATA ══════════════════════════════ */

const features = [
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Lumio Score",
    desc: "Measure exactly where and how often your brand appears in ChatGPT, Google AI & Perplexity answers.",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: "Competitor Intelligence",
    desc: "See which brands steal your share in AI responses — and the exact queries where they dominate.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
    title: "Query-Level Insights",
    desc: "Understand which high-intent buying queries mention competitors instead of you.",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.841m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
      </svg>
    ),
    title: "Recovery Playbook",
    desc: "Get a step-by-step content plan to win back AI recommendations in 30 days.",
    color: "text-violet-400",
    bg: "bg-violet-500/10",
  },
];

const howItWorks = [
  { step: "01", title: "Enter your brand", desc: "Type your brand or domain. We auto-detect your industry and category.", time: "5 sec" },
  { step: "02", title: "We analyze AI answers", desc: "Real prompts sent to ChatGPT, Google AI and Perplexity. We scan who gets recommended.", time: "~60 sec" },
  { step: "03", title: "See how to win", desc: "Get your visibility score, competitor map, gaps, and an exact action plan.", time: "Instant" },
];

const stats = [
  { value: "70%", label: "of product discovery is shifting to AI", accent: "text-blue-400" },
  { value: "3.2x", label: "more users trust AI over search results", accent: "text-cyan-400" },
  { value: "40%", label: "of clicks never happen — AI answers directly", accent: "text-emerald-400" },
];

const faqItems = [
  { q: "What is AI visibility?", a: "AI visibility measures how often your brand is recommended in AI-generated answers (ChatGPT, Google AI, Perplexity) when users ask buying questions in your category. Lumio tracks this for you." },
  { q: "How is this different from SEO?", a: "SEO tracks search rankings. Lumio tracks whether AI recommends you. These are different systems — you can rank #1 on Google but be invisible in ChatGPT." },
  { q: "How do you collect the data?", a: "We send real prompts to AI systems and analyze the responses for brand mentions, competitor references, and recommendation patterns." },
  { q: "Can I track competitors?", a: "Yes. Every analysis shows which competitors appear in AI answers instead of you, their mention frequency, and why AI prefers them." },
  { q: "Is it free?", a: "Your first quick analysis is completely free — no signup, no credit card. Pro features (full analysis, trend tracking, action plans) start at $49/mo." },
];

/* Demo chart data */
const demoCompetitorData = [
  { name: "Stripe", visibility: 72, fill: "#3B82F6" },
  { name: "Square", visibility: 58, fill: "#06B6D4" },
  { name: "PayPal", visibility: 45, fill: "#8B5CF6" },
  { name: "Adyen", visibility: 31, fill: "#22C55E" },
  { name: "You?", visibility: 8, fill: "#EF4444" },
];

const demoTrendData = [
  { month: "Jan", competitor: 52, you: 22 },
  { month: "Feb", competitor: 55, you: 20 },
  { month: "Mar", competitor: 61, you: 18 },
  { month: "Apr", competitor: 58, you: 15 },
  { month: "May", competitor: 65, you: 12 },
  { month: "Jun", competitor: 72, you: 8 },
];

const problemStats = [
  { value: "0%", label: "Your Lumio score", color: "text-red-400", bar: "w-[4%] bg-red-500" },
  { value: "72%", label: "Top competitor", color: "text-blue-400", bar: "w-[72%] bg-blue-500" },
  { value: "~2,400", label: "Lost visitors / month", color: "text-amber-400", bar: "w-[60%] bg-amber-500" },
  { value: "$18K", label: "Revenue at risk", color: "text-red-400", bar: "w-[45%] bg-red-500" },
];

/* ═════════════════════ SUB-COMPONENTS ═════════════════════ */

/* Chart tooltip */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0F1420] px-3 py-2 text-xs shadow-xl">
      <p className="font-semibold text-white">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="mt-0.5">{p.name}: {p.value}%</p>
      ))}
    </div>
  );
};

/* Mini dashboard preview for hero right side */
function HeroDashboardPreview() {
  return (
    <div className="relative w-full max-w-md">
      {/* Glow backdrop */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-600/20 via-cyan-500/10 to-emerald-500/10 blur-2xl" />

      <div className="relative rounded-2xl border border-white/[0.08] bg-[#0C1222]/90 p-5 shadow-2xl backdrop-blur-xl">
        {/* Score header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lumio Score</p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-3xl font-black text-red-400">12</span>
              <span className="text-sm font-semibold text-slate-500">/100</span>
            </div>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
            <span className="text-xs font-black text-red-400">!</span>
          </div>
        </div>

        {/* Mini bar chart */}
        <div className="h-[130px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={demoCompetitorData} barSize={20}>
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 100]} />
              <Bar dataKey="visibility" radius={[4, 4, 0, 0]}>
                {demoCompetitorData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} fillOpacity={entry.name === "You?" ? 1 : 0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom labels */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 py-2">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400">~$3,200/mo revenue at risk</span>
          </div>
          <span className="text-[10px] font-bold text-slate-500">8,200 lost users/mo</span>
        </div>
      </div>
    </div>
  );
}

/* Analysis Modal */
function AnalysisModal({ isOpen, onClose, onSubmit, defaultMode = "quick", defaultBrand = "" }) {
  const [brandName, setBrandName] = useState(defaultBrand);
  const [mode, setMode] = useState(defaultMode);
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("Global");

  useEffect(() => {
    if (!isOpen) return;
    setBrandName(defaultBrand || "");
    setMode(defaultMode || "quick");
    setIndustry("");
    setCountry("Global");
  }, [isOpen, defaultBrand, defaultMode]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!brandName?.trim()) return;
    onSubmit({ brandName, industry: industry || "auto", country, mode, autoRun: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0E1A]/85 p-4 backdrop-blur-md">
      <div className="w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#0F1420] p-7 shadow-2xl shadow-blue-500/10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Analyze Your Brand</h3>
            <p className="mt-1 text-sm text-slate-500">See your Lumio score in under 60 seconds.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 transition hover:bg-white/[0.05] hover:text-white" aria-label="Close">✕</button>
        </div>

        <div className="space-y-4">
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
            placeholder="Brand or domain (e.g. stripe.com)"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
            autoFocus
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-600">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 focus:border-blue-500 focus:outline-none">
                <option value="">Auto-detect</option>
                <option value="fintech">Fintech</option>
                <option value="ecommerce">E-commerce</option>
                <option value="saas">SaaS</option>
                <option value="ai">AI Tools</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="real estate">Real Estate</option>
                <option value="logistics">Logistics</option>
                <option value="marketplace">Marketplace</option>
                <option value="crypto">Crypto</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-600">Market</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-sm text-slate-300 focus:border-blue-500 focus:outline-none">
                <option value="Global">Global</option>
                <option value="USA">USA</option>
                <option value="UK">UK</option>
                <option value="Germany">Germany</option>
                <option value="Turkey">Turkey</option>
                <option value="UAE">UAE</option>
                <option value="India">India</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] p-1">
            {["quick", "full"].map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${mode === m ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>
                {m === "quick" ? "Quick Preview" : "Full Analysis"}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-600">
            {mode === "quick" ? "Quick preview — score + top competitors. ~30 seconds." : "Full analysis — all competitors, charts, sources & action plan. ~60 seconds."}
          </p>

          <button onClick={handleSubmit} className="w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl hover:shadow-blue-500/30">
            Analyze Now →
          </button>
        </div>
      </div>
    </div>
  );
}

/* FAQ Item */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06]">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between py-5 text-left">
        <span className="pr-4 text-sm font-semibold text-white">{q}</span>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/[0.08] text-xs text-slate-500 transition-transform ${open ? "rotate-45 border-blue-500/30 text-blue-400" : ""}`}>+</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40 pb-5" : "max-h-0"}`}>
        <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════ LANDING PAGE ═══════════════════════════ */
export default function LandingPage({ onAnalyze, onSeeDemo }) {
  const [isAnalysisOpen, setAnalysisOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState("quick");
  const [analysisDefaultBrand, setAnalysisDefaultBrand] = useState("");
  const [heroBrand, setHeroBrand] = useState("");
  const heroInputRef = useRef(null);

  const openAnalysis = (mode = "quick", brand = "") => {
    setAnalysisMode(mode);
    setAnalysisDefaultBrand(brand);
    setAnalysisOpen(true);
  };

  const submitAnalysis = ({ brandName, industry, country, mode, autoRun }) => {
    if (!brandName?.trim()) return;
    setAnalysisOpen(false);
    onAnalyze({ brandName: brandName.trim(), industry: industry || "auto", country: country || "Global", mode, autoRun });
  };

  const handleHeroSubmit = () => {
    if (!heroBrand.trim()) { heroInputRef.current?.focus(); return; }
    openAnalysis("quick", heroBrand.trim());
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-100 antialiased">
      {/* ─── Background gradients ─── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[700px] w-[700px] rounded-full bg-blue-600/[0.07] blur-[140px]" />
        <div className="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.05] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-emerald-500/[0.04] blur-[100px]" />
        <div className="absolute top-2/3 right-1/4 h-[300px] w-[300px] rounded-full bg-violet-500/[0.04] blur-[80px]" />
      </div>

      {/* ═══════════════ STICKY HEADER ═══════════════ */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0E1A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3.5">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-2.5 group">
            <LumioMark size={32} />
            <span className="text-base font-bold tracking-tight text-white">Lumio</span>
          </button>

          <nav className="hidden items-center gap-8 md:flex">
            {[
              { href: "#features", label: "Features" },
              { href: "#how-it-works", label: "How it works" },
              { href: "#demo", label: "Demo" },
              { href: "#pricing", label: "Pricing" },
              { href: "#faq", label: "FAQ" },
            ].map((link) => (
              <a key={link.href} href={link.href} className="text-sm text-slate-400 transition hover:text-white">{link.label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button onClick={() => openAnalysis("quick")} className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg hover:shadow-blue-500/30">
              Analyze Free
            </button>
          </div>
        </div>
      </header>

      <main className="relative">

        {/* ═══════════════════════ 1 · HERO (SPLIT) ═══════════════════════ */}
        <section className="relative overflow-hidden px-6 pb-20 pt-16 md:pb-28 md:pt-24">
          <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">

            {/* ── LEFT: Copy + Input ── */}
            <div>
              {/* Trust pill */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-1.5">
                <div className="flex -space-x-1.5">
                  {[1,2,3,4].map((i) => (
                    <div key={i} className="h-5 w-5 rounded-full border-2 border-[#0A0E1A] bg-gradient-to-br from-blue-400 to-cyan-400" />
                  ))}
                </div>
                <span className="text-xs text-slate-400">Trusted by modern growth teams</span>
              </div>

              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white md:text-5xl lg:text-6xl">
                <span className="text-red-400">🚨</span> Most brands are{" "}
                <span className="bg-gradient-to-r from-red-400 via-amber-400 to-red-400 bg-clip-text text-transparent">
                  losing customers
                </span>{" "}
                in AI answers
              </h1>

              <p className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
                You might be losing <span className="font-bold text-red-400">thousands of dollars</span> in traffic every month — and you don't even know it.
              </p>

              {/* Hero input */}
              <div className="mt-8 max-w-lg">
                <div className="flex items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-1.5 shadow-xl shadow-blue-500/[0.06] backdrop-blur-sm transition-all focus-within:border-blue-500/30 focus-within:shadow-blue-500/[0.12]">
                  <input
                    ref={heroInputRef}
                    value={heroBrand}
                    onChange={(e) => setHeroBrand(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleHeroSubmit(); }}
                    placeholder="Enter your domain (e.g. stripe.com)"
                    className="flex-1 bg-transparent px-4 py-3 text-base text-white placeholder:text-slate-600 focus:outline-none"
                  />
                  <button
                    onClick={handleHeroSubmit}
                    className="shrink-0 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/25 transition-all hover:shadow-lg hover:shadow-blue-500/40 active:scale-[0.98]"
                  >
                    Analyze My Brand
                  </button>
                </div>

                {/* Under-input bullets */}
                <div className="mt-4 space-y-1.5">
                  {[
                    { emoji: "📉", text: "73% of users never click links anymore" },
                    { emoji: "🎯", text: "AI gives ONE answer — not 10 blue links" },
                    { emoji: "⚔️", text: "If it's not you → it's your competitor" },
                  ].map((b) => (
                    <div key={b.text} className="flex items-center gap-2">
                      <span className="text-xs">{b.emoji}</span>
                      <span className="text-xs text-slate-500">{b.text}</span>
                    </div>
                  ))}
                </div>

                {/* Social proof conversion */}
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/10 bg-amber-500/[0.04] px-3 py-2">
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-medium text-amber-300/80">3 companies analyzed in the last 10 minutes</span>
                </div>
              </div>

              {/* Demo link */}
              <button onClick={onSeeDemo} className="mt-5 text-sm font-medium text-slate-500 underline decoration-slate-700 underline-offset-4 transition hover:text-slate-300 hover:decoration-slate-500">
                or see a live demo with Stripe →
              </button>
            </div>

            {/* ── RIGHT: Mini dashboard preview ── */}
            <div className="hidden lg:flex lg:justify-end">
              <HeroDashboardPreview />
            </div>
          </div>
        </section>

        {/* ═══════════════════════ 2 · TRUST + STATS BAR ═══════════════════════ */}
        <section className="border-t border-white/[0.04] px-6 py-14">
          <div className="mx-auto max-w-5xl">
            {/* AI platforms */}
            <div className="mb-10 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-600">We analyze real responses from</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-10">
                {["ChatGPT", "Google AI", "Perplexity", "Claude"].map((name) => (
                  <span key={name} className="text-base font-bold text-slate-500/80 transition hover:text-slate-300">{name}</span>
                ))}
              </div>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 text-center backdrop-blur-sm">
                  <p className={`text-3xl font-black ${s.accent}`}>{s.value}</p>
                  <p className="mt-1.5 text-xs text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ 3 · AI VISIBILITY EXPLANATION ═══════════════════════ */}
        <section className="border-t border-white/[0.04] bg-gradient-to-b from-transparent via-blue-950/[0.08] to-transparent px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">The invisible problem</p>
              <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">AI gives ONE answer. If you're not in it — you don't exist.</h2>
              <p className="mx-auto mt-5 max-w-2xl text-base text-slate-400">
                When users ask "What's the best payment platform?" — AI doesn't show 10 blue links.
                It recommends <span className="font-semibold text-white">one winner</span>. If that's not you, the customer is already gone.
              </p>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {[
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                  ),
                  title: "Your traffic is leaking",
                  text: "70% of product discovery is moving to AI. Users get an answer — and never reach your website.",
                  color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/10",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  ),
                  title: "Competitors win by default",
                  text: "AI recommends brands with structured content. If you don't optimize, competitors absorb your demand.",
                  color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/10",
                },
                {
                  icon: (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                    </svg>
                  ),
                  title: "Early movers compound",
                  text: "AI learns from patterns. The earlier you appear, the harder it is for competitors to displace you.",
                  color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/10",
                },
              ].map((card) => (
                <div key={card.title} className={`rounded-2xl border ${card.border} bg-white/[0.02] p-6 backdrop-blur-sm`}>
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg} ${card.color}`}>{card.icon}</div>
                  <h3 className="mt-4 text-base font-semibold text-white">{card.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{card.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ 4 · PROBLEM SECTION ═══════════════════════ */}
        <section className="border-t border-white/[0.04] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left: message */}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-400">Revenue impact</p>
                <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">You are losing customers to AI</h2>
                <p className="mt-4 max-w-md text-base text-slate-400">
                  Every day your brand is invisible in AI answers, competitors capture high-intent buyers who never even consider you.
                </p>
                <button onClick={() => openAnalysis("quick")} className="mt-8 rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-red-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:shadow-xl hover:shadow-red-500/30">
                  Stop losing customers
                </button>
              </div>

              {/* Right: visual stats */}
              <div className="space-y-4">
                {problemStats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                      <span className={`text-lg font-black ${s.color}`}>{s.value}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/[0.06]">
                      <div className={`h-1.5 rounded-full ${s.bar} transition-all duration-1000`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ 5 · HOW IT WORKS ═══════════════════════ */}
        <section id="how-it-works" className="border-t border-white/[0.04] bg-gradient-to-b from-transparent via-cyan-950/[0.06] to-transparent px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-emerald-400">How it works</p>
              <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">From zero to insights in 60 seconds</h2>
            </div>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {howItWorks.map((h, idx) => (
                <div key={h.step} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all hover:border-white/[0.12] hover:bg-white/[0.04]">
                  {/* Connector line (desktop) */}
                  {idx < 2 && <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-white/10 to-transparent md:block" />}

                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-black text-white shadow-md shadow-blue-500/20">{h.step}</span>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-0.5 text-[10px] font-bold text-slate-500">{h.time}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white">{h.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">{h.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-14 text-center">
              <button onClick={() => openAnalysis("quick")} className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 transition hover:shadow-xl hover:shadow-blue-500/30">
                Try it free — no signup
              </button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ 6 · MINI DEMO ═══════════════════════ */}
        <section id="demo" className="border-t border-white/[0.04] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400">Live preview</p>
              <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">See what you're missing</h2>
              <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
                Real data from AI responses. This is what your competitors see — and you don't.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {/* Competitor bar chart */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Competitor Visibility</p>
                    <p className="mt-1 text-sm text-slate-400">Query: "best payment platform"</p>
                  </div>
                  <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-400">You: 8%</span>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={demoCompetitorData} barSize={32}>
                      <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} width={30} />
                      <Tooltip content={<ChartTooltip />} cursor={false} />
                      <Bar dataKey="visibility" radius={[6, 6, 0, 0]}>
                        {demoCompetitorData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} fillOpacity={entry.name === "You?" ? 1 : 0.75} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Chart annotation */}
                <div className="mt-3 flex items-center justify-between rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-red-400">You (critically low visibility)</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">Stripe (dominates 72%)</span>
                </div>
              </div>

              {/* Trend area chart */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Visibility Trend</p>
                    <p className="mt-1 text-sm text-slate-400">Competitor vs You · 6 months</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-[10px] text-blue-400"><span className="h-1.5 w-1.5 rounded-full bg-blue-500" />Competitor</span>
                    <span className="flex items-center gap-1 text-[10px] text-red-400"><span className="h-1.5 w-1.5 rounded-full bg-red-500" />You</span>
                  </div>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={demoTrendData}>
                      <defs>
                        <linearGradient id="gradComp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradYou" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#EF4444" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: "#475569", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} width={30} />
                      <Tooltip content={<ChartTooltip />} cursor={false} />
                      <Area type="monotone" dataKey="competitor" name="Competitor" stroke="#3B82F6" strokeWidth={2} fill="url(#gradComp)" />
                      <Area type="monotone" dataKey="you" name="You" stroke="#EF4444" strokeWidth={2} fill="url(#gradYou)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {/* Chart annotation */}
                <div className="mt-3 flex items-center justify-between rounded-lg border border-amber-500/15 bg-amber-500/[0.06] px-3 py-2">
                  <span className="text-[10px] font-bold text-amber-400">↑ Competitor visibility growing</span>
                  <span className="text-[10px] font-bold text-red-400">↓ You: declining every month</span>
                </div>
              </div>
            </div>

            {/* Revenue impact row */}
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/40 via-[#111827] to-red-950/40 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-base">💰</span>
                <p className="text-sm font-bold text-white">What this costs you</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: "Lost traffic", value: "~8,200/mo", sub: "users going to competitors", color: "text-red-400" },
                  { label: "Revenue at risk", value: "~$3,200/mo", sub: "estimated monthly loss", color: "text-red-400" },
                  { label: "Missed opportunities", value: "12 queries", sub: "where competitors win", color: "text-amber-400" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center backdrop-blur-sm">
                    <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Insight row below charts */}
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {[
                { label: "Visibility gap", value: "64%", sub: "between you and #1 competitor", color: "text-red-400" },
                { label: "Missed queries", value: "12", sub: "high-intent queries you're absent from", color: "text-amber-400" },
                { label: "Revenue at risk", value: "$18K/mo", sub: "estimated lost from AI invisibility", color: "text-red-400" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center backdrop-blur-sm">
                  <p className={`text-xl font-black ${item.color}`}>{item.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <button onClick={() => openAnalysis("full")} className="rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-red-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 transition hover:shadow-xl">
                Stop losing customers →
              </button>
              <p className="mt-3 text-xs text-slate-600">This is sample data. Run your brand to see your real revenue loss.</p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FEATURES GRID ═══════════════════════ */}
        <section id="features" className="border-t border-white/[0.04] bg-gradient-to-b from-transparent via-blue-950/[0.05] to-transparent px-6 py-20 md:py-28">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-400">Platform</p>
              <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">Everything you need to win in AI</h2>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-2">
              {features.map((f) => (
                <div key={f.title} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04]">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${f.bg} ${f.color} transition-transform duration-300 group-hover:scale-110`}>{f.icon}</div>
                    <div>
                      <h3 className="text-base font-semibold text-white">{f.title}</h3>
                      <p className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ PRICING ═══════════════════════ */}
        <section id="pricing" className="border-t border-white/[0.04] px-6 py-20 md:py-28">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-blue-400">Pricing</p>
              <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">Start free. Scale when ready.</h2>
              <p className="mt-4 text-base text-slate-400">No credit card required for your first analysis.</p>
            </div>

            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {/* Free */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Free</p>
                <p className="mt-3 text-4xl font-black text-white">$0</p>
                <p className="mt-1 text-xs text-slate-600">forever</p>
                <ul className="mt-6 space-y-3">
                  {["3 analyses per month", "Basic AI analysis", "Visibility score", "Top 3 competitors", "Basic insights"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400"><span className="text-emerald-400">✓</span>{f}</li>
                  ))}
                </ul>
                <button onClick={() => openAnalysis("quick")} className="mt-8 w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]">
                  Start Free
                </button>
              </div>

              {/* Pro - highlighted */}
              <div className="relative rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/[0.08] to-transparent p-6 shadow-xl shadow-blue-500/[0.06]">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-lg shadow-blue-500/30">Most popular</span>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Pro</p>
                <p className="mt-3 text-4xl font-black text-white">$49<span className="text-base font-semibold text-slate-500">/mo</span></p>
                <p className="mt-1 text-xs text-slate-600">billed monthly</p>
                <ul className="mt-6 space-y-3">
                  {["50 analyses per month", "Full AI analysis", "Strategy recommendations", "Content generation", "Tracking & impact analysis", "Competitor deep-dive"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-300"><span className="text-blue-400">✓</span>{f}</li>
                  ))}
                </ul>
                <button onClick={() => openAnalysis("full")} className="mt-8 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition hover:shadow-lg">
                  Recover Your Traffic →
                </button>
              </div>

              {/* Enterprise */}
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Enterprise</p>
                <p className="mt-3 text-2xl font-black text-white">Custom Pricing</p>
                <p className="mt-1 text-xs text-slate-600">tailored to your org</p>
                <ul className="mt-6 space-y-3">
                  {["Unlimited analyses", "Multi-brand portfolio", "Team collaboration", "Weekly AI reports", "Priority insights", "Dedicated support"].map((f) => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-slate-400"><span className="text-emerald-400">✓</span>{f}</li>
                  ))}
                </ul>
                <button className="mt-8 w-full rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ FAQ ═══════════════════════ */}
        <section id="faq" className="border-t border-white/[0.04] bg-gradient-to-b from-transparent via-blue-950/[0.04] to-transparent px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-slate-500">FAQ</p>
              <h2 className="mt-4 text-3xl font-bold text-white md:text-4xl">Common questions</h2>
            </div>
            <div className="mt-12">
              {faqItems.map((item) => <FaqItem key={item.q} {...item} />)}
            </div>
          </div>
        </section>

        {/* ═══════════════════════ 7 · FINAL CTA ═══════════════════════ */}
        <section className="border-t border-white/[0.04] px-6 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white md:text-5xl">
              Recover your AI visibility
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-3xl font-bold md:text-5xl">
              <span className="bg-gradient-to-r from-red-400 via-amber-400 to-red-400 bg-clip-text text-transparent">before competitors lock you out.</span>
            </p>
            <p className="mt-6 text-lg text-slate-400">See your score in 60 seconds. No signup required.</p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <button onClick={() => openAnalysis("quick")} className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-xl hover:shadow-blue-500/40 active:scale-[0.98]">
                Stop Losing Customers
              </button>
              <button onClick={onSeeDemo} className="rounded-xl border border-white/[0.1] bg-white/[0.03] px-8 py-4 text-base font-semibold text-slate-300 transition hover:bg-white/[0.06]">
                See live demo
              </button>
            </div>
            <p className="mt-4 text-xs text-slate-600">No signup · No credit card · Instant results</p>
          </div>
        </section>

        {/* ═══════════════════════ FOOTER ═══════════════════════ */}
        <footer className="border-t border-white/[0.04] px-6 py-10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <LumioMark size={24} />
              <span className="text-sm font-bold text-white">Lumio</span>
            </div>
            <div className="flex items-center gap-6">
              <a href="#features" className="text-xs text-slate-600 transition hover:text-slate-400">Features</a>
              <a href="#pricing" className="text-xs text-slate-600 transition hover:text-slate-400">Pricing</a>
              <a href="#faq" className="text-xs text-slate-600 transition hover:text-slate-400">FAQ</a>
            </div>
            <p className="text-xs text-slate-600">© 2026 Lumio. All rights reserved.</p>
          </div>
        </footer>
      </main>

      <AnalysisModal isOpen={isAnalysisOpen} onClose={() => setAnalysisOpen(false)} onSubmit={submitAnalysis} defaultMode={analysisMode} defaultBrand={analysisDefaultBrand} />
    </div>
  );
}
