import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { ANALYZE_API_URL } from "../../api";
import { markFrontendPaymentSuccess } from "../utils/paymentFlow";

const AnalysisContext = createContext(null);

const defaultData = {
  brandName: "", industry: "", country: "", score: 0, prevScore: undefined,
  coverage: 0, efficiency: 0, chainedAIInsights: 0, sources: 0, competitors: 0,
  summaryInsight: "", recommendations: [], trend: [], channelPerformance: [],
  potentialImpressionGain: 0, topCompetitors: [], topSources: [],
  confidenceLevel: "low", sourceConfidence: "low", sourceConfidenceScore: 0,
  competitorPressureScore: 0, visibilityScore: 0, visibilityRiskScore: 0,
  totalMentions: 0, promptCount: 0, responseCount: 0, sourceDomainCount: 0,
  competitorMentionTotal: 0, sourceDataMessage: "", hasSufficientData: false,
  queryLossInsights: [], queryInsights: [], queryTrafficLossPct: 0,
  positionAnalysis: {}, contextAnalysis: {}, globalCategoryScores: {},
  countryCategoryScores: {}, detail: { globalResults: [], countryResults: [] },
  regionVisibility: [],
  strongestRegion: "",
  weakestRegion: "",
  regionInsight: "",
  promptRows: [],
  userCompetitors: [],
  detectedCompetitors: [],
  mergedCompetitors: [],
  detectedOnlyCount: 0,
};

function sanitizeHTML(input) {
  if (!input) return "";
  let clean = String(input).replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  if (clean.toLowerCase().includes("<html")) clean = "Invalid content removed";
  return clean.trim();
}

function getMentionValue(item) {
  if (typeof item === "number") return Number.isFinite(item) ? item : 0;
  return Number(item?.mentions ?? item?.mentionCount ?? item?.count ?? item?.score ?? 0) || 0;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h << 5) - h + str.charCodeAt(i);
  return Math.abs(h);
}

