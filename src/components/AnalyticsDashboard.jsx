import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ANALYZE_API_URL } from "../api";

const SOURCE_TYPE_PATTERNS = {
  media: /techcrunch|forbes|wired|venturebeat|bloomberg|cnbc|businessinsider|theinformation/,
  community: /reddit|quora|medium|substack|discord/,
  industry: /g2|capterra|insider|journal|association|report|review/,
};

function toDomainList(text) {
  if (!text || typeof text !== "string") return [];
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9-]+\.[a-z]{2,}/gi;
  const matches = text.match(urlRegex) || [];
  return matches
    .map((raw) => raw.replace(/[\],;.!?)]+$/, ""))
    .map((raw) => {
      try {
        const normalized = raw.startsWith("http") ? raw : `https://${raw}`;
        return new URL(normalized).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        return raw.replace(/^www\./, "").toLowerCase();
      }
    })
    .filter(Boolean);
}

function classifySource(domain) {
  if (SOURCE_TYPE_PATTERNS.media.test(domain)) return "media";
  if (SOURCE_TYPE_PATTERNS.community.test(domain)) return "community";
  if (SOURCE_TYPE_PATTERNS.industry.test(domain)) return "industry";
  return "product";
}

function buildPrompts(brandName, industry, targetCountry, mode) {
  const locationSuffix = targetCountry && targetCountry !== "Global" ? ` in ${targetCountry}` : "";

  const fullPrompts = [
    `Which ${industry} brands are most recommended by AI assistants${locationSuffix}?`,
    `Compare ${brandName} with top ${industry} alternatives${locationSuffix}.`,
    `What are the best ${industry} tools for growing companies${locationSuffix}?`,
    `How does ${brandName} perform against competitors in reliability and pricing${locationSuffix}?`,
    `What ${industry} products are most trusted for enterprise buyers${locationSuffix}?`,
    `Which companies are most cited in ${industry} AI answers${locationSuffix}?`,
    `What are the strongest alternatives to ${brandName} in ${industry}${locationSuffix}?`,
    `How should buyers choose between ${brandName} and competitors${locationSuffix}?`,
    `What content themes increase AI visibility for ${industry} brands${locationSuffix}?`,
    `What sources influence AI recommendations in ${industry}${locationSuffix}?`,
    `Which brands dominate comparison queries in ${industry}${locationSuffix}?`,
    `What decision factors make one ${industry} brand rank above another${locationSuffix}?`,
  ];

  if (mode === "quick") {
    return fullPrompts.slice(0, 3);
  }

  return fullPrompts;
}

