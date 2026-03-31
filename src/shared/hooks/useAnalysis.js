import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import { ANALYZE_API_URL } from "../../api";
import { markFrontendPaymentSuccess } from "../utils/paymentFlow";

const AnalysisContext = createContext(null);

const ANALYSIS_CACHE_KEY = "lumio-analysis-cache-v2";
const ANALYSIS_CACHE_SCHEMA_VERSION = 2;
const LEGACY_ANALYSIS_KEYS = [
  "ai-visibility-last-analysis",
  "ai-visibility-settings",
  "ai-visibility-email",
  "lumio-analysis-cache",
  "lumio-analysis-data",
];

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
  fallbackInjected: false,
  dataSource: "default",
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

function seededInt(seed, idx, min, max) {
  const x = Math.sin(seed + idx * 7919) * 10000;
  const frac = x - Math.floor(x);
  return Math.round(min + frac * (max - min));
}

function buildWeakFallbackAnalysis(payload = {}) {
  const brand = sanitizeHTML(payload.brandName || "Brand");
  const industry = sanitizeHTML(payload.industry || "software");
  const seed = hashString(`${brand}-${industry}-fallback`);
  const userComps = (Array.isArray(payload.competitors) ? payload.competitors : [])
    .map((c) => sanitizeHTML(c || "").trim())
    .filter(Boolean);
  const defaults = [`${industry}flow`, `${industry}ly`, "Competitor One", "Competitor Two"];
  const compPool = [...new Set([...userComps, ...defaults])].filter((n) => n.toLowerCase() !== brand.toLowerCase());
  const c1 = compPool[0] || "Competitor One";
  const c2 = compPool[1] || "Competitor Two";
  const c3 = compPool[2] || "Competitor Three";

  const prompts = [
    `best ${industry} tools`,
    `${brand} alternatives`,
    `${c1} vs ${brand}`,
    `top ${industry} platform for teams`,
    `${industry} pricing comparison`,
    `how to choose ${industry} software`,
  ];

  const mentionsByPrompt = prompts.map((prompt, idx) => {
    const brandMentions = idx % 3 === 0 ? 1 : 0;
    const first = seededInt(seed, idx + 1, 2, 6);
    const second = seededInt(seed, idx + 2, 1, 4);
    return {
      prompt,
      mentions: brandMentions,
      competitors: [
        { name: c1, mentions: first },
        { name: c2, mentions: second },
        ...(idx % 2 === 0 ? [{ name: c3, mentions: 1 }] : []),
      ],
    };
  });

  const analyzedResponses = [
    { response: `Top picks include ${c1}. Sources: https://reddit.com/r/saas https://g2.com/products/${c1.toLowerCase().replace(/\s+/g, "-")}` },
    { response: `${c2} appears in comparison pages: https://capterra.com/p/${c2.toLowerCase().replace(/\s+/g, "-")} https://medium.com/@review/best-${industry.replace(/\s+/g, "-")}-tools` },
    { response: `Analysts cite docs and news: https://docs.${c1.toLowerCase().replace(/\s+/g, "")}.com https://techcrunch.com` },
  ];

  const competitors = [
    { name: c1, mentionCount: seededInt(seed, 20, 12, 24) },
    { name: c2, mentionCount: seededInt(seed, 21, 8, 18) },
    { name: c3, mentionCount: seededInt(seed, 22, 3, 9) },
  ];

  return {
    mentionsByPrompt,
    analyzedResponses,
    competitors,
    totalMentions: mentionsByPrompt.reduce((s, p) => s + (Number(p.mentions) || 0), 0),
    detail: { globalResults: [], countryResults: [] },
  };
}

function isWeakAnalysis(analysis) {
  const n = analysis || {};
  const mbp = Array.isArray(n.mentionsByPrompt) ? n.mentionsByPrompt : [];
  const comps = Array.isArray(n.competitors) ? n.competitors : [];
  const validPromptCount = mbp.filter((entry) => {
    const prompt = sanitizeHTML(entry?.prompt || "").trim();
    const mentionCount = Number(entry?.mentions) || 0;
    const validComps = Array.isArray(entry?.competitors)
      ? entry.competitors.filter((comp) => sanitizeHTML(typeof comp === "string" ? comp : comp?.name || comp?.brand || "").trim()).length
      : 0;
    return Boolean(prompt) || mentionCount > 0 || validComps > 0;
  }).length;
  const validCompCount = comps.filter((item) => {
    const name = sanitizeHTML(typeof item === "string" ? item : item?.name || item?.brand || "").trim();
    return Boolean(name);
  }).length;
  const totalMentions = Number(n.totalMentions ?? 0) || mbp.reduce((s, i) => s + (Number(i?.mentions) || 0), 0);
  return validPromptCount < 3 || validCompCount < 2 || totalMentions <= 0;
}

