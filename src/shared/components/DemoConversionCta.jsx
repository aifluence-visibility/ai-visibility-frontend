import React, { useState } from "react";
import { useAnalysis } from "../hooks/useAnalysis";
import { getLaunchCountdownLabel } from "../utils/pricing";

export default function DemoConversionCta({
  title = "Want this for your brand?",
  subtitle = "You are viewing a sample report.",
  className = "",
}) {
  const { brandName, setBrandName, setPremiumModalOpen } = useAnalysis();
  const [inputBrand, setInputBrand] = useState(brandName || "");
  const countdownLabel = getLaunchCountdownLabel();

  const handleSubmit = (event) => {
    event.preventDefault();
    const nextBrand = inputBrand.trim();
    if (!nextBrand) return;
    setBrandName(nextBrand);
    setPremiumModalOpen(true);
  };

  return (
    <div className={`rounded-[28px] border border-violet-500/30 bg-gradient-to-r from-violet-950/70 via-slate-950 to-indigo-950/60 p-6 shadow-[0_18px_50px_rgba(76,29,149,0.18)] ${className}`}>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-rose-200">
              Sample report
            </span>
            <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-amber-200">
              Lock $59/mo before price increases to $99
            </span>
            <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-cyan-200">
              {countdownLabel}
            </span>
          </div>
          <h3 className="text-xl font-black text-white">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
          <p className="mt-2 text-sm font-semibold text-amber-200">Your competitors may already be gaining visibility while you're not.</p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Takes 30 seconds</span>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">No setup required</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-md shrink-0">
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-violet-200">
            Enter your brand
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={inputBrand}
              onChange={(event) => setInputBrand(event.target.value)}
              placeholder="Acme AI"
              className="h-12 flex-1 rounded-2xl border border-violet-400/20 bg-slate-950/80 px-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-violet-400/45"
            />
            <button
              type="submit"
              className="h-12 rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 px-5 text-sm font-black text-white shadow-[0_16px_45px_rgba(139,92,246,0.3)] transition hover:scale-[1.01] hover:shadow-[0_20px_60px_rgba(139,92,246,0.4)]"
            >
              {inputBrand.trim() ? `Get report for ${inputBrand.trim()} →` : "Unlock your visibility report →"}
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {inputBrand.trim() ? `${inputBrand.trim()} can have this exact flow personalized in one step.` : "Type your brand name and we’ll personalize the upgrade flow instantly."}
          </p>
        </form>
      </div>
    </div>
  );
}