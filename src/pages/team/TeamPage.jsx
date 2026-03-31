import React, { useState } from "react";
import { GlassCard, SectionHeader } from "../../shared/components";
import { useWorkspace } from "../../shared/hooks/useWorkspace";
import { PRICING_PLANS } from "../../shared/utils/pricing";

const ROLES = ["owner", "manager", "analyst", "content"];
const ROLE_BADGES = {
  owner:   { bg: "bg-amber-500/15 border-amber-500/30 text-amber-400", label: "Owner" },
  manager: { bg: "bg-blue-500/15 border-blue-500/30 text-blue-400", label: "Manager" },
  analyst: { bg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-400", label: "Analyst" },
  content: { bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-400", label: "Content" },
};

const ROLE_PERMS = {
  owner:   "Full access — billing, team, all features",
  manager: "Portfolio, strategy, reports, all analysis",
  analyst: "Analysis, strategy, tracking — read only",
  content: "Analysis, content creation",
};

const PLAN_LIMITS = { pro: 5, enterprise: 50 };

export default function TeamPage() {
  const { workspace, plan, members, loading, error, createWorkspace, addMember, updateMemberRole, removeMember, updatePlan, leaveWorkspace } = useWorkspace();
  const [setupName, setSetupName] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("analyst");
  const [editingEmail, setEditingEmail] = useState(null);

  // ── No workspace yet: Setup form ──
  if (!workspace) {
    return (
      <div className="max-w-lg mx-auto mt-16">
        <GlassCard className="p-8" glow="bg-blue-500">
          <SectionHeader icon="🏢" title="Create Your Workspace" subtitle="Set up your team to collaborate on Lumio" />
          <div className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Workspace Name</label>
              <input
                value={setupName} onChange={e => setSetupName(e.target.value)}
                placeholder="e.g. Acme Marketing"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1 block">Your Email</label>
              <input
                value={setupEmail} onChange={e => setSetupEmail(e.target.value)}
                placeholder="you@company.com" type="email"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              onClick={() => setupName.trim() && setupEmail.trim() && createWorkspace(setupName.trim(), setupEmail.trim())}
              disabled={loading || !setupName.trim() || !setupEmail.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3 text-sm font-bold text-white shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-40"
            >
              {loading ? "Creating…" : "Create Workspace"}
            </button>
          </div>
        </GlassCard>
      </div>
    );
  }

  const maxMembers = PLAN_LIMITS[plan] || 5;
  const canAddMore = members.length < maxMembers;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">{workspace.name}</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {members.length}/{maxMembers} members •{" "}
            <span className="font-semibold text-cyan-400 capitalize">{plan}</span> plan
          </p>
        </div>
        <button onClick={leaveWorkspace} className="rounded-lg border border-slate-700/50 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:border-red-500/30 transition-colors">
          Leave Workspace
        </button>
      </div>

      {/* ── Plan Selector ── */}
      <GlassCard className="p-6">
        <SectionHeader icon="💎" title="Plan" subtitle="Choose the right plan for your team" />
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          {PRICING_PLANS.map(p => (
            <button
              key={p.id}
              onClick={() => updatePlan(p.id)}
              disabled={loading}
              className={`rounded-xl border p-5 text-left transition-all ${
                plan === p.id
                  ? p.id === "pro"
                    ? "border-amber-400/50 bg-amber-400/10 ring-1 ring-amber-400/30 shadow-lg shadow-amber-500/10"
                    : "border-cyan-500/50 bg-cyan-500/10 ring-1 ring-cyan-500/20"
                  : p.id === "pro"
                    ? "border-amber-400/20 bg-gradient-to-b from-amber-400/[0.08] to-slate-900/40 hover:border-amber-400/40"
                    : "border-slate-700/50 bg-slate-900/40 hover:border-slate-600/50"
              }`}
            >
              {p.badge ? <div className="mb-3 inline-flex rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-amber-200">{p.badge}</div> : null}
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white">{p.name}</span>
                <span className={`text-xs font-bold ${p.id === "pro" ? "text-amber-200" : "text-cyan-400"}`}>{p.price}{p.cadence}</span>
              </div>
              {p.premiumFeature ? (
                <div className="mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Premium feature</p>
                  <p className="mt-1 text-xs font-bold text-white">{p.premiumFeature}</p>
                </div>
              ) : null}
              <ul className="mt-2 space-y-1">
                {p.features.map(f => (
                  <li key={f} className="text-xs text-slate-400">✓ {f}</li>
                ))}
              </ul>
              {plan === p.id && <div className="mt-2 text-[10px] font-bold uppercase tracking-widest text-cyan-400">Current Plan</div>}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* ── Members ── */}
      <GlassCard className="p-6">
        <SectionHeader icon="👥" title="Team Members" subtitle="Manage roles and access for your team" />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <div className="mt-4 space-y-2">
          {members.map((m, i) => (
            <div key={m.email} className="flex items-center justify-between rounded-xl border border-slate-700/30 bg-slate-900/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600/20 to-cyan-600/20 text-sm font-bold text-white">
                  {m.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{m.email}</p>
                  <p className="text-[10px] text-slate-500">{ROLE_PERMS[m.role]}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {editingEmail === m.email ? (
                  <select
                    value={m.role}
                    onChange={e => { updateMemberRole(m.email, e.target.value); setEditingEmail(null); }}
                    className="rounded-lg border border-slate-700/50 bg-slate-900 px-2 py-1 text-xs text-white"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_BADGES[r].label}</option>)}
                  </select>
                ) : (
                  <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${ROLE_BADGES[m.role].bg}`}>
                    {ROLE_BADGES[m.role].label}
                  </span>
                )}
                {i > 0 && (
                  <>
                    <button onClick={() => setEditingEmail(editingEmail === m.email ? null : m.email)} className="text-xs text-slate-500 hover:text-blue-400 transition-colors">✏️</button>
                    <button onClick={() => removeMember(m.email)} className="text-xs text-slate-500 hover:text-red-400 transition-colors">✕</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add member form */}
        {canAddMore ? (
          <div className="mt-4 flex gap-2">
            <input
              value={newEmail} onChange={e => setNewEmail(e.target.value)}
              placeholder="team@company.com" type="email"
              className="flex-1 rounded-xl border border-slate-700/50 bg-slate-900/60 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500/50 focus:outline-none"
            />
            <select
              value={newRole} onChange={e => setNewRole(e.target.value)}
              className="rounded-xl border border-slate-700/50 bg-slate-900/60 px-3 py-2.5 text-sm text-white"
            >
              {ROLES.filter(r => r !== "owner").map(r => <option key={r} value={r}>{ROLE_BADGES[r].label}</option>)}
            </select>
            <button
              onClick={() => { if (newEmail.trim()) { addMember(newEmail.trim(), newRole); setNewEmail(""); } }}
              disabled={loading || !newEmail.trim()}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-40"
            >
              {loading ? "…" : "Add"}
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
            <p className="text-xs text-amber-300 font-semibold">
              {plan === "pro" ? "Upgrade to Enterprise for up to 50 members" : "Maximum members reached"}
            </p>
          </div>
        )}
      </GlassCard>

      {/* ── Role Permissions Reference ── */}
      <GlassCard className="p-6">
        <SectionHeader icon="🛡️" title="Role Permissions" subtitle="What each role can access" />
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700/40">
                <th className="text-left py-2 text-slate-500 font-bold">Permission</th>
                {ROLES.map(r => <th key={r} className="text-center py-2 text-slate-500 font-bold">{ROLE_BADGES[r].label}</th>)}
              </tr>
            </thead>
            <tbody className="text-slate-300">
              {[
                { name: "View Dashboard", perms: [true, true, true, true] },
                { name: "Run Analysis", perms: [true, true, true, true] },
                { name: "Strategy & Insights", perms: [true, true, true, false] },
                { name: "Content Creation", perms: [true, true, false, true] },
                { name: "Performance Tracking", perms: [true, true, true, false] },
                { name: "Portfolio Management", perms: [true, true, false, false] },
                { name: "Team Management", perms: [true, false, false, false] },
                { name: "Billing & Plans", perms: [true, false, false, false] },
                { name: "Reports", perms: [true, true, false, false] },
              ].map(row => (
                <tr key={row.name} className="border-b border-slate-800/30">
                  <td className="py-2 text-slate-400">{row.name}</td>
                  {row.perms.map((p, i) => (
                    <td key={i} className="text-center py-2">
                      {p ? <span className="text-emerald-400">✓</span> : <span className="text-slate-600">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