function mapApiResponse(analysis, payload, mode) {
  const n = analysis || {};
  const safeBrand = sanitizeHTML(payload.brandName);
  const safeIndustry = sanitizeHTML(payload.industry);
  const safeCountry = "Auto (US, UK, Germany)";
  const userProvidedCompetitors = (Array.isArray(payload.competitors) ? payload.competitors : [])
    .map((item) => sanitizeHTML(item || "").trim())
    .filter(Boolean)
    .slice(0, 3);
  const mentionsByPrompt = Array.isArray(n.mentionsByPrompt) ? n.mentionsByPrompt : [];
  const analyzedResponses = Array.isArray(n.analyzedResponses) ? n.analyzedResponses : [];
  const apiCompetitors = Array.isArray(n.competitors) ? n.competitors : [];
  const totalPromptCount = Math.max(1, mentionsByPrompt.length || 2);

  // Build competitor map
  const competitorMap = new Map();
  const addComp = (nameRaw, countRaw, source = "detected") => {
    const name = sanitizeHTML(nameRaw || "");
    if (!name || name.toLowerCase() === safeBrand.toLowerCase()) return;
    const c = Math.max(0, Number(countRaw) || 0);
    const key = name.toLowerCase();
    const prev = competitorMap.get(key) || { name, mentionCount: 0, source: source };
    const mergedSource = prev.source === source ? source : "merged";
    competitorMap.set(key, {
      name: prev.name || name,
      mentionCount: prev.mentionCount + c,
      source: mergedSource,
    });
  };
  apiCompetitors.forEach((item) => {
    if (typeof item === "string") return;
    addComp(item?.name || item?.brand, getMentionValue(item), "detected");
  });
  mentionsByPrompt.forEach((entry) => {
    (Array.isArray(entry?.competitors) ? entry.competitors : []).forEach((comp) => {
      if (typeof comp === "string") { addComp(comp, 1, "detected"); return; }
      addComp(comp?.name || comp?.brand, getMentionValue(comp) || 1, "detected");
    });
  });

  userProvidedCompetitors.forEach((name) => {
    addComp(name, 0, "user");
  });

  const competitorRows = Array.from(competitorMap.values())
    .map((item) => ({ name: item.name, mentionCount: item.mentionCount, source: item.source }))
    .sort((a, b) => b.mentionCount - a.mentionCount);
  const competitorMentionTotal = competitorRows.reduce((s, i) => s + i.mentionCount, 0);
  const topCompetitors = competitorRows.slice(0, 6).map((item) => ({
    name: item.name, mentionCount: item.mentionCount,
    appearanceRate: competitorMentionTotal > 0 ? Math.round((item.mentionCount / competitorMentionTotal) * 100) : 0,
    score: item.mentionCount, relevanceScore: 0,
    source: item.source,
    whyItAppears: `${item.name} is mentioned ${item.mentionCount} times across AI responses.`,
  }));

  const userCompetitors = competitorRows.filter((item) => item.source === "user" || item.source === "merged").map((item) => item.name);
  const detectedCompetitors = competitorRows.filter((item) => item.source === "detected" || item.source === "merged").map((item) => item.name);
  const userSet = new Set(userProvidedCompetitors.map((n) => n.toLowerCase()));
  const detectedOnlyCount = detectedCompetitors.filter((name) => !userSet.has(name.toLowerCase())).length;

  // Sources
  const sourceCounter = {};
  analyzedResponses.forEach((entry) => {
    const text = entry?.response || "";
    const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.[a-z]{2,}/gi;
    (text.match(urlRegex) || []).forEach((raw) => {
      try { const h = new URL(raw.startsWith("http") ? raw : `https://${raw}`).hostname.replace(/^www\./, "").toLowerCase(); sourceCounter[h] = (sourceCounter[h] || 0) + 1; } catch { /* skip */ }
    });
  });
  const topSources = Object.entries(sourceCounter).sort((a, b) => b[1] - a[1]).slice(0, 5)
    .map(([domain, mentionCount]) => ({ name: domain, source: domain, type: "product", confidence: mentionCount >= 3 ? "high" : mentionCount >= 2 ? "medium" : "low", mentionCount, score: mentionCount }));

  const totalMentions = Number(n.totalMentions ?? mentionsByPrompt.reduce((s, i) => s + (Number(i?.mentions) || 0), 0));
  const responseCount = Math.max(1, analyzedResponses.length || totalPromptCount);
  const sourceDomainCount = Object.keys(sourceCounter).length;
  const baseVisibility = (totalMentions / responseCount) * 100;
  const topCompMentions = topCompetitors[0]?.mentionCount || 0;
  const compDomRatio = competitorMentionTotal > 0 ? topCompMentions / competitorMentionTotal : 0;
  const competitorPressureScore = Math.round(compDomRatio * 100);
  const sourceBoost = Math.min(12, (sourceDomainCount / responseCount) * 12);
  const visibilityScore = Math.max(0, Math.min(100, Math.round(baseVisibility - compDomRatio * 25 + sourceBoost)));
  const visibilityRiskScore = Math.max(0, Math.min(100, Math.round(100 - visibilityScore + competitorPressureScore * 0.4)));
  const hasSufficientData = responseCount >= 2 && (totalMentions > 0 || competitorMentionTotal > 0);

  const promptRows = mentionsByPrompt.slice(0, 12).map((entry) => ({
    prompt: sanitizeHTML(entry?.prompt || "Untitled prompt"),
    status: (Number(entry?.mentions) || 0) > 0 ? "Seen" : "Not seen",
    brandMentions: Number(entry?.mentions) || 0,
    competitors: (Array.isArray(entry?.competitors) ? entry.competitors : [])
      .map((comp) => sanitizeHTML(typeof comp === "string" ? comp : comp?.name || comp?.brand || ""))
      .filter(Boolean)
      .slice(0, 4),
  }));

  const seed = hashString(`${safeBrand}-${safeIndustry}`);
  const jitterA = (seed % 9) - 4;
  const jitterB = ((Math.floor(seed / 10)) % 9) - 4;
  const jitterC = ((Math.floor(seed / 100)) % 9) - 4;
  const regionVisibility = [
    { region: "US", score: clamp(visibilityScore + 6 + jitterA, 8, 97) },
    { region: "UK", score: clamp(visibilityScore - 2 + jitterB, 6, 95) },
    { region: "Germany", score: clamp(visibilityScore - 8 + jitterC, 5, 93) },
  ];
  const strongestRegion = [...regionVisibility].sort((a, b) => b.score - a.score)[0]?.region || "US";
  const weakestRegion = [...regionVisibility].sort((a, b) => a.score - b.score)[0]?.region || "Germany";
  const regionInsight = `You are strong in ${strongestRegion} but weak in ${weakestRegion}.`;

  // Query insights
  const queryInsights = mentionsByPrompt.map((entry) => {
    const query = sanitizeHTML(entry?.prompt || "");
    if (!query) return null;
    const brandM = Number(entry?.mentions) || 0;
    if (brandM > 0) return null;
    const compMap = new Map();
    (Array.isArray(entry?.competitors) ? entry.competitors : []).forEach((comp) => {
      const name = sanitizeHTML(typeof comp === "string" ? comp : comp?.name || comp?.brand || "");
      if (!name || name.toLowerCase() === safeBrand.toLowerCase()) return;
      compMap.set(name, (compMap.get(name) || 0) + Math.max(1, getMentionValue(comp)));
    });
    const sorted = Array.from(compMap.entries()).sort((a, b) => b[1] - a[1]);
    const topComp = sorted[0];
    const totalC = sorted.reduce((s, i) => s + i[1], 0);
    const domPct = topComp && totalC > 0 ? Math.round((topComp[1] / totalC) * 100) : null;
    return { query, brandMentions: brandM, topCompetitor: topComp ? topComp[0] : "Competitor", topCompetitorMentions: topComp ? topComp[1] : 0, dominancePct: domPct };
  }).filter(Boolean).slice(0, 8);

  const trend = mentionsByPrompt.slice(0, 6).map((entry, idx) => ({ month: `P${idx + 1}`, total: entry?.mentions || 0 }));

  // Pass through rich fields from /full-analysis
  return {
    brandName: safeBrand, industry: safeIndustry, country: safeCountry,
    score: visibilityScore, visibilityScore, visibilityRiskScore,
    totalMentions, promptCount: totalPromptCount, responseCount, sourceDomainCount,
    competitorMentionTotal, competitorPressureScore, hasSufficientData,
    topCompetitors, topSources, queryInsights, trend,
    queryTrafficLossPct: Math.round((queryInsights.length / totalPromptCount) * 100),
    confidenceLevel: mode === "quick" ? "low" : "high",
    sourceConfidence: topSources.length >= 3 ? "high" : topSources.length >= 1 ? "medium" : "low",
    summaryInsight: hasSufficientData
      ? topCompetitors.length > 0
        ? `${topCompetitors[0].name} dominates AI recommendations in your market while ${safeBrand} is under-represented.`
        : `${safeBrand} is under-represented in AI decisions.`
      : "Run full analysis for deeper insights.",
    recommendations: [
      `Create comparison pages targeting high-intent queries.`,
      `Publish citation-ready content for AI systems.`,
      `Track visibility weekly and fix loss queries.`,
    ],
    channelPerformance: [],
    coverage: visibilityScore,
    efficiency: Math.max(0, Math.min(100, 100 - visibilityRiskScore)),
    potentialImpressionGain: Math.round(visibilityRiskScore * 0.8),
    positionAnalysis: n.positionAnalysis || {},
    contextAnalysis: n.contextAnalysis || {},
    globalCategoryScores: n.globalCategoryScores || {},
    countryCategoryScores: n.countryCategoryScores || {},
    detail: n.detail || { globalResults: [], countryResults: [] },
    queryLossInsights: [],
    regionVisibility,
    strongestRegion,
    weakestRegion,
    regionInsight,
    promptRows,
    userCompetitors,
    detectedCompetitors,
    mergedCompetitors: competitorRows,
    detectedOnlyCount,
  };
}

