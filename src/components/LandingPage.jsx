import React, { useRef, useState } from "react";
import { LumioMark } from "../shared/components/LumioLogo";

const TRUST_MARKS = ["NOVA", "PULSE", "STACK", "FORGE", "ATLAS", "LAYER"];

const PROBLEM_CARDS = [
  {
    title: "AI tools recommend competitors",
    body: "High-intent prompts now resolve inside ChatGPT, Perplexity, and Google AI. If competitors appear first, demand never reaches your site.",
    accent: "from-red-500/25 to-orange-500/10",
    border: "border-red-500/20",
    icon: "01",
  },
  {
    title: "Your brand is not mentioned",
    body: "AI systems build recommendations from authority signals, citations, and structured positioning. Missing signals mean missing mentions.",
    accent: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/20",
    icon: "02",
  },
  {
    title: "Traffic is silently lost",
    body: "Customers think they completed research, competitors absorb the click, and your pipeline drops without a visible ranking change.",
    accent: "from-emerald-500/20 to-teal-500/10",
    border: "border-emerald-500/20",
    icon: "03",
  },
];

const VALUE_PILLARS = [
  {
    title: "Visibility analysis",
    body: "See where AI recommends your brand, where it skips you, and how visible you really are across commercial prompts.",
    metric: "Visibility score",
  },
  {
    title: "Competitor intelligence",
    body: "Track which competitors dominate AI answers, how often they appear, and what content patterns help them win.",
    metric: "Competitor share",
  },
  {
    title: "Recovery plan",
    body: "Move from diagnostics to execution with a prioritized plan built to recover lost visibility and traffic fast.",
    metric: "7-day plan",
  },
];

const RECOVERY_DAYS = [
  {
    day: "Day 1",
    title: "Fix brand positioning pages",
    note: "Publish the page AI needs to understand what you do, who you serve, and why you win.",
    impact: "+14 visibility points",
  },
  { day: "Day 2", title: "Capture comparison prompts", note: "Build competitor comparison assets for decision queries." },
  { day: "Day 3", title: "Add citation-friendly proof", note: "Ship authority blocks, proof points, and structured statements." },
  { day: "Day 4", title: "Rewrite commercial pages", note: "Align core pages to the prompts AI actually cites." },
  { day: "Day 5", title: "Expand answer coverage", note: "Create FAQ and category pages for missing intents." },
  { day: "Day 6", title: "Track gain by prompt", note: "Watch visibility recover at the query level." },
  { day: "Day 7", title: "Lock in growth loop", note: "Turn wins into a repeatable AI growth system." },
];

const ADDON = { name: "7-Day Recovery Plan", monthlyPrice: 19 };

const PRICING = [
  {
    name: "FREE",
    price: 0,
    cadence: "",
    cta: "Analyze My Visibility",
    features: ["3 analyses/month", "Basic insights", "Visibility score", "Competitor overview"],
    recoveryPlan: null,
  },
  {
    name: "PRO",
    launchPrice: 29,
    originalPrice: 49,
    cadence: "/month",
    cta: "Start recovering traffic",
    badge: "Most valuable feature",
    featured: true,
    features: ["Full analysis", "Competitor insights", "Strategy recommendations", "Tracking", "Content generation"],
    recoveryPlan: "optional",
  },
  {
    name: "ENTERPRISE",
    launchPrice: 299,
    originalPrice: 499,
    cadence: "/month",
    cta: "Unlock your growth plan",
    features: ["Everything in PRO", "Multi-brand", "Team features", "Reports & exports", "Priority support"],
    recoveryPlan: "included",
  },
];

function SectionIntro({ eyebrow, title, body, align = "center" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl"}>
      <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300/80">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">{title}</h2>
      {body ? <p className="mt-4 text-base leading-7 text-slate-400 md:text-lg">{body}</p> : null}
    </div>
  );
}