function mapAnalyzeResponse(response, payload, mode) {
  const analysis = response?.data ?? response ?? {};
  const mentionsByPrompt = Array.isArray(analysis.mentionsByPrompt)
    ? analysis.mentionsByPrompt
    : [];
  const analyzedResponses = Array.isArray(analysis.analyzedResponses)
    ? analysis.analyzedResponses
    : [];

  const competitorCounter = {};
  mentionsByPrompt.forEach((entry) => {
    const competitors = Array.isArray(entry.competitors) ? entry.competitors : [];
    competitors.forEach((name) => {
      competitorCounter[name] = (competitorCounter[name] || 0) + 1;
    });
  });

  const totalPromptCount = Math.max(1, mentionsByPrompt.length || buildPrompts(payload.brandName, payload.industry, payload.targetCountry, mode).length);
  const topCompetitors = Object.entries(competitorCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, mentionCount]) => ({
      name,
      mentionCount,
      appearanceRate: Math.round((mentionCount / totalPromptCount) * 100),
      score: mentionCount,
      relevanceScore: 0,
      whyItAppears: `${name} appears in ${mentionCount}/${totalPromptCount} prompts.`,
    }));

  const sourceCounter = {};
  analyzedResponses.forEach((entry) => {
    const text = entry?.response || "";
    toDomainList(text).forEach((domain) => {
      sourceCounter[domain] = (sourceCounter[domain] || 0) + 1;
    });
  });

  const topSources = Object.entries(sourceCounter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain, mentionCount]) => ({
      name: domain,
      source: domain,
      type: classifySource(domain),
      confidence: mentionCount >= 3 ? "high" : mentionCount >= 2 ? "medium" : "low",
      inferred: false,
      mentionCount,
      score: mentionCount,
    }));

  const channelAccumulator = { media: 0, community: 0, industry: 0, product: 0 };
  topSources.forEach((src) => {
    channelAccumulator[src.type] += src.mentionCount;
  });

  const channelPerformance = Object.entries(channelAccumulator)
    .filter(([, contribution]) => contribution > 0)
    .map(([channel, contribution]) => ({ channel, contribution }));

  const visibilityScore = Number(analysis.visibilityScore ?? 0);
  const competitorPressureScore = Math.min(
    100,
    Math.round((topCompetitors.reduce((sum, item) => sum + item.mentionCount, 0) / totalPromptCount) * 20)
  );
  const sourceConfidenceScore = Math.min(
    100,
    Math.round((topSources.reduce((sum, item) => sum + item.mentionCount, 0) / totalPromptCount) * 25)
  );
  const visibilityRiskScore = Math.max(
    0,
    Math.min(100, Math.round(100 - visibilityScore + competitorPressureScore * 0.4))
  );

  const sourceConfidence =
    sourceConfidenceScore >= 70 ? "high" : sourceConfidenceScore >= 40 ? "medium" : "low";

  const recommendations = [
    `Increase ${payload.industry} comparison content for ${payload.brandName}.`,
    "Publish source-backed pages AI systems can cite directly.",
    "Track visibility weekly and iterate high-intent query coverage.",
  ];

  const trend = mentionsByPrompt.slice(0, 6).map((entry, idx) => ({
    month: `P${idx + 1}`,
    total: entry?.mentions || 0,
  }));

  return {
    brandName: payload.brandName,
    industry: payload.industry,
    country: payload.targetCountry,
    score: visibilityScore,
    prevScore: undefined,
    coverage: visibilityScore,
    efficiency: Math.max(0, Math.min(100, 100 - visibilityRiskScore)),
    competitors: topCompetitors.length,
    sources: topSources.length,
    chainedAIInsights: mentionsByPrompt.length,
    summaryInsight:
      topCompetitors.length > 0
        ? `${payload.brandName} appears inconsistently in AI answers and is competing with ${topCompetitors[0].name}. Prioritize comparison coverage this week.`
        : `${payload.brandName} has limited competitor signals in this sample. Expand prompt coverage to validate visibility opportunities.`,
    recommendations,
    trend,
    channelPerformance,
    potentialImpressionGain: Math.max(0, Math.min(100, Math.round(visibilityRiskScore * 0.8))),
    topCompetitors,
    topSources,
    strategicNarrative: null,
    biggestWeakness: `${payload.brandName} appears in only ${analysis.totalMentions || 0}/${totalPromptCount} analyzed responses.`,
    strongestArea: topSources[0]?.source || "No dominant source signal",
    contentOpportunity: "Create decision-focused content for high-intent prompts.",
    competitorThreat: topCompetitors[0]
      ? `${topCompetitors[0].name} appears in ${topCompetitors[0].mentionCount}/${totalPromptCount} prompts.`
      : "No strong competitor detected in this run.",
    confidenceLevel: mode === "quick" ? "low" : "high",
    sourceConfidence,
    sourceConfidenceScore,
    competitorPressureScore,
    visibilityScore,
    visibilityRiskScore,
    sourceDataMessage:
      topSources.length > 0
        ? ""
        : "Traffic sources require deeper analysis. Run full analysis to unlock.",
  };
}

const defaultData = {
  brandName: "",
  industry: "",
  country: "",
  score: 0,
  prevScore: undefined,
  coverage: 0,
  efficiency: 0,
  chainedAIInsights: 0,
  sources: 0,
  competitors: 0,
  summaryInsight: "",
  recommendations: [],
  trend: [],
  channelPerformance: [],
  potentialImpressionGain: 0,
  topCompetitors: [],
  topSources: [],
  confidenceLevel: "low",
  sourceConfidence: "low",
  sourceConfidenceScore: 0,
  competitorPressureScore: 0,
  visibilityScore: 0,
  visibilityRiskScore: 0,
  sourceDataMessage: "",
};

