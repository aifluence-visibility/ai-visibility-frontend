import React, { useState } from "react";
import { useAnalysis } from "../../shared/hooks/useAnalysis";
import { GlassCard, SectionHeader } from "../../shared/components";

export default function SettingsPage() {
  const { brandName, industry, country, mode, setBrandName, setIndustry, setCountry, setMode, fetchAnalysis, loading } = useAnalysis();
  const [localBrand, setLocalBrand] = useState(brandName);
  const [localIndustry, setLocalIndustry] = useState(industry);
  const [localCountry, setLocalCountry] = useState(country);
  const [localMode, setLocalMode] = useState(mode);

  const handleSave = () => {
    setBrandName(localBrand);
    setIndustry(localIndustry);
    setCountry(localCountry);
    setMode(localMode);
    fetchAnalysis({ brandName: localBrand, industry: localIndustry, country: localCountry, mode: localMode });
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-black text-white">Settings</h2>
        <p className="text-sm text-slate-400 mt-1">Configure your analysis parameters</p>
      </div>

      <GlassCard className="p-6" glow="bg-indigo-500">
        <SectionHeader icon="🔧" title="Analysis Configuration" subtitle="Update your brand details and re-run analysis" />
        <div className="mt-6 space-y-5">
          {/* Brand Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Brand Name</label>
            <input
              type="text"
              value={localBrand}
              onChange={(e) => setLocalBrand(e.target.value)}
              placeholder="e.g. Stripe, Notion, Airtable"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Industry</label>
            <input
              type="text"
              value={localIndustry}
              onChange={(e) => setLocalIndustry(e.target.value)}
              placeholder="e.g. Payment Processing, Project Management"
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/80 px-4 py-3 text-sm text-white placeholder-slate-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Target Country</label>
            <select
              value={localCountry}
              onChange={(e) => setLocalCountry(e.target.value)}
              className="w-full rounded-xl border border-slate-700/50 bg-slate-900/80 px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
            >
              <option value="Global">Global</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Germany">Germany</option>
              <option value="France">France</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
              <option value="India">India</option>
              <option value="Japan">Japan</option>
              <option value="Brazil">Brazil</option>
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Analysis Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLocalMode("quick")}
                className={`rounded-xl border p-4 text-left transition-all ${localMode === "quick" ? "border-blue-500/50 bg-blue-500/10" : "border-slate-700/50 bg-slate-900/50 hover:border-slate-600/50"}`}
              >
                <p className="text-sm font-bold text-white">⚡ Quick</p>
                <p className="text-[11px] text-slate-400 mt-1">Fast analysis with core metrics. Free tier.</p>
              </button>
              <button
                onClick={() => setLocalMode("full")}
                className={`rounded-xl border p-4 text-left transition-all ${localMode === "full" ? "border-emerald-500/50 bg-emerald-500/10" : "border-slate-700/50 bg-slate-900/50 hover:border-slate-600/50"}`}
              >
                <p className="text-sm font-bold text-white">🔬 Full</p>
                <p className="text-[11px] text-slate-400 mt-1">Deep analysis with all insights. Premium.</p>
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSave}
            disabled={loading || !localBrand.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-40"
          >
            {loading ? "Analyzing…" : "Save & Re-analyze"}
          </button>
        </div>
      </GlassCard>

      {/* About */}
      <GlassCard className="p-6">
        <SectionHeader icon="ℹ️" title="About Lumio" />
        <div className="mt-3 space-y-2 text-xs text-slate-400">
          <p>Lumio measures how visible your brand is in AI-generated recommendations from ChatGPT, Perplexity, Claude, and other AI systems.</p>
          <p>We analyze real AI responses to queries in your market and measure mentions, positioning, competitor pressure, and source authority.</p>
          <p className="text-slate-500 mt-4">Version 2.0 • Built with ❤️ for growth teams</p>
        </div>
      </GlassCard>
    </div>
  );
}