function InputCta({ value, onChange, onSubmit, inputRef, buttonLabel, helperText, compact = false }) {
  return (
    <div className={compact ? "w-full" : "w-full max-w-2xl"}>
      <div className={`rounded-[28px] border border-white/10 bg-white/[0.04] p-2 shadow-[0_20px_80px_rgba(11,19,36,0.55)] backdrop-blur-xl ${compact ? "" : "ring-1 ring-cyan-400/10"}`}>
        <div className={`flex ${compact ? "flex-col gap-3 sm:flex-row sm:items-center" : "flex-col gap-3 md:flex-row md:items-center"}`}>
          <div className="flex flex-1 items-center gap-3 rounded-[22px] bg-slate-950/50 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-xs font-black text-cyan-200">AI</div>
            <input
              ref={inputRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") onSubmit();
              }}
              placeholder="Enter your brand name"
              className="w-full bg-transparent text-base font-medium text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>
          <button
            onClick={onSubmit}
            className="rounded-[22px] bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 px-7 py-4 text-sm font-black text-slate-950 shadow-[0_20px_45px_rgba(34,211,238,0.28)] transition duration-300 hover:scale-[1.01] hover:shadow-[0_24px_60px_rgba(34,211,238,0.38)]"
          >
            {buttonLabel}
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-500">{helperText}</p>
    </div>
  );
}

function TrustMark({ name }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-2.5 text-sm font-bold tracking-[0.24em] text-slate-500 transition duration-300 hover:border-white/20 hover:text-slate-300">
      {name}
    </div>
  );
}

