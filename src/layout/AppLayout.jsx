import React, { useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAnalysis } from "../shared/hooks/useAnalysis";
import { useWorkspace } from "../shared/hooks/useWorkspace";
import { ActionModeToggle, HighConversionPaywall } from "../shared/components";
import { computeTrafficLossPct } from "../shared/utils/insightEngine";
import { LumioMark } from "../shared/components/LumioLogo";
import { LAUNCH_PRICING, PLAN_DETAILS, getLaunchCountdownLabel } from "../shared/utils/pricing";
import { isFakePaymentMode, isStripePaymentMode } from "../shared/config/paymentConfig";
import { redirectToStripePaymentLink, savePendingPaymentContext } from "../shared/utils/paymentFlow";

const NAV = [
  { to: "/app",              icon: "📊", label: "Dashboard",           end: true },
  { to: "/app/visibility",   icon: "🎯", label: "Visibility Score" },
  { to: "/app/prompts",      icon: "🔍", label: "Prompt Performance"  },
  { to: "/app/competitors",  icon: "⚔️", label: "Competitor Analysis" },
  { to: "/app/opportunities", icon: "💡", label: "Missing Opportunities" },
  { to: "/app/sentiment",    icon: "💬", label: "Sentiment & Position" },
  { to: "/app/actions",      icon: "🚀", label: "Recommended Actions" },
  { to: "/app/growth",       icon: "📈", label: "Growth Impact"       },
  { to: "/app/recovery",     icon: "🗓️", label: "Recovery Plan"       },
  { to: "/app/settings",     icon: "⚙️", label: "Settings"            },
  { to: "/app/team",         icon: "👥", label: "Team & Workspace", divider: true },
  { to: "/app/reports",      icon: "📋", label: "Reports"             },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const {
    brandName,
    industry,
    competitors,
    loading,
    fetchAnalysis,
    data,
    actionMode,
    setActionMode,
    hasAnalyzedOnce,
    isQuickMode,
    isPremiumModalOpen,
    setPremiumModalOpen,
    isLimitModalOpen,
    setLimitModalOpen,
    analysisCredits,
    purchaseEntryAnalysis,
    upgradeToPro,
    unlockStrategyAddon,
    isDemoMode,
  } = useAnalysis();
  const { workspace, plan } = useWorkspace();
  const navigate = useNavigate();

  const trafficLoss = useMemo(() => data ? computeTrafficLossPct(data) : 0, [data]);
  const showLossBar = isQuickMode && hasAnalyzedOnce && !loading;
  const paywallBrand = (brandName || data?.brandName || "").trim();

  const handleStarterCheckout = () => {
    if (isStripePaymentMode()) {
      savePendingPaymentContext({
        brandName: paywallBrand,
        industry,
        competitors,
        payEntry: true,
      });
      const redirected = redirectToStripePaymentLink();
      if (redirected) return;
    }

    purchaseEntryAnalysis();
    setPremiumModalOpen(false);
    fetchAnalysis({ brandName: paywallBrand || brandName, industry, competitors, forceAccess: true });
  };

  const handleProCheckout = () => {
    if (isStripePaymentMode()) {
      savePendingPaymentContext({
        brandName: paywallBrand,
        industry,
        competitors,
        payEntry: true,
        upgradePro: true,
      });
      const redirected = redirectToStripePaymentLink();
      if (redirected) return;
    }

    upgradeToPro();
    purchaseEntryAnalysis();
    setPremiumModalOpen(false);
    fetchAnalysis({ brandName: paywallBrand || brandName, industry, competitors, forceAccess: true });
  };

  const handleEnterpriseCheckout = () => {
    if (isStripePaymentMode()) {
      savePendingPaymentContext({
        brandName: paywallBrand,
        industry,
        competitors,
        payEntry: true,
        upgradePro: true,
        unlockStrategy: true,
      });
      const redirected = redirectToStripePaymentLink();
      if (redirected) return;
    }

    upgradeToPro();
    unlockStrategyAddon();
    purchaseEntryAnalysis();
    setPremiumModalOpen(false);
    fetchAnalysis({ brandName: paywallBrand || brandName, industry, competitors, forceAccess: true });
  };

  return (
    <div className="flex h-screen bg-[#0A0E1A] text-white overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={`${collapsed ? "w-[68px]" : "w-[240px]"} flex flex-col border-r border-slate-800/60 bg-[#070B14] transition-all duration-200 shrink-0`}>
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-800/40">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <LumioMark size={24} />
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                Lumio
              </span>
            </div>
          )}
          {collapsed && <LumioMark size={24} />}
          <button onClick={() => setCollapsed(!collapsed)} className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800/60 hover:text-slate-300 transition-colors">
            {collapsed ? "→" : "←"}
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {NAV.map((item) => (
            <React.Fragment key={item.to}>
              {item.divider && (
                <div className={`my-2 border-t border-slate-800/40 ${collapsed ? "mx-2" : "mx-3"}`} />
              )}
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-cyan-600/10 text-white border border-blue-500/20 shadow-lg shadow-blue-500/5"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
                  }`
                }
              >
                <span className="text-base shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            </React.Fragment>
          ))}
        </nav>

        {/* Bottom: workspace + brand */}
        {!collapsed && workspace && (
          <div className="border-t border-slate-800/40 px-4 py-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Workspace</p>
            <p className="mt-0.5 text-xs font-semibold text-white truncate">{workspace.name}</p>
            <span className="inline-block mt-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-[9px] font-bold text-cyan-400 uppercase">{plan}</span>
          </div>
        )}
        {!collapsed && data?.brandName && (
          <div className="border-t border-slate-800/40 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Analyzing</p>
            <p className="mt-0.5 text-sm font-semibold text-white truncate">{data.brandName}</p>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between border-b border-slate-800/40 bg-[#0A0E1A]/80 px-6 py-3 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-bold text-slate-300">
              {brandName ? `${brandName} — Lumio` : "Lumio"}
            </h1>
            {loading && <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
            {hasAnalyzedOnce && <ActionModeToggle actionMode={actionMode} setActionMode={setActionMode} />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isQuickMode && analysisCredits <= 0) {
                  setLimitModalOpen(true);
                  return;
                }
                fetchAnalysis();
              }}
              disabled={loading || !brandName}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-40"
            >
              {loading ? "Analyzing…" : isQuickMode ? "Run Another Analysis (Starter $59/mo)" : "Re-analyze"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              ← Home
            </button>
          </div>
        </header>

        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="shrink-0 border-b border-violet-500/20 bg-gradient-to-r from-violet-950/70 via-indigo-950/60 to-violet-950/70 px-6 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-violet-400/30 bg-violet-400/15 text-xs font-black text-violet-200">
                  ▶
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-[0.28em] text-violet-300/80">Demo Mode</span>
                    <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] text-amber-200">
                      ⏱ {getLaunchCountdownLabel()} · Price increases after launch
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-300 truncate">
                    Viewing <span className="text-violet-200">Lumora AI</span> (sample) — analyze your own brand to unlock your real gaps and 7-day recovery plan.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate("/")}
                className="shrink-0 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-1.5 text-xs font-black text-white shadow-[0_8px_24px_rgba(139,92,246,0.25)] transition hover:shadow-[0_12px_32px_rgba(139,92,246,0.35)] hover:scale-[1.02] whitespace-nowrap"
              >
                Analyze my brand →
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto px-8 py-8 ${showLossBar ? "pb-20" : ""}`}>
          <Outlet />
        </main>
      </div>

      {/* ── Bottom Loss Conversion Bar ── */}
      {showLossBar && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-red-500/30 bg-gradient-to-r from-[#1a0a0a] via-[#1a0f0a] to-[#1a0a0a] backdrop-blur-xl px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/25 shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                You are losing traffic every day you are not visible in AI search.
              </p>
              <p className="text-[11px] text-slate-400">
                Your competitors are already taking these positions — {trafficLoss}% of AI queries skip {brandName}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPremiumModalOpen(true)}
            className="shrink-0 rounded-xl bg-gradient-to-r from-red-600 to-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:shadow-red-500/40 hover:scale-[1.02] transition-all"
          >
            Recover {brandName}'s Traffic →
          </button>
        </div>
      )}

      {/* ── Entry Payment Modal ── */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0A0E1A]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0F1420] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <button onClick={() => setLimitModalOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-white/[0.05] hover:text-white transition-colors">✕</button>
            </div>
            <h4 className="text-xl font-bold text-white">Run Full AI Visibility Analysis</h4>
            <p className="mt-2 text-sm text-slate-400">This analysis uses real AI models across multiple prompts and regions.</p>
            {isFakePaymentMode() ? (
              <p className="mt-2 inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                Test mode enabled
              </p>
            ) : null}
            <p className="mt-3 text-xs font-medium text-cyan-300">Starter launch price: <span className="line-through text-slate-500">$99</span> → $59/month</p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-amber-200">{LAUNCH_PRICING.availability}</p>
            <p className="mt-1 text-xs font-bold text-white">{LAUNCH_PRICING.lockInCopy}</p>
            <button
              onClick={() => {
                if (isStripePaymentMode()) {
                  savePendingPaymentContext({
                    brandName,
                    industry,
                    competitors,
                    payEntry: true,
                  });
                  const redirected = redirectToStripePaymentLink();
                  if (!redirected) {
                    purchaseEntryAnalysis();
                    setLimitModalOpen(false);
                    fetchAnalysis({ forceAccess: true });
                    return;
                  }
                  return;
                }
                purchaseEntryAnalysis();
                setLimitModalOpen(false);
                fetchAnalysis({ forceAccess: true });
              }}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
            >
              Lock Starter at $59/mo &#8594; Continue
            </button>
            <button
              onClick={() => { setLimitModalOpen(false); setPremiumModalOpen(true); }}
              className="mt-3 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.06]"
            >
              Upgrade to Pro — ${PLAN_DETAILS.pro.originalPrice} → ${PLAN_DETAILS.pro.launchPrice}{PLAN_DETAILS.pro.cadence}
            </button>
            <button onClick={() => setLimitModalOpen(false)} className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors">Not now</button>
          </div>
        </div>
      )}

      {isPremiumModalOpen && (
        <HighConversionPaywall
          brandName={paywallBrand}
          onClose={() => setPremiumModalOpen(false)}
          onStarter={handleStarterCheckout}
          onPro={handleProCheckout}
          onEnterprise={handleEnterpriseCheckout}
        />
      )}

      {/* ── Premium Loading Overlay ── */}
      {loading && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-[#07111f]/72 backdrop-blur-md p-6">
          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#0F1420]/95 p-7 shadow-2xl">
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-cyan-300/80">AI Visibility Intelligence</p>
            <h4 className="mt-3 text-2xl font-bold text-white">Analyzing {brandName || "your brand"}</h4>
            <div className="mt-6 space-y-3">
              {[
                "Scanning AI prompts",
                "Detecting competitors",
                "Analyzing visibility across regions",
                "Generating insights",
              ].map((step, index) => (
                <div key={step} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-cyan-400/30 bg-cyan-400/10 text-[11px] font-black text-cyan-200">{index + 1}</span>
                  <p className="text-sm text-slate-200">{step}</p>
                  <span className="ml-auto h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
