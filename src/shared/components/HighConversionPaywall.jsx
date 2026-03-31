import React from "react";
import { GlassCard } from "./index";
import {
  LAUNCH_PRICING,
  PLAN_DETAILS,
  PRICING_PLAN_ORDER,
  getLaunchCountdownLabel,
} from "../utils/pricing";

function formatBrand(brandName) {
  const value = String(brandName || "").trim();
  return value || "your brand";
}

export default function HighConversionPaywall({
  brandName,
  reportEmail,
  onReportEmailChange,
  preview = { visibilityStart: 0, visibilityEnd: 58, missingQueries: 12, competitorsDetected: 3 },
  onClose,
  onStarter,
  onPro,
  onEnterprise,
}) {
  const formattedBrand = formatBrand(brandName);
  const countdownLabel = getLaunchCountdownLabel();

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#07111f]/84 backdrop-blur-md p-4">
      <div className="w-full max-w-6xl rounded-[32px] border border-white/10 bg-[#0F1420]/96 shadow-[0_40px_140px_rgba(2,8,23,0.68)]">
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.9fr]">
          <div className="border-b border-white/8 p-7 lg:border-b-0 lg:border-r">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-cyan-200">
                    AI Growth Decision Engine
                  </span>
                  <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.22em] text-amber-200">
                    {LAUNCH_PRICING.badge}
                  </span>
                </div>
                <h3 className="mt-4 text-3xl font-black tracking-[-0.04em] text-white">
                  Get your AI visibility report for {formattedBrand}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-300">
                  Your competitors may already be gaining visibility while you're not. Unlock the exact report that shows where you are missing, why competitors win, and exactly what to do next.
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-white/[0.05] hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">Takes 30 seconds</span>
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1">No setup required</span>
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-amber-200">Lock $59/mo before price increases to $99</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "where you are missing",
                "why competitors win",
                "exactly what to do next",
              ].map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">✔ {item}</p>
                </div>
              ))}
            </div>

            <GlassCard className="mt-6 border border-violet-500/20 p-5" glow="bg-violet-500">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-violet-200">Result Preview</p>
                  <p className="mt-1 text-lg font-black text-white">See the outcome before you unlock</p>
                </div>
                <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-200">
                  Simulated for {formattedBrand}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/6 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Visibility</p>
                  <p className="mt-2 text-2xl font-black text-cyan-300">{preview.visibilityStart} → {preview.visibilityEnd}</p>
                </div>
                <div className="rounded-2xl border border-red-500/20 bg-red-500/6 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Missing queries</p>
                  <p className="mt-2 text-2xl font-black text-red-300">{preview.missingQueries}</p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/6 p-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">Competitors detected</p>
                  <p className="mt-2 text-2xl font-black text-amber-300">{preview.competitorsDetected}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="p-7">
            <div className="rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/8 via-cyan-500/5 to-transparent p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-300">Primary unlock</p>
                  <p className="mt-2 text-xl font-black text-white">Get my AI visibility report</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {formattedBrand} gets the full AI visibility report immediately after checkout. {countdownLabel}. Early users lock this price forever.
                  </p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">
                  Best first step
                </span>
              </div>
              <button
                onClick={onStarter}
                className="mt-5 w-full rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-5 py-3.5 text-sm font-black text-white shadow-[0_18px_45px_rgba(14,165,233,0.22)] transition hover:shadow-[0_20px_60px_rgba(14,165,233,0.32)]"
              >
                Get my AI visibility report
              </button>
              <p className="mt-3 text-center text-[11px] font-bold text-slate-300">
                Takes 30 seconds • No setup required • Cancel anytime
              </p>
              <div className="mt-4">
                <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                  Email for report delivery
                </label>
                <input
                  type="email"
                  value={reportEmail}
                  onChange={(event) => onReportEmailChange?.(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/35"
                />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">Pricing</p>
              <div className="mt-3 space-y-3">
                {PRICING_PLAN_ORDER.map((planId) => {
                  const plan = PLAN_DETAILS[planId];
                  const isStarter = planId === "starter";
                  const isPro = planId === "pro";
                  return (
                    <div key={planId} className={`rounded-2xl border p-4 ${isStarter ? "border-cyan-500/25 bg-cyan-500/6" : isPro ? "border-violet-500/20 bg-violet-500/6" : "border-amber-500/20 bg-amber-500/6"}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-black text-white">{plan.name}</p>
                            {plan.badge ? (
                              <span className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.16em] text-violet-200">
                                {plan.badge}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-slate-400">{plan.premiumFeature}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-500 line-through">${plan.originalPrice}{plan.cadence}</p>
                          <p className="text-lg font-black text-white">${plan.launchPrice}{plan.cadence}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                onClick={onPro}
                className="rounded-2xl border border-violet-400/20 bg-violet-400/8 px-4 py-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/14"
              >
                Upgrade to Pro ($199 → $149)
              </button>
              <button
                onClick={onEnterprise}
                className="rounded-2xl border border-amber-400/20 bg-amber-400/8 px-4 py-3 text-sm font-black text-amber-100 transition hover:bg-amber-400/14"
              >
                Choose Enterprise ($499 → $399)
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">🚀 Launch pricing – limited time</p>
              <p className="mt-2 text-sm text-slate-300">Early users lock this price forever.</p>
              <p className="mt-1 text-xs text-slate-400">Used by 100+ brands to improve AI visibility.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}