const cardDefinitions = [
  { label: "AI Visibility Score", valueKey: "score", suffix: "%" },
  { label: "AI Reach", valueKey: "coverage", suffix: "%" },
  { label: "Exposure Gain", valueKey: "potentialImpressionGain", suffix: "%" },
  { label: "Efficiency", valueKey: "efficiency", suffix: "%" },
  { label: "AI Signals Tracked", valueKey: "chainedAIInsights" },
  { label: "Active Source Assets", valueKey: "sources" },
];

const generatePDFReport = async (
  data,
  trendElRef,
  competitorsElRef,
  sourcesElRef
) => {
  try {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const marginLeft = 15;
    let cursorY = 15;
    const reportDate = new Date().toLocaleDateString();

    doc.setFont("helvetica", "bold").setFontSize(20);
    doc.text("AI Visibility Report", marginLeft, cursorY);
    cursorY += 12;

    doc.setFont("helvetica", "normal").setFontSize(10);
    doc.text(`Brand: ${data.brandName || "N/A"}`, marginLeft, cursorY);
    doc.text(`Industry: ${data.industry || "N/A"}`, marginLeft + 80, cursorY);
    doc.text(`Country: ${data.country || "N/A"}`, marginLeft + 140, cursorY);
    cursorY += 6;
    doc.text(`Date: ${reportDate}`, marginLeft, cursorY);

    cursorY += 10;
    doc.setLineWidth(0.3).line(marginLeft, cursorY - 2, 195, cursorY - 2);

    doc.setFont("helvetica", "bold").setFontSize(12);
    doc.text("Main Metrics", marginLeft, cursorY);
    cursorY += 6;

    doc.setFont("helvetica", "normal").setFontSize(10);
    doc.text(`AI Visibility Score: ${data.score}%`, marginLeft, cursorY);
    doc.text(
      `Previous score: ${
        data.prevScore !== undefined ? `${data.prevScore}%` : "N/A"
      }`,
      marginLeft + 90,
      cursorY
    );
    cursorY += 6;
    doc.text(`Coverage (Country): ${data.coverage}%`, marginLeft, cursorY);
    doc.text(`Efficiency: ${data.efficiency}%`, marginLeft + 90, cursorY);
    cursorY += 10;

    const addChartToPdf = async (title, ref) => {
      doc.setFont("helvetica", "bold").text(title, marginLeft, cursorY);
      cursorY += 5;

      if (ref?.current) {
        const canvas = await html2canvas(ref.current, { scale: 2 });
        const imgData = canvas.toDataURL("image/png");
        const imgWidth = 180;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        doc.addImage(imgData, "PNG", marginLeft, cursorY, imgWidth, imgHeight);
        cursorY += imgHeight + 8;
      } else {
        doc.setFont("helvetica", "normal");
        doc.text(`${title} unavailable.`, marginLeft, cursorY);
        cursorY += 10;
      }
    };

    await addChartToPdf("Trend Visualization", trendElRef);
    await addChartToPdf("Top Competitors", competitorsElRef);
    await addChartToPdf("Source Analysis", sourcesElRef);

    doc.setFont("helvetica", "bold").text("Top Metrics", marginLeft, cursorY);
    cursorY += 6;
    doc.setFont("helvetica", "normal");
    doc.text(`AI Signals Tracked: ${data.chainedAIInsights}`, marginLeft, cursorY);
    cursorY += 6;
    doc.text(`Active Sources: ${data.sources}`, marginLeft, cursorY);
    cursorY += 6;
    doc.text(`Competitor Count: ${data.competitors}`, marginLeft, cursorY);
    cursorY += 10;

    doc.setFont("helvetica", "bold").text("Summary Insight", marginLeft, cursorY);
    cursorY += 6;
    const summary = data.summaryInsight || "No summary available.";
    const summaryLines = doc.splitTextToSize(summary, 180);
    doc.setFont("helvetica", "normal");
    doc.text(summaryLines, marginLeft, cursorY);
    cursorY += summaryLines.length * 6 + 6;

    doc.setFont("helvetica", "bold").text("Recommendations", marginLeft, cursorY);
    cursorY += 6;
    doc.setFont("helvetica", "normal");
    const recommendations = data.recommendations || [];
    recommendations.forEach((rec) => {
      doc.text(`• ${rec}`, marginLeft, cursorY);
      cursorY += 6;
    });

    doc.save("ai-visibility-report.pdf");
  } catch (err) {
    window.alert("Failed to generate report. Please retry.");
  }
};

