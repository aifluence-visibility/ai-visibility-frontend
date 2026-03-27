import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
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
  const normalizedBrand = (brandName || "").trim();
  const locationSuffix = targetCountry && targetCountry !== "Global" ? ` in ${targetCountry}` : "";

  const prompts = [
    `best ${normalizedBrand} competitors`,
    `${normalizedBrand} alternatives`,
    `${normalizedBrand} vs other ${industry} tools${locationSuffix}`,
    `is ${normalizedBrand} recommended by AI assistants${locationSuffix}`,
    `top companies similar to ${normalizedBrand}${locationSuffix}`,
  ];

  if (mode === "quick") {
    return prompts.slice(0, 2);
  }

  return prompts;
}

function mapAnalyzeResponse(analysis, payload, mode) {
  const normalizedAnalysis = analysis || {};
  const mentionsByPrompt = Array.isArray(normalizedAnalysis.mentionsByPrompt)
    ? normalizedAnalysis.mentionsByPrompt
    : [];
  const analyzedResponses = Array.isArray(normalizedAnalysis.analyzedResponses)
    ? normalizedAnalysis.analyzedResponses
    : [];

  const apiCompetitors = Array.isArray(normalizedAnalysis.competitors)
    ? normalizedAnalysis.competitors
    : [];

  const competitorsFromPrompts = mentionsByPrompt
    .flatMap((entry) => (Array.isArray(entry?.competitors) ? entry.competitors : []))
    .filter(Boolean);

  const totalPromptCount = Math.max(
    1,
    mentionsByPrompt.length ||
      buildPrompts(payload.brandName, payload.industry, payload.targetCountry, mode)
        .length
  );

  const topCompetitors = (apiCompetitors.length ? apiCompetitors : competitorsFromPrompts)
        .map((item) => {
          if (typeof item === "string") {
            return {
              name: item,
              mentionCount: 1,
              appearanceRate: Math.round((1 / totalPromptCount) * 100),
              score: 1,
              relevanceScore: 0,
              whyItAppears: `${item} appears in AI comparisons.`,
            };
          }

          const name = item?.name || item?.brand || "Unknown";
          const mentionCount = Number(
            item?.mentionCount ?? item?.count ?? item?.mentions ?? item?.score ?? 1
          );
          return {
            name,
            mentionCount,
            appearanceRate: Math.round((mentionCount / totalPromptCount) * 100),
            score: mentionCount,
            relevanceScore: Number(item?.relevanceScore ?? 0),
            whyItAppears:
              item?.whyItAppears ||
              `${name} appears in ${mentionCount}/${totalPromptCount} prompts.`,
          };
        })
        .slice(0, 6);

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

  const visibilityScore = Number(normalizedAnalysis.visibilityScore ?? 0);
  const totalMentions = Number(normalizedAnalysis.totalMentions ?? 0);
  const competitorMentionTotal = topCompetitors.reduce(
    (sum, item) => sum + Number(item.mentionCount || 0),
    0
  );
  const responseCount = Math.max(analyzedResponses.length, totalPromptCount);
  const sourceDomainCount = Object.keys(sourceCounter).length;
  const competitorPressureScore = Math.min(
    100,
    Math.round(
      (competitorMentionTotal / totalPromptCount) *
        20
    )
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
    biggestWeakness: `${payload.brandName} appears in only ${totalMentions}/${totalPromptCount} analyzed responses.`,
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
    totalMentions,
    promptCount: totalPromptCount,
    responseCount,
    sourceDomainCount,
    competitorMentionTotal,
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
  totalMentions: 0,
  promptCount: 0,
  responseCount: 0,
  sourceDomainCount: 0,
  competitorMentionTotal: 0,
  sourceDataMessage: "",
};

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
  initialIndustry = "",
  initialCountry = "Global",
  initialMode = "quick",
  autoRun = false,
  onBackToLanding,
}) {
  const [data, setData] = useState(defaultData);
  const [brandName, setBrandName] = useState(initialBrandName || "");
  const [industry, setIndustry] = useState(initialIndustry || "");
  const [customIndustry, setCustomIndustry] = useState("");
  const [country, setCountry] = useState(initialCountry || "Global");
  const [mode, setMode] = useState(initialMode || "quick");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPremiumModalOpen, setPremiumModalOpen] = useState(false);
  const [isEmailCaptureOpen, setEmailCaptureOpen] = useState(false);
  const [captureEmail, setCaptureEmail] = useState("");
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [shareToastText, setShareToastText] = useState("Done");
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(false);
  const [emailSubmitSuccess, setEmailSubmitSuccess] = useState(false);
  const [animatedHeroScore, setAnimatedHeroScore] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);
  const [isScorePulsing, setIsScorePulsing] = useState(false);
  const [showPostScoreSections, setShowPostScoreSections] = useState(true);

  const trendRef = useRef(null);
  const competitorsRef = useRef(null);
  const sourcesRef = useRef(null);
  const autoRunRef = useRef(false);
  const emailCaptureShownRef = useRef(false);

  const loadFromLocal = () => {
    try {
      const cachedData = window.localStorage.getItem("ai-visibility-last-analysis");
      const cachedSettings = window.localStorage.getItem("ai-visibility-settings");
      const cachedEmail = window.localStorage.getItem("ai-visibility-email");

      if (cachedData) {
        setData(JSON.parse(cachedData));
        setHasAnalyzedOnce(true);
      }

      if (cachedSettings) {
        const settings = JSON.parse(cachedSettings);
        if (settings.brandName) setBrandName(settings.brandName);
        if (settings.industry) setIndustry(settings.industry);
        if (settings.country) setCountry(settings.country);
        if (settings.mode) setMode(settings.mode);
      }

      if (cachedEmail) {
        setCaptureEmail(cachedEmail);
        setEmailCaptured(true);
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
    if (initialIndustry) setIndustry(initialIndustry);
  }, [initialIndustry]);

  useEffect(() => {
    if (initialCountry) setCountry(initialCountry);
  }, [initialCountry]);

  useEffect(() => {
    if (!initialMode) return;
    setMode(initialMode);
  }, [initialMode]);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }

    const stepTimer = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % 3);
    }, 800);

    return () => clearInterval(stepTimer);
  }, [loading]);

  const fetchAnalysis = useCallback(async () => {
    console.log("ANALYSIS TRIGGERED", { brandName, mode });
    if (!brandName.trim()) {
      setError("Brand name is required.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");
    setShowPostScoreSections(false);
    setIsScorePulsing(false);
    const loadingStartedAt = Date.now();

    try {
      const effectiveIndustry =
        industry === "custom"
          ? customIndustry.trim() || "other"
          : industry.trim() || "other";

      const payload = {
        brandName,
        industry: effectiveIndustry,
        targetCountry: country || "Global",
        mode,
      };

      const prompts = buildPrompts(
        payload.brandName,
        payload.industry,
        payload.targetCountry,
        mode
      );

      const requestBody = JSON.stringify({
        brandName: payload.brandName,
        prompts,
      });

      const res = await fetch(ANALYZE_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody,
      });

      let apiResponse = await res.json().catch(() => null);

      console.log("RAW RESPONSE", apiResponse);

      if (!res.ok) {
        console.log("Retrying...");
        await new Promise((r) => setTimeout(r, 2000));
        const retryRes = await fetch(ANALYZE_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        });
        apiResponse = await retryRes.json().catch(() => null);
        console.log("RAW RESPONSE (retry)", apiResponse);
      }

      if (!apiResponse) {
        throw new Error("Empty response from server.");
      }

      const data = apiResponse;
      const hasValidData =
        typeof data === "object" &&
        data !== null &&
        (Object.prototype.hasOwnProperty.call(data, "visibilityScore") ||
          Object.prototype.hasOwnProperty.call(data, "totalMentions") ||
          Array.isArray(data.competitors) ||
          Array.isArray(data.mentionsByPrompt));

      if (data?.error && !hasValidData) {
        throw new Error(data.error);
      }

      const visibilityScore = data.visibilityScore || 0;
      const competitors = data.competitors || [];
      const mentions = data.totalMentions || 0;

      if (hasValidData || visibilityScore || competitors.length || mentions) {
        setError("");
      }

      const mapped = mapAnalyzeResponse(
        { ...data, visibilityScore, competitors, totalMentions: mentions },
        payload,
        mode
      );

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
      setHasAnalyzedOnce(true);

      window.localStorage.setItem(
        "ai-visibility-last-analysis",
        JSON.stringify(mapped)
      );
      window.localStorage.setItem(
        "ai-visibility-settings",
        JSON.stringify({ brandName, industry, country, mode })
      );

      setMessage(`Loaded ${mode} analysis successfully.`);
      setTimeout(() => setShowPostScoreSections(true), 520);
      setTimeout(() => setMessage(""), 2000);
      if (!emailCaptured && !emailCaptureShownRef.current) {
        emailCaptureShownRef.current = true;
        setTimeout(() => setEmailCaptureOpen(true), 900);
      }
    } catch (error) {
      console.error("Analysis fetch error:", error);
      setError(error?.message || "Network request failed. Please try again.");
    } finally {
      const elapsed = Date.now() - loadingStartedAt;
      const minLoadingDuration = 2500;
      if (elapsed < minLoadingDuration) {
        await new Promise((resolve) => setTimeout(resolve, minLoadingDuration - elapsed));
      }
      setLoading(false);
    }
  }, [brandName, country, customIndustry, emailCaptured, industry, mode]);

  useEffect(() => {
    if (!autoRun || autoRunRef.current) return;
    if (!brandName.trim()) return;
    autoRunRef.current = true;
    fetchAnalysis();
  }, [autoRun, brandName, fetchAnalysis]);

  const showShareToast = (text) => {
    setShareToastText(text);
    setShareToast(true);
    setTimeout(() => setShareToast(false), 1800);
  };

  const getShareSummaryText = () => {
    const score = Number(data.visibilityScore ?? data.score ?? 0);
    const topCompetitor = Array.isArray(data.topCompetitors) && data.topCompetitors.length
      ? data.topCompetitors[0].name
      : "No dominant competitor detected";

    return [
      `AI Visibility Report - ${data.brandName || brandName || "Brand"}`,
      `Visibility Score: ${score}/100`,
      `Top Competitor: ${topCompetitor}`,
      `Insight: ${data.summaryInsight || conciseInsight}`,
      `View report: ${window.location.href}`,
    ].join("\n");
  };

  const handleDownloadReport = () => {
    // Simulated client-side PDF export (no backend dependency).
    generatePDFReport(data, trendRef, competitorsRef, sourcesRef);
    showShareToast("PDF report downloaded");
  };

  const handleCopySummary = async () => {
    if (!navigator.clipboard) {
      window.alert("Clipboard not supported in this browser");
      return;
    }
    try {
      await navigator.clipboard.writeText(getShareSummaryText());
      showShareToast("Summary copied");
    } catch {
      window.alert("Copy failed. Please copy manually.");
    }
  };

  const handleShareResult = async () => {
    const summaryText = getShareSummaryText();

    if (navigator.share) {
      try {
        await navigator.share({
          title: "AI Visibility Result",
          text: summaryText,
          url: window.location.href,
        });
        showShareToast("Result shared");
        return;
      } catch {
        // Fall back to clipboard copy when native share is dismissed or unsupported by context.
      }
    }

    if (!navigator.clipboard) {
      window.alert("Share is not available on this device.");
      return;
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      showShareToast("Share text copied");
    } catch {
      window.alert("Share failed. Please copy manually.");
    }
  };

  const handleUpgrade = (tier) => {
    setMode("full");
    setPremiumModalOpen(false);
    setMessage("Full Analysis unlocked. Run analysis to load complete insights.");
    setTimeout(() => setMessage(""), 2500);
  };

  const handleEmailCaptureSubmit = () => {
    const normalized = captureEmail.trim();
    if (!normalized || !normalized.includes("@")) {
      window.alert("Please enter a valid email address.");
      return;
    }

    window.localStorage.setItem("ai-visibility-email", normalized);
    setEmailCaptured(true);
    setEmailSubmitSuccess(true);
    setTimeout(() => {
      setEmailCaptureOpen(false);
      setEmailSubmitSuccess(false);
    }, 2000);
  };

  const isQuickMode = mode === "quick";
  const visibilityScoreValue = useMemo(
    () => Number(data.visibilityScore ?? data.score ?? 0),
    [data.visibilityScore, data.score]
  );

  const heroHeadline = useMemo(() => {
    if (!hasAnalyzedOnce) return "Is your brand invisible to AI?";
    if (visibilityScoreValue < 30) return "Your AI visibility is at risk.";
    if (visibilityScoreValue <= 70) return "Your AI visibility is unstable.";
    return "Your AI visibility is strong.";
  }, [hasAnalyzedOnce, visibilityScoreValue]);

  const heroSubtext = useMemo(() => {
    if (!hasAnalyzedOnce) return "Millions of buying decisions now start with an AI answer. Find out if your brand is part of that answer.";
    if (visibilityScoreValue < 30)
      return "You are losing visibility to competitors in AI search.";
    if (visibilityScoreValue <= 70)
      return "You are losing visibility to competitors in AI search.";
    return "Competitors are actively contesting your visibility in AI search.";
  }, [hasAnalyzedOnce, visibilityScoreValue]);

  const heroConsequence = useMemo(() => {
    if (!hasAnalyzedOnce) return null;
    if (visibilityScoreValue < 30)
      return "You are missing a significant portion of demand in your category.";
    if (visibilityScoreValue <= 70)
      return "You are missing a significant portion of demand in your category.";
    return "Protect your lead now or competitors will capture high-value demand.";
  }, [hasAnalyzedOnce, visibilityScoreValue]);

  const riskScore = useMemo(
    () => Math.max(0, Math.min(100, 100 - visibilityScoreValue)),
    [visibilityScoreValue]
  );

  const heroGradient = useMemo(() => {
    if (visibilityScoreValue < 30) {
      return "from-rose-600 via-red-500 to-orange-500";
    }
    if (visibilityScoreValue <= 70) {
      return "from-amber-400 via-yellow-500 to-orange-500";
    }
    return "from-emerald-500 via-green-500 to-lime-500";
  }, [visibilityScoreValue]);

  const riskLabel = useMemo(() => {
    if (visibilityScoreValue < 30) return "High";
    if (visibilityScoreValue <= 70) return "Medium";
    return "Low";
  }, [visibilityScoreValue]);

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

  const displayedTopCompetitors = useMemo(() => {
    const list = Array.isArray(data.topCompetitors) ? [...data.topCompetitors] : [];
    const sorted = list.sort((a, b) => {
      const aRate = Number(a?.appearanceRate ?? 0);
      const bRate = Number(b?.appearanceRate ?? 0);
      if (aRate !== bRate) return bRate - aRate;
      return Number(b?.mentionCount ?? 0) - Number(a?.mentionCount ?? 0);
    });
    return isQuickMode ? sorted.slice(0, 3) : sorted.slice(0, 5);
  }, [data.topCompetitors, isQuickMode]);

  const hiddenCompetitorCount = useMemo(() => {
    const fullCount = Array.isArray(data.topCompetitors) ? data.topCompetitors.length : 0;
    return Math.max(0, fullCount - displayedTopCompetitors.length);
  }, [data.topCompetitors, displayedTopCompetitors.length]);

  const competitorChartData = useMemo(() => {
    const promptCount = Math.max(1, Number(data.promptCount || 0));
    const brandRate = Number(data.totalMentions || 0)
      ? Math.round((Number(data.totalMentions || 0) / promptCount) * 100)
      : Math.round(visibilityScoreValue);
    const brandEntry = {
      name: (brandName || "Your Brand").slice(0, 14),
      appearanceRate: hasAnalyzedOnce ? Math.max(0, Math.min(100, brandRate)) : 0,
      isAnalyzedBrand: true,
    };
    const competitors = displayedTopCompetitors.slice(0, 5).map((c) => {
      const finalRate = Math.max(0, Math.min(100, Number(c.appearanceRate || 0)));
      return {
        name: (c.name || "Competitor").slice(0, 14),
        appearanceRate: finalRate,
        isAnalyzedBrand: false,
      };
    });
    return [brandEntry, ...competitors];
  }, [brandName, data.promptCount, data.totalMentions, displayedTopCompetitors, hasAnalyzedOnce, visibilityScoreValue]);

  const promptCountValue = Math.max(0, Number(data.promptCount || 0));
  const responseCountValue = Math.max(0, Number(data.responseCount || 0));
  const sourceDomainCountValue = Math.max(0, Number(data.sourceDomainCount || 0));
  const competitorMentionTotalValue = Math.max(0, Number(data.competitorMentionTotal || 0));

  const displayedCompetitors = displayedTopCompetitors;

  const topCompetitorName = displayedCompetitors[0]?.name || "No clear leader";

  const prioritizedActions = useMemo(() => {
    const topCompetitor = displayedCompetitors[0]?.name || "top competitors";
    return [
      `Create competitor comparison pages immediately vs ${topCompetitor} to capture lost demand`,
      "Publish pages targeting high-volume buyer queries now to reclaim visibility",
      "Secure mentions in trusted domains AI cites to stop competitor dominance",
    ];
  }, [displayedCompetitors]);

  const whatThisMeansLead = useMemo(() => {
    if (!displayedCompetitors.length) {
      return "Your AI visibility is currently weak and inconsistent across buying queries.";
    }
    return `${brandName || "Your brand"} is losing recommendation share to ${displayedCompetitors[0].name} in key comparison queries.`;
  }, [brandName, displayedCompetitors]);

  const estimatedMissedDemand = Math.max(0, Math.min(100, Math.round(100 - visibilityScoreValue)));

  const confidenceSummary = useMemo(() => {
    if (responseCountValue >= 5 && sourceDomainCountValue >= 3) {
      return "Confidence: High";
    }
    if (responseCountValue >= 2) {
      return "Confidence: Medium (limited dataset)";
    }
    return "Confidence: Low (very limited dataset)";
  }, [responseCountValue, sourceDomainCountValue]);

  const methodologyText = useMemo(() => {
    return `Score is based on relative visibility vs competitors using ${responseCountValue || promptCountValue || 0} AI responses, ${competitorMentionTotalValue} competitor mentions, and ${sourceDomainCountValue} source domains`;
  }, [competitorMentionTotalValue, promptCountValue, responseCountValue, sourceDomainCountValue]);

  useEffect(() => {
    const target = Math.max(0, Math.min(100, Math.round(visibilityScoreValue)));
    let current = 0;
    const timer = setInterval(() => {
      current += Math.max(1, Math.ceil((target - current) / 6));
      if (current >= target) {
        setAnimatedHeroScore(target);
        setIsScorePulsing(true);
        setTimeout(() => setIsScorePulsing(false), 340);
        clearInterval(timer);
      } else {
        setAnimatedHeroScore(current);
      }
    }, 26);

    return () => clearInterval(timer);
  }, [visibilityScoreValue]);

  return (
    <div className="min-h-screen bg-[#0B0F1A] text-[#E5E7EB] p-5 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        {shareToast && (
          <div className="fixed bottom-5 right-5 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg">
            {shareToastText}
          </div>
        )}

        <section className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${heroGradient} p-6 md:p-8 text-white shadow-[0_0_45px_rgba(59,130,246,0.35)]`}>
          <div className="absolute inset-0 bg-[#020617]/35" />
          <div className="relative z-10 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide">
                  {hasAnalyzedOnce ? "AI Visibility Report" : "AI Visibility Scanner"}
                </span>
                <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">
                  {heroHeadline}
                </h1>
                <p className="mt-3 max-w-2xl text-lg font-medium text-white/90">
                  {heroSubtext}
                </p>
                <p className="mt-2 max-w-2xl text-sm font-semibold text-white/80">
                  {heroConsequence || "We analyze your brand across AI-generated search results."}
                </p>
                {hasAnalyzedOnce ? (
                  <p className="mt-1 max-w-2xl text-sm font-bold text-red-200">
                    Right now, users are seeing your competitors instead of you.
                  </p>
                ) : null}
                <p className="mt-1 max-w-2xl text-sm font-semibold text-amber-200">
                  Every day you delay, competitors strengthen their position in AI results.
                </p>
              </div>
              {typeof onBackToLanding === "function" ? (
                <button
                  onClick={onBackToLanding}
                  className="rounded-lg border border-white/30 bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15"
                >
                  Back
                </button>
              ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-2xl border border-white/20 bg-slate-950/20 p-5">
                <div className="flex flex-wrap items-end gap-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Visibility score</p>
                    <p className={`mt-1 text-6xl font-extrabold tracking-tight transition-all duration-300 ${isScorePulsing ? "scale-110 drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]" : "scale-100"}`}>
                      {animatedHeroScore}<span className="text-2xl font-bold opacity-60">/100</span>
                    </p>
                  </div>
                  <div className="pb-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/60">Risk level</p>
                    <p className="mt-1 inline-flex items-center rounded-xl border border-white/25 bg-white/10 px-4 py-2 text-lg font-bold">
                      {riskLabel}
                      <span className="ml-2 text-sm font-semibold text-white/75">({riskScore}/100)</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-1 text-sm text-white/80">
                  <p>{methodologyText}</p>
                  <p>{confidenceSummary}</p>
                  <p>If your brand is not mentioned in AI answers, users will choose competitors.</p>
                  <p>Data based on AI-generated responses (ChatGPT, Gemini, etc.)</p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/20 bg-slate-950/20 p-5">
                <p className="text-sm font-semibold text-white/85">Run or refine analysis</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <input
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="rounded-lg border border-white/20 bg-slate-950/35 px-3 py-2 text-white placeholder:text-white/40"
                    placeholder="Brand name"
                  />
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="rounded-lg border border-white/20 bg-slate-950/35 px-3 py-2 text-white"
                  >
                    <option value="Global">Global</option>
                    <option value="USA">USA</option>
                    <option value="UK">UK</option>
                    <option value="Germany">Germany</option>
                    <option value="Turkey">Turkey</option>
                    <option value="UAE">UAE</option>
                    <option value="India">India</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </select>
                  <div className="md:col-span-2 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <select
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="rounded-lg border border-white/20 bg-slate-950/35 px-3 py-2 text-white"
                    >
                      <option value="">Auto-detect industry</option>
                      <option value="fintech">Fintech</option>
                      <option value="ecommerce">E-commerce</option>
                      <option value="saas">SaaS</option>
                      <option value="ai">AI Tools</option>
                      <option value="real estate">Real Estate</option>
                      <option value="education">Education</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="travel">Travel</option>
                      <option value="hospitality">Hospitality</option>
                      <option value="marketplace">Marketplace</option>
                      <option value="crypto">Crypto</option>
                      <option value="logistics">Logistics</option>
                      <option value="other">Other</option>
                      <option value="custom">Custom industry…</option>
                    </select>
                    <div className="flex rounded-lg border border-white/20 p-1">
                      {["quick", "full"].map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMode(m)}
                          className={`px-3 py-2 text-sm font-semibold ${mode === m ? "rounded-md bg-white text-slate-950" : "text-white/75"}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={fetchAnalysis}
                      disabled={loading}
                      className={`rounded-lg px-4 py-2 text-sm font-bold ${loading ? "bg-slate-700 text-slate-400" : "bg-white text-slate-950 hover:bg-slate-100"}`}
                    >
                      {loading ? "Analyzing..." : "Run Analysis"}
                    </button>
                  </div>
                  {industry === "custom" ? (
                    <input
                      value={customIndustry}
                      onChange={(e) => setCustomIndustry(e.target.value)}
                      className="md:col-span-2 rounded-lg border border-white/20 bg-slate-950/35 px-3 py-2 text-white placeholder:text-white/40"
                      placeholder="Type your industry"
                    />
                  ) : null}
                </div>
                {hasAnalyzedOnce ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                      onClick={handleDownloadReport}
                      disabled={loading}
                    >
                      Download PDF
                    </button>
                    <button
                      className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                      onClick={handleCopySummary}
                      disabled={loading}
                    >
                      Copy Summary
                    </button>
                    <button
                      className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
                      onClick={handleShareResult}
                      disabled={loading}
                    >
                      Share
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {message ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="flex items-center justify-between rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
            <span>{error}</span>
            <button
              onClick={fetchAnalysis}
              className="rounded-lg bg-red-600 px-3 py-1 text-sm font-semibold text-white hover:bg-red-500"
            >
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F1A]/95 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#111827] p-8 shadow-[0_0_50px_rgba(59,130,246,0.25)]">
              <div className="mb-6 flex items-center justify-center gap-2">
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-blue-400 [animation-delay:0ms]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
                <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
              </div>
              <h3 className="text-center text-2xl font-bold text-white">Analyzing AI visibility...</h3>
              <div className="mt-6 space-y-3 text-sm">
                {["scanning AI responses", "detecting competitors", "calculating visibility score"].map((step, idx) => {
                  const isActive = idx === loadingStep;
                  const isPassed = idx < loadingStep;
                  return (
                    <div
                      key={step}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all duration-300 ${isActive ? "border-blue-400/60 bg-blue-500/10 text-blue-200" : isPassed ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200" : "border-slate-700 bg-slate-900 text-slate-400"}`}
                    >
                      <span className="capitalize">{step}</span>
                      <span>{isActive ? "..." : isPassed ? "done" : "pending"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : hasAnalyzedOnce ? (
          <>
            <section className={`rounded-2xl border border-slate-700 bg-[#111827] p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <h2 className="text-xl font-bold text-white">What should you do next?</h2>
              <p className="mt-1 text-sm text-slate-400">Prioritized actions to recover visibility quickly.</p>
              <ol className="mt-4 grid gap-3 md:grid-cols-3">
                {prioritizedActions.map((item, idx) => (
                  <li key={item} className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-200">
                    <p className="text-xs font-bold uppercase tracking-wide text-cyan-400">Priority {idx + 1}</p>
                    <p className="mt-2 font-semibold text-white">{item}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className={`rounded-2xl border border-slate-700 bg-[#111827] p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <h2 className="text-xl font-bold text-white">What this means</h2>
              <p className="mt-2 text-sm font-semibold text-slate-100">{whatThisMeansLead}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                <li>• You are losing visibility to {topCompetitorName} in comparison queries.</li>
                <li>• {brandName || "Your brand"} appears inconsistently in AI-generated answers.</li>
                <li>• High-value queries are still dominated by competitors.</li>
              </ul>
            </section>

            <section className={`rounded-2xl border border-amber-700/40 bg-amber-950/20 p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <h2 className="text-xl font-bold text-white">Business Impact</h2>
              <p className="mt-2 text-sm text-amber-100">You are missing up to {estimatedMissedDemand}% of AI-driven demand in your category.</p>
              <p className="mt-1 text-sm font-semibold text-amber-50">This means you are losing a significant share of potential traffic and conversions.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm">
                <div className="rounded-lg border border-amber-700/30 bg-amber-900/20 p-3 text-amber-100">
                  Estimated traffic loss: {estimatedMissedDemand}% of AI recommendation opportunity
                </div>
                <div className="rounded-lg border border-emerald-700/30 bg-emerald-900/20 p-3 text-emerald-100">
                  This directly impacts traffic, conversions, and revenue.
                </div>
              </div>
            </section>

            <section className={`rounded-2xl border border-slate-700 bg-[#111827] p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`} ref={competitorsRef}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Competitors</h2>
                  <p className="mt-1 text-sm font-semibold text-amber-300">Top competitor: {topCompetitorName}</p>
                  <p className="mt-1 text-sm font-semibold text-red-300">Your biggest competitor is capturing visibility in key queries.</p>
                  <p className="mt-1 text-sm text-slate-400">This chart shows how often your brand appears in AI-generated responses compared to competitors.</p>
                  <p className="mt-1 text-xs text-slate-500">Share of visibility in AI answers. Data based on AI-generated responses (ChatGPT, Gemini, etc.)</p>
                </div>
                {isQuickMode && hiddenCompetitorCount > 0 ? (
                  <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-3 py-1 text-xs font-semibold text-amber-300">+{hiddenCompetitorCount} hidden</span>
                ) : null}
              </div>
              {displayedCompetitors.length === 0 ? (
                <div className="mt-4 rounded-xl border border-amber-700/30 bg-amber-950/20 p-4 text-sm text-amber-100">
                  Limited competitor signal detected. The current dataset is too small for a strong market read.
                </div>
              ) : (
                <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
                  <div className="relative rounded-xl border border-slate-700 bg-slate-900 p-4">
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={competitorChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="name" tick={{ fill: "#9CA3AF", fontSize: 11 }} />
                        <YAxis unit="%" tick={{ fill: "#9CA3AF", fontSize: 11 }} domain={[0, 100]} />
                        <Tooltip
                          formatter={(val) => [`${val}%`, "Visibility share"]}
                          contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                          labelStyle={{ color: "#E5E7EB" }}
                          itemStyle={{ color: "#E5E7EB" }}
                        />
                        <Bar dataKey="appearanceRate" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={900}>
                          {competitorChartData.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.isAnalyzedBrand ? "#6366f1" : "#f59e0b"} opacity={entry.isAnalyzedBrand ? 1 : 0.85} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    {isQuickMode ? (
                      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/65 backdrop-blur-sm">
                        <button
                          onClick={() => setPremiumModalOpen(true)}
                          className="rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-5 py-2 text-sm font-bold text-white"
                        >
                          🔒 This is only a preview. Upgrade to see real insights.
                        </button>
                      </div>
                    ) : null}
                  </div>
                  <div className="space-y-2">
                    {displayedCompetitors.map((comp, idx) => (
                      <div key={comp.name} className={`rounded-xl border p-3 ${idx === 0 ? "border-amber-400/60 bg-amber-900/20" : "border-slate-700 bg-slate-900"}`}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-semibold text-white">{comp.name}</p>
                          <p className="text-sm font-semibold text-slate-300">{comp.appearanceRate}%</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{comp.whyItAppears || `${comp.name} appears frequently across measured prompts.`}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <section className={`rounded-2xl border border-slate-700 bg-[#111827] p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">See exactly how to win back visibility</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {isQuickMode
                      ? "Get the full competitor map, query-level gaps, and execution guidance to recover demand."
                      : "Full analysis is active. Re-run anytime as your content and market position change."}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-slate-100">Unlock to see:</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300">
                    <li>• exact queries where you lose visibility</li>
                    <li>• which competitors dominate each query</li>
                    <li>• step-by-step recovery strategy</li>
                  </ul>
                </div>
                <button
                  onClick={() => setPremiumModalOpen(true)}
                  className="rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-6 py-3 text-sm font-bold text-white"
                >
                  {isQuickMode ? "See exactly how to win back visibility" : "Manage Full Analysis"}
                </button>
              </div>
            </section>
          </>
        ) : null}
      </div>

      {isPremiumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#111827] p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h4 className="text-2xl font-bold text-white">See exactly how to win back visibility</h4>
                <p className="text-sm text-slate-300">
                  Unlock the full roadmap to recover AI-driven demand.
                </p>
              </div>
              <button
                onClick={() => setPremiumModalOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-sm font-semibold text-slate-100">What you unlock:</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Full competitor analysis</li>
                <li>• Query-level visibility gaps and source insights</li>
                <li>• Exact actions to recover and grow visibility</li>
              </ul>
              <button
                onClick={() => handleUpgrade("full")}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                See exactly how to win back visibility
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setPremiumModalOpen(false)}
                className="rounded-lg border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-100"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}

      {isEmailCaptureOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-6 shadow-2xl">
            {emailSubmitSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/40">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="text-xl font-bold text-white">Report sent to your inbox</p>
                <p className="mt-2 text-sm text-slate-400">We'll send your first AI visibility report shortly.</p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-white">Get your AI visibility report</h4>
                    <p className="mt-1 text-sm text-slate-400">We'll send you a breakdown of:</p>
                  </div>
                  <button
                    onClick={() => setEmailCaptureOpen(false)}
                    className="text-slate-400 hover:text-slate-100 ml-3 flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>

                <ul className="mb-5 space-y-2 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-400 font-bold">•</span>
                    <span>Where you lose visibility to competitors</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-400 font-bold">•</span>
                    <span>Which competitors beat you in AI answers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-0.5 text-emerald-400 font-bold">•</span>
                    <span>What to fix this week</span>
                  </li>
                </ul>

                <input
                  type="email"
                  value={captureEmail}
                  onChange={(e) => setCaptureEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEmailCaptureSubmit(); }}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
                />

                <button
                  onClick={handleEmailCaptureSubmit}
                  className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-95 transition-opacity"
                >
                  Send my report
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}