import React, { useState, useMemo } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAnalysis } from "../shared/hooks/useAnalysis";
import { useWorkspace } from "../shared/hooks/useWorkspace";
import { ActionModeToggle } from "../shared/components";
import { computeTrafficLossPct, getShockMetrics } from "../shared/utils/insightEngine";
import { LumioMark } from "../shared/components/LumioLogo";

const NAV = [
  { to: "/app",              icon: "📊", label: "Dashboard",           end: true },
  { to: "/app/visibility",   icon: "🎯", label: "Visibility Score" },
  { to: "/app/prompts",      icon: "🔍", label: "Prompt Performance"  },
  { to: "/app/competitors",  icon: "⚔️", label: "Competitor Analysis" },
  { to: "/app/opportunities", icon: "💡", label: "Missing Opportunities" },
  { to: "/app/sentiment",    icon: "💬", label: "Sentiment & Position" },
  { to: "/app/actions",      icon: "🚀", label: "Recommended Actions" },
  { to: "/app/growth",       icon: "📈", label: "Growth Impact"       },
  { to: "/app/settings",     icon: "⚙️", label: "Settings"            },
  { to: "/app/team",         icon: "👥", label: "Team & Workspace", divider: true },
  { to: "/app/reports",      icon: "📋", label: "Reports"             },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { brandName, loading, fetchAnalysis, data, actionMode, setActionMode, hasAnalyzedOnce, isQuickMode, setPremiumModalOpen, isLimitModalOpen, setLimitModalOpen, usageCount, usageLimit } = useAnalysis();
  const { workspace, plan } = useWorkspace();
  const navigate = useNavigate();

  const trafficLoss = useMemo(() => data ? computeTrafficLossPct(data) : 0, [data]);
  const shock = useMemo(() => data ? getShockMetrics(data) : { estimatedLostTraffic: 0, estimatedMonthlyLoss: 0 }, [data]);
  const dailyLostTraffic = useMemo(() => Math.round(shock.estimatedLostTraffic / 30), [shock]);
  const dailyLostRevenue = useMemo(() => Math.round(shock.estimatedMonthlyLoss / 30), [shock]);
  const showLossBar = isQuickMode && hasAnalyzedOnce && !loading;

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
              onClick={() => fetchAnalysis()}
              disabled={loading || !brandName}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-40"
            >
              {loading ? "Analyzing…" : "Re-analyze"}
            </button>
            <button
              onClick={() => navigate("/")}
              className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
            >
              ← Home
            </button>
          </div>
        </header>

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

      {/* ── Usage Limit Modal ── */}
      {isLimitModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0A0E1A]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0F1420] p-6 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
                <svg className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <button onClick={() => setLimitModalOpen(false)} className="rounded-lg p-1 text-slate-500 hover:bg-white/[0.05] hover:text-white transition-colors">✕</button>
            </div>
            <h4 className="text-xl font-bold text-white">Your monthly analysis limit has been reached.</h4>
            <p className="mt-2 text-sm text-slate-400">You've used {usageCount} of {usageLimit} analyses this month. Upgrade to Pro for 50 analyses/month and full access to all features.</p>
            <p className="mt-3 text-xs text-red-400 font-medium">You are losing traffic every day you are not visible in AI search.</p>
            <button
              onClick={() => { setLimitModalOpen(false); setPremiumModalOpen(true); }}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
            >
              Upgrade to Pro — $49/mo
            </button>
            <button onClick={() => setLimitModalOpen(false)} className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors">Not now</button>
          </div>
        </div>
      )}
    </div>
  );
}