export default function AnalyticsDashboard({
  initialBrandName = "",
  initialMode = "quick",
  autoRun = false,
  onBackToLanding,
}) {
  const [data, setData] = useState(defaultData);
  const [brandName, setBrandName] = useState(initialBrandName || "");
  const [industry, setIndustry] = useState("fintech");
  const [customIndustry, setCustomIndustry] = useState("");
  const [country, setCountry] = useState("Turkey");
  const [mode, setMode] = useState(initialMode || "quick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPremiumModalOpen, setPremiumModalOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [kpiAnimated, setKpiAnimated] = useState(false);

  const trendRef = useRef(null);
  const competitorsRef = useRef(null);
  const sourcesRef = useRef(null);
  const autoRunRef = useRef(false);

  const loadFromLocal = () => {
    try {
      const cachedData = window.localStorage.getItem("ai-visibility-last-analysis");
      const cachedSettings = window.localStorage.getItem("ai-visibility-settings");

      if (cachedData) setData(JSON.parse(cachedData));

      if (cachedSettings) {
        const settings = JSON.parse(cachedSettings);
        if (settings.brandName) setBrandName(settings.brandName);
        if (settings.industry) setIndustry(settings.industry);
        if (settings.country) setCountry(settings.country);
        if (settings.mode) setMode(settings.mode);
      }
    } catch {}
  };

  useEffect(() => {
    loadFromLocal();
  }, []);

  useEffect(() => {
    if (!initialBrandName) return;
    setBrandName(initialBrandName);
  }, [initialBrandName]);

  useEffect(() => {
    if (!initialMode) return;
    setMode(initialMode);
  }, [initialMode]);

  const fetchAnalysis = useCallback(async () => {
    if (!brandName.trim()) {
      setError("Brand name is required.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setKpiAnimated(false);

    try {
      const payload = {
        brandName,
        industry: industry === "custom" ? (customIndustry || "other") : industry,
        targetCountry: country,
        mode,
      };

      const res = await fetch(ANALYZE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: payload.brandName,
          prompts: buildPrompts(payload.brandName, payload.industry, payload.targetCountry, mode),
          analysisType: mode === "full" ? "comparison" : "generic",
        }),
      });

      const raw = await res.json();

      // Check for structured error response
      if (raw.success === false) {
        const errorMsg = raw.error || "Analysis failed";
        const details = raw.details ? ` (${raw.details})` : "";
        throw new Error(`${errorMsg}${details}`);
      }

      if (!res.ok) {
        throw new Error("Analysis pipeline failed. Please retry.");
      }

      const mapped = mapAnalyzeResponse(raw, payload, mode);

      if (mode === "quick") {
        mapped.summaryInsight =
          mapped.summaryInsight ||
          "Quick mode data: please run full for more detail.";
        mapped.recommendations =
          Array.isArray(mapped.recommendations) && mapped.recommendations.length
            ? mapped.recommendations
            : ["Run full mode for complete recommendations."];
      }

      setData(mapped);

      window.localStorage.setItem(
        "ai-visibility-last-analysis",
        JSON.stringify(mapped)
      );
      window.localStorage.setItem(
        "ai-visibility-settings",
        JSON.stringify({ brandName, industry, country, mode })
      );

      setMessage(`Loaded ${mode} analysis successfully.`);
      setTimeout(() => setKpiAnimated(true), 100);
      setTimeout(() => setMessage(""), 2000);
    } catch (error) {
      console.error("Analysis fetch error:", error);
      setError("Analysis could not be completed. Please try again or switch to full mode.");
    } finally {
      setLoading(false);
    }
  }, [brandName, country, customIndustry, industry, mode]);

  useEffect(() => {
    if (!autoRun || autoRunRef.current) return;
    if (!brandName.trim()) return;
    autoRunRef.current = true;
    fetchAnalysis();
  }, [autoRun, brandName, fetchAnalysis]);

  const handleShare = async () => {
    if (!navigator.clipboard) {
      window.alert("Clipboard not supported in this browser");
      return;
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 1800);
    } catch {
      window.alert("Copy failed. Please copy manually.");
    }
  };

  const handleEmailShare = () => {
    const visibilityPct = data.coverage || data.score || 0;
    const subject = encodeURIComponent("AI Visibility Risk Alert: share report");
    const body = encodeURIComponent(
      `You are losing visibility in AI search.\n\nYour brand appears in only ${visibilityPct}% of responses.\n\nView full report:\n${window.location.href}`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleUpgrade = (tier) => {
    const stripeLinks = {
      Starter: "https://buy.stripe.com/starter-link",
      Growth: "https://buy.stripe.com/growth-link",
      Enterprise: "mailto:enterprise@company.com?subject=Enterprise%20Inquiry",
    };
    const link = stripeLinks[tier];
    if (link) window.location.href = link;
  };

  const visibilityLoss = useMemo(
    () => Math.max(0, 100 - (data.score || 0)),
    [data.score]
  );

  const confidenceText = useMemo(() => {
    if (data.confidenceLevel === "high") return "Full analysis (high confidence)";
    return "Based on limited sample size";
  }, [data.confidenceLevel]);

  const sampleSizeText = useMemo(() => {
    if (data.confidenceLevel === "low") return "Quick mode preview";
    return "";
  }, [data.confidenceLevel]);

  const heroSupportText = useMemo(() => {
    if (data.confidenceLevel === "low") {
      return "Limited presence detected in AI responses.";
    }
    return `Your brand is missing in ${visibilityLoss}% of AI responses.`;
  }, [data.confidenceLevel, visibilityLoss]);

  const riskLabel = useMemo(() => {
    const risk = data.visibilityRiskScore || 0;
    if (risk >= 70) return "High";
    if (risk >= 40) return "Medium";
    return "Low";
  }, [data.visibilityRiskScore]);

  const sourceConfidenceText = useMemo(() => {
    const level = (data.sourceConfidence || "low").toLowerCase();
    if (level === "high") return "Source confidence: High";
    if (level === "medium") return "Source confidence: Medium";
    return "Source confidence: Low";
  }, [data.sourceConfidence]);

  const hasWeakSignals = useMemo(
    () => (!data.topCompetitors || data.topCompetitors.length === 0) && (!data.topSources || data.topSources.length === 0),
    [data.topCompetitors, data.topSources]
  );

  const hasTrustworthySourceSignals = useMemo(() => {
    const confidence = (data.sourceConfidence || "low").toLowerCase();
    const sourceCount = Array.isArray(data.topSources) ? data.topSources.length : 0;
    return sourceCount >= 2 && (confidence === "medium" || confidence === "high");
  }, [data.topSources, data.sourceConfidence]);

  const conciseInsight = useMemo(() => {
    const base = (data.summaryInsight || data.biggestWeakness || "").replace(/\s+/g, " ").trim();
    if (!base) {
      return "Problem: Limited data signals detected. Action: Run full analysis to unlock stronger, data-backed recommendations.";
    }

    const sentences = base.match(/[^.!?]+[.!?]?/g) || [base];
    const problemSentence =
      sentences.find((s) => /problem:/i.test(s)) ||
      sentences[0] ||
      "";
    const actionSentence =
      (base.match(/Action:[^.!?]+[.!?]?/i) || [])[0] ||
      sentences.find((s) => /action|create|prioritize|publish|run full/i.test(s)) ||
      "";

    const compact = [problemSentence.trim(), actionSentence.trim()].filter(Boolean).slice(0, 2);
    return compact.join(" ");
  }, [data.summaryInsight, data.biggestWeakness]);

  const scoreTrend = useMemo(() => {
    const prev = data.prevScore;
    const curr = data.score;

    if (prev === undefined || prev === null) {
      return { changeText: "No trend data" };
    }

    const diff = curr - prev;
    const direction = diff > 0 ? "↑" : diff < 0 ? "↓" : "→";
    return { changeText: `${prev} → ${curr} ${direction}` };
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 p-5 md:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-700 p-8 text-white shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/20 text-white border border-white/30">
                ⚠️ AI Visibility Alert
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              You are losing market visibility.
            </h1>
            <p className="text-xl font-medium mb-8 opacity-90">
              {heroSupportText}
            </p>
            <p className="mb-6 text-sm text-slate-200">{confidenceText}</p>
            {sampleSizeText ? <p className="mb-6 text-xs text-slate-200">{sampleSizeText}</p> : null}
            <div className="mb-6 inline-flex items-center rounded-xl border border-white/40 bg-white/15 px-4 py-2">
              <p className="text-base font-bold text-white">Risk: {data.visibilityRiskScore || 0}/100 ({riskLabel})</p>
            </div>
            <button
              onClick={() => setPremiumModalOpen(true)}
              className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-700 shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all"
            >
              Fix Your Visibility
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-5">
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
              placeholder="Brand name"
            />
            <div className="flex flex-col">
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="fintech">fintech</option>
                <option value="saas">saas</option>
                <option value="ecommerce">ecommerce</option>
                <option value="real estate">real estate</option>
                <option value="education">education</option>
                <option value="healthcare">healthcare</option>
                <option value="travel">travel</option>
                <option value="hospitality">hospitality</option>
                <option value="marketplace">marketplace</option>
                <option value="crypto">crypto</option>
                <option value="AI tools">AI tools</option>
                <option value="logistics">logistics</option>
                <option value="custom">Custom industry</option>
              </select>
              {industry === "custom" && (
                <input
                  value={customIndustry}
                  onChange={(e) => setCustomIndustry(e.target.value)}
                  className="mt-2 rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Type your industry"
                />
              )}
            </div>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="Global">Global</option>
              <option value="USA">USA</option>
              <option value="UK">UK</option>
              <option value="Germany">Germany</option>
              <option value="Turkey">Turkey</option>
              <option value="UAE">UAE</option>
              <option value="India">India</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="Singapore">Singapore</option>
              <option value="Netherlands">Netherlands</option>
              <option value="France">France</option>
              <option value="Canada">Canada</option>
              <option value="Australia">Australia</option>
            </select>
            <div className="flex rounded-lg border border-slate-300 p-1">
              {["quick", "full"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={`flex-1 px-3 py-2 text-sm font-medium ${
                    mode === m
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-slate-700"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                loading
                  ? "bg-slate-300 text-slate-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
              }`}
            >
              {loading ? "Fetching..." : "Run Analysis"}
            </button>
          </div>
        </section>

        <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            {typeof onBackToLanding === "function" ? (
              <button
                onClick={onBackToLanding}
                className="mb-3 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Back to Home
              </button>
            ) : null}
            <h2 className="text-2xl font-bold">AI Visibility Insights</h2>
            <p className="text-sm text-slate-600">
              Quick overview of AI market share, urgency, and actionable next
              steps.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">AI-generated insights</span>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Data-driven analysis</span>
              <span className="rounded-full bg-slate-200 px-3 py-1 text-slate-700">Updated in real-time</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
              Score trend: {scoreTrend.changeText}
            </span>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                loading
                  ? "bg-slate-300 text-slate-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
              }`}
              onClick={() =>
                generatePDFReport(data, trendRef, competitorsRef, sourcesRef)
              }
              disabled={loading}
            >
              Export Report
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                loading
                  ? "bg-slate-300 text-slate-500"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
              onClick={handleShare}
              disabled={loading}
            >
              Share Report
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                loading
                  ? "bg-slate-300 text-slate-500"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
              onClick={handleEmailShare}
              disabled={loading}
            >
              Email Share
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            {message}
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
            <span>{error}</span>
            <button
              onClick={fetchAnalysis}
              className="rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        )}

        {shareToast && (
          <div className="fixed bottom-5 right-5 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
            Link copied
          </div>
        )}

        {loading ? (
          <div className="grid gap-4">
            <div className="h-20 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-72 animate-pulse rounded-xl bg-slate-200" />
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-orange-300 bg-orange-50 p-4 shadow-lg">
              <div className="flex flex-col gap-2 text-orange-800">
                <h3 className="text-lg font-extrabold uppercase tracking-widest">
                  Visibility Alert
                </h3>
                <p className="text-sm font-semibold text-orange-900">
                  {data.biggestWeakness || data.summaryInsight || "No critical insight available."}
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Strategic Insights
              </h4>
              <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-800">Problem + Action</p>
                <p className="mt-2 text-sm text-slate-600">{conciseInsight}</p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {cardDefinitions.map((card) => (
                <article
                  key={card.label}
                  className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-opacity duration-500 ${
                    kpiAnimated ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {card.label}
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {data[card.valueKey]}
                    {card.suffix || ""}
                  </p>
                </article>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div
                className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                ref={trendRef}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    AI Visibility Score Trend
                  </h3>
                  <span className="text-xs text-slate-500">Last 6 months</span>
                </div>
                {(!data.trend || data.trend.length === 0) ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    No trend data yet — run a full analysis to unlock visibility history.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={data.trend}>
                      <defs>
                        <linearGradient
                          id="trendGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" style={{ fontSize: 12 }} />
                    <YAxis domain={[40, 80]} style={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="total"
                      stroke="#6366f1"
                      fill="url(#trendGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Traffic Source Performance
                  </h3>
                  <span className="text-xs text-slate-500">
                    AI + Organic impact
                  </span>
                </div>
                {(!hasTrustworthySourceSignals || !data.channelPerformance || data.channelPerformance.length === 0) ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Traffic sources require deeper analysis.
                    <br />
                    Run full analysis to unlock influence channels.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={data.channelPerformance}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="channel" style={{ fontSize: 12 }} />
                      <YAxis style={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar
                        dataKey="contribution"
                        fill="#0ea5e9"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {hasWeakSignals ? (
                <div className="xl:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
                  <h3 className="text-lg font-bold">Signal Quality Notice</h3>
                  <p className="mt-2 text-sm text-slate-500">
                    Quick analysis found limited signals. Run full analysis for accurate insights.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">{sourceConfidenceText}</p>
                </div>
              ) : null}

              {!hasWeakSignals ? (
              <div
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                ref={competitorsRef}
              >
                <div className="mb-3">
                  <h3 className="text-lg font-bold">Top Competitors</h3>
                  <p className="text-sm text-slate-500">
                    Brands outranking you in AI responses.
                  </p>
                </div>
                {(!data.topCompetitors || data.topCompetitors.length === 0) ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    <p>No strong competitors detected in this analysis.</p>
                    <p className="mt-2">This may indicate:</p>
                    <p className="mt-1">- limited data signals</p>
                    <p>- niche positioning</p>
                    <p>- or low competitive visibility</p>
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.topCompetitors}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" style={{ fontSize: 12 }} />
                        <YAxis style={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar
                          dataKey="score"
                          fill="#f59e0b"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-2">
                      {data.topCompetitors.map((comp) => {
                        let topClass = "text-slate-600";
                        let dominanceLabel = "Observed in responses";
                        if (comp.score >= 6) {
                          dominanceLabel = "Strong competitor signal";
                          topClass = "text-red-600";
                        } else if (comp.score >= 3) {
                          dominanceLabel = "Moderate competitor signal";
                          topClass = "text-orange-600";
                        }
                        return (
                          <div key={comp.name} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{comp.name}</span>
                              <div className="text-right">
                                <span className="text-slate-600">{comp.mentionCount} mentions</span>
                                <p className={`${topClass} text-xs font-semibold`}>{dominanceLabel}</p>
                                <p className="text-[11px] text-slate-500">{comp.appearanceRate}% appearance rate</p>
                              </div>
                            </div>
                            {comp.whyItAppears ? (
                              <p className="mt-1 text-[11px] text-slate-500">{comp.whyItAppears}</p>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              ) : null}

              {!hasWeakSignals ? (
              <div
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                ref={sourcesRef}
              >
                <div className="mb-3">
                  <h3 className="text-lg font-bold">Source Analysis</h3>
                  <p className="text-sm text-slate-500">
                    Top sources driving AI visibility.
                  </p>
                  <p className="mt-1 text-xs text-slate-500">{sourceConfidenceText}</p>
                </div>
                {(!hasTrustworthySourceSignals || !data.topSources || data.topSources.length === 0) ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    Limited source signals detected.
                    <br />
                    Full analysis provides deeper visibility into influence channels.
                  </div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={data.topSources}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" style={{ fontSize: 12 }} />
                        <YAxis style={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar
                          dataKey="score"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-2">
                      {data.topSources.map((src) => {
                        const typeLabels = {
                          product: "Official product content",
                          media: "High-authority media coverage",
                          industry: "Industry research and review signal",
                          community: "Community discussion signal",
                        };
                        const why = typeLabels[src.type] || "Trusted source";

                        return (
                          <div key={src.name || Math.random()} className="rounded-lg bg-slate-50 px-3 py-2 text-sm">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{src.name}</span>
                              <span className="text-slate-600">{src.mentionCount ? `${src.mentionCount} mentions` : "observed"}</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-500">{why}</p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {src.type} · {src.confidence} confidence{src.inferred ? " · Estimated source" : ""}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
              ) : null}
            </section>

            <section className="relative rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3">
                <h3 className="text-lg font-bold">Full AI Visibility Analysis</h3>
                <p className="text-sm text-slate-500">
                  In-depth ranking, prompt-level publishing recommendations, and
                  model-specific gap analysis.
                </p>
              </div>

              <div className="space-y-3">
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <li className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-medium">Biggest Weakness</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {data.biggestWeakness ? `${data.biggestWeakness} category needs attention` : 'Analysis in progress...'}
                    </p>
                  </li>
                  <li className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-medium">Top Competitor Threat</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {data.competitorThreat ? data.competitorThreat.split(' - ')[0] : 'No significant threats detected'}
                    </p>
                  </li>
                  <li className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-medium">Strongest Area</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {data.strongestArea ? `${data.strongestArea} category performing well` : 'Analysis in progress...'}
                    </p>
                  </li>
                  <li className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="font-medium">Content Opportunity</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {data.contentOpportunity ? data.contentOpportunity.substring(0, 50) + '...' : 'Unlock to discover opportunities'}
                    </p>
                  </li>
                </ul>
                <p className="text-sm text-slate-600">
                  Full data unlock reveals detailed competitor strategies, prompt-level optimizations, and actionable monthly playbooks.
                </p>
              </div>

              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-white/35 backdrop-blur-xl transition-opacity">
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-800">
                    You are currently losing visibility in AI search.
                  </p>
                  <ul className="mt-2 list-disc space-y-1 text-sm text-slate-700 pl-5 text-left">
                    <li>See exact competitor strategies</li>
                    <li>Get content plan to recover visibility</li>
                    <li>Identify hidden growth gaps</li>
                  </ul>
                  <button
                    onClick={() => setPremiumModalOpen(true)}
                    className="pointer-events-auto rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90"
                  >
                    Recover My Visibility
                  </button>
                  <span className="text-xs text-slate-600">
                    Enterprise | Team | Agency plans available; includes data export and stakeholder reporting.
                  </span>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {isPremiumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h4 className="text-2xl font-bold">Upgrade to Premium</h4>
                <p className="text-sm text-slate-600">
                  Unlock full AI visibility, exportable reporting, and quarterly
                  strategy sessions.
                </p>
              </div>
              <button
                onClick={() => setPremiumModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  tier: "Starter",
                  price: "$79/mo",
                  benefits: [
                    "Full Analysis",
                    "Prompt optimization",
                    "1 export/report",
                  ],
                },
                {
                  tier: "Growth",
                  price: "$169/mo",
                  benefits: [
                    "All Starter",
                    "Competitive AI signals",
                    "Weekly showback",
                  ],
                },
                {
                  tier: "Enterprise",
                  price: "$329/mo",
                  benefits: [
                    "All Growth",
                    "Dedicated SLA",
                    "On-demand custom playbooks",
                  ],
                },
              ].map((plan) => (
                <div
                  key={plan.tier}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <h5 className="text-lg font-semibold">{plan.tier}</h5>
                  <p className="mt-1 text-3xl font-bold">{plan.price}</p>
                  <ul className="mt-3 space-y-1 text-sm text-slate-600">
                    {plan.benefits.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan.tier)}
                    className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  >
                    Choose {plan.tier}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPremiumModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}