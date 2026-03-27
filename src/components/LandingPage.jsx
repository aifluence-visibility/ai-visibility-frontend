import React from "react";

const features = [
  "AI visibility tracking",
  "Competitor analysis",
  "Source analysis",
  "Risk scoring",
  "Actionable insights",
];

const trustBadges = [
  "AI-generated insights",
  "Data-driven analysis",
  "Real-time updates",
];

export default function LandingPage({ onAnalyze, onSeeDemo }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.16),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.18),transparent_35%),radial-gradient(circle_at_50%_80%,rgba(2,132,199,0.14),transparent_45%)]" />

      <main className="relative mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
        <section className="overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-900/70 p-8 shadow-2xl backdrop-blur md:p-12">
          <div className="mb-5 inline-flex items-center rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-200">
            AI Visibility Alert
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-white md:text-6xl">
            You are losing visibility in AI search.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300 md:text-xl">
            Your brand is missing in X% of AI-generated answers.
          </p>

          <div className="mt-7 inline-flex items-center rounded-xl border border-rose-300/25 bg-rose-500/15 px-4 py-2">
            <p className="text-base font-bold text-rose-100">Risk: 82/100 (High)</p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={onAnalyze}
              className="rounded-xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Analyze My Brand
            </button>
            <button
              onClick={onSeeDemo}
              className="rounded-xl border border-slate-600 bg-slate-800/90 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
            >
              See Demo
            </button>
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Search behavior changed</h2>
            <p className="mt-2 text-sm text-slate-300">People ask AI first. They skip Google.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Brands are invisible</h2>
            <p className="mt-2 text-sm text-slate-300">If AI does not mention your brand, you lose demand before visits happen.</p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-lg font-semibold text-white">Competitors take traffic</h2>
            <p className="mt-2 text-sm text-slate-300">Every missing mention is discovery traffic captured by someone else.</p>
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
              <p className="mt-2 text-base font-semibold text-white">We analyze AI responses</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Step 3</p>
              <p className="mt-2 text-base font-semibold text-white">Get actionable insights</p>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-2xl font-bold text-white">Product preview</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Visibility score</p>
              <p className="mt-2 text-3xl font-bold text-cyan-300">42%</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Competitors</p>
              <p className="mt-2 text-sm text-slate-200">Stripe, PayPal, Adyen</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Traffic sources</p>
              <p className="mt-2 text-sm text-slate-200">stripe.com, techcrunch.com</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Risk score</p>
              <p className="mt-2 text-3xl font-bold text-rose-300">82/100</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Insights</p>
              <p className="mt-2 text-sm text-slate-200">Problem detected. Action plan ready.</p>
            </div>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
          <h2 className="text-2xl font-bold text-white">Why it matters</h2>
          <div className="mt-4 space-y-2 text-slate-300">
            <p>AI search is growing fast.</p>
            <p>If you are not mentioned, you do not exist.</p>
            <p>Early movers win the category.</p>
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/50 p-8">
          <h2 className="text-2xl font-bold text-white">Features</h2>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-200">
                {feature}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-3xl border border-slate-800 bg-slate-900/60 p-8">
          <h2 className="text-2xl font-bold text-white">Pricing</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <article className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Free</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Quick Analysis</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>Quick analysis</li>
                <li>Limited data</li>
                <li>Low confidence</li>
              </ul>
            </article>
            <article className="rounded-2xl border border-cyan-300/40 bg-cyan-500/10 p-6">
              <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Paid</p>
              <h3 className="mt-2 text-2xl font-bold text-white">Full Analysis</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-200">
                <li>Full analysis</li>
                <li>Deep insights</li>
                <li>High confidence</li>
                <li>Competitor intelligence</li>
              </ul>
              <button className="mt-6 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">
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
          <button
            onClick={onAnalyze}
            className="mt-6 rounded-xl bg-cyan-400 px-8 py-3 text-base font-bold text-slate-950 transition hover:bg-cyan-300"
          >
            Analyze My Brand
          </button>
        </section>
      </main>
    </div>
  );
}