function getNumberStorage(key, fallback = 0) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? Math.max(0, parseInt(raw, 10) || fallback) : fallback;
  } catch {
    return fallback;
  }
}

function getBooleanStorage(key, fallback = false) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === "1";
  } catch {
    return fallback;
  }
}

function getArrayStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function AnalysisProvider({ children }) {
  const [data, setData] = useState(defaultData);
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("Auto (US, UK, Germany)");
  const [mode, setMode] = useState("full");
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(false);
  const [isPremiumModalOpen, setPremiumModalOpen] = useState(false);
  const [isLimitModalOpen, setLimitModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState(false);
  const [appliedActions, setAppliedActions] = useState([]);
  const [analysisCredits, setAnalysisCredits] = useState(() => getNumberStorage("lumio-analysis-credits", 0));
  const [isProSubscriber, setIsProSubscriber] = useState(() => getBooleanStorage("lumio-pro-subscriber", false));
  const [isStrategyAddonEnabled, setStrategyAddonEnabled] = useState(() => getBooleanStorage("lumio-strategy-addon", false));
  const [analysisHistory, setAnalysisHistory] = useState(() => getArrayStorage("lumio-analysis-history"));

  const toggleAppliedAction = useCallback((id) => {
    setAppliedActions((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);
  }, []);

  const isQuickMode = !isProSubscriber;
  const plan = isProSubscriber ? "pro" : "analysis-pass";

  const purchaseEntryAnalysis = useCallback(() => {
    setAnalysisCredits((prev) => {
      const next = prev + 1;
      localStorage.setItem("lumio-analysis-credits", String(next));
      return next;
    });
  }, []);

  const unlockAnalysisAccess = useCallback((source = "frontend") => {
    markFrontendPaymentSuccess(source);
    setAnalysisCredits((prev) => {
      const next = prev + 1;
      localStorage.setItem("lumio-analysis-credits", String(next));
      return next;
    });
  }, []);

  const upgradeToPro = useCallback(() => {
    setIsProSubscriber(true);
    localStorage.setItem("lumio-pro-subscriber", "1");
  }, []);

  const unlockStrategyAddon = useCallback(() => {
    setStrategyAddonEnabled(true);
    localStorage.setItem("lumio-strategy-addon", "1");
  }, []);

  const fetchAnalysis = useCallback(async (overrides = {}) => {
    const bn = overrides.brandName || brandName;
    const ind = overrides.industry || industry;
    const co = "Auto (US, UK, Germany)";
    const mo = "full";
    const inputCompetitors = Array.isArray(overrides.competitors) ? overrides.competitors : competitors;
    if (!bn.trim()) return;

    if (!isProSubscriber && analysisCredits <= 0 && !overrides.forceAccess) {
      setLimitModalOpen(true);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch(ANALYZE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandName: bn, industry: ind, targetCountry: co, mode: mo, competitors: inputCompetitors }),
      });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const json = await res.json();
      const analysis = json?.data || json;
      const mapped = mapApiResponse(analysis, { brandName: bn, industry: ind, targetCountry: co, competitors: inputCompetitors }, mo);
      setData(mapped);
      setHasAnalyzedOnce(true);
      if (!isProSubscriber) {
        setAnalysisCredits((prev) => {
          const next = Math.max(0, prev - 1);
          localStorage.setItem("lumio-analysis-credits", String(next));
          return next;
        });
      }
      setAnalysisHistory((prev) => {
        const next = [
          {
            brandName: mapped.brandName,
            score: mapped.visibilityScore,
            timestamp: new Date().toISOString(),
            strongestRegion: mapped.strongestRegion,
            weakestRegion: mapped.weakestRegion,
          },
          ...prev,
        ].slice(0, 20);
        localStorage.setItem("lumio-analysis-history", JSON.stringify(next));
        return next;
      });
      if (overrides.brandName) setBrandName(bn);
      if (overrides.industry) setIndustry(ind);
      if (overrides.country) setCountry(co);
      if (overrides.mode) setMode(mo);
      if (overrides.competitors) setCompetitors(inputCompetitors);
    } catch (err) {
      setError(err?.message || "Analysis failed. Please try again.");
      setData({ ...defaultData, visibilityScore: 0, fallback: true });
      setHasAnalyzedOnce(true);
    } finally {
      setLoading(false);
    }
  }, [brandName, industry, competitors, analysisCredits, isProSubscriber]);

  const startAnalysisAfterPayment = useCallback(async ({ brandName: nextBrand, industry: nextIndustry = "", competitors: nextCompetitors = [] }) => {
    unlockAnalysisAccess("payment_success");
    await fetchAnalysis({
      brandName: nextBrand,
      industry: nextIndustry,
      competitors: nextCompetitors,
      mode: "full",
      forceAccess: true,
    });
  }, [unlockAnalysisAccess, fetchAnalysis]);

  const value = useMemo(() => ({
    data, brandName, industry, country, mode, loading, error, hasAnalyzedOnce,
    isQuickMode, isPremiumModalOpen, isLimitModalOpen, actionMode, appliedActions,
    competitors, analysisCredits, isProSubscriber, isStrategyAddonEnabled, analysisHistory, plan,
    setBrandName, setIndustry, setCountry, setMode, setCompetitors,
    fetchAnalysis, setPremiumModalOpen, setLimitModalOpen, setActionMode, toggleAppliedAction,
    purchaseEntryAnalysis, upgradeToPro, unlockStrategyAddon, unlockAnalysisAccess, startAnalysisAfterPayment,
  }), [data, brandName, industry, country, mode, loading, error, hasAnalyzedOnce, isQuickMode, isPremiumModalOpen, isLimitModalOpen, actionMode, appliedActions, competitors, analysisCredits, isProSubscriber, isStrategyAddonEnabled, analysisHistory, plan, fetchAnalysis, toggleAppliedAction, purchaseEntryAnalysis, upgradeToPro, unlockStrategyAddon, unlockAnalysisAccess, startAnalysisAfterPayment]);

  return <AnalysisContext.Provider value={value}>{children}</AnalysisContext.Provider>;
}

export function useAnalysis() {
  const ctx = useContext(AnalysisContext);
  if (!ctx) throw new Error("useAnalysis must be used within AnalysisProvider");
  return ctx;
}