function BillingToggle({ billing, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
      {["monthly", "yearly"].map((cycle) => (
        <button
          key={cycle}
          onClick={() => onChange(cycle)}
          className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${billing === cycle ? "bg-white text-slate-950 shadow" : "text-slate-400 hover:text-white"}`}
        >
          {cycle === "monthly" ? "Monthly" : (
            <span className="flex items-center gap-2">
              Yearly
              <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">Save 20%</span>
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

function DemoMetric({ label, value, tone }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-black tracking-[-0.04em] ${tone}`}>{value}</p>
    </div>
  );
}

function ValueCard({ title, body, metric }) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-7 shadow-[0_18px_50px_rgba(15,23,42,0.38)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-cyan-400/20">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold text-white">{title}</p>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">{metric}</span>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-400">{body}</p>
    </div>
  );
}

function PricingCard({ plan, billing, addOn, onAddOnChange, onCheckout, onStartFree }) {
  const isFree = plan.price === 0;
  const isYearly = billing === "yearly";
  const baseMonthly = plan.launchPrice ?? 0;
  const baseDisplay = isYearly ? Math.round(baseMonthly * 0.8) : baseMonthly;
  const origMonthly = plan.originalPrice ?? 0;
  const origDisplay = isYearly ? Math.round(origMonthly * 0.8) : origMonthly;
  const addOnMonthly = ADDON.monthlyPrice;
  const addOnDisplay = isYearly ? Math.round(addOnMonthly * 0.8) : addOnMonthly;
  const showAddOnToggle = plan.recoveryPlan === "optional";
  const addOnIncluded = plan.recoveryPlan === "included";
  const addOnActive = showAddOnToggle ? addOn : addOnIncluded;
  const totalDisplay = baseDisplay + (addOnActive ? addOnDisplay : 0);

  return (
    <div className={`relative rounded-[30px] border p-7 shadow-[0_24px_80px_rgba(15,23,42,0.38)] backdrop-blur-xl ${plan.featured ? "border-amber-300/30 bg-gradient-to-b from-amber-300/12 via-cyan-500/10 to-white/[0.03]" : "border-white/8 bg-white/[0.03]"}`}>
      {plan.badge ? (
        <div className="absolute -top-3 left-6">
          <span className="rounded-full border border-amber-300/30 bg-amber-300/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-950">{plan.badge}</span>
        </div>
      ) : null}
      <p className={`text-[11px] font-black uppercase tracking-[0.24em] ${plan.featured ? "text-amber-200" : "text-slate-500"}`}>{plan.name}</p>

      <div className="mt-5">
        {isFree ? (
          <div className="flex items-end gap-1">
            <p className="text-4xl font-black tracking-[-0.05em] text-white">$0</p>
            <p className="pb-1 text-sm font-semibold text-slate-500">forever</p>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black tracking-[-0.05em] text-white">
                ${addOnActive ? totalDisplay : baseDisplay}
              </p>
              <p className="pb-1 text-sm font-semibold text-slate-500">
                {isYearly ? "/mo, billed yearly" : "/month"}
              </p>
            </div>
            {origDisplay > 0 && (
              <p className="mt-1 text-sm text-slate-500">
                <span className="line-through">${origDisplay}/mo</span>
                <span className="ml-2 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-black text-emerald-300">Launch price</span>
              </p>
            )}
            {addOnActive && showAddOnToggle && (
              <p className="mt-1 text-[11px] text-slate-500">${baseDisplay} base + ${addOnDisplay} add-on</p>
            )}
          </>
        )}
      </div>

      {showAddOnToggle && (
        <div className="mt-5 rounded-[22px] border border-amber-300/20 bg-amber-300/[0.08] p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">&#9733; Optional add-on</p>
              <p className="mt-1 text-sm font-bold text-white">7-Day Recovery Plan</p>
              <p className="mt-0.5 text-[11px] text-slate-400">+${addOnDisplay}/month</p>
            </div>
            <button
              onClick={() => onAddOnChange(!addOn)}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${addOn ? "bg-amber-400" : "bg-slate-700"}`}
              role="switch"
              aria-checked={addOn}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${addOn ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
          </div>
        </div>
      )}

      {addOnIncluded && (
        <div className="mt-5 rounded-[22px] border border-emerald-400/20 bg-emerald-400/[0.08] p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-300">&#10003; Included</p>
          <p className="mt-1 text-sm font-bold text-white">7-Day Recovery Plan</p>
          <p className="mt-0.5 text-[11px] text-slate-400">Included at no extra cost</p>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${plan.featured ? "bg-amber-300/15 text-amber-200" : "bg-white/[0.08] text-slate-300"}`}>&#10003;</span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={() => isFree ? onStartFree() : onCheckout(plan)}
        className={`mt-8 w-full rounded-[20px] px-5 py-4 text-sm font-black transition duration-300 ${plan.featured ? "bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 text-slate-950 shadow-[0_20px_45px_rgba(245,158,11,0.28)] hover:shadow-[0_24px_60px_rgba(245,158,11,0.38)]" : "border border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]"}`}
      >
        {plan.cta}
      </button>
    </div>
  );
}

function RecoveryDay({ item, locked = false }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-slate-950/45 p-5 ${locked ? "opacity-75" : ""}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">{item.day}</p>
          <p className="mt-2 text-base font-bold text-white">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-400">{item.note}</p>
        </div>
        {item.impact ? <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">{item.impact}</span> : null}
      </div>
    </div>
  );
}

function CheckoutModal({ plan, billing, addOn, onClose, onConfirm }) {
        const isYearly = billing === "yearly";
        const baseMonthly = plan.launchPrice ?? 0;
        const baseDisplay = isYearly ? Math.round(baseMonthly * 0.8) : baseMonthly;
        const addOnMonthly = ADDON.monthlyPrice;
        const addOnDisplay = isYearly ? Math.round(addOnMonthly * 0.8) : addOnMonthly;
        const showAddOn = addOn && plan.recoveryPlan === "optional";
        const addOnIncluded = plan.recoveryPlan === "included";
        const total = baseDisplay + (showAddOn ? addOnDisplay : 0);

        return (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#07111f]/85 p-6 backdrop-blur-xl">
            <div className="w-full max-w-md rounded-[32px] border border-white/10 bg-[#0c1828] p-8 shadow-[0_40px_120px_rgba(2,8,23,0.65)]">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300/80">Order summary</p>
                <button onClick={onClose} className="rounded-lg p-1.5 text-slate-500 transition hover:text-white">&#x2715;</button>
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-[-0.04em] text-white">Unlock your growth plan</h3>

              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/[0.03] px-5 py-4">
                  <div>
                    <p className="font-bold text-white">{plan.name} Plan</p>
                    <p className="mt-0.5 text-[11px] text-slate-500">{isYearly ? "Billed yearly" : "Billed monthly"}</p>
                  </div>
                  <p className="text-lg font-black text-white">${baseDisplay}<span className="text-sm font-semibold text-slate-500">/mo</span></p>
                </div>

                {(showAddOn || addOnIncluded) && (
                  <div className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${addOnIncluded ? "border-emerald-400/20 bg-emerald-400/[0.08]" : "border-amber-300/20 bg-amber-300/[0.08]"}`}>
                    <div>
                      <p className="font-bold text-white">7-Day Recovery Plan</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{addOnIncluded ? "Included with Enterprise" : "Add-on"}</p>
                    </div>
                    <div>
                      {addOnIncluded
                        ? <span className="text-sm font-black text-emerald-300">FREE</span>
                        : <p className="text-lg font-black text-white">${addOnDisplay}<span className="text-sm font-semibold text-slate-500">/mo</span></p>}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-2xl border border-white/[0.15] bg-white/[0.06] px-5 py-4">
                  <p className="font-bold text-white">Total</p>
                  <div className="text-right">
                    <p className="text-2xl font-black tracking-[-0.04em] text-white">${total}<span className="text-sm font-semibold text-slate-500">/mo</span></p>
                    {isYearly && <p className="mt-0.5 text-[10px] text-emerald-300">Billed ${total * 12}/year</p>}
                  </div>
                </div>
              </div>

              <button
                onClick={onConfirm}
                className="mt-6 w-full rounded-[20px] bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 px-5 py-4 text-sm font-black text-slate-950 shadow-[0_20px_45px_rgba(245,158,11,0.28)] transition hover:shadow-[0_24px_60px_rgba(245,158,11,0.38)]"
              >
                Start recovering traffic &#8594;
              </button>
              <p className="mt-3 text-center text-[11px] text-slate-500">Early pricing &#183; Prices will increase after launch.</p>
              <button onClick={onClose} className="mt-2 w-full text-center text-xs text-slate-500 transition hover:text-slate-300">Cancel</button>
            </div>
          </div>
        );
}

export default function LandingPage({ onAnalyze, onSeeDemo }) {
  const [brandName, setBrandName] = useState("");
  const [billing, setBilling] = useState("monthly");
  const [addOn, setAddOn] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const heroInputRef = useRef(null);
  const finalInputRef = useRef(null);

  const startAnalysis = (mode = "quick") => {
    if (!brandName.trim()) {
      heroInputRef.current?.focus();
      return;
    }

    onAnalyze({ brandName: brandName.trim(), mode });
  };

  const unlockPro = () => {
    if (!brandName.trim()) {
      heroInputRef.current?.focus();
      return;
    }

    onAnalyze({ brandName: brandName.trim(), mode: "full" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#07111f] text-white antialiased">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_80%_10%,_rgba(16,185,129,0.12),_transparent_24%),radial-gradient(circle_at_50%_55%,_rgba(59,130,246,0.10),_transparent_32%)]" />
        <div className="absolute -top-28 left-10 h-80 w-80 rounded-full bg-cyan-400/12 blur-3xl" />
        <div className="absolute top-32 right-0 h-[30rem] w-[30rem] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[24rem] w-[24rem] rounded-full bg-blue-500/12 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/8 bg-[#07111f]/78 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <LumioMark size={34} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-300/75">LUMIO AI</p>
              <p className="text-sm font-semibold text-slate-400">AI Visibility and Growth</p>
            </div>
          </div>
          <div className="hidden items-center gap-8 lg:flex">
            <a href="#problem" className="text-sm text-slate-400 transition hover:text-white">Problem</a>
            <a href="#demo" className="text-sm text-slate-400 transition hover:text-white">Live Demo</a>
            <a href="#recovery" className="text-sm text-slate-400 transition hover:text-white">Recovery Plan</a>
            <a href="#pricing" className="text-sm text-slate-400 transition hover:text-white">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onSeeDemo} className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] lg:inline-flex">
              Unlock growth insights
            </button>
            <button onClick={unlockPro} className="rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-emerald-400 px-5 py-2.5 text-sm font-black text-slate-950 shadow-[0_16px_45px_rgba(34,211,238,0.28)] transition hover:scale-[1.01]">
              Recover your visibility
            </button>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="px-6 pb-20 pt-14 lg:px-10 lg:pb-28 lg:pt-20">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/8 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-cyan-200">
                Premium AI growth platform
              </div>
              <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-[-0.07em] text-white sm:text-6xl lg:text-7xl">
                You are losing traffic to AI every day.
              </h1>
              <p className="mt-6 max-w-2xl text-xl leading-8 text-slate-300">
                Your competitors are being recommended by AI tools — and you are not.
              </p>
              <div className="mt-10">
                <InputCta
                  value={brandName}
                  onChange={setBrandName}
                  onSubmit={() => startAnalysis("quick")}
                  inputRef={heroInputRef}
                  buttonLabel="Analyze My Visibility"
                  helperText="No signup required / Instant results"
                />
              </div>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button onClick={unlockPro} className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]">
                  Stop losing traffic
                </button>
                <button onClick={onSeeDemo} className="rounded-full px-5 py-3 text-sm font-bold text-slate-300 transition hover:text-white">
                  Unlock growth insights
                </button>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-cyan-400/20 via-transparent to-emerald-400/15 blur-2xl" />
              <div className="relative rounded-[36px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_100px_rgba(2,8,23,0.55)] backdrop-blur-2xl">
                <div className="flex items-center justify-between border-b border-white/8 pb-5">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">AI visibility overview</p>
                    <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">LUMIO AI analysis preview</p>
                  </div>
                  <span className="rounded-full border border-red-400/20 bg-red-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-red-200">Traffic leaking</span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <DemoMetric label="Visibility score" value="18/100" tone="text-red-300" />
                  <DemoMetric label="Lost traffic" value="2,480" tone="text-amber-200" />
                  <DemoMetric label="AI leaders" value="4" tone="text-cyan-200" />
                </div>

                <div className="mt-6 rounded-[28px] border border-white/8 bg-slate-950/45 p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">What AI recommends</p>
                      <p className="mt-2 text-lg font-bold text-white">Competitors own the highest-intent prompts</p>
                    </div>
                    <button onClick={onSeeDemo} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-black uppercase tracking-[0.16em] text-slate-300 transition hover:bg-white/[0.08]">
                      Live demo
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {[
                      { name: "Stripe", share: 72, tone: "bg-cyan-400" },
                      { name: "Adyen", share: 48, tone: "bg-blue-400" },
                      { name: "PayPal", share: 39, tone: "bg-emerald-400" },
                      { name: "Your brand", share: 18, tone: "bg-red-400" },
                    ].map((item) => (
                      <div key={item.name}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-semibold text-slate-300">{item.name}</span>
                          <span className="text-slate-500">{item.share}% of AI mentions</span>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/6">
                          <div className={`h-2 rounded-full ${item.tone}`} style={{ width: `${item.share}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-[28px] border border-amber-300/15 bg-gradient-to-r from-amber-300/10 to-transparent p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-200">7-Day Recovery Plan</p>
                      <p className="mt-2 text-lg font-bold text-white">Most valuable feature inside Pro</p>
                      <p className="mt-2 text-sm leading-7 text-slate-400">See the exact fixes, content moves, and prompt-level actions needed to recover visibility within seven days.</p>
                    </div>
                    <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Upgrade driver</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/8 bg-slate-950/25 px-6 py-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm font-semibold text-slate-300">Used by growth teams, startups, and marketers</p>
            <div className="flex flex-wrap gap-3">
              {TRUST_MARKS.map((mark) => <TrustMark key={mark} name={mark} />)}
            </div>
          </div>
        </section>

        <section id="problem" className="px-6 py-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              eyebrow="Why this matters"
              title="AI is replacing search — and you are invisible"
              body="The traffic loss does not show up as a normal SEO drop. It happens in the recommendation layer, where AI picks winners before users ever click."
            />
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {PROBLEM_CARDS.map((card) => (
                <div key={card.title} className={`rounded-[30px] border ${card.border} bg-gradient-to-br ${card.accent} p-[1px] shadow-[0_24px_80px_rgba(15,23,42,0.35)]`}>
                  <div className="h-full rounded-[29px] bg-[#0a1526] p-7">
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{card.icon}</span>
                    <h3 className="mt-6 text-2xl font-black tracking-[-0.04em] text-white">{card.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{card.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="demo" className="border-y border-white/8 bg-slate-950/20 px-6 py-24 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-center">
            <SectionIntro
              eyebrow="Live demo"
              title="See how LUMIO AI exposes the gap"
              body="The product shows the score, the lost demand, and the competitors capturing recommendation share. Then it gates the deeper analysis behind Pro."
              align="left"
            />
            <div className="rounded-[34px] border border-white/10 bg-white/[0.04] p-6 shadow-[0_30px_100px_rgba(2,8,23,0.58)] backdrop-blur-2xl">
              <div className="grid gap-4 md:grid-cols-3">
                <DemoMetric label="Visibility score" value="22/100" tone="text-red-300" />
                <DemoMetric label="Lost traffic / month" value="3,120" tone="text-amber-200" />
                <DemoMetric label="Competitors tracked" value="6" tone="text-cyan-200" />
              </div>
              <div className="mt-6 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[26px] border border-white/8 bg-slate-950/45 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Competitors listed</p>
                  <div className="mt-4 space-y-3">
                    {[
                      { name: "Stripe", score: "72%", note: "Dominates payment platform prompts" },
                      { name: "PayPal", score: "39%", note: "Wins trust and brand-association prompts" },
                      { name: "Adyen", score: "48%", note: "Strong on enterprise recommendation prompts" },
                    ].map((competitor) => (
                      <div key={competitor.name} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-white">{competitor.name}</p>
                          <span className="text-sm font-bold text-cyan-200">{competitor.score}</span>
                        </div>
                        <p className="mt-2 text-sm text-slate-400">{competitor.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-[26px] border border-white/8 bg-slate-950/45 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Premium analysis preview</p>
                  <div className="mt-4 space-y-3">
                    {[
                      "Missing commercial comparison pages",
                      "Low citation density across key answers",
                      "Weak brand positioning in AI summaries",
                      "Prompt-level visibility trend by competitor",
                    ].map((line, index) => (
                      <div key={line} className={`rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 ${index > 0 ? "blur-[3px]" : ""}`}>
                        <p className="text-sm font-semibold text-white">{line}</p>
                      </div>
                    ))}
                  </div>
                  <div className="absolute inset-x-5 bottom-5 rounded-[24px] border border-amber-300/20 bg-[#08111f]/88 p-5 text-center backdrop-blur-xl">
                    <p className="text-lg font-black text-white">Unlock full analysis</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">Get the missing prompt data, competitor patterns, and full upgrade path.</p>
                    <button onClick={unlockPro} className="mt-4 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.01]">
                      Unlock full analysis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 py-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              eyebrow="Core value"
              title="From invisible to recommended"
              body="LUMIO AI is built to turn AI visibility from a vague brand problem into a measurable, repeatable growth channel."
            />
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {VALUE_PILLARS.map((pillar) => <ValueCard key={pillar.title} {...pillar} />)}
            </div>
          </div>
        </section>

        <section id="recovery" className="border-y border-white/8 bg-slate-950/20 px-6 py-24 lg:px-10">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <div className="inline-flex rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-amber-200">
                Most valuable feature
              </div>
              <h2 className="mt-6 text-4xl font-black tracking-[-0.05em] text-white md:text-5xl">Your 7-Day Recovery Plan</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-400">
                We don’t just show the problem. We tell you exactly what to do.
              </p>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-400">
                Pro turns raw visibility data into a day-by-day execution sequence so your team knows what to ship first, what to measure, and how to recover AI demand fast.
              </p>
              <button onClick={unlockPro} className="mt-8 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 px-6 py-3.5 text-sm font-black text-slate-950 shadow-[0_20px_50px_rgba(245,158,11,0.28)] transition hover:scale-[1.01]">
                Unlock your recovery plan
              </button>
            </div>

            <div className="rounded-[34px] border border-amber-300/15 bg-white/[0.04] p-6 shadow-[0_30px_100px_rgba(2,8,23,0.58)] backdrop-blur-2xl">
              <RecoveryDay item={RECOVERY_DAYS[0]} />
              <div className="relative mt-4">
                <div className="space-y-4 blur-[4px] select-none pointer-events-none">
                  {RECOVERY_DAYS.slice(1).map((item) => <RecoveryDay key={item.day} item={item} locked />)}
                </div>
                <div className="absolute inset-0 flex items-center justify-center px-5">
                  <div className="max-w-md rounded-[30px] border border-amber-300/20 bg-[#08111f]/88 p-6 text-center shadow-[0_20px_60px_rgba(15,23,42,0.55)] backdrop-blur-2xl">
                    <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">Most valuable feature</span>
                    <p className="mt-4 text-2xl font-black tracking-[-0.04em] text-white">Unlock your recovery plan</p>
                    <p className="mt-3 text-sm leading-7 text-slate-400">Day 1 is visible. Days 2-7 are reserved for Pro, where the full growth sequence is unlocked.</p>
                    <button onClick={unlockPro} className="mt-5 rounded-full bg-gradient-to-r from-amber-300 via-orange-400 to-emerald-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:scale-[1.01]">
                      Unlock your recovery plan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="px-6 py-24 lg:px-10">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              eyebrow="Pricing"
              title="Upgrade when the visibility gap becomes too expensive"
              body="Start with a free read on your AI visibility, then move to Pro when you need competitor intelligence and a real recovery plan."
            />
            <div className="mt-8 flex flex-col items-center gap-3">
              <BillingToggle billing={billing} onChange={setBilling} />
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-300/80">
                &#9889; Early pricing ends soon &#8212; prices will increase after launch
              </p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {PRICING.map((plan) => (
                <PricingCard
                  key={plan.name}
                  plan={plan}
                  billing={billing}
                  addOn={addOn}
                  onAddOnChange={setAddOn}
                  onCheckout={setCheckoutPlan}
                  onStartFree={() => startAnalysis("quick")}
                />
              ))}
            </div>
          </div>
        </section>

        {checkoutPlan && (
          <CheckoutModal
            plan={checkoutPlan}
            billing={billing}
            addOn={addOn}
            onClose={() => setCheckoutPlan(null)}
            onConfirm={() => { setCheckoutPlan(null); unlockPro(); }}
          />
        )}

        <section className="border-y border-white/8 bg-gradient-to-r from-red-500/10 via-transparent to-amber-300/10 px-6 py-20 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-red-200/85">Urgency</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white md:text-5xl">Every day you are not visible, you lose customers.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">AI recommendation loops compound. The longer competitors own the answer, the harder they are to displace.</p>
            </div>
            <button onClick={unlockPro} className="rounded-full bg-gradient-to-r from-red-400 via-orange-400 to-amber-300 px-7 py-4 text-sm font-black text-slate-950 shadow-[0_20px_50px_rgba(248,113,113,0.28)] transition hover:scale-[1.01]">
              Start recovering now
            </button>
          </div>
        </section>

        <section className="px-6 py-24 lg:px-10 lg:py-28">
          <div className="mx-auto max-w-5xl rounded-[40px] border border-white/10 bg-white/[0.04] p-8 shadow-[0_30px_100px_rgba(2,8,23,0.58)] backdrop-blur-2xl md:p-12">
            <SectionIntro
              eyebrow="Final CTA"
              title="See how much traffic you're losing"
              body="Run one input, get the score, and decide whether the gap is big enough to keep ignoring."
            />
            <div className="mt-10 flex justify-center">
              <InputCta
                value={brandName}
                onChange={setBrandName}
                onSubmit={() => startAnalysis("quick")}
                inputRef={finalInputRef}
                buttonLabel="Analyze My Visibility"
                helperText="No signup required / Instant results"
                compact
              />
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <button onClick={unlockPro} className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15">
                Recover your visibility
              </button>
              <button onClick={onSeeDemo} className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-black text-slate-300 transition hover:bg-white/[0.06]">
                Stop losing traffic
              </button>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/8 px-6 py-8 lg:px-10">
          <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <LumioMark size={26} />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-300/80">LUMIO AI</p>
                <p className="text-sm text-slate-500">AI Visibility and Growth platform</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 text-sm text-slate-500">
              <a href="#problem" className="transition hover:text-white">Problem</a>
              <a href="#demo" className="transition hover:text-white">Live Demo</a>
              <a href="#recovery" className="transition hover:text-white">Recovery Plan</a>
              <a href="#pricing" className="transition hover:text-white">Pricing</a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