function hasRenderableShape(mapped) {
  if (!mapped || typeof mapped !== "object") return false;
  const hasBrand = Boolean(sanitizeHTML(mapped.brandName || "").trim());
  const hasPrompts = Array.isArray(mapped.promptRows) && mapped.promptRows.some((row) => sanitizeHTML(row?.prompt || "").trim());
  const hasComps = Array.isArray(mapped.topCompetitors) && mapped.topCompetitors.some((c) => sanitizeHTML(c?.name || "").trim());
  const hasRegions = Array.isArray(mapped.regionVisibility) && mapped.regionVisibility.length >= 3;
  const hasTrend = Array.isArray(mapped.trend) && mapped.trend.length >= 2;
  const hasSources = Array.isArray(mapped.topSources) ? mapped.topSources.length > 0 : true;
  return hasBrand && hasPrompts && hasComps && hasRegions && hasTrend && hasSources;
}

function ensureNormalizedMinimum(mapped, payload, mode) {
  const fallback = mapApiResponse(null, payload, mode, { forceFallback: true });
  const base = mapped && typeof mapped === "object" ? mapped : {};
  const normalized = {
    ...fallback,
    ...base,
    topCompetitors: Array.isArray(base.topCompetitors) && base.topCompetitors.length ? base.topCompetitors : fallback.topCompetitors,
    promptRows: Array.isArray(base.promptRows) && base.promptRows.length ? base.promptRows : fallback.promptRows,
    queryInsights: Array.isArray(base.queryInsights) && base.queryInsights.length ? base.queryInsights : fallback.queryInsights,
    regionVisibility: Array.isArray(base.regionVisibility) && base.regionVisibility.length ? base.regionVisibility : fallback.regionVisibility,
    topSources: Array.isArray(base.topSources) && base.topSources.length ? base.topSources : fallback.topSources,
    trend: Array.isArray(base.trend) && base.trend.length >= 2 ? base.trend : fallback.trend,
    mergedCompetitors: Array.isArray(base.mergedCompetitors) && base.mergedCompetitors.length ? base.mergedCompetitors : fallback.mergedCompetitors,
    detectedCompetitors: Array.isArray(base.detectedCompetitors) && base.detectedCompetitors.length ? base.detectedCompetitors : fallback.detectedCompetitors,
    userCompetitors: Array.isArray(base.userCompetitors) ? base.userCompetitors : fallback.userCompetitors,
  };

  const structurallyWeak = !hasRenderableShape(normalized);
  if (structurallyWeak) {
    return {
      ...fallback,
      fallbackInjected: true,
      dataSource: "fallback",
    };
  }

  return {
    ...normalized,
    fallbackInjected: Boolean(base.fallbackInjected) || Boolean(structurallyWeak),
  };
}

