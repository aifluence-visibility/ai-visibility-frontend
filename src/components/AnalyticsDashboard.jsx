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
  const competitorPressureScore = Math.min(
    100,
    Math.round(
      (topCompetitors.reduce((sum, item) => sum + item.mentionCount, 0) /
        totalPromptCount) *
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
  const [isEmailCaptureOpen, setEmailCaptureOpen] = useState(false);
  const [captureEmail, setCaptureEmail] = useState("");
  const [emailCaptured, setEmailCaptured] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [shareToastText, setShareToastText] = useState("Done");
  const [kpiAnimated, setKpiAnimated] = useState(false);
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

      if (cachedData) setData(JSON.parse(cachedData));

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
    setKpiAnimated(false);
    setShowPostScoreSections(false);
    setIsScorePulsing(false);
    const loadingStartedAt = Date.now();

    try {
      const payload = {
        brandName,
        industry: industry === "custom" ? (customIndustry || "other") : industry,
        targetCountry: country,
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
    setEmailCaptureOpen(false);
    setMessage("Weekly AI visibility insights enabled.");
    setTimeout(() => setMessage(""), 2200);
  };

  const isQuickMode = mode === "quick";
  const visibilityScoreValue = useMemo(
    () => Number(data.visibilityScore ?? data.score ?? 0),
    [data.visibilityScore, data.score]
  );

  const confidenceText = useMemo(() => {
    if (isQuickMode) return "Quick analysis preview (limited data depth)";
    return "Full analysis mode (complete signal coverage)";
  }, [isQuickMode]);

  const sampleSizeText = useMemo(() => {
    if (isQuickMode) return "Upgrade to full analysis for full competitor and source intelligence.";
    return "";
  }, [isQuickMode]);

  const heroHeadline = useMemo(() => {
    if (visibilityScoreValue < 30) return "You are losing visibility.";
    if (visibilityScoreValue <= 70) return "Your visibility is unstable.";
    return "Your visibility is strong.";
  }, [visibilityScoreValue]);

  const heroSupportText = useMemo(() => {
    if (visibilityScoreValue < 30) return "AI assistants are not consistently recommending your brand in critical prompts.";
    if (visibilityScoreValue <= 70) return "Your brand appears intermittently; competitors are still capturing meaningful share.";
    return "Your brand is performing strongly across AI responses. Keep compounding this lead.";
  }, [visibilityScoreValue]);

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

  const displayedTopCompetitors = useMemo(() => {
    const list = Array.isArray(data.topCompetitors) ? data.topCompetitors : [];
    return isQuickMode ? list.slice(0, 3) : list;
  }, [data.topCompetitors, isQuickMode]);

  const hiddenCompetitorCount = useMemo(() => {
    const fullCount = Array.isArray(data.topCompetitors) ? data.topCompetitors.length : 0;
    return Math.max(0, fullCount - displayedTopCompetitors.length);
  }, [data.topCompetitors, displayedTopCompetitors.length]);

  const actionPlan = useMemo(() => {
    const topCompetitor = displayedTopCompetitors[0]?.name || "competitors";
    const weakness = data.biggestWeakness || "Low visibility in high-intent AI prompts.";
    const sourceGap = hasTrustworthySourceSignals
      ? "Source presence is improving but still uneven across channels."
      : "Source credibility is weak in AI-cited channels.";

    return [
      {
        problem: weakness,
        recommendation: `Publish comparison and alternative pages targeting ${topCompetitor} and adjacent buyer intent.` ,
        impact: "Expected impact: +10-20 visibility points in high-intent prompts within 4-8 weeks.",
      },
      {
        problem: sourceGap,
        recommendation: "Create citation-ready assets: benchmark pages, FAQs, and evidence-backed feature pages.",
        impact: "Expected impact: stronger source trust and more consistent AI recommendations.",
      },
      {
        problem: "Conversion narrative is not clearly differentiated in AI summaries.",
        recommendation: "Define 3 core brand claims and repeat them consistently in homepage, docs, and comparison content.",
        impact: "Expected impact: better recommendation quality and reduced competitor substitution.",
      },
    ];
  }, [data.biggestWeakness, displayedTopCompetitors, hasTrustworthySourceSignals]);

  const topSummary = useMemo(() => {
    const topCompetitor = displayedTopCompetitors[0]?.name;
    const mainProblem = data.biggestWeakness || "Your brand appears inconsistently in AI answers.";
    const opportunity = topCompetitor
      ? `Opportunity: Build direct comparison pages against ${topCompetitor}.`
      : "Opportunity: Expand high-intent prompt coverage to gain recommendation share.";
    const nextAction = isQuickMode
      ? "Next action: Unlock Full Analysis to reveal complete competitor and source intelligence."
      : "Next action: Execute the action plan and track visibility weekly.";
    const sentence = visibilityScoreValue < 50
      ? `AI recommendation momentum is currently against ${brandName || "your brand"}, but recoverable with focused execution.`
      : `${brandName || "Your brand"} has measurable AI visibility momentum, with clear opportunities to widen the lead.`;

    return {
      sentence,
      bullets: [mainProblem, opportunity, nextAction],
    };
  }, [brandName, data.biggestWeakness, displayedTopCompetitors, isQuickMode, visibilityScoreValue]);

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
    <div className="min-h-screen bg-[#0B0F1A] text-[#E5E7EB] p-5 md:p-8">
      <div className="mx-auto max-w-[1500px] space-y-5">
        <div className={`rounded-2xl bg-gradient-to-r ${heroGradient} p-8 text-white shadow-[0_0_45px_rgba(59,130,246,0.35)] relative overflow-hidden transition-all duration-500`}>
          <div className="absolute inset-0 bg-[#020617]/35"></div>
          <div className="relative z-10">
            <div className="mb-6">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-white/20 text-white border border-white/30">
                ⚠️ AI Visibility Alert
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              {heroHeadline}
            </h1>
            <p className="text-xl font-medium mb-8 opacity-90">
              {heroSupportText}
            </p>
            <p className="mb-6 text-sm text-slate-200">{confidenceText}</p>
            {sampleSizeText ? <p className="mb-6 text-xs text-slate-200">{sampleSizeText}</p> : null}
            <div className="mb-4 flex items-end gap-2">
              <p
                className={`text-5xl font-extrabold tracking-tight transition-all duration-300 ${
                  isScorePulsing
                    ? "scale-110 drop-shadow-[0_0_16px_rgba(255,255,255,0.8)]"
                    : "scale-100 drop-shadow-[0_0_0_rgba(255,255,255,0)]"
                }`}
              >
                {animatedHeroScore}
              </p>
              <p className="pb-1 text-sm font-semibold text-white/85">AI Visibility Score</p>
            </div>
            <div className="mb-6 inline-flex items-center rounded-xl border border-white/40 bg-white/15 px-4 py-2">
              <p className="text-base font-bold text-white">Risk: {riskScore}/100 ({riskLabel})</p>
            </div>
            <button
              onClick={() => setPremiumModalOpen(true)}
              className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-indigo-700 shadow-lg hover:shadow-xl hover:bg-gray-50 hover:shadow-white/25 transition-all duration-300"
            >
              {isQuickMode ? "Unlock Full Analysis" : "Optimize My Visibility"}
            </button>
          </div>
        </div>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-5 shadow-sm transition-all duration-500">
          <p className="text-lg font-bold text-white">{topSummary.sentence}</p>
          <ul className="mt-3 space-y-1 text-sm text-slate-300">
            {topSummary.bullets.map((item, idx) => (
              <li key={idx}>• {item}</li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-[0_0_28px_rgba(17,24,39,0.9)]">
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
                  className={`flex-1 px-3 py-2 text-sm font-medium transition ${
                    mode === m
                      ? "bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] text-white"
                      : "bg-[#0B0F1A] text-slate-300"
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
                  ? "bg-slate-700 text-slate-400"
                  : "bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] text-white hover:opacity-95"
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
            <h2 className="text-2xl font-bold text-white">AI Visibility Insights</h2>
            <p className="text-sm text-slate-300">
              Quick overview of AI market share, urgency, and actionable next
              steps.
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">AI-generated insights</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">Data-driven analysis</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-slate-200">Updated in real-time</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200">
              Score trend: {scoreTrend.changeText}
            </span>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                loading
                  ? "bg-slate-300 text-slate-500"
                  : "bg-indigo-600 text-white hover:bg-indigo-500"
              }`}
              onClick={handleDownloadReport}
              disabled={loading}
            >
              Download Report (PDF)
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                loading
                  ? "bg-slate-300 text-slate-500"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
              onClick={handleCopySummary}
              disabled={loading}
            >
              Copy Summary
            </button>
            <button
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                loading
                  ? "bg-slate-300 text-slate-500"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
              onClick={handleShareResult}
              disabled={loading}
            >
              Share result
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
            {shareToastText}
          </div>
        )}

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
                {[
                  "scanning AI responses",
                  "detecting competitors",
                  "calculating visibility score",
                ].map((step, idx) => {
                  const isActive = idx === loadingStep;
                  const isPassed = idx < loadingStep;

                  return (
                    <div
                      key={step}
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 transition-all duration-300 ${
                        isActive
                          ? "border-blue-400/60 bg-blue-500/10 text-blue-200"
                          : isPassed
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                          : "border-slate-700 bg-slate-900 text-slate-400"
                      }`}
                    >
                      <span className="capitalize">{step}</span>
                      <span>{isActive ? "..." : isPassed ? "done" : "pending"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className={`rounded-2xl border border-orange-700/60 bg-orange-950/30 p-4 shadow-lg transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <div className="flex flex-col gap-2 text-orange-800">
                <h3 className="text-lg font-extrabold uppercase tracking-widest">
                  Visibility Alert
                </h3>
                <p className="text-sm font-semibold text-orange-200">
                  {data.biggestWeakness || data.summaryInsight || "No critical insight available."}
                </p>
              </div>
            </section>

            <section className={`rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-sm transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <h4 className="text-sm font-bold uppercase tracking-wide text-slate-400">
                Strategic Insights
              </h4>
              <div className="mt-3 rounded-xl border border-slate-700 bg-slate-900 p-4">
                <p className="text-sm font-semibold text-slate-100">Problem + Action</p>
                <p className="mt-2 text-sm text-slate-300">{conciseInsight}</p>
              </div>
              {isQuickMode ? (
                <div className="mt-4 rounded-xl border border-indigo-500/50 bg-indigo-500/10 p-4">
                  <p className="text-sm font-semibold text-indigo-200">🔒 Upgrade to see real insights</p>
                  <p className="mt-1 text-xs text-indigo-100/80">Unlock detailed charts, source insights, and an execution-ready action plan.</p>
                  <button
                    onClick={() => setPremiumModalOpen(true)}
                    className="mt-3 rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 hover:shadow-[0_0_24px_rgba(139,92,246,0.45)] transition"
                  >
                    Unlock Full Analysis
                  </button>
                </div>
              ) : null}
            </section>

            <section className={`rounded-2xl border border-slate-800 bg-[#111827] p-4 shadow-sm transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold uppercase tracking-wide text-slate-400">Action Plan</h4>
                {isQuickMode ? <span className="text-xs text-slate-400">Locked in quick mode</span> : null}
              </div>
              <div className="relative">
                <div className="grid gap-3 md:grid-cols-3">
                  {actionPlan.map((item, idx) => (
                    <article
                      key={idx}
                      className={`rounded-xl border border-slate-700 bg-slate-900 p-4 transition-all duration-300 ${
                        isQuickMode && idx > 0 ? "blur-sm opacity-55" : ""
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">Problem</p>
                      <p className="mt-1 text-sm text-slate-200">{item.problem}</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-emerald-300">Recommendation</p>
                      <p className="mt-1 text-sm text-slate-200">{item.recommendation}</p>
                      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-cyan-300">Expected Impact</p>
                      <p className="mt-1 text-sm text-slate-200">{item.impact}</p>
                    </article>
                  ))}
                </div>
                {isQuickMode ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-slate-950/45">
                    <button
                      onClick={() => setPremiumModalOpen(true)}
                      className="rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-5 py-2 text-sm font-semibold text-white hover:shadow-[0_0_24px_rgba(59,130,246,0.45)] transition"
                    >
                      🔒 Upgrade to see real insights
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-3 xl:grid-cols-6">
              {(isQuickMode ? cardDefinitions.filter((card) => card.valueKey === "score") : cardDefinitions).map((card) => (
                <article
                  key={card.label}
                  className={`rounded-2xl border border-slate-700 bg-[#111827] p-4 shadow-sm transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_0_22px_rgba(59,130,246,0.2)] ${
                    kpiAnimated ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-slate-400">
                    {card.label}
                  </p>
                  <p
                    className={`mt-2 text-2xl font-bold text-white transition-all duration-300 ${
                      card.valueKey === "score" && isScorePulsing
                        ? "scale-110 drop-shadow-[0_0_12px_rgba(34,197,94,0.85)]"
                        : "scale-100"
                    }`}
                  >
                    {card.valueKey === "score" ? animatedHeroScore : data[card.valueKey]}
                    {card.suffix || ""}
                  </p>
                </article>
              ))}
            </section>

            <section className={`grid grid-cols-1 gap-4 xl:grid-cols-3 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <div
                className="xl:col-span-2 rounded-2xl border border-slate-700 bg-[#111827] p-4 shadow-sm relative"
                ref={trendRef}
              >
                <div className={`mb-3 flex items-center justify-between ${isQuickMode ? "blur-sm" : ""}`}>
                  <h3 className="text-sm font-semibold">
                    AI Visibility Score Trend
                  </h3>
                  <span className="text-xs text-slate-500">Last 6 months</span>
                </div>
                <div className={isQuickMode ? "blur-sm select-none" : ""}>
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
                      isAnimationActive
                      animationDuration={900}
                    />
                  </AreaChart>
                </ResponsiveContainer>
                )}
                </div>
                {isQuickMode ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/45">
                    <button
                      onClick={() => setPremiumModalOpen(true)}
                      className="rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:shadow-[0_0_24px_rgba(34,197,94,0.45)] transition"
                    >
                      🔒 Upgrade to see real insights
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-700 bg-[#111827] p-4 shadow-sm relative">
                <div className={`mb-3 flex items-center justify-between ${isQuickMode ? "blur-sm" : ""}`}>
                  <h3 className="text-sm font-semibold">
                    Traffic Source Performance
                  </h3>
                  <span className="text-xs text-slate-500">
                    AI + Organic impact
                  </span>
                </div>
                <div className={isQuickMode ? "blur-sm select-none" : ""}>
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
                        isAnimationActive
                        animationDuration={900}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
                </div>
                {isQuickMode ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/45">
                    <button
                      onClick={() => setPremiumModalOpen(true)}
                      className="rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:shadow-[0_0_24px_rgba(139,92,246,0.45)] transition"
                    >
                      🔒 Upgrade to see real insights
                    </button>
                  </div>
                ) : null}
              </div>
            </section>

            <section className={`grid grid-cols-1 gap-4 xl:grid-cols-2 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
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
                className="rounded-2xl border border-slate-700 bg-[#111827] p-4 shadow-sm"
                ref={competitorsRef}
              >
                <div className="mb-3">
                  <h3 className="text-lg font-bold">Top Competitors</h3>
                  <p className="text-sm text-slate-500">
                    Brands outranking you in AI responses.
                  </p>
                  {isQuickMode && hiddenCompetitorCount > 0 ? (
                    <p className="mt-1 text-xs font-semibold text-amber-300">+ {hiddenCompetitorCount} more competitors hidden</p>
                  ) : null}
                </div>
                {(displayedTopCompetitors.length === 0) ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
                    <p>No strong competitors detected in this analysis.</p>
                    <p className="mt-2">This may indicate:</p>
                    <p className="mt-1">- limited data signals</p>
                    <p>- niche positioning</p>
                    <p>- or low competitive visibility</p>
                  </div>
                ) : (
                  <>
                    {!isQuickMode ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={displayedTopCompetitors}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" style={{ fontSize: 12 }} />
                        <YAxis style={{ fontSize: 12 }} />
                        <Tooltip />
                        <Bar
                          dataKey="score"
                          fill="#f59e0b"
                          radius={[6, 6, 0, 0]}
                          isAnimationActive
                          animationDuration={900}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    ) : null}
                    <div className="mt-3 space-y-2">
                      {displayedTopCompetitors.map((comp) => {
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
                          <div key={comp.name} className="rounded-lg bg-slate-50 px-3 py-2 text-sm transition duration-300 hover:shadow-md">
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

              {!hasWeakSignals && !isQuickMode ? (
              <div
                className="rounded-2xl border border-slate-700 bg-[#111827] p-4 shadow-sm"
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
                          isAnimationActive
                          animationDuration={900}
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

            <section className={`relative rounded-2xl border border-slate-700 bg-[#111827] p-4 shadow-sm transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <div className="mb-3">
                <h3 className="text-lg font-bold">Full AI Visibility Analysis</h3>
                <p className="text-sm text-slate-500">
                  In-depth ranking, prompt-level publishing recommendations, and
                  model-specific gap analysis.
                </p>
              </div>

              <div className={`space-y-3 ${isQuickMode ? "blur-sm select-none" : ""}`}>
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

              {isQuickMode ? (
              <div className="absolute inset-0 rounded-2xl bg-slate-950/45 backdrop-blur-xl transition-opacity">
                <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 p-4 text-center">
                  <p className="text-2xl font-bold text-slate-100">
                    You are currently losing visibility in AI search.
                  </p>
                  <ul className="mt-2 list-disc space-y-1 text-sm text-slate-200 pl-5 text-left">
                    <li>See exact competitor strategies</li>
                    <li>Get content plan to recover visibility</li>
                    <li>Identify hidden growth gaps</li>
                  </ul>
                  <button
                    onClick={() => setPremiumModalOpen(true)}
                    className="rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-5 py-2 text-sm font-semibold text-white shadow-lg hover:opacity-90"
                  >
                    Unlock Full Analysis
                  </button>
                  <span className="text-xs text-slate-300">
                    Enterprise | Team | Agency plans available; includes data export and stakeholder reporting.
                  </span>
                </div>
              </div>
              ) : null}
            </section>
          </>
        )}
      </div>

      {isPremiumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-[#111827] p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h4 className="text-2xl font-bold text-white">Upgrade to Full Analysis</h4>
                <p className="text-sm text-slate-300">
                  Unlock the complete investor-level AI visibility experience.
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
                <li>• Source insights and influence channels</li>
                <li>• Actionable recommendations and execution plan</li>
              </ul>
              <button
                onClick={() => handleUpgrade("full")}
                className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
              >
                Activate Full Analysis
              </button>
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

      {isEmailCaptureOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-[#111827] p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h4 className="text-xl font-bold text-white">Get weekly AI visibility report</h4>
                <p className="mt-1 text-sm text-slate-300">Receive signal shifts, competitor moves, and recommended next actions.</p>
              </div>
              <button
                onClick={() => setEmailCaptureOpen(false)}
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <input
              type="email"
              value={captureEmail}
              onChange={(e) => setCaptureEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
            />

            <button
              onClick={handleEmailCaptureSubmit}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#3B82F6] via-[#8B5CF6] to-[#22C55E] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
            >
              Send me insights
            </button>
          </div>
        </div>
      )}
    </div>
  );
}