import React, { useEffect, useMemo, useState } from "react";

const features = [
  {
    title: "AI Visibility Tracking",
    description: "Measure where your brand is mentioned across AI-generated buying answers.",
  },
  {
    title: "Competitor Pressure",
    description: "See which brands replace you in AI responses and where you lose demand.",
  },
  {
    title: "Source Intelligence",
    description: "Understand the sources and channels shaping AI recommendations in your niche.",
  },
  {
    title: "Actionable Playbooks",
    description: "Get practical content and positioning recommendations your team can execute fast.",
  },
];

const trustBadges = [
  "Live AI answer analysis",
  "Prompt-level competitor tracking",
  "Exportable stakeholder reports",
];

function AnalysisModal({
  isOpen,
  onClose,
  onSubmit,
  defaultMode = "quick",
  defaultBrand = "",
}) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Analyze Your Brand</h3>
            <p className="mt-1 text-sm text-slate-400">
              We analyze your brand across AI-generated search results.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 transition hover:text-slate-200"
            aria-label="Close analysis modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Brand name (e.g. Stripe, Shopify)"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
              autoFocus
            />
            <p className="mt-1.5 text-xs text-slate-500">We analyze your brand across AI-generated search results</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-400">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
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
              <label className="mb-1 block text-xs font-semibold text-slate-400">Market</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
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

          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-700 p-1">
            <button
              type="button"
              onClick={() => setMode("quick")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === "quick"
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-transparent text-slate-300 hover:bg-slate-800"
              }`}
            >
              Quick Preview
            </button>
            <button
              type="button"
              onClick={() => setMode("full")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                mode === "full"
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-transparent text-slate-300 hover:bg-slate-800"
              }`}
            >
              Full Analysis
            </button>
          </div>

          {mode === "quick" ? (
            <p className="text-xs text-amber-400/80">
              ⚡ Quick preview shows score + top 3 competitors. Upgrade to unlock full insights.
            </p>
          ) : (
            <p className="text-xs text-emerald-400/80">
              ✓ Full analysis includes all competitors, charts, sources, and action plan.
            </p>
          )}

          <button
            onClick={handleSubmit}
            className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Analyze Now →
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginModal({ isOpen, onClose, onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white">Login</h3>
            <p className="mt-1 text-sm text-slate-300">
              Access your saved reports and team workspace.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 transition hover:text-slate-200"
            aria-label="Close login modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
          />

          <button
            onClick={() => onLogin({ email, password })}
            className="w-full rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage({ onAnalyze, onSeeDemo }) {
  const [isAnalysisOpen, setAnalysisOpen] = useState(false);
  const [isLoginOpen, setLoginOpen] = useState(false);
  const [analysisMode, setAnalysisMode] = useState("quick");
  const [analysisDefaultBrand, setAnalysisDefaultBrand] = useState("");
  const [user, setUser] = useState(null);

  const loginLabel = useMemo(() => {
    if (!user) return "Login";
    return user.email || "My Workspace";
  }, [user]);

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

  const handleLogin = ({ email }) => {
    if (!email?.trim()) return;
    setUser({ email: email.trim() });
    setLoginOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(34,211,238,0.14),transparent_36%),radial-gradient(circle_at_90%_0%,rgba(14,165,233,0.14),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(56,189,248,0.09),transparent_45%)]" />

      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 md:px-10">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-lg font-extrabold tracking-tight text-white"
          >
            AI Visibility
          </button>

          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Features
            </a>
            <a href="#pricing" className="text-sm font-medium text-slate-300 transition hover:text-white">
              Pricing
            </a>
            <button
              onClick={() => setLoginOpen(true)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              {loginLabel}
            </button>
          </nav>

          <button
            onClick={() => openAnalysis("quick")}
            className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Quick Analysis
          </button>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <section className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl backdrop-blur md:p-12">
          <div className="mb-5 inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            AI Visibility Alert
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
            You are losing visibility in AI search.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300 md:text-xl">
            Measure your share in AI answers and recover demand before competitors absorb it.
          </p>

          <div className="mt-7 inline-flex items-center rounded-xl border border-rose-300/25 bg-rose-500/15 px-4 py-2">
            <p className="text-base font-bold text-rose-100">Risk: 82/100 (High)</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => openAnalysis("quick")}
              className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Markami Analiz Et
            </button>
            <button
              onClick={onSeeDemo}
              className="rounded-xl border border-slate-600 bg-slate-800/90 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            >
              See Demo
            </button>
          </div>
        </section>

        <section id="features" className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
          <h2 className="text-2xl font-bold text-white">Built for AI-Era Growth Teams</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-slate-800 bg-slate-900 p-5">
                <p className="text-base font-semibold text-white">{feature.title}</p>
                <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
          <h2 className="text-2xl font-bold text-white">How it works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Step 1</p>
              <p className="mt-2 text-base font-semibold text-white">Enter your brand</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Step 2</p>
              <p className="mt-2 text-base font-semibold text-white">Run quick or full scan</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Step 3</p>
              <p className="mt-2 text-base font-semibold text-white">View live visibility insights</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
          <h2 className="text-2xl font-bold text-white">Pricing</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Free</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Quick Analysis</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>3 prompt scan</li>
                <li>Core score and risk view</li>
                <li>Starter recommendations</li>
              </ul>
              <button
                onClick={() => openAnalysis("quick")}
                className="mt-6 rounded-xl border border-cyan-300/50 bg-cyan-400/15 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/25"
              >
                Quick Analysis
              </button>
            </article>

            <article className="rounded-2xl border border-cyan-300/40 bg-cyan-500/10 p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Paid</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Full Analysis</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>Deep prompt coverage</li>
                <li>Competitor intelligence</li>
                <li>Source confidence and trends</li>
                <li>Export-ready reporting</li>
              </ul>
              <button
                onClick={() => openAnalysis("full")}
                className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
              >
                Unlock Full Analysis
              </button>
            </article>
          </div>
        </section>

        <section className="mt-14">
          <div className="flex flex-wrap gap-2">
            {trustBadges.map((badge) => (
              <span key={badge} className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-300">
                {badge}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-center">
          <h2 className="text-3xl font-bold text-white">Start your analysis now</h2>
          <p className="mt-3 text-sm text-slate-300">
            Launch a quick scan in seconds and move directly into your live dashboard.
          </p>
          <button
            onClick={() => openAnalysis("quick")}
            className="mt-6 rounded-xl bg-cyan-400 px-8 py-3 text-base font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Markami Analiz Et
          </button>
        </section>
      </main>

      <AnalysisModal
        isOpen={isAnalysisOpen}
        onClose={() => setAnalysisOpen(false)}
        onSubmit={submitAnalysis}
        defaultMode={analysisMode}
        defaultBrand={analysisDefaultBrand}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={handleLogin}
      />
    </div>
  );
}