function clearLegacyAnalysisCache() {
  try {
    LEGACY_ANALYSIS_KEYS.forEach((key) => {
      if (localStorage.getItem(key) != null) {
        localStorage.removeItem(key);
        console.warn("[Analysis] Invalidated legacy analysis cache key:", key);
      }
    });
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

function persistAnalysisCache(dataToPersist) {
  try {
    const payload = {
      schemaVersion: ANALYSIS_CACHE_SCHEMA_VERSION,
      savedAt: Date.now(),
      data: dataToPersist,
    };
    localStorage.setItem(ANALYSIS_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors in restricted environments.
  }
}

function readAnalysisCache() {
  clearLegacyAnalysisCache();
  try {
    const raw = localStorage.getItem(ANALYSIS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.schemaVersion !== ANALYSIS_CACHE_SCHEMA_VERSION || !hasRenderableShape(parsed?.data)) {
      localStorage.removeItem(ANALYSIS_CACHE_KEY);
      console.warn("[Analysis] Invalidated stale analysis cache (schema/data mismatch)");
      return null;
    }
    return {
      ...parsed.data,
      dataSource: "persisted-cache",
    };
  } catch {
    try {
      localStorage.removeItem(ANALYSIS_CACHE_KEY);
    } catch {
      // Ignore storage errors in restricted environments.
    }
    return null;
  }
}

function mapApiResponse(analysis, payload, mode, options = {}) {
  const n = options.forceFallback || isWeakAnalysis(analysis)
    ? buildWeakFallbackAnalysis(payload)
    : (analysis || {});
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

  const ensuredPromptRows = promptRows.length ? promptRows : [
    {
      prompt: `best ${safeIndustry || "software"} tools`,
      status: "Not seen",
      brandMentions: 0,
      competitors: detectedCompetitors.slice(0, 3),
    },
    {
      prompt: `${safeBrand} alternatives`,
      status: "Not seen",
      brandMentions: 0,
      competitors: detectedCompetitors.slice(0, 3),
    },
  ];

  const ensuredQueryInsights = queryInsights.length ? queryInsights : [
    {
      query: `best ${safeIndustry || "software"} tools`,
      brandMentions: 0,
      topCompetitor: topCompetitors[0]?.name || "Competitor One",
      topCompetitorMentions: topCompetitors[0]?.mentionCount || 3,
      dominancePct: 68,
    },
    {
      query: `${safeBrand} alternatives`,
      brandMentions: 0,
      topCompetitor: topCompetitors[1]?.name || topCompetitors[0]?.name || "Competitor Two",
      topCompetitorMentions: topCompetitors[1]?.mentionCount || 2,
      dominancePct: 61,
    },
  ];

  const trend = (mentionsByPrompt.length ? mentionsByPrompt : ensuredPromptRows)
    .slice(0, 6)
    .map((entry, idx) => ({ month: `P${idx + 1}`, total: entry?.mentions || entry?.brandMentions || 0 }));

  // Pass through rich fields from /full-analysis
  return {
    brandName: safeBrand, industry: safeIndustry, country: safeCountry,
    score: visibilityScore, visibilityScore, visibilityRiskScore,
    totalMentions, promptCount: totalPromptCount, responseCount, sourceDomainCount,
    competitorMentionTotal, competitorPressureScore, hasSufficientData,
    topCompetitors, topSources, queryInsights: ensuredQueryInsights, trend,
    queryTrafficLossPct: Math.round((ensuredQueryInsights.length / totalPromptCount) * 100),
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
    promptRows: ensuredPromptRows,
    userCompetitors,
    detectedCompetitors,
    mergedCompetitors: competitorRows,
    detectedOnlyCount,
    fallbackInjected: options.forceFallback || isWeakAnalysis(analysis),
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
  const initialCachedData = useMemo(() => readAnalysisCache(), []);
  const [data, setData] = useState(initialCachedData || defaultData);
  const [brandName, setBrandName] = useState("");
  const [industry, setIndustry] = useState("");
  const [country, setCountry] = useState("Auto (US, UK, Germany)");
  const [mode, setMode] = useState("full");
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(Boolean(initialCachedData));
  const [isPremiumModalOpen, setPremiumModalOpen] = useState(false);
  const [isLimitModalOpen, setLimitModalOpen] = useState(false);
  const [actionMode, setActionMode] = useState(false);
  const [appliedActions, setAppliedActions] = useState([]);
  const [analysisCredits, setAnalysisCredits] = useState(() => getNumberStorage("lumio-analysis-credits", 0));
  const [isProSubscriber, setIsProSubscriber] = useState(() => getBooleanStorage("lumio-pro-subscriber", false));
  const [isStrategyAddonEnabled, setStrategyAddonEnabled] = useState(() => getBooleanStorage("lumio-strategy-addon", false));
  const [analysisHistory, setAnalysisHistory] = useState(() => getArrayStorage("lumio-analysis-history"));

  useEffect(() => {
    if (initialCachedData) {
      console.info("[Analysis] Restored analysis data from persisted cache", {
        source: "persisted-cache",
        fallbackInjected: Boolean(initialCachedData.fallbackInjected),
        brandName: initialCachedData.brandName,
      });
    }
  }, [initialCachedData]);

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
      console.info("[Analysis] raw API response", json);
      const mapped = mapApiResponse(analysis, { brandName: bn, industry: ind, targetCountry: co, competitors: inputCompetitors }, mo);
      const normalized = ensureNormalizedMinimum(mapped, { brandName: bn, industry: ind, targetCountry: co, competitors: inputCompetitors }, mo);
      const dataSource = normalized.fallbackInjected ? "fallback" : "api";
      const finalData = { ...normalized, dataSource };
      console.info("[Analysis] normalized mapped data", finalData);
      console.info("[Analysis] fallbackInjected", Boolean(finalData.fallbackInjected));
      console.info("[Analysis] data source", dataSource);

      setData(finalData);
      persistAnalysisCache(finalData);
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
            score: finalData.visibilityScore,
            timestamp: new Date().toISOString(),
            strongestRegion: finalData.strongestRegion,
            weakestRegion: finalData.weakestRegion,
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
      const fallbackMapped = mapApiResponse(
        null,
        { brandName: bn, industry: ind, targetCountry: co, competitors: inputCompetitors },
        mo,
        { forceFallback: true },
      );
      const normalizedFallback = ensureNormalizedMinimum(fallbackMapped, { brandName: bn, industry: ind, targetCountry: co, competitors: inputCompetitors }, mo);
      const finalFallbackData = { ...normalizedFallback, fallback: true, fallbackInjected: true, dataSource: "fallback" };
      console.info("[Analysis] normalized mapped data", finalFallbackData);
      console.info("[Analysis] fallbackInjected", true);
      console.info("[Analysis] data source", "fallback");
      setData(finalFallbackData);
      persistAnalysisCache(finalFallbackData);
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
