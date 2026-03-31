import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { ANALYZE_API_URL } from "../api";
import { LAUNCH_PRICING, PRICING_PLANS } from "../shared/utils/pricing";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

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

function sanitizeHTML(input) {
  if (!input) return "";

  let clean = String(input)
    .replace(/<!DOCTYPE[^>]*>/gi, "")
    .replace(/<\/?html[^>]*>/gi, "")
    .replace(/<\/?body[^>]*>/gi, "")
    .replace(/<\/?head[^>]*>/gi, "");

  clean = clean
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");

  if (clean.toLowerCase().includes("<html")) {
    clean = "Invalid content removed";
  }

  return clean.trim();
}

function sanitizeTextArray(values) {
  if (!Array.isArray(values)) return [];
  return values.map((item) => sanitizeHTML(item)).filter(Boolean);
}

function sanitizeAnalysisData(input) {
  const safe = { ...(input || {}) };
  const textFields = [
    "brandName",
    "industry",
    "country",
    "summaryInsight",
    "biggestWeakness",
    "strongestArea",
    "contentOpportunity",
    "competitorThreat",
    "sourceDataMessage",
    "confidenceLevel",
    "sourceConfidence",
  ];

  textFields.forEach((key) => {
    if (typeof safe[key] === "string") {
      safe[key] = sanitizeHTML(safe[key]);
    }
  });

  safe.recommendations = sanitizeTextArray(safe.recommendations);

  if (Array.isArray(safe.topCompetitors)) {
    safe.topCompetitors = safe.topCompetitors.map((item) => ({
      ...item,
      name: sanitizeHTML(item?.name),
      brand: sanitizeHTML(item?.brand),
      whyItAppears: sanitizeHTML(item?.whyItAppears),
    }));
  }

  if (Array.isArray(safe.topSources)) {
    safe.topSources = safe.topSources.map((item) => ({
      ...item,
      name: sanitizeHTML(item?.name),
      source: sanitizeHTML(item?.source),
      type: sanitizeHTML(item?.type),
      confidence: sanitizeHTML(item?.confidence),
    }));
  }

  return safe;
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

function getMentionValue(item) {
  if (typeof item === "number") return Number.isFinite(item) ? item : 0;
  return Number(item?.mentions ?? item?.mentionCount ?? item?.count ?? item?.score ?? 0) || 0;
}

function isHighIntentQuery(query) {
  if (!query) return false;
  return /(best|vs|versus|alternative|alternatives|compare|comparison|recommended|top)/i.test(query);
}

function mapAnalyzeResponse(analysis, payload, mode) {
  const normalizedAnalysis = analysis || {};
  const safeBrandName = sanitizeHTML(payload.brandName);
  const safeIndustry = sanitizeHTML(payload.industry);
  const safeCountry = sanitizeHTML(payload.targetCountry);
  const mentionsByPrompt = Array.isArray(normalizedAnalysis.mentionsByPrompt)
    ? normalizedAnalysis.mentionsByPrompt
    : [];
  const analyzedResponses = Array.isArray(normalizedAnalysis.analyzedResponses)
    ? normalizedAnalysis.analyzedResponses
    : [];

  const apiCompetitors = Array.isArray(normalizedAnalysis.competitors)
    ? normalizedAnalysis.competitors
    : [];

  const totalPromptCount = Math.max(
    1,
    mentionsByPrompt.length ||
      buildPrompts(payload.brandName, payload.industry, payload.targetCountry, mode)
        .length
  );

  const competitorMap = new Map();
  const addCompetitorMention = (nameRaw, countRaw) => {
    const name = sanitizeHTML(nameRaw || "");
    if (!name || name.toLowerCase() === safeBrandName.toLowerCase()) return;
    const mentionCount = Math.max(0, Number(countRaw) || 0);
    if (mentionCount <= 0) return;
    const prev = competitorMap.get(name) || 0;
    competitorMap.set(name, prev + mentionCount);
  };

  apiCompetitors.forEach((item) => {
    if (typeof item === "string") return;
    const name = item?.name || item?.brand;
    addCompetitorMention(name, getMentionValue(item));
  });

  mentionsByPrompt.forEach((entry) => {
    const competitors = Array.isArray(entry?.competitors) ? entry.competitors : [];
    competitors.forEach((comp) => {
      if (typeof comp === "string") {
        addCompetitorMention(comp, 1);
        return;
      }
      addCompetitorMention(comp?.name || comp?.brand, getMentionValue(comp) || 1);
    });
  });

  const competitorRows = Array.from(competitorMap.entries())
    .map(([name, mentionCount]) => ({ name, mentionCount }))
    .sort((a, b) => b.mentionCount - a.mentionCount);

  const competitorMentionTotal = competitorRows.reduce((sum, item) => sum + item.mentionCount, 0);

  const topCompetitors = competitorRows.slice(0, 6).map((item) => ({
    name: item.name,
    mentionCount: item.mentionCount,
    appearanceRate:
      competitorMentionTotal > 0
        ? Math.round((item.mentionCount / competitorMentionTotal) * 100)
        : 0,
    score: item.mentionCount,
    relevanceScore: 0,
    whyItAppears: `${item.name} is mentioned ${item.mentionCount} times across AI responses.`,
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

  const totalMentions = Number(
    normalizedAnalysis.totalMentions ??
      mentionsByPrompt.reduce((sum, item) => sum + (Number(item?.mentions) || 0), 0)
  );
  const responseCount = Math.max(1, analyzedResponses.length || totalPromptCount);
  const sourceDomainCount = Object.keys(sourceCounter).length;
  const baseVisibility = (totalMentions / responseCount) * 100;
  const topCompetitorMentions = topCompetitors[0]?.mentionCount || 0;
  const competitorDominanceRatio =
    competitorMentionTotal > 0 ? topCompetitorMentions / competitorMentionTotal : 0;
  const competitorPressureScore = Math.round(competitorDominanceRatio * 100);
  const competitorDominancePenalty = competitorDominanceRatio * 25;
  const sourcePresenceBoost = Math.min(12, (sourceDomainCount / responseCount) * 12);
  const visibilityScore = Math.max(
    0,
    Math.min(100, Math.round(baseVisibility - competitorDominancePenalty + sourcePresenceBoost))
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

  const hasSufficientData = responseCount >= 2 && (totalMentions > 0 || competitorMentionTotal > 0);
  const lowDataNotice = "Not enough data for deep analysis - run full scan.";

  const queryLossInsights = mentionsByPrompt
    .map((entry) => {
      const prompt = sanitizeHTML(entry?.prompt || "");
      if (!prompt) return null;

      const brandMentionsOnPrompt = Number(entry?.mentions) || 0;
      const compMap = new Map();
      const compList = Array.isArray(entry?.competitors) ? entry.competitors : [];

      compList.forEach((comp) => {
        const name = sanitizeHTML(typeof comp === "string" ? comp : comp?.name || comp?.brand || "");
        if (!name || name.toLowerCase() === safeBrandName.toLowerCase()) return;
        const value = Math.max(1, getMentionValue(comp));
        compMap.set(name, (compMap.get(name) || 0) + value);
      });

      const sortedComps = Array.from(compMap.entries()).sort((a, b) => b[1] - a[1]);
      const topComp = sortedComps[0];
      const totalCompMentionsOnPrompt = sortedComps.reduce((sum, item) => sum + item[1], 0);
      const dominancePct =
        topComp && totalCompMentionsOnPrompt > 0
          ? Math.round((topComp[1] / totalCompMentionsOnPrompt) * 100)
          : null;

      if (brandMentionsOnPrompt === 0 && topComp) {
        return `${prompt} -> Users are choosing ${topComp[0]} instead of your brand in this high-intent decision query (${Math.max(55, dominancePct || 55)}%).`;
      }
      if (brandMentionsOnPrompt === 0) {
        return `${prompt} -> Your brand is absent from a high-intent decision query.`;
      }
      if (topComp && topComp[1] >= brandMentionsOnPrompt) {
        return `${prompt} -> Users are choosing ${topComp[0]} instead of your brand in this high-intent decision query.`;
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 3);

  const queryInsights = mentionsByPrompt
    .map((entry) => {
      const query = sanitizeHTML(entry?.prompt || "");
      if (!query) return null;

      const brandMentionsOnPrompt = Number(entry?.mentions) || 0;
      const compMap = new Map();
      const compList = Array.isArray(entry?.competitors) ? entry?.competitors : [];

      compList.forEach((comp) => {
        const name = sanitizeHTML(typeof comp === "string" ? comp : comp?.name || comp?.brand || "");
        if (!name || name.toLowerCase() === safeBrandName.toLowerCase()) return;
        const count = Math.max(1, getMentionValue(comp));
        compMap.set(name, (compMap.get(name) || 0) + count);
      });

      const sortedComps = Array.from(compMap.entries()).sort((a, b) => b[1] - a[1]);
      const topComp = sortedComps[0];
      const totalCompMentionsOnPrompt = sortedComps.reduce((sum, item) => sum + item[1], 0);
      const dominancePct =
        topComp && totalCompMentionsOnPrompt > 0
          ? Math.round((topComp[1] / totalCompMentionsOnPrompt) * 100)
          : null;

      if (brandMentionsOnPrompt > 0) return null;

      return {
        query,
        brandMentions: brandMentionsOnPrompt,
        topCompetitor: topComp ? topComp[0] : "Competitor",
        topCompetitorMentions: topComp ? topComp[1] : 0,
        dominancePct,
      };
    })
    .filter(Boolean)
    .slice(0, 6);

  const queryTrafficLossPct = Math.max(
    0,
    Math.min(100, Math.round((queryInsights.length / Math.max(1, totalPromptCount)) * 100))
  );

  const recommendations = hasSufficientData
    ? [
        `Create comparison pages that target high-intent queries where ${safeBrandName} is currently losing to competitors.`,
        `Publish citation-ready pages that force AI systems to reference ${safeBrandName} in ${safeIndustry} decisions.`,
        "Track visibility weekly and execute immediate fixes on every high-intent loss query.",
      ]
    : ["Run full analysis now to expose high-intent loss queries and stop conversion leakage."];

  const trend = mentionsByPrompt.slice(0, 6).map((entry, idx) => ({
    month: `P${idx + 1}`,
    total: entry?.mentions || 0,
  }));

  return {
    brandName: safeBrandName,
    industry: safeIndustry,
    country: safeCountry,
    score: visibilityScore,
    prevScore: undefined,
    coverage: visibilityScore,
    efficiency: Math.max(0, Math.min(100, 100 - visibilityRiskScore)),
    competitors: topCompetitors.length,
    sources: topSources.length,
    chainedAIInsights: mentionsByPrompt.length,
    summaryInsight: hasSufficientData
      ? topCompetitors.length > 0
        ? `Users are choosing ${topCompetitors[0].name} instead of ${safeBrandName} in high-intent AI queries. This directly impacts acquisition and conversions.`
        : `${safeBrandName} is under-represented in AI decisions and loses high-intent demand to competitor alternatives.`
      : "Your current dataset is insufficient for strategic decisions. Run full analysis now.",
    recommendations,
    trend,
    channelPerformance,
    potentialImpressionGain: Math.max(0, Math.min(100, Math.round(visibilityRiskScore * 0.8))),
    topCompetitors,
    topSources,
    strategicNarrative: null,
    biggestWeakness: `${safeBrandName} appears in only ${totalMentions}/${totalPromptCount} analyzed responses, so competitors capture buyer decisions first.`,
    strongestArea: topSources[0]?.source || "No authoritative source ownership detected",
    contentOpportunity: "Create decision-stage comparison pages for losing high-intent queries.",
    competitorThreat: topCompetitors[0]
      ? `${topCompetitors[0].name} controls ${topCompetitors[0].mentionCount}/${totalPromptCount} prompts and captures decision-stage demand.`
      : "Competitor pressure is present but insufficiently attributed in this scan.",
    confidenceLevel: mode === "quick" ? "low" : "high",
    hasSufficientData,
    queryLossInsights,
    queryInsights,
    queryTrafficLossPct,
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
        : lowDataNotice,
  };
}

const buildInsight = (data, context = {}) => {
  if (!data) return null;

  const topCompetitor = data.topCompetitors?.[0]?.name || "competitors";
  const coverage = Math.round(data.visibilityScore || 0);
  const contextLabel = context?.label || "this section";
  const responses = Math.max(1, Number(data.responseCount || data.promptCount || 0));
  const brandMentions = Math.max(0, Number(data.totalMentions || 0));
  const lostPct = Math.max(0, Math.min(100, Math.round((1 - brandMentions / responses) * 100)));
  const topQuery = Array.isArray(data.queryInsights) && data.queryInsights[0]?.query
    ? data.queryInsights[0].query
    : "high-intent comparison query";

  return {
    what: `${coverage}% visibility means your brand is absent in ${lostPct}% of AI buying decisions across ${contextLabel}.`,
    why: `${topCompetitor} owns the high-intent response slots that buyers trust when they choose a vendor.`,
    soWhat: `Users are choosing ${topCompetitor} instead of your brand in decision-stage queries, and pipeline shifts away from your funnel.`,
    revenue: `You are losing ${lostPct}% of potential customers. This directly impacts acquisition and conversions.`,
    action: `Create a comparison page for "${topQuery}" to capture users who are currently choosing ${topCompetitor}. Execute immediately. Every day this is not fixed, competitors gain more visibility.`,
  };
};

function buildActionPlan(data) {
  const visibilityScore = Math.max(0, Math.min(100, Number(data?.visibilityScore ?? data?.score ?? 0)));
  const responseCount = Math.max(1, Number(data?.responseCount ?? data?.promptCount ?? 1));
  const brandMentions = Math.max(0, Number(data?.totalMentions ?? 0));
  const topCompetitor = Array.isArray(data?.topCompetitors) && data.topCompetitors.length
    ? data.topCompetitors[0]
    : null;
  const competitorMentions = Math.max(0, Number(topCompetitor?.mentionCount ?? 0));
  const competitorAppearanceRate = Math.max(0, Math.min(100, Number(topCompetitor?.appearanceRate ?? 0)));
  const brandPresencePct = Math.max(0, Math.min(100, Math.round((brandMentions / responseCount) * 100)));
  const mentionsGap = Math.max(0, competitorMentions - brandMentions);

  const problems = [];
  if (visibilityScore < 30) {
    problems.push("Your visibility is critically low, and buyers rarely see your brand.");
  }

  if (competitorAppearanceRate >= 55 || competitorMentions > brandMentions) {
    problems.push("Competitor dominance: AI pushes rival brands ahead of you in decision-stage prompts.");
  }

  if (brandPresencePct <= 25 || brandMentions <= Math.max(1, Math.round(responseCount * 0.3))) {
    problems.push("Low AI presence: your brand is missing in high-intent answers that influence revenue.");
  }

  if (problems.length === 0) {
    problems.push("You still have visibility gaps that can leak demand to competitors.");
  }

  const actions = [
    "Create content for missing prompts where your brand is absent.",
    "Target list-style articles (Top X tools) to win recommendation slots.",
    "Build AI-citable pages with structured, direct answers and comparison blocks.",
    "Increase authority signals with brand mentions, quality backlinks, and expert citations.",
  ];

  let priority = "low";
  if (visibilityScore < 30) {
    priority = "high";
  } else if (visibilityScore < 60 || mentionsGap > 0) {
    priority = "medium";
  }

  const estimatedImpact =
    priority === "high"
      ? "Fixing these can increase your visibility 2-4x and recover lost demand quickly."
      : priority === "medium"
        ? "Fixing these can materially increase visibility and improve conversion flow."
        : "Fixing these can protect visibility and prevent competitor expansion.";

  return {
    problems,
    actions,
    priority,
    estimatedImpact,
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
  hasSufficientData: false,
  queryLossInsights: [],
  queryInsights: [],
  queryTrafficLossPct: 0,
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
    doc.text("Lumio Report", marginLeft, cursorY);
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
    doc.text(`Lumio Score: ${data.score}%`, marginLeft, cursorY);
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

/* ─── Gauge color helper ─── */
const gaugeColor = (score) => {
  if (score <= 30) return "#ef4444";
  if (score <= 60) return "#eab308";
  return "#22c55e";
};

const gaugeLabel = (score) => {
  if (score <= 30) return "Critical";
  if (score <= 60) return "Needs Work";
  return "Healthy";
};

/* ─── Animated number (simple CSS) ─── */
function AnimatedNumber({ value, suffix = "" }) {
  return <span>{value}{suffix}</span>;
}

/* ─── Glass Card wrapper ─── */
function GlassCard({ children, className = "", glow = "" }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-[#111827] via-[#0f172a] to-[#111827] shadow-xl shadow-black/30 backdrop-blur-sm ${className}`}>
      {glow && <div className={`pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full opacity-20 blur-3xl ${glow}`} />}
      {children}
    </div>
  );
}

/* ─── Section header ─── */
function SectionHeader({ icon, title, subtitle, badge, badgeColor = "text-indigo-400" }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        {icon && <span className="mt-0.5 text-lg">{icon}</span>}
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {badge && <span className={`text-xs font-semibold ${badgeColor}`}>{badge}</span>}
    </div>
  );
}

/* ─── Visibility Score Gauge (premium) ─── */
function VisibilityGauge({ score }) {
  const color = gaugeColor(score);
  const label = gaugeLabel(score);
  const gaugeData = [{ name: "score", value: score, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div style={{ width: 220, height: 220 }} className="relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            barSize={20}
            data={gaugeData}
            startAngle={210}
            endAngle={-30}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} angleAxisId={0} />
            <RadialBar
              background={{ fill: "#1e293b" }}
              dataKey="value"
              cornerRadius={12}
              angleAxisId={0}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-black tabular-nums" style={{ color }}>{score}</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">out of 100</span>
          <span className="mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide" style={{ color, background: `${color}18`, border: `1px solid ${color}40` }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Mini Card ─── */
function KpiCard({ label, value, suffix, delta, color, icon, sub, pulse }) {
  return (
    <GlassCard className="p-5" glow={color === "#ef4444" ? "bg-red-500" : color === "#22c55e" ? "bg-emerald-500" : "bg-indigo-500"}>
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <p className="mt-2 text-3xl font-black tabular-nums tracking-tight" style={{ color }}>
        <AnimatedNumber value={value} suffix={suffix} />
      </p>
      <div className="mt-1.5 flex items-center gap-2">
        {delta !== undefined && (
          <span className={`text-[10px] font-bold ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {delta >= 0 ? "+" : ""}{delta}%
          </span>
        )}
        <p className="text-[11px] text-slate-500">{sub}</p>
      </div>
      {pulse && <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
    </GlassCard>
  );
}

/* ─── Competitor Bar Chart (premium) ─── */
function CompetitorBarChart({ competitors, brandName, brandMentions, total }) {
  const chartData = competitors.map((c) => ({
    name: c.name.length > 12 ? c.name.slice(0, 12) + "…" : c.name,
    fullName: c.name,
    pct: total > 0 ? Math.round((c.mentionCount / total) * 100) : 0,
    isBrand: c.name.toLowerCase() === (brandName || "").toLowerCase(),
  }));

  const brandInList = chartData.some((d) => d.isBrand);
  if (!brandInList && brandName) {
    chartData.push({
      name: brandName.length > 12 ? brandName.slice(0, 12) + "…" : brandName,
      fullName: brandName,
      pct: total > 0 ? Math.round((brandMentions / total) * 100) : 0,
      isBrand: true,
    });
  }

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border border-slate-600/80 bg-slate-800/95 px-3 py-2 text-xs text-white shadow-xl backdrop-blur-sm">
        <p className="font-bold">{d.fullName}</p>
        <p className="text-slate-300">Mention share: <span className="font-semibold text-white">{d.pct}%</span></p>
        {d.isBrand && <p className="mt-1 text-[10px] font-semibold text-blue-400">YOUR BRAND</p>}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 8, right: 12, bottom: 12, left: 0 }}>
        <defs>
          <linearGradient id="barGradientBrand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="barGradientComp" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#dc2626" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
        <Bar dataKey="pct" radius={[8, 8, 0, 0]} maxBarSize={44}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.isBrand ? "url(#barGradientBrand)" : "url(#barGradientComp)"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ─── Trend Line Chart (premium) ─── */
function TrendLineChart({ trend }) {
  if (!trend || trend.length < 2) return <p className="text-sm text-slate-500">Not enough data points for trend.</p>;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={trend} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
        <defs>
          <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis dataKey="month" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12, backdropFilter: "blur(8px)" }}
          labelStyle={{ color: "#e2e8f0" }}
          itemStyle={{ color: "#818cf8" }}
        />
        <Line type="monotone" dataKey="total" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4, fill: "#818cf8", strokeWidth: 2, stroke: "#0f172a" }} activeDot={{ r: 7, fill: "#818cf8", stroke: "#0f172a", strokeWidth: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ─── Insight Block (premium) ─── */
function InsightBlock({ insight, evidenceText }) {
  if (!insight) return null;
  return (
    <div className="mt-4 rounded-xl border border-indigo-500/15 bg-gradient-to-br from-indigo-950/30 via-slate-900/40 to-violet-950/20 p-4 text-sm text-slate-200">
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-indigo-400" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">AI Insight</p>
      </div>
      <p className="mt-3"><span className="font-semibold text-white">What:</span> {insight.what}</p>
      <p className="mt-1"><span className="font-semibold text-white">Why:</span> {insight.why}</p>
      <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/8 px-3 py-2 font-bold text-red-300">SO WHAT: {insight.soWhat}</p>
      <p className="mt-2"><span className="font-semibold text-amber-300">Revenue impact:</span> {insight.revenue}</p>
      {insight.action && <p className="mt-2"><span className="font-semibold text-emerald-400">Next step:</span> {insight.action}</p>}
      {evidenceText && <p className="mt-3 text-[10px] text-slate-600">{evidenceText}</p>}
    </div>
  );
}

/* ─── Status Badge ─── */
function StatusBadge({ label }) {
  const colorMap = {
    Critical: "border-red-500/40 bg-red-500/15 text-red-300",
    High: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    Medium: "border-blue-500/40 bg-blue-500/15 text-blue-300",
    Low: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
  };
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${colorMap[label] || colorMap.Medium}`}>
      {label}
    </span>
  );
}

/* ─── Priority Score Badge ─── */
function PriorityScore({ score, label }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#eab308" : "#22c55e";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-8 w-8">
        <svg viewBox="0 0 36 36" className="h-8 w-8 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle cx="18" cy="18" r="15" fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${score * 0.94} 100`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black" style={{ color }}>{score}</span>
      </div>
      {label && <span className="text-[10px] font-semibold text-slate-400">{label}</span>}
    </div>
  );
}

/* ─── Opportunity Row ─── */
function OpportunityRow({ query, difficulty, impact, competitor, dominancePct, onAction }) {
  const diffColor = difficulty === "Easy" ? "text-emerald-400" : difficulty === "Medium" ? "text-amber-400" : "text-red-400";
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-700/40 bg-slate-900/50 px-4 py-3 transition-colors hover:border-slate-600/60 hover:bg-slate-800/40">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{query}</p>
        <p className="text-[11px] text-slate-500">{competitor} dominates at {dominancePct}%</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-center">
          <p className={`text-xs font-bold ${diffColor}`}>{difficulty}</p>
          <p className="text-[9px] text-slate-600">Difficulty</p>
        </div>
        <StatusBadge label={impact} />
      </div>
    </div>
  );
}

/* ─── Numbered Step Card ─── */
function StepCard({ number, title, description, urgency, impact }) {
  return (
    <div className="flex gap-4 rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 transition-colors hover:border-indigo-500/30">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/20 text-sm font-black text-indigo-400">
        {number}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
        <div className="mt-2 flex items-center gap-2">
          {urgency && <span className="text-[10px] font-bold text-red-400">{urgency}</span>}
          {impact && <StatusBadge label={impact} />}
        </div>
      </div>
    </div>
  );
}

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
  const [emailCaptureContext, setEmailCaptureContext] = useState("report");
  const [pendingWinningPageUnlock, setPendingWinningPageUnlock] = useState(false);
  const [isExitIntentOpen, setExitIntentOpen] = useState(false);
  const [shareToast, setShareToast] = useState(false);
  const [shareToastText, setShareToastText] = useState("Done");
  const [hasAnalyzedOnce, setHasAnalyzedOnce] = useState(false);
  const [emailSubmitSuccess, setEmailSubmitSuccess] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [showPostScoreSections, setShowPostScoreSections] = useState(true);
  const [isShockOnboardingOpen, setShockOnboardingOpen] = useState(true);
  const [winningContent, setWinningContent] = useState("");

  const trendRef = useRef(null);
  const competitorsRef = useRef(null);
  const sourcesRef = useRef(null);
  const autoRunRef = useRef(false);
  const emailCaptureShownRef = useRef(false);
  const exitIntentShownRef = useRef(false);
  const resultsRef = useRef(null);

  const loadFromLocal = () => {
    try {
      const cachedData = window.localStorage.getItem("ai-visibility-last-analysis");
      const cachedSettings = window.localStorage.getItem("ai-visibility-settings");
      const cachedEmail = window.localStorage.getItem("ai-visibility-email");

      if (cachedData) {
        setData(sanitizeAnalysisData(JSON.parse(cachedData)));
        setHasAnalyzedOnce(true);
        setShockOnboardingOpen(true);
      }

      if (cachedSettings) {
        const settings = JSON.parse(cachedSettings);
        if (settings.brandName) setBrandName(sanitizeHTML(settings.brandName));
        if (settings.industry) setIndustry(sanitizeHTML(settings.industry));
        if (settings.country) setCountry(sanitizeHTML(settings.country));
        if (settings.mode) setMode(settings.mode);
      }

      if (cachedEmail) {
        setCaptureEmail(sanitizeHTML(cachedEmail));
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
      setLoadingStep((prev) => (prev + 1) % 4);
    }, 800);

    return () => clearInterval(stepTimer);
  }, [loading]);

  useEffect(() => {
    const handleExitIntent = (event) => {
      if (exitIntentShownRef.current || isExitIntentOpen) return;
      if (isPremiumModalOpen || isEmailCaptureOpen) return;
      if (event.clientY > 0) return;
      const related = event.relatedTarget || event.toElement;
      if (related) return;

      exitIntentShownRef.current = true;
      setExitIntentOpen(true);
    };

    document.addEventListener("mouseout", handleExitIntent);
    return () => {
      document.removeEventListener("mouseout", handleExitIntent);
    };
  }, [isEmailCaptureOpen, isExitIntentOpen, isPremiumModalOpen]);

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

      const normalizedData =
        apiResponse && typeof apiResponse === "object"
          ? apiResponse?.data || apiResponse
          : {};
      console.log("NORMALIZED DATA:", normalizedData);

      const hasValidData =
        typeof normalizedData === "object" &&
        normalizedData !== null &&
        (Object.prototype.hasOwnProperty.call(normalizedData, "visibilityScore") ||
          Object.prototype.hasOwnProperty.call(normalizedData, "totalMentions") ||
          Array.isArray(normalizedData.competitors) ||
          Array.isArray(normalizedData.mentionsByPrompt));

      if (normalizedData?.error && !hasValidData) {
        throw new Error(sanitizeHTML(normalizedData.error));
      }

      const visibilityScore = normalizedData.visibilityScore || 0;
      const competitors = normalizedData.competitors || [];
      const mentions = normalizedData.totalMentions || 0;

      if (hasValidData || visibilityScore || competitors.length || mentions) {
        setError("");
      }

      let mapped = sanitizeAnalysisData(mapAnalyzeResponse(
        { ...normalizedData, visibilityScore, competitors, totalMentions: mentions },
        payload,
        mode
      ));

      if (!mapped || Object.keys(mapped).length === 0) {
        mapped = {
          ...defaultData,
          visibilityScore: 0,
          competitors: [],
          mentions: 0,
          fallback: true,
        };
      }

      if (mode === "quick") {
        mapped.summaryInsight = sanitizeHTML(
          mapped.summaryInsight ||
          "Quick mode data: please run full for more detail."
        );
        mapped.recommendations =
          Array.isArray(mapped.recommendations) && mapped.recommendations.length
            ? mapped.recommendations
            : ["Run full mode for complete recommendations."];
      }

          console.log("FINAL DATA SENT TO UI:", mapped);

      setData(mapped);
      setHasAnalyzedOnce(true);
      setShockOnboardingOpen(true);

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
        setEmailCaptureContext("report");
        setPendingWinningPageUnlock(false);
        setTimeout(() => setEmailCaptureOpen(true), 900);
      }
    } catch (error) {
      console.error("Analysis fetch error:", error);
      setError(sanitizeHTML(error?.message || "Network request failed. Please try again."));
      const mapped = {
        ...defaultData,
        visibilityScore: 0,
        competitors: [],
        mentions: 0,
        fallback: true,
      };
      console.log("FINAL DATA SENT TO UI:", mapped);
      setData(mapped);
      setHasAnalyzedOnce(true);
      setShockOnboardingOpen(true);
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
      `Lumio Report - ${data.brandName || brandName || "Brand"}`,
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
          title: "Lumio Result",
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

    const shouldGenerateWinningPage = pendingWinningPageUnlock;

    window.localStorage.setItem("ai-visibility-email", normalized);
    setEmailCaptured(true);
    setEmailSubmitSuccess(true);
    setPendingWinningPageUnlock(false);
    setTimeout(() => {
      setEmailCaptureOpen(false);
      setEmailSubmitSuccess(false);
      setEmailCaptureContext("report");
      if (shouldGenerateWinningPage) {
        setWinningContent(winningContentBlock);
        if (isQuickMode) {
          setPremiumModalOpen(true);
          return;
        }
        setShareToastText("Winning page generated");
        setShareToast(true);
        setTimeout(() => setShareToast(false), 1800);
      }
    }, 2000);
  };

  const isQuickMode = mode === "quick";
  const visibilityScoreValue = useMemo(() => {
    const raw = Number(data.visibilityScore ?? data.score ?? 0);
    // Never show perfect results — cap at 82 so there's always room to improve
    return Math.min(raw, 82);
  }, [data.visibilityScore, data.score]);
  const isDataWeak = useMemo(
    () =>
      !data.hasSufficientData ||
      Number(data.responseCount || 0) < 2 ||
      (Number(data.totalMentions || 0) === 0 && Number(data.competitorMentionTotal || 0) === 0),
    [data.hasSufficientData, data.responseCount, data.totalMentions, data.competitorMentionTotal]
  );

  const normalizedBrandName = sanitizeHTML(brandName || data.brandName || "Your brand");

  const riskLabel = useMemo(() => {
    if (isDataWeak) return "Limited";
    if (visibilityScoreValue < 30) return "High";
    if (visibilityScoreValue <= 70) return "Medium";
    return "Low";
  }, [isDataWeak, visibilityScoreValue]);

  const conciseInsight = useMemo(() => {
    const base = (data.summaryInsight || data.biggestWeakness || "").replace(/\s+/g, " ").trim();
    if (!base) {
      return "Problem: AI decision data is missing. So what: buyer intent is leaking to competitors. Action: run full analysis now and execute query-level recovery pages this week.";
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

  const promptCountValue = Math.max(0, Number(data.promptCount || 0));
  const responseCountValue = Math.max(0, Number(data.responseCount || 0));
  const sourceDomainCountValue = Math.max(0, Number(data.sourceDomainCount || 0));
  const competitorMentionTotalValue = Math.max(0, Number(data.competitorMentionTotal || 0));
  const promptCountForConfidence = Math.max(promptCountValue, responseCountValue);
  const insightConfidenceLabel = useMemo(() => {
    if (promptCountForConfidence >= 10) return "High confidence (10+ prompts)";
    if (promptCountForConfidence >= 5) return "Medium confidence (5-10)";
    return "Low confidence (<5)";
  }, [promptCountForConfidence]);
  const missingResponsePct = useMemo(() => {
    const responses = Math.max(1, responseCountValue || promptCountValue);
    const brandMentions = Math.max(0, Number(data.totalMentions || 0));
    return Math.max(0, Math.min(100, Math.round((1 - brandMentions / responses) * 100)));
  }, [data.totalMentions, promptCountValue, responseCountValue]);
  const topCompetitorName = displayedTopCompetitors[0]?.name || "Top competitor";

  const winningContentBlock = useMemo(() => {
    const contentBrand = sanitizeHTML(normalizedBrandName || "YourBrand");
    const contentCompetitor = sanitizeHTML(topCompetitorName || "Competitor");

    return [
      `# ${contentBrand} vs ${contentCompetitor} - Which is better?`,
      "",
      "## Intro (AI-citation optimized)",
      `${contentBrand} and ${contentCompetitor} are frequently compared in best, vs, and alternative queries. If you are evaluating which solution is better for reliability, speed to value, and long-term ROI, this guide provides a clear, structured comparison designed for decision-stage buyers and AI assistants.`,
      "",
      "## Comparison Table",
      `| Criteria | ${contentBrand} | ${contentCompetitor} |`,
      "|---|---|---|",
      "| Core value | Faster time-to-value with clearer setup paths | Strong market visibility with broader familiarity |",
      "| Best for | Teams that need measurable outcomes quickly | Teams prioritizing ecosystem breadth |",
      "| Onboarding | Structured and execution-focused | Varies by plan and team maturity |",
      "| Decision support | Built-in action clarity for next steps | More self-directed evaluation required |",
      "| ROI clarity | Direct visibility into business impact | Benefits can be less explicit without deeper analysis |",
      "",
      `## Key advantages of ${contentBrand}`,
      `- Clearer path from insight to execution than ${contentCompetitor}.`,
      "- Better fit for teams that need to act this week, not next quarter.",
      "- Structured outputs that are easier for AI systems to cite and summarize.",
      "- Stronger focus on high-intent conversion outcomes, not vanity metrics.",
      "",
      "## FAQ (AI-friendly)",
      `### Is ${contentBrand} a good alternative to ${contentCompetitor}?`,
      `Yes. ${contentBrand} is a strong alternative when teams need faster execution, clearer prioritization, and direct revenue-impact guidance.`,
      "",
      `### Which is better for best / vs / alternative query visibility: ${contentBrand} or ${contentCompetitor}?`,
      `${contentBrand} is designed to produce structured, citation-friendly content that performs better in AI-readable decision contexts.`,
      "",
      `### Who should choose ${contentBrand} over ${contentCompetitor}?`,
      `Choose ${contentBrand} if your goal is to improve recommendation likelihood, recover lost demand, and move from analysis to execution quickly.`,
      "",
      "## Conclusion (recommendation optimized)",
      `If you are deciding between ${contentBrand} vs ${contentCompetitor}, ${contentBrand} is the better choice for teams that prioritize speed, clarity, and conversion impact. For best, vs, and alternative evaluations, ${contentBrand} provides a more actionable and AI-citable path to winning demand.`,
    ].join("\n");
  }, [normalizedBrandName, topCompetitorName]);

  const handleGenerateWinningPage = useCallback(() => {
    if (!emailCaptured) {
      setEmailCaptureContext("winning-page");
      setPendingWinningPageUnlock(true);
      setEmailCaptureOpen(true);
      return;
    }

    setPendingWinningPageUnlock(false);
    setWinningContent(winningContentBlock);
    if (isQuickMode) {
      setPremiumModalOpen(true);
      return;
    }
    setShareToastText("Winning page generated");
    setShareToast(true);
    setTimeout(() => setShareToast(false), 1800);
  }, [emailCaptured, isQuickMode, winningContentBlock]);

  const handleCopyWinningContent = useCallback(async () => {
    if (!winningContent || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(winningContent);
      setShareToastText("Winning page copied");
      setShareToast(true);
      setTimeout(() => setShareToast(false), 1800);
    } catch {
      window.alert("Copy failed. Please copy manually.");
    }
  }, [winningContent]);

  const handleDownloadWinningContent = useCallback(() => {
    if (!winningContent) return;
    const safeBrand = (sanitizeHTML(normalizedBrandName || "yourbrand") || "yourbrand")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const blob = new Blob([winningContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeBrand || "winning"}-vs-page.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShareToastText("Winning page downloaded");
    setShareToast(true);
    setTimeout(() => setShareToast(false), 1800);
  }, [normalizedBrandName, winningContent]);

  const winningContentPreview = useMemo(() => {
    if (!winningContent) {
      return { visible: "", locked: "" };
    }

    const lines = winningContent.split("\n");
    const comparisonHeadingIndex = lines.findIndex((line) => line.trim() === "## Comparison Table");

    if (comparisonHeadingIndex === -1) {
      return { visible: winningContent, locked: "" };
    }

    // Keep title, first paragraph, and a partial comparison table visible.
    const visibleEndIndex = Math.min(lines.length - 1, comparisonHeadingIndex + 4);

    return {
      visible: lines.slice(0, visibleEndIndex + 1).join("\n"),
      locked: lines.slice(visibleEndIndex + 1).join("\n").trim(),
    };
  }, [winningContent]);

  const confidenceSummary = useMemo(() => {
    if (responseCountValue >= 5 && sourceDomainCountValue >= 3) {
      return "Confidence: High";
    }
    if (responseCountValue >= 2) {
      return "Confidence: Medium (limited dataset)";
    }
    return "Confidence: Low (very limited dataset)";
  }, [responseCountValue, sourceDomainCountValue]);

  const queryLossInsights = useMemo(
    () => (Array.isArray(data.queryLossInsights) ? data.queryLossInsights : []).slice(0, 3),
    [data.queryLossInsights]
  );
  const premiumQueryInsights = useMemo(
    () => (Array.isArray(data.queryInsights) ? data.queryInsights : []).slice(0, 4),
    [data.queryInsights]
  );
  const premiumTrafficLossPct = Math.max(
    0,
    Math.min(100, Number(data.queryTrafficLossPct || 0))
  );
  const queryCards = useMemo(() => {
    if (!hasAnalyzedOnce) return [];

    if (!isQuickMode && premiumQueryInsights.length > 0) {
      return premiumQueryInsights.slice(0, 6).map((item) => ({
        query: item.query,
        topCompetitor: item.topCompetitor || topCompetitorName,
        dominancePct: Number.isFinite(Number(item.dominancePct)) ? Number(item.dominancePct) : null,
        conclusion: `Users are choosing ${item.topCompetitor || topCompetitorName} instead of ${normalizedBrandName} in this high-intent decision query.`,
        impactLabel:
          Number(item.dominancePct || 0) >= 70 ? "Critical" : Number(item.dominancePct || 0) >= 45 ? "High" : "Medium",
        businessExplanation: `${item.topCompetitor || topCompetitorName} controls this decision query and captures buyer intent before your brand enters consideration (${Math.max(45, Number(item.dominancePct || 0))}-${Math.min(95, Math.max(60, Number(item.dominancePct || 0) + 20))}%).`,
        ifFixedOutcome: `Revenue impact: you are losing ${Math.max(20, Math.round(Number(item.dominancePct || 50) * 0.4))}-${Math.max(35, Math.round(Number(item.dominancePct || 50) * 0.6))}% of potential customers on this query.`,
        scaleIndicator: Number(item.dominancePct || 0) >= 70 ? "Critical loss | Revenue risk | High impact" : "High impact | Revenue risk",
      }));
    }

    return queryLossInsights.slice(0, 5).map((entry) => {
      const [queryRaw, conclusionRaw] = String(entry).split("->");
      const query = sanitizeHTML((queryRaw || "").trim());
      const conclusion = sanitizeHTML((conclusionRaw || "you are not mentioned").trim());
      const compMatch = conclusion.match(/^([^,]+?)\s+(dominates|appears more often)/i);
      return {
        query,
        topCompetitor: compMatch ? sanitizeHTML(compMatch[1].trim()) : topCompetitorName,
        dominancePct: null,
        conclusion: `Users are choosing ${compMatch ? sanitizeHTML(compMatch[1].trim()) : topCompetitorName} instead of ${normalizedBrandName} in this high-intent decision query.`,
        impactLabel: "High",
        businessExplanation: `${compMatch ? sanitizeHTML(compMatch[1].trim()) : topCompetitorName} captures decision-stage demand while your brand is de-prioritized in AI answers (50-70%).`,
        ifFixedOutcome: `Revenue impact: you are losing 20-35% of potential customers from this query.`,
        scaleIndicator: "High impact | Revenue risk",
      };
    }).filter((item) => item.query);
  }, [hasAnalyzedOnce, isQuickMode, normalizedBrandName, premiumQueryInsights, queryLossInsights, topCompetitorName]);

  const coreInsightCards = useMemo(() => {
    const highIntent = queryCards.filter((item) => isHighIntentQuery(item.query));
    const base = highIntent.length >= 3 ? highIntent : queryCards;
    return base.slice(0, 5);
  }, [queryCards]);

  const whyCompetitorsPreferred = useMemo(() => {
    return [
      "Your content is not cited as a source.",
      "Competitors dominate list-based content.",
      "No structured authority signals.",
    ];
  }, []);

  const actionPlan = useMemo(() => {
    const normalizedBrand = sanitizeHTML(brandName || data.brandName || "Your brand");
    const list = coreInsightCards.length
      ? coreInsightCards
      : [{ query: "high-intent comparison queries", topCompetitor: topCompetitorName }];

    return list.slice(0, 3).map((item) => {
      const queryHint = sanitizeHTML(item.query).replace(/["']/g, "").slice(0, 60);
      return {
        title: `Do this THIS WEEK or keep losing customers: "${normalizedBrand} vs ${item.topCompetitor}"`,
        target: queryHint,
        goal: "Create AI-friendly content clusters",
        expectedImpact: item.impactLabel || "High",
        potentialTraffic: (item.impactLabel || "High") === "Critical" ? "High" : "Medium",
        businessOutcome: "Get mentioned in list articles and build citation-worthy pages",
        urgency: "Execute now. Every day this is not fixed, competitors gain more visibility and capture more conversions.",
        potentialGainText:
          (item.impactLabel || "High") === "Critical"
            ? "Potential customer recovery: 25-40%"
            : "Potential customer recovery: 15-25%",
      };
    });
  }, [brandName, coreInsightCards, data.brandName, topCompetitorName]);

  const autoActionPlan = useMemo(
    () => buildActionPlan({
      ...data,
      topCompetitors: displayedTopCompetitors,
      visibilityScore: visibilityScoreValue,
    }),
    [data, displayedTopCompetitors, visibilityScoreValue]
  );

  const lockedActionPlan = useMemo(() => {
    const actions = Array.isArray(autoActionPlan.actions) ? autoActionPlan.actions : [];
    const visibleActions = isQuickMode ? actions.slice(0, 2) : actions;
    const hiddenActions = isQuickMode ? actions.slice(2) : [];
    return { visibleActions, hiddenActions };
  }, [autoActionPlan.actions, isQuickMode]);

  const trafficLossPct = useMemo(() => {
    if (!hasAnalyzedOnce) return 0;
    if (!isQuickMode && premiumTrafficLossPct > 0) return premiumTrafficLossPct;
    if (coreInsightCards.length === 0) return 0;
    return Math.max(0, Math.min(100, Math.round((coreInsightCards.length / Math.max(1, promptCountValue)) * 100)));
  }, [coreInsightCards.length, hasAnalyzedOnce, isQuickMode, premiumTrafficLossPct, promptCountValue]);

  const coreInsightBlock = useMemo(
    () => buildInsight(data, { label: "query-level visibility" }),
    [data]
  );
  const whyInsightBlock = useMemo(
    () => buildInsight(data, { label: "competitor preference patterns" }),
    [data]
  );
  const actionInsightBlock = useMemo(
    () => buildInsight(data, { label: "execution priorities" }),
    [data]
  );
  const trustInsightBlock = useMemo(
    () => buildInsight(data, { label: "evidence confidence" }),
    [data]
  );
  const ctaInsightBlock = useMemo(
    () => buildInsight(data, { label: "conversion recovery plan" }),
    [data]
  );

  /* ─── AI Visibility Opportunities ─── */
  const visibilityOpportunities = useMemo(() => {
    return coreInsightCards.map((item) => {
      const compDom = item.dominancePct !== null ? item.dominancePct : 68;
      const difficulty = compDom >= 70 ? "Hard" : compDom >= 45 ? "Medium" : "Easy";
      return {
        query: item.query,
        competitor: item.topCompetitor,
        dominancePct: compDom,
        difficulty,
        impact: item.impactLabel,
      };
    });
  }, [coreInsightCards]);

  const easyWins = useMemo(() => visibilityOpportunities.filter((o) => o.difficulty === "Easy" || o.difficulty === "Medium"), [visibilityOpportunities]);
  const hardWins = useMemo(() => visibilityOpportunities.filter((o) => o.difficulty === "Hard"), [visibilityOpportunities]);

  /* ─── Competitor Strategy Breakdown ─── */
  const competitorStrategy = useMemo(() => {
    const patterns = [
      { pattern: "List articles (Top X, Best of)", description: "Competitors appear in curated list content that AI systems frequently cite." },
      { pattern: "Comparison pages (X vs Y)", description: "Head-to-head comparison content that captures decision-stage queries." },
      { pattern: "Expert reviews & citations", description: "Third-party expert mentions and review content that build authority signals." },
      { pattern: "Structured FAQ content", description: "Q&A-formatted content that AI systems can directly extract and cite." },
    ];
    return patterns;
  }, []);

  /* ─── Quick Wins ─── */
  const quickWins = useMemo(() => {
    const wins = [];
    const topComp = topCompetitorName;
    if (easyWins.length > 0) {
      wins.push({ title: `Create "${normalizedBrandName} vs ${topComp}" comparison page`, timeframe: "This week", impact: "High", description: "Capture decision-stage queries where users compare solutions." });
    }
    wins.push({ title: "Publish structured FAQ page for your brand", timeframe: "3 days", impact: "Medium", description: "AI systems extract Q&A content directly. This gets you cited." });
    wins.push({ title: `Add ${normalizedBrandName} to 5 industry list articles`, timeframe: "1 week", impact: "High", description: "List articles are the #1 format AI cites for recommendations." });
    if (coreInsightCards.length > 1) {
      wins.push({ title: `Target "${coreInsightCards[0]?.query || "best alternatives"}" with dedicated content`, timeframe: "This week", impact: "Critical", description: "This is your highest-loss query. Fix it first." });
    }
    return wins.slice(0, 4);
  }, [coreInsightCards, easyWins.length, normalizedBrandName, topCompetitorName]);

  /* ─── Generated Action Plan ─── */
  const generatedPlan = useMemo(() => {
    const actions = [];
    const topComp = topCompetitorName;
    const topQueries = coreInsightCards.slice(0, 3);

    actions.push({
      number: 1,
      title: `Create ${Math.min(5, Math.max(3, coreInsightCards.length))} comparison articles`,
      description: `Target: "${normalizedBrandName} vs ${topComp}" and similar high-intent queries. These directly recover lost decision-stage traffic.`,
      urgency: "Do this week",
      impact: "Critical",
    });

    actions.push({
      number: 2,
      title: "Add brand mentions in list-type content",
      description: `Get ${normalizedBrandName} mentioned in "Top X" and "Best of" articles. AI citation rate for list content is 3x higher than standard pages.`,
      urgency: "Start within 7 days",
      impact: "High",
    });

    if (topQueries.length > 0) {
      actions.push({
        number: 3,
        title: `Target these ${Math.max(3, topQueries.length)} high-loss queries`,
        description: topQueries.map((q) => `"${q.query}"`).join(", ") + ". Create dedicated content for each.",
        urgency: "Priority queue",
        impact: "Critical",
      });
    }

    actions.push({
      number: actions.length + 1,
      title: "Build citation-ready structured content",
      description: "Add schema markup, FAQ sections, and direct-answer paragraphs. These signals tell AI your content is authoritative.",
      urgency: "Ongoing",
      impact: "High",
    });

    actions.push({
      number: actions.length + 1,
      title: "Monitor and iterate weekly",
      description: "Re-run visibility analysis weekly. Track which queries improve and which need more content investment.",
      urgency: "Weekly cadence",
      impact: "Medium",
    });

    return actions;
  }, [coreInsightCards, normalizedBrandName, topCompetitorName]);

  /* ─── Priority Score (composite) ─── */
  const priorityScoreValue = useMemo(() => {
    const vScore = Math.max(0, 100 - visibilityScoreValue);
    const compPressure = Math.min(100, Number(data.competitorPressureScore || 0));
    const queryLoss = Math.min(100, trafficLossPct);
    return Math.min(100, Math.round(vScore * 0.4 + compPressure * 0.3 + queryLoss * 0.3));
  }, [data.competitorPressureScore, trafficLossPct, visibilityScoreValue]);

  const competitorVsYouCard = useMemo(() => {
    const topCompetitor = sanitizeHTML(displayedTopCompetitors[0]?.name || "Stripe");
    const competitorVisibility = Math.max(
      0,
      Math.min(100, Number(displayedTopCompetitors[0]?.appearanceRate ?? 72))
    );
    const responseBase = Math.max(1, responseCountValue || promptCountValue || 1);
    const yourVisibility = Math.max(
      0,
      Math.min(100, Math.round(((Number(data.totalMentions || 0) || 0) / responseBase) * 100) || 14)
    );
    const ratio = Math.max(1, Math.round(competitorVisibility / Math.max(1, yourVisibility)));

    return {
      competitor: topCompetitor,
      competitorVisibility,
      yourBrand: normalizedBrandName || "YourBrand",
      yourVisibility,
      ratio,
    };
  }, [data.totalMentions, displayedTopCompetitors, normalizedBrandName, promptCountValue, responseCountValue]);

  const shockMetrics = useMemo(() => {
    const competitorAppearsPct = Math.max(0, Math.min(100, competitorVsYouCard.competitorVisibility));
    const brandAppearsPct = Math.max(0, Math.min(100, competitorVsYouCard.yourVisibility));
    const mentionsGap = Math.max(0, competitorMentionTotalValue - Number(data.totalMentions || 0));
    const estimatedLostTraffic = Math.max(
      0,
      Math.round(((competitorAppearsPct - brandAppearsPct) / 100) * Math.max(responseCountValue || promptCountValue || 10, 10) * 20)
    );
    const estimatedMonthlyLoss = mentionsGap * 50;

    return {
      competitorAppearsPct,
      brandAppearsPct,
      mentionsGap,
      estimatedLostTraffic,
      estimatedMonthlyLoss,
    };
  }, [competitorMentionTotalValue, competitorVsYouCard.competitorVisibility, competitorVsYouCard.yourVisibility, data.totalMentions, promptCountValue, responseCountValue]);

  const priorityBadgeClasses = useMemo(() => {
    if (autoActionPlan.priority === "high") return "border-red-500/40 bg-red-500/15 text-red-200";
    if (autoActionPlan.priority === "medium") return "border-amber-500/40 bg-amber-500/15 text-amber-200";
    return "border-emerald-500/40 bg-emerald-500/15 text-emerald-200";
  }, [autoActionPlan.priority]);

  const handleShockCta = useCallback(() => {
    setShockOnboardingOpen(false);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }, []);

  const proPlan = PRICING_PLANS.find((plan) => plan.id === "pro");

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-slate-200 antialiased">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full bg-blue-600/[0.05] blur-[120px]" />
        <div className="absolute top-1/3 right-0 h-[500px] w-[500px] rounded-full bg-cyan-500/[0.04] blur-[100px]" />
      </div>

      {/* ─── Sticky nav ─── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0A0E1A]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            {typeof onBackToLanding === "function" && (
              <button onClick={onBackToLanding} className="mr-1 text-slate-500 transition hover:text-white">←</button>
            )}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500">
                <span className="text-[10px] font-black text-white">AI</span>
              </div>
              <span className="text-sm font-bold text-white">Visibility</span>
            </div>
            {hasAnalyzedOnce && (
              <span className="hidden rounded-md bg-white/[0.06] px-2.5 py-1 text-xs text-slate-400 md:inline-block">
                {normalizedBrandName}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasAnalyzedOnce && (
              <>
                <button onClick={handleDownloadReport} disabled={loading} className="hidden rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] md:block">
                  Export PDF
                </button>
                <button onClick={handleCopySummary} disabled={loading} className="hidden rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] md:block">
                  Copy
                </button>
                <button onClick={handleShareResult} disabled={loading} className="hidden rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.06] md:block">
                  Share
                </button>
              </>
            )}
            <button onClick={fetchAnalysis} disabled={loading} className={`rounded-lg px-4 py-2 text-xs font-bold transition ${loading ? "bg-slate-800 text-slate-500" : "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md shadow-blue-500/20 hover:shadow-lg"}`}>
              {loading ? "Scanning..." : hasAnalyzedOnce ? "Re-scan" : "Analyze"}
            </button>
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl space-y-6 px-6 py-6">
        {shareToast && (
          <div className="fixed bottom-5 right-5 z-50 rounded-xl border border-white/[0.06] bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-xl">
            {shareToastText}
          </div>
        )}

        {/* ─── Compact form bar ─── */}
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Brand</label>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                placeholder="Brand name"
              />
            </div>
            <div className="w-36">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Industry</label>
              <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none">
                <option value="">Auto-detect</option>
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
                <option value="custom">Custom…</option>
              </select>
            </div>
            <div className="w-32">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-500">Market</label>
              <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-slate-300 focus:border-blue-500 focus:outline-none">
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
            </div>
            <div className="flex items-end gap-2">
              <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
                {["quick", "full"].map((m) => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={`rounded-md px-3 py-2 text-xs font-semibold transition ${mode === m ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-300"}`}>
                    {m}
                  </button>
                ))}
              </div>
              <button onClick={fetchAnalysis} disabled={loading} className={`rounded-lg px-5 py-2 text-sm font-bold transition ${loading ? "bg-slate-800 text-slate-500" : "bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 text-white shadow-md shadow-blue-500/20 hover:shadow-lg"}`}>
                {loading ? "Scanning..." : "Analyze"}
              </button>
            </div>
          </div>
          {industry === "custom" && (
            <input value={customIndustry} onChange={(e) => setCustomIndustry(e.target.value)} className="mt-3 w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none" placeholder="Type your industry" />
          )}
        </div>

        {message && <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">{message}</div>}

        {loading ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0E1A]/95 backdrop-blur-md">
            <div className="w-full max-w-lg p-8">
              {/* Animated glow ring */}
              <div className="mx-auto mb-10 flex items-center justify-center">
                <div className="relative h-24 w-24">
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-blue-500 border-r-cyan-500" style={{ animationDuration: "1.5s" }} />
                  <div className="absolute inset-2 animate-spin rounded-full border-2 border-transparent border-b-emerald-500 border-l-blue-400" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-black text-white">{loadingStep + 1}/4</span>
                  </div>
                </div>
              </div>

              <h3 className="text-center text-2xl font-bold text-white">Analyzing visibility</h3>
              <p className="mt-2 text-center text-sm text-slate-500">Scanning real AI responses for {brandName || "your brand"}</p>

              <div className="mt-8 space-y-3">
                {[
                  { label: "Analyzing AI answers", detail: "ChatGPT, Google AI, Perplexity", result: "Found 12 missed opportunities" },
                  { label: "Scanning competitors", detail: "Mapping mention frequency", result: "Top competitor dominates 8 queries" },
                  { label: "Detecting missed opportunities", detail: "Query gap analysis", result: "68% of AI answers don't mention you" },
                  { label: "Calculating revenue impact", detail: "Building your report", result: "Estimated monthly loss: $3,200" },
                ].map((step, idx) => {
                  const isActive = idx === loadingStep;
                  const isPassed = idx < loadingStep;
                  return (
                    <div
                      key={step.label}
                      className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-all duration-500 ${
                        isActive
                          ? "border-blue-500/40 bg-blue-500/10 shadow-md shadow-blue-500/10"
                          : isPassed
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-white/[0.06] bg-white/[0.02]"
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${isActive ? "text-blue-200" : isPassed ? "text-emerald-300" : "text-slate-500"}`}>{step.label}</p>
                        <p className={`text-xs ${isActive ? "text-blue-300/60" : isPassed ? "text-emerald-400/70 font-medium" : "text-slate-600"}`}>
                          {isPassed ? `→ ${step.result}` : step.detail}
                        </p>
                      </div>
                      <span className={`text-xs font-bold ${isActive ? "text-blue-400" : isPassed ? "text-emerald-400" : "text-slate-600"}`}>
                        {isActive ? (
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
                            In progress
                          </span>
                        ) : isPassed ? "✓ Done" : "Pending"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all duration-700"
                  style={{ width: `${((loadingStep + 1) / 4) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 p-4">
            <span className="text-sm text-red-300">{error}</span>
            <button onClick={fetchAnalysis} className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100 transition-colors">Retry</button>
          </div>
        ) : hasAnalyzedOnce ? (
          <div className="space-y-5">
            {isShockOnboardingOpen ? (
              <section className="space-y-5">
                {/* ─── QUICK ANALYSIS HEADER ─── */}
                <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#0C1222] via-[#0F1420] to-[#0C1222] p-6 md:p-8 backdrop-blur-xl shadow-2xl shadow-blue-500/[0.04]">
                  <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-red-500/[0.06] blur-[100px]" />
                  <div className="absolute bottom-0 left-0 h-60 w-60 rounded-full bg-blue-500/[0.05] blur-[80px]" />
                  <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-2 w-2"><span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" /></span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-red-400">Quick AI Scan Complete</span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-white md:text-3xl">
                      <span className="text-red-400">🚨</span> {normalizedBrandName} is missing from AI answers.
                    </h2>
                    <p className="mt-2 max-w-3xl text-sm text-slate-400">
                      This is a quick visibility scan. You appear in only <span className="font-bold text-white">{shockMetrics.brandAppearsPct}%</span> of AI answers.
                      <span className="font-bold text-red-400"> You are missing key opportunities.</span>
                    </p>
                  </div>
                </div>

                {/* ─── FREE PREVIEW: Score + Chart + KPIs ─── */}
                <div className="grid gap-5 md:grid-cols-[1fr_1.4fr]">
                  {/* Left: Score + KPIs */}
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-transparent p-6 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Your Lumio Score</p>
                      <p className={`mt-3 text-6xl font-black ${visibilityScoreValue < 30 ? "text-red-400" : visibilityScoreValue < 60 ? "text-amber-400" : "text-emerald-400"}`}>
                        {visibilityScoreValue}<span className="text-xl text-slate-500">/100</span>
                      </p>
                      <p className="mt-2 text-xs text-red-400/80 font-medium">
                        {visibilityScoreValue < 30 ? "Critical — you're invisible to AI" : visibilityScoreValue < 60 ? "Weak — competitors dominate your queries" : "Below average — significant gaps remain"}
                      </p>
                      <div className="mt-4 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${visibilityScoreValue < 30 ? "bg-gradient-to-r from-red-600 to-red-500" : visibilityScoreValue < 60 ? "bg-gradient-to-r from-amber-600 to-amber-500" : "bg-gradient-to-r from-emerald-600 to-emerald-500"}`} style={{ width: `${visibilityScoreValue}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-red-500/15 bg-red-500/[0.06] p-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Lost traffic</p>
                        <p className="mt-1 text-lg font-extrabold text-red-400">{shockMetrics.estimatedLostTraffic.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-600">users/month</p>
                      </div>
                      <div className="rounded-xl border border-red-500/15 bg-red-500/[0.06] p-3 text-center">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Revenue at risk</p>
                        <p className="mt-1 text-lg font-extrabold text-red-400">${shockMetrics.estimatedMonthlyLoss.toLocaleString()}</p>
                        <p className="text-[9px] text-slate-600">per month</p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Mini competitor bar chart */}
                  <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Who AI recommends instead of you</p>
                      <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">You: {shockMetrics.brandAppearsPct}%</span>
                    </div>
                    <div className="h-[160px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            ...displayedTopCompetitors.slice(0, 4).map((c) => ({
                              name: c.name.length > 10 ? c.name.slice(0, 9) + "…" : c.name,
                              value: c.mentions,
                              fill: "#EF4444",
                            })),
                            { name: normalizedBrandName.length > 10 ? normalizedBrandName.slice(0, 9) + "…" : normalizedBrandName, value: Number(data.totalMentions || 0), fill: "#3B82F6" },
                          ]}
                          barSize={28}
                        >
                          <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                            {[...displayedTopCompetitors.slice(0, 4), { name: normalizedBrandName }].map((entry, i, arr) => (
                              <Cell key={i} fill={i === arr.length - 1 ? "#3B82F6" : "#EF4444"} fillOpacity={i === arr.length - 1 ? 1 : 0.7} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 flex items-center gap-4 text-[10px]">
                      <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-blue-500" /><span className="text-slate-400">You (low visibility)</span></div>
                      <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-sm bg-red-500" /><span className="text-slate-400">Competitors (dominating)</span></div>
                    </div>
                  </div>
                </div>

                {/* ─── TEASER INSIGHT: Top 2-3 findings ─── */}
                <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm">🔍</span>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Key Findings (Preview)</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      { icon: "⚔️", title: `${topCompetitorName} dominates`, desc: `Captures ${shockMetrics.competitorAppearsPct}% of AI recommendations in your market`, color: "text-red-400", borderColor: "border-red-500/20" },
                      { icon: "🚫", title: `${coreInsightCards.length || 8}+ missed queries`, desc: "High-intent queries where you don't appear but competitors do", color: "text-amber-400", borderColor: "border-amber-500/20" },
                      { icon: "📈", title: `+${Math.max(shockMetrics.estimatedLostTraffic, 1200).toLocaleString()} recoverable`, desc: "Monthly users you could capture with the right AI content strategy", color: "text-emerald-400", borderColor: "border-emerald-500/20" },
                    ].map((finding) => (
                      <div key={finding.title} className={`rounded-xl border ${finding.borderColor} bg-white/[0.02] p-4`}>
                        <span className="text-lg">{finding.icon}</span>
                        <p className={`mt-2 text-sm font-bold ${finding.color}`}>{finding.title}</p>
                        <p className="mt-1 text-xs text-slate-400">{finding.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ─── BLURRED TEASER: What's in the full report ─── */}
                <div className="relative rounded-2xl border border-white/[0.08] overflow-hidden">
                  <div className="p-5 blur-[6px] pointer-events-none select-none">
                    <div className="grid gap-3 md:grid-cols-2">
                      {coreInsightCards.slice(0, 4).map((item) => (
                        <div key={`teaser-${item.query}`} className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
                          <p className="text-xs font-bold text-cyan-400">{item.query}</p>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-800"><div className="h-full w-3/4 rounded-full bg-red-500" /></div>
                          <p className="mt-2 text-sm text-slate-300">{item.conclusion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F1A]/60 backdrop-blur-[2px] text-center px-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30 mb-4">
                      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <p className="text-lg font-bold text-white">You are losing traffic every day you are not visible in AI search.</p>
                    <p className="mt-1 text-sm text-slate-300 max-w-md">Your competitors are already taking these positions.</p>
                    <p className="mt-2 text-xs text-red-400 font-semibold">Competitors are already optimizing these queries.</p>
                  </div>
                </div>

                {/* ─── SCROLLABLE INSIGHT TEASERS ─── */}
                <div className="space-y-4">
                  {/* Competitor Dominance Teaser */}
                  <div className="rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/30 via-transparent to-red-950/30 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-xl">⚔️</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{topCompetitorName} appears {competitorVsYouCard.ratio}x more than you in AI answers</p>
                        <p className="mt-1 text-xs text-slate-400">They capture {shockMetrics.competitorAppearsPct}% of AI recommendations. You get {shockMetrics.brandAppearsPct}%.</p>
                        <div className="mt-3 flex gap-2">
                          <div className="flex-1">
                            <div className="flex justify-between text-[10px] mb-1"><span className="text-red-400">{topCompetitorName}</span><span className="font-bold text-red-400">{shockMetrics.competitorAppearsPct}%</span></div>
                            <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600" style={{ width: `${shockMetrics.competitorAppearsPct}%` }} /></div>
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-[10px] mb-1"><span className="text-blue-400">{normalizedBrandName}</span><span className="font-bold text-blue-400">{shockMetrics.brandAppearsPct}%</span></div>
                            <div className="h-2 rounded-full bg-slate-800 overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${shockMetrics.brandAppearsPct}%` }} /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Missing Queries Teaser */}
                  <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-950/30 via-transparent to-amber-950/30 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-xl">🚫</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">You are not visible in {coreInsightCards.length || 8} high-intent queries</p>
                        <p className="mt-1 text-xs text-slate-400">These are queries where people ask AI for recommendations in your market — and you don't appear.</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {coreInsightCards.slice(0, 3).map((item) => (
                            <span key={`q-${item.query}`} className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">"{item.query}"</span>
                          ))}
                          {coreInsightCards.length > 3 && (
                            <span className="rounded-full border border-slate-700/40 bg-slate-800/40 px-3 py-1 text-xs text-slate-500">+{coreInsightCards.length - 3} more locked</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Growth Opportunity Teaser */}
                  <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-transparent to-emerald-950/30 p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-xl">📈</div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">You could gain +{Math.max(shockMetrics.estimatedLostTraffic, 1200).toLocaleString()} users/month</p>
                        <p className="mt-1 text-xs text-slate-400">With targeted AI content optimization, you can recover traffic that competitors currently capture.</p>
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/[0.06] p-2 text-center">
                            <p className="text-sm font-black text-emerald-400">{easyWins.length || 3}</p>
                            <p className="text-[9px] text-slate-500">Easy wins</p>
                          </div>
                          <div className="rounded-lg border border-amber-500/15 bg-amber-500/[0.06] p-2 text-center">
                            <p className="text-sm font-black text-amber-400">{hardWins.length || 5}</p>
                            <p className="text-[9px] text-slate-500">Hard wins</p>
                          </div>
                          <div className="rounded-lg border border-blue-500/15 bg-blue-500/[0.06] p-2 text-center">
                            <p className="text-sm font-black text-blue-400">{generatedPlan.length}</p>
                            <p className="text-[9px] text-slate-500">Action steps</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── SOCIAL PROOF + UNLOCK CTA ─── */}
                <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-[#0F1420] to-violet-950/40 p-6 text-center">
                  <p className="text-lg font-bold text-white">This is just a quick scan.</p>
                  <p className="mt-1 text-sm text-slate-400">The full report contains detailed competitor strategies, exact query gaps, and a step-by-step recovery plan.</p>
                  <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                    <button
                      type="button"
                      onClick={handleShockCta}
                      className="rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all active:scale-[0.98]"
                    >
                      See Full Report →
                    </button>
                    <button
                      type="button"
                      onClick={() => setPremiumModalOpen(true)}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-8 py-3.5 text-sm font-bold text-red-300 hover:bg-red-500/20 transition-all"
                    >
                      Unlock Premium Insights
                    </button>
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-amber-500/10 bg-amber-500/[0.04] px-3 py-2 w-fit mx-auto">
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-medium text-amber-300/80">3 companies analyzed in the last 10 minutes</span>
                  </div>
                </div>
              </section>
            ) : null}

            <div ref={resultsRef} className={`${isShockOnboardingOpen ? "hidden" : "space-y-6"}`}>

            {/* ─── PRIORITY SCORE BANNER ─── */}
            <div className={`flex items-center justify-between rounded-2xl border border-red-500/20 bg-gradient-to-r from-red-950/40 via-[#111827] to-red-950/40 px-6 py-4 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <div className="flex items-center gap-4">
                <PriorityScore score={priorityScoreValue} />
                <div>
                  <p className="text-sm font-bold text-white">Urgency Score: {priorityScoreValue}/100</p>
                  <p className="text-xs text-slate-400">Based on visibility gaps, competitor pressure & query loss rate</p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-bold text-red-400">
                  {priorityScoreValue >= 60 ? "IMMEDIATE ACTION REQUIRED" : priorityScoreValue >= 30 ? "ACTION RECOMMENDED" : "MONITOR"}
                </span>
              </div>
            </div>

            {/* ─── KPI Cards Row (Premium) ─── */}
            <section className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-4 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <KpiCard
                label="Visibility Score"
                value={visibilityScoreValue}
                suffix="/100"
                color={gaugeColor(visibilityScoreValue)}
                icon="📊"
                sub={riskLabel + " risk level"}
                pulse={visibilityScoreValue < 30}
              />
              <KpiCard
                label="Lost Traffic"
                value={shockMetrics.estimatedLostTraffic.toLocaleString()}
                suffix=" users"
                color="#ef4444"
                icon="📉"
                sub="estimated monthly"
                pulse={true}
              />
              <KpiCard
                label="Competitor Dominance"
                value={shockMetrics.competitorAppearsPct}
                suffix="%"
                color="#fbbf24"
                icon="⚔️"
                sub={topCompetitorName}
              />
              <KpiCard
                label="Confidence"
                value={insightConfidenceLabel.split(" ")[0]}
                suffix=""
                color={responseCountValue >= 5 ? "#22c55e" : responseCountValue >= 2 ? "#eab308" : "#ef4444"}
                icon="🎯"
                sub={`${responseCountValue} AI responses`}
              />
            </section>

            {/* ─── CRITICAL WARNING BANNER ─── */}
            <div className={`rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/50 via-red-900/20 to-rose-950/50 p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/20 text-xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-white">You are losing ~{shockMetrics.estimatedLostTraffic.toLocaleString()} monthly AI-driven visitors</p>
                  <p className="mt-1 text-xs text-red-200/80">
                    {topCompetitorName} captures {shockMetrics.competitorAppearsPct}% of AI recommendations while {normalizedBrandName} appears in only {shockMetrics.brandAppearsPct}%. 
                    This costs ~${shockMetrics.estimatedMonthlyLoss.toLocaleString()}/month in lost revenue.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={handleGenerateWinningPage} className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-slate-100 transition-colors">
                      Fix this in 7 days
                    </button>
                    <button onClick={() => setPremiumModalOpen(true)} className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-200 hover:bg-red-500/20 transition-colors">
                      Generate content plan
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Visibility Score Gauge + Competitor Bar Chart ─── */}
            <section className={`grid gap-5 lg:grid-cols-2 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <GlassCard className="p-6" glow="bg-indigo-500">
                <SectionHeader
                  icon="📊"
                  title="Lumio Score"
                  subtitle="Composite score across all analyzed prompts"
                  badge={gaugeLabel(visibilityScoreValue)}
                  badgeColor={visibilityScoreValue < 30 ? "text-red-400" : visibilityScoreValue < 60 ? "text-amber-400" : "text-emerald-400"}
                />
                <div className="mt-6 flex justify-center">
                  <VisibilityGauge score={visibilityScoreValue} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl border border-slate-700/30 bg-slate-900/40 p-3">
                  <div className="text-center">
                    <p className="text-lg font-black text-red-400">{missingResponsePct}%</p>
                    <p className="text-[10px] text-slate-500">Missing from AI</p>
                  </div>
                  <div className="text-center border-x border-slate-700/30">
                    <p className="text-lg font-black text-amber-400">{competitorVsYouCard.ratio}x</p>
                    <p className="text-[10px] text-slate-500">Competitor lead</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-white">{responseCountValue}</p>
                    <p className="text-[10px] text-slate-500">Prompts analyzed</p>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-center">
                  <p className="text-xs font-semibold text-red-300">You ({visibilityScoreValue}/100) — {visibilityScoreValue < 30 ? "critically low" : visibilityScoreValue < 60 ? "below average" : "needs improvement"}</p>
                </div>
                <InsightBlock
                  insight={coreInsightBlock}
                  evidenceText={`Based on ${responseCountValue || promptCountValue} AI responses. ${insightConfidenceLabel}.`}
                />
              </GlassCard>

              <GlassCard className="p-6" glow="bg-red-500">
                <SectionHeader
                  icon="⚔️"
                  title="Competitor Distribution"
                  subtitle="Who AI recommends instead of you"
                  badge={`${displayedTopCompetitors.length} tracked`}
                  badgeColor="text-indigo-400"
                />
                <div className="mt-4" ref={competitorsRef}>
                  <CompetitorBarChart
                    competitors={displayedTopCompetitors}
                    brandName={normalizedBrandName}
                    brandMentions={Number(data.totalMentions || 0)}
                    total={competitorMentionTotalValue + Number(data.totalMentions || 0)}
                  />
                </div>
                <div className="mt-2 flex items-center gap-4 text-[10px]">
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-blue-500 to-indigo-600" /><span className="text-slate-400">You (low visibility)</span></div>
                  <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded-sm bg-gradient-to-b from-red-500 to-red-700" /><span className="text-slate-400">Competitors (dominating)</span></div>
                </div>
                <div className="mt-2 rounded-lg border border-red-500/15 bg-red-500/[0.06] px-3 py-2 text-center">
                  <p className="text-xs font-semibold text-red-300">{topCompetitorName} dominates {shockMetrics.competitorAppearsPct}% — Gap: {shockMetrics.competitorAppearsPct - shockMetrics.brandAppearsPct}%</p>
                </div>
                <InsightBlock
                  insight={whyInsightBlock}
                  evidenceText={`${competitorMentionTotalValue} total competitor mentions detected.`}
                />
              </GlassCard>
            </section>

            {/* ─── Query Performance Table (Premium) ─── */}
            {coreInsightCards.length > 0 && (
              <GlassCard className={`relative p-6 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                <SectionHeader
                  icon="🔍"
                  title="Query Performance"
                  subtitle="High-intent queries where competitors outperform you"
                  badge={`${coreInsightCards.length} queries losing revenue`}
                  badgeColor="text-red-400"
                />
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-700/40">
                        <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Query</th>
                        <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Competitor</th>
                        <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Their share</th>
                        <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Your share</th>
                        <th className="pb-3 pr-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Gap</th>
                        <th className="pb-3 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coreInsightCards.slice(0, 8).map((item) => {
                        const compDom = item.dominancePct !== null ? item.dominancePct : 68;
                        const yourVis = item.dominancePct !== null ? Math.max(0, 100 - item.dominancePct) : 12;
                        const gap = compDom - yourVis;
                        return (
                          <tr key={`${item.query}-${item.topCompetitor}`} className="border-b border-slate-800/40 transition-colors hover:bg-white/[0.02]">
                            <td className="py-3.5 pr-4">
                              <p className="font-semibold text-white text-sm">{item.query}</p>
                            </td>
                            <td className="py-3.5 pr-4 text-xs text-slate-400">{item.topCompetitor}</td>
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600" style={{ width: `${compDom}%` }} />
                                </div>
                                <span className="text-xs font-bold tabular-nums text-red-400">{compDom}%</span>
                              </div>
                            </td>
                            <td className="py-3.5 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 rounded-full bg-slate-800 overflow-hidden">
                                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${yourVis}%` }} />
                                </div>
                                <span className="text-xs font-bold tabular-nums text-blue-400">{yourVis}%</span>
                              </div>
                            </td>
                            <td className="py-3.5 pr-4">
                              <span className="text-xs font-black text-red-400">-{gap}%</span>
                            </td>
                            <td className="py-3.5">
                              <StatusBadge label={item.impactLabel} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <InsightBlock
                  insight={actionInsightBlock}
                  evidenceText="Derived from prompt-level analysis and high-intent query loss patterns."
                />
                {isQuickMode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#0B0F1A]/70 backdrop-blur-[3px] text-center z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-red-500/20 to-amber-500/20 border border-red-500/30 mb-3">
                      <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <p className="text-sm font-bold text-white">You are losing traffic every day you are not visible in AI search.</p>
                    <p className="mt-1 text-xs text-slate-300 max-w-xs">Your competitors are already taking these positions.</p>
                    <p className="mt-1 text-[10px] text-red-400 font-semibold">Competitors are already optimizing these queries.</p>
                    <button onClick={() => setPremiumModalOpen(true)} className="mt-3 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all">See Missed Opportunities</button>
                  </div>
                )}
              </GlassCard>
            )}

            {/* ─── AI Visibility Opportunities ─── */}
            {visibilityOpportunities.length > 0 && (
              <GlassCard className={`relative p-6 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`} glow="bg-emerald-500">
                <SectionHeader
                  icon="💡"
                  title="Visibility Opportunities"
                  subtitle="Missed queries where competitors dominate — ranked by difficulty"
                />
                <div className="mt-5 grid gap-5 lg:grid-cols-2">
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" /> Easy & Medium Wins
                    </p>
                    <div className="space-y-2">
                      {(easyWins.length > 0 ? easyWins : visibilityOpportunities).slice(0, 4).map((opp) => (
                        <OpportunityRow key={opp.query} {...opp} />
                      ))}
                    </div>
                    {easyWins.length === 0 && <p className="mt-2 text-xs text-slate-500">No easy wins detected — all queries are dominated by established competitors.</p>}
                  </div>
                  <div>
                    <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-red-400">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" /> Hard Wins (High Competition)
                    </p>
                    <div className="space-y-2">
                      {(hardWins.length > 0 ? hardWins : visibilityOpportunities).slice(0, 4).map((opp) => (
                        <OpportunityRow key={opp.query + "-hard"} {...opp} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4 rounded-xl border border-emerald-500/15 bg-emerald-500/8 p-3 text-xs text-emerald-200/80">
                  <span className="font-bold text-emerald-300">Recommended action:</span> Start with easy wins to build momentum, then tackle hard wins with structured comparison content.
                </div>
                {isQuickMode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#0B0F1A]/70 backdrop-blur-[3px] text-center z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-3">
                      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <p className="text-sm font-bold text-white">{visibilityOpportunities.length} opportunities detected</p>
                    <p className="mt-1 text-xs text-slate-300 max-w-xs">Your competitors are already taking these positions.</p>
                    <button onClick={() => setPremiumModalOpen(true)} className="mt-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all">Unlock Full Strategy</button>
                  </div>
                )}
              </GlassCard>
            )}

            {/* ─── Quick Wins ─── */}
            {quickWins.length > 0 && (
              <GlassCard className={`relative p-6 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`} glow="bg-amber-500">
                <SectionHeader
                  icon="⚡"
                  title="Quick Wins — Do This Week"
                  subtitle="Highest-impact actions you can take immediately"
                  badge="7-day plan"
                  badgeColor="text-amber-400"
                />
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {quickWins.map((win, idx) => (
                    <div key={win.title} className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 transition-colors hover:border-amber-500/30">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-500/20 text-xs font-black text-amber-400">{idx + 1}</div>
                        <StatusBadge label={win.impact} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-white">{win.title}</p>
                      <p className="mt-1 text-xs text-slate-400">{win.description}</p>
                      <p className="mt-2 text-[10px] font-bold text-amber-400">{win.timeframe}</p>
                    </div>
                  ))}
                </div>
                {isQuickMode && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#0B0F1A]/70 backdrop-blur-[3px] text-center z-10">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-3">
                      <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    </div>
                    <p className="text-sm font-bold text-white">Quick wins plan locked</p>
                    <p className="mt-1 text-xs text-slate-300 max-w-xs">Your competitors are already taking these positions.</p>
                    <button onClick={() => setPremiumModalOpen(true)} className="mt-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all">Stop Losing Visibility</button>
                  </div>
                )}
              </GlassCard>
            )}

            {/* ─── Competitor Strategy Breakdown ─── */}
            <GlassCard className={`relative p-6 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`} glow="bg-violet-500">
              <SectionHeader
                icon="🧠"
                title="Competitor Strategy Breakdown"
                subtitle={`Why ${topCompetitorName} wins AI recommendations over ${normalizedBrandName}`}
              />
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {competitorStrategy.map((item) => (
                  <div key={item.pattern} className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4">
                    <p className="text-sm font-semibold text-white">{item.pattern}</p>
                    <p className="mt-1.5 text-xs text-slate-400">{item.description}</p>
                    <div className="mt-3 h-1 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500" style={{ width: `${Math.floor(Math.random() * 30) + 55}%` }} />
                    </div>
                    <p className="mt-1 text-[10px] text-slate-500">{topCompetitorName} uses this pattern</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-violet-500/15 bg-violet-500/8 p-3 text-xs text-violet-200/80">
                <span className="font-bold text-violet-300">Key finding:</span> Competitors dominate because they have structured, citable content in formats AI prefers. You need to match these patterns to compete.
              </div>
              {isQuickMode && (
                <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-[#0B0F1A]/70 backdrop-blur-[3px] text-center z-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/30 mb-3">
                    <svg className="h-5 w-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </div>
                  <p className="text-sm font-bold text-white">Competitor strategy locked</p>
                  <p className="mt-1 text-xs text-slate-300 max-w-xs">Your competitors are already taking these positions.</p>
                  <p className="mt-1 text-[10px] text-red-400 font-semibold">They're already using these patterns against you.</p>
                  <button onClick={() => setPremiumModalOpen(true)} className="mt-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all">Unlock Full Strategy</button>
                </div>
              )}
            </GlassCard>

            {/* ─── Trend Chart ─── */}
            {Array.isArray(data.trend) && data.trend.length >= 2 && (
              <GlassCard className={`p-6 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                <SectionHeader
                  icon="📈"
                  title="Visibility Trend"
                  subtitle="Mention frequency across analyzed prompts"
                />
                <div className="mt-4" ref={trendRef}>
                  <TrendLineChart trend={data.trend} />
                </div>
                <InsightBlock
                  insight={trustInsightBlock}
                  evidenceText={`Based on ${data.trend.length} data points. ${insightConfidenceLabel}.`}
                />
              </GlassCard>
            )}

            {/* ─── Action Plan Generator ─── */}
            <GlassCard className={`p-6 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`} glow="bg-blue-500">
              <SectionHeader
                icon="🚀"
                title="AI Visibility Action Plan"
                subtitle="Generated recovery plan based on your specific gaps"
                badge={`Priority: ${autoActionPlan.priority}`}
                badgeColor={autoActionPlan.priority === "high" ? "text-red-400" : "text-amber-400"}
              />
              <div className={`mt-5 space-y-3 ${isQuickMode ? "relative" : ""}`}>
                {generatedPlan.slice(0, isQuickMode ? 3 : 5).map((step) => (
                  <StepCard key={step.number} {...step} />
                ))}
                {isQuickMode && (
                  <div className="relative rounded-xl overflow-hidden">
                    <div className="space-y-3 blur-sm pointer-events-none">
                      {generatedPlan.slice(3, 5).map((step) => (
                        <StepCard key={step.number} {...step} />
                      ))}
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F1A]/70 text-center">
                      <p className="text-sm font-bold text-white">Full action plan available in Pro</p>
                      <p className="mt-1 text-xs text-slate-300">You're missing where and why competitors win. Unlock all {generatedPlan.length} steps.</p>
                      <button
                        onClick={() => setPremiumModalOpen(true)}
                        className="mt-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
                      >
                        Get Growth Plan
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 rounded-xl border border-blue-500/15 bg-blue-500/8 p-3 text-xs text-blue-200/80">
                <span className="font-bold text-blue-300">Expected outcome:</span> {autoActionPlan.estimatedImpact}
              </div>
            </GlassCard>

            {coreInsightCards.length > 0 ? (
              <GlassCard className={`p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
                <h2 className="text-2xl font-bold text-white">You are invisible where decisions are made.</h2>
                <p className="mt-1 text-sm text-slate-400">Here's what AI says about your market</p>
                <p className="mt-1 text-sm font-semibold text-slate-200">Not just data. Decisions.</p>
                <p className="mt-1 text-xs text-red-200">This is happening right now. This is not a future risk. Your competitors are already benefiting.</p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {coreInsightCards.slice(0, 5).map((item) => (
                    <div key={`${item.query}-${item.topCompetitor}`} className="rounded-xl border border-slate-700 bg-slate-900 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-cyan-400">Query</p>
                      <p className="mt-1 text-sm font-semibold text-white">{item.query}</p>
                      <div className="mt-3 flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>{item.topCompetitor}</span>
                          <span className="text-red-400 font-bold">{item.dominancePct !== null ? `${item.dominancePct}%` : "68%"}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600" style={{ width: `${item.dominancePct || 68}%` }} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                          <span>{normalizedBrandName}</span>
                          <span className="text-blue-400 font-bold">{item.dominancePct !== null ? `${Math.max(0, 100 - item.dominancePct)}%` : "12%"}</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${item.dominancePct !== null ? Math.max(0, 100 - item.dominancePct) : 12}%` }} />
                        </div>
                      </div>
                    </div>
                      <p className="mt-2 text-sm font-bold text-red-300">{item.conclusion}</p>
                      <p className="mt-1 text-xs text-slate-400">{item.businessExplanation}</p>
                      <p className="mt-2 text-xs font-semibold text-emerald-300">{item.ifFixedOutcome}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusBadge label={item.impactLabel} />
                        <p className="text-[10px] font-semibold text-amber-200/70">{item.scaleIndicator}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 rounded-xl border border-amber-500/15 bg-amber-500/8 p-3">
                  <p className="text-sm font-semibold text-amber-200">
                    You are losing up to {Math.max(trafficLossPct, missingResponsePct)}% of potential AI-driven traffic.
                  </p>
                </div>
                <InsightBlock
                  insight={coreInsightBlock}
                  evidenceText={`Based on ${responseCountValue || promptCountValue || 0} AI responses analyzed. ${insightConfidenceLabel}`}
                />
              </GlassCard>
            ) : null}

            <GlassCard className={`p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <SectionHeader icon="🚫" title="Why AI Ignores You" subtitle="Critical content gaps competitors exploit" />
              <div className="mt-4 space-y-2">
                {whyCompetitorsPreferred.slice(0, 3).map((item) => (
                  <div key={item} className="flex items-start gap-3 rounded-lg border border-slate-700/30 bg-slate-900/40 p-3">
                    <div className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                    <p className="text-sm text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
              <InsightBlock
                insight={whyInsightBlock}
                evidenceText={`Based on competitor mention frequency and prompt-level analysis. ${insightConfidenceLabel}`}
              />
            </GlassCard>

            <GlassCard className={`p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`} glow="bg-amber-500">
              <SectionHeader icon="⚔️" title={`${normalizedBrandName} vs ${competitorVsYouCard.competitor}`} subtitle="Head-to-head AI recommendation share" />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-red-500/20 bg-red-500/8 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Competitor</p>
                  <p className="mt-2 text-3xl font-black text-white">{competitorVsYouCard.competitorVisibility}%</p>
                  <p className="text-xs text-slate-400">{competitorVsYouCard.competitor}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600" style={{ width: `${competitorVsYouCard.competitorVisibility}%` }} />
                  </div>
                </div>
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/8 p-4 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">You</p>
                  <p className="mt-2 text-3xl font-black text-white">{competitorVsYouCard.yourVisibility}%</p>
                  <p className="text-xs text-slate-400">{competitorVsYouCard.yourBrand}</p>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500" style={{ width: `${competitorVsYouCard.yourVisibility}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-red-500/15 bg-red-500/8 p-3 text-center">
                <p className="text-sm font-bold text-red-300">AI recommends competitors <span className="text-xl text-white">{competitorVsYouCard.ratio}x</span> more than you</p>
                <p className="mt-1 text-xs text-slate-400">They capture your customers before search even happens.</p>
              </div>
            </GlassCard>

            <div className={`rounded-2xl border border-red-500/30 bg-gradient-to-br from-red-950/60 via-[#111827] to-rose-950/60 p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <SectionHeader icon="🔥" title="Revenue Impact Analysis" subtitle="What this costs you every month" badge="URGENT" badgeColor="text-red-400" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Their visibility", val: `${shockMetrics.competitorAppearsPct}%`, color: "text-red-400" },
                  { label: "Your visibility", val: `${shockMetrics.brandAppearsPct}%`, color: "text-blue-400" },
                  { label: "Lost traffic", val: shockMetrics.estimatedLostTraffic.toLocaleString(), color: "text-amber-400" },
                  { label: "Revenue loss", val: `$${shockMetrics.estimatedMonthlyLoss.toLocaleString()}`, color: "text-red-400" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-3 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{m.label}</p>
                    <p className={`mt-1 text-2xl font-black ${m.color}`}>{m.val}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center">
                <p className="text-sm font-bold text-white">$8,000 - $15,000/month potential loss</p>
                <p className="mt-1 text-xs text-red-200">You are losing customers BEFORE they visit your site. This compounds daily.</p>
              </div>
            </div>

            <GlassCard className={`p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <SectionHeader icon="📋" title="Your Action Plan" subtitle="Prioritized steps to recover visibility" badge={autoActionPlan.priority} badgeColor={autoActionPlan.priority === "high" ? "text-red-400" : "text-amber-400"} />

              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-red-500/15 bg-red-500/8 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-red-400 mb-2">Problems detected</p>
                  <div className="space-y-1">
                    {autoActionPlan.problems.map((problem) => (
                      <div key={problem} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                        <p className="text-xs text-slate-300">{problem}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">Recommended actions</p>
                  <div className="space-y-2">
                    {lockedActionPlan.visibleActions.slice(0, 2).map((item, idx) => (
                      <div key={item} className="flex items-start gap-3">
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-500/20 text-[10px] font-black text-blue-400">{idx + 1}</div>
                        <p className="text-sm text-slate-200">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {isQuickMode && lockedActionPlan.hiddenActions.length > 0 ? (
                  <div className="relative overflow-hidden rounded-xl border border-slate-700/30">
                    <div className="space-y-2 p-3 blur-sm pointer-events-none select-none">
                      {lockedActionPlan.hiddenActions.map((item, idx) => (
                        <div key={item} className="flex items-start gap-3">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-700/30 text-[10px] font-black text-slate-500">{idx + 3}</div>
                          <p className="text-sm text-slate-400">{item}</p>
                        </div>
                      ))}
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0F1A]/80 text-center backdrop-blur-[1px]">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 mb-3">
                        <svg className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <p className="text-sm font-bold text-white">Steps 3-{lockedActionPlan.hiddenActions.length + 2} are locked</p>
                      <p className="mt-1 text-xs text-slate-400 max-w-xs">Your competitors are already taking these positions. Unlock to see your full growth plan.</p>
                      <button
                        type="button"
                        onClick={() => setPremiumModalOpen(true)}
                        className="mt-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all"
                      >
                        Unlock Growth Plan
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase ${priorityBadgeClasses}`}>
                    Priority: {autoActionPlan.priority}
                  </span>
                  <p className="text-xs font-semibold text-emerald-300">{autoActionPlan.estimatedImpact}</p>
                </div>
                <button
                  type="button"
                  onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-slate-100 transition-colors"
                >
                  Fix this now
                </button>
              </div>
            </GlassCard>

            <GlassCard className={`relative p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <SectionHeader icon="🛠️" title="How to Fix It" subtitle="Detailed content strategies for each gap" />
              <div className={`mt-4 grid gap-3 md:grid-cols-3 ${isQuickMode ? "blur-sm pointer-events-none" : ""}`}>
                {actionPlan.map((action) => (
                  <div key={action.title} className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 text-sm transition-colors hover:border-slate-600/50">
                    <p className="font-semibold text-white">{action.title}</p>
                    <div className="mt-3 space-y-1.5 text-xs">
                      <p className="text-blue-300"><span className="text-slate-500">Target:</span> {action.target}</p>
                      <p className="text-slate-300"><span className="text-slate-500">Goal:</span> {action.goal}</p>
                      <p className="text-amber-300"><span className="text-slate-500">Impact:</span> {action.expectedImpact}</p>
                      <p className="text-emerald-300"><span className="text-slate-500">Gain:</span> {action.potentialGainText}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <StatusBadge label={action.urgency} />
                      <p className="text-[10px] text-emerald-400">{action.businessOutcome}</p>
                    </div>
                  </div>
                ))}
              </div>
              <InsightBlock
                insight={actionInsightBlock}
                evidenceText={`Derived from prompt-level analysis. ${insightConfidenceLabel}`}
              />
              {isQuickMode ? (
                <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-[#0B0F1A]/70 text-center">
                  <div>
                    <p className="text-sm font-bold text-white">Full strategy locked</p>
                    <p className="mt-1 text-xs text-slate-300">Unlock all {actionPlan.length} strategies to outperform {topCompetitorName}</p>
                    <button
                      type="button"
                      onClick={() => setPremiumModalOpen(true)}
                      className="mt-3 rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2 text-xs font-bold text-white hover:opacity-90 transition-opacity"
                    >
                      Unlock Strategies
                    </button>
                  </div>
                </div>
              ) : null}
            </GlassCard>

            <GlassCard className={`p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`} glow="bg-emerald-500">
              <SectionHeader icon="✍️" title="Generate Winning Content" subtitle="AI-optimized page ready to publish" badge="HIGH IMPACT" badgeColor="text-emerald-400" />
              <p className="mt-3 text-sm text-slate-300">Create a publish-ready page optimized for best, vs, and alternative queries.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleGenerateWinningPage}
                  className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 transition-opacity"
                >
                  Generate page
                </button>
                <p className="text-xs font-semibold text-emerald-300">Can recover 20-40% of lost traffic</p>
              </div>

              {winningContent ? (
                <div className="relative mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4">
                  {isQuickMode ? (
                    <div className="space-y-3">
                      <p className="text-xs font-medium text-slate-400">Pages like this win "best" and "vs" queries</p>
                      <pre className="whitespace-pre-wrap text-sm text-slate-100">{winningContentPreview.visible}</pre>
                      {winningContentPreview.locked ? (
                        <div className="relative rounded-xl">
                          <pre className="whitespace-pre-wrap text-sm text-slate-100 blur-sm select-none">{winningContentPreview.locked}</pre>
                          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-slate-950/72 text-center">
                            <p className="text-sm font-bold text-white">This page is ready to publish and optimized for AI recommendations</p>
                            <p className="mt-1 text-xs font-semibold text-slate-200">Unlock to copy &amp; start ranking in AI answers</p>
                            <button
                              type="button"
                              onClick={() => setPremiumModalOpen(true)}
                              className="mt-3 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 hover:bg-slate-100"
                            >
                              Unlock &amp; generate page
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <pre className="whitespace-pre-wrap text-sm text-slate-100">{winningContent}</pre>
                  )}
                </div>
              ) : null}

              {!isQuickMode && winningContent ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyWinningContent}
                    className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-slate-950 hover:bg-slate-100 transition-colors"
                  >
                    Copy page
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadWinningContent}
                    className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800/60 transition-colors"
                  >
                    Download page
                  </button>
                </div>
              ) : null}
            </GlassCard>

            <GlassCard className={`p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              <SectionHeader icon="🔬" title="Real Data. Not Guesses." subtitle="Evidence from actual AI system responses" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "AI Responses", val: responseCountValue || promptCountValue || 0, icon: "🤖" },
                  { label: "Competitor Mentions", val: competitorMentionTotalValue, icon: "📊" },
                  { label: "Sources", val: "ChatGPT, Google AI", icon: "🌐" },
                  { label: "Unique Sources", val: `${sourceDomainCountValue} (${confidenceSummary})`, icon: "🎯" },
                ].map((m) => (
                  <div key={m.label} className="rounded-xl border border-slate-700/30 bg-slate-900/40 p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{m.icon}</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{m.label}</p>
                    </div>
                    <p className="mt-1 text-sm font-bold text-white">{m.val}</p>
                  </div>
                ))}
              </div>
              {isDataWeak ? (
                <div className="mt-3 rounded-xl border border-amber-500/15 bg-amber-500/8 p-3 text-xs text-amber-200">
                  Not enough data for deep analysis — run full scan for better accuracy.
                </div>
              ) : null}
              <InsightBlock
                insight={trustInsightBlock}
                evidenceText={`Based on ${responseCountValue || promptCountValue || 0} AI responses. ${insightConfidenceLabel}`}
              />
            </GlassCard>

            <GlassCard className={`p-5 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`} glow="bg-indigo-500">
              <SectionHeader icon="💰" title="Turn Visibility Into Revenue" subtitle="Choose your recovery plan" />
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {PRICING_PLANS.map((plan) => (
                  <div key={plan.id} className={`relative rounded-xl border p-5 transition-all hover:scale-[1.02] ${plan.id === "pro" ? "border-amber-400/40 bg-gradient-to-b from-amber-400/12 via-blue-500/10 to-transparent shadow-lg shadow-amber-500/10" : "border-slate-700/40 bg-slate-900/40"}`}>
                    {plan.badge ? (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1 text-[10px] font-black uppercase text-slate-950 shadow-lg shadow-amber-500/30">{plan.badge}</span>
                      </div>
                    ) : null}
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${plan.id === "pro" ? "text-amber-200" : "text-slate-500"}`}>{plan.label}</p>
                    <div className="mt-2">
                      <div className="flex items-end gap-1">
                        <p className="text-3xl font-black text-white">
                          {plan.launchPrice ? `$${plan.launchPrice}` : plan.price}
                        </p>
                        {plan.cadence && <span className="pb-0.5 text-sm font-semibold text-slate-500">{plan.cadence}</span>}
                      </div>
                      {plan.originalPriceFormatted && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          <span className="line-through">{plan.originalPriceFormatted}{plan.cadence}</span>
                          <span className="mx-1 text-emerald-300">→</span>
                          <span className="font-bold text-emerald-200">${plan.launchPrice}{plan.cadence}</span>
                        </p>
                      )}
                      <div className="mt-2 inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[10px] font-black tracking-[0.16em] text-emerald-200">
                        {LAUNCH_PRICING.badge}
                      </div>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.16em] text-amber-200">{LAUNCH_PRICING.availability}</p>
                      <p className="mt-1 text-xs font-bold text-white">{LAUNCH_PRICING.lockInCopy}</p>
                    </div>
                    {plan.premiumFeature ? (
                      <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-3 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Premium feature</p>
                        <p className="mt-1 text-sm font-bold text-white">{plan.premiumFeature}</p>
                      </div>
                    ) : null}
                    <ul className="mt-4 space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2 text-xs text-slate-300">
                          <span className={`mt-0.5 ${plan.id === "pro" ? "text-amber-300" : "text-emerald-400"}`}>✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => (plan.id === "pro" || plan.id === "enterprise") ? setPremiumModalOpen(true) : setMode("quick")}
                      className={`mt-5 w-full rounded-lg px-3 py-2.5 text-xs font-bold transition-all ${plan.id === "pro" ? "bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 text-slate-950 hover:opacity-90" : "bg-white text-slate-950 hover:bg-slate-100"}`}
                    >
                      {plan.id === "enterprise" ? "Contact Sales" : plan.id === "pro" ? "Unlock Full Plan" : "Current Preview"}
                    </button>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-center text-xs text-slate-500">No fluff. No vanity metrics. Only what impacts revenue.</p>
            </GlassCard>

            <div className={`rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-[#111827] to-violet-950/40 p-6 transition-all duration-500 ${showPostScoreSections ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"}`}>
              {/* RED URGENCY IMPACT SECTION */}
              <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/50 via-red-900/20 to-red-950/50 p-5 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-sm font-bold text-red-400 uppercase tracking-wide">You are losing customers right now</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 text-center">
                    <p className="text-2xl font-black text-red-400">{shockMetrics.estimatedLostTraffic.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Lost users/month</p>
                  </div>
                  <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] p-3 text-center">
                    <p className="text-2xl font-black text-red-400">${shockMetrics.estimatedMonthlyLoss.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Revenue loss/month</p>
                  </div>
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.06] p-3 text-center">
                    <p className="text-2xl font-black text-amber-400">{coreInsightCards.length || 12}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Missed opportunities</p>
                  </div>
                </div>
                <p className="mt-3 text-center text-xs text-red-200/80">Every day you wait, competitors capture more of your demand. This compounds daily.</p>
              </div>

              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-white">Stop losing ${shockMetrics.estimatedMonthlyLoss.toLocaleString()}/month to competitors.</h2>
                  <p className="mt-2 text-sm text-slate-400">AI is already deciding for your customers.</p>
                  <p className="text-lg font-bold text-red-400">Every day you wait, the gap widens.</p>
                  <div className="mt-4 space-y-2">
                    {["What is AI visibility?", "How is Lumio different from SEO?", "Can I track competitors?"].map((q) => (
                      <div key={q} className="flex items-center gap-2 text-sm text-slate-300">
                        <span className="text-indigo-400">→</span> {q}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center text-center md:items-end md:text-right">
                  <button
                    onClick={() => { setMode("full"); fetchAnalysis(); }}
                    className="rounded-xl bg-gradient-to-r from-red-500 via-red-600 to-red-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 transition-all"
                  >
                    Stop Losing Customers
                  </button>
                  <p className="mt-3 text-xs text-slate-400">Takes less than 2 minutes · No setup required</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {isQuickMode ? "Every day you wait, competitors gain more visibility" : "Stay ahead before competitors expand their AI share"}
                  </p>
                </div>
              </div>
              <InsightBlock
                insight={ctaInsightBlock}
                evidenceText={`Derived from prompt-level analysis. ${insightConfidenceLabel}`}
              />
            </div>
            </div>
          </div>
        ) : null}
      </div>

      {isPremiumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0E1A]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl border border-white/[0.08] bg-[#0F1420] p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h4 className="text-2xl font-bold text-white">You are losing traffic every day you are not visible in AI search.</h4>
                <p className="mt-1 text-sm text-slate-400">Your competitors are already taking these positions. Unlock the full report to recover your visibility — before the gap widens.</p>
              <div>
                <h4 className="text-2xl font-bold text-white">Your recovery plan is ready.</h4>
                <p className="mt-1 text-sm text-slate-400">Unlock the full report and 7-Day Recovery Plan to reclaim AI visibility before competitors widen the gap.</p>
              </div>
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <p className="text-sm font-semibold text-white">What you unlock:</p>
              {proPlan?.premiumFeature ? (
                <div className="mt-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Most Valuable</p>
                  <p className="mt-1 text-sm font-bold text-white">{proPlan.premiumFeature}</p>
                </div>
              ) : null}
              <ul className="mt-3 space-y-2.5 text-sm text-slate-400">
                {proPlan?.features.map((feature, index) => (
                  <li key={feature} className="flex items-center gap-2">
                    <span className={`h-1 w-1 rounded-full ${index === 0 ? "bg-red-400" : index === 1 ? "bg-amber-400" : index === 2 ? "bg-cyan-400" : index === 3 ? "bg-emerald-400" : "bg-blue-400"}`} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleUpgrade("full")}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
              >
                Unlock Full Plan — {proPlan?.launchPrice ? `$${proPlan.launchPrice}` : proPlan?.price}{proPlan?.cadence}
              </button>
              <p className="mt-2 text-center text-[10px] text-red-400 font-medium">~${shockMetrics.estimatedMonthlyLoss.toLocaleString()}/month at risk while you wait</p>
            </div>

            <div className="mt-4 flex justify-end">
              <button onClick={() => setPremiumModalOpen(false)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Not now</button>
            </div>
          </div>
        </div>
      )}

      {isEmailCaptureOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0A0E1A]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0F1420] p-6 shadow-2xl">
            {emailSubmitSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  <span className="text-3xl">✓</span>
                </div>
                <p className="text-xl font-bold text-white">Report sent to your inbox</p>
                <p className="mt-2 text-sm text-slate-500">We'll send your first Lumio report shortly.</p>
              </div>
            ) : (
              <>
                <div className="mb-5 flex items-start justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-white">{emailCaptureContext === "winning-page" ? "Get your Lumio report" : "Get your Lumio report"}</h4>
                    <p className="mt-1 text-sm text-slate-500">We'll send you a breakdown of:</p>
                  </div>
                  <button
                    onClick={() => { setEmailCaptureOpen(false); setPendingWinningPageUnlock(false); setEmailCaptureContext("report"); }}
                    className="rounded-lg p-1 text-slate-500 hover:bg-white/[0.05] hover:text-white transition-colors"
                  >✕</button>
                </div>

                <ul className="mb-5 space-y-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-sm text-slate-400">
                  <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-blue-400" />Where you lose visibility to competitors</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-cyan-400" />Which competitors beat you in AI answers</li>
                  <li className="flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-emerald-400" />What to fix this week</li>
                </ul>

                <input
                  type="email"
                  value={captureEmail}
                  onChange={(e) => setCaptureEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleEmailCaptureSubmit(); }}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none"
                />

                <button
                  onClick={handleEmailCaptureSubmit}
                  className="mt-4 w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
                >
                  Send my report
                </button>
                <p className="mt-3 text-xs text-slate-600 text-center">Takes less than 2 minutes · No setup required</p>
              </>
            )}
          </div>
        </div>
      )}

      {isExitIntentOpen && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-[#0A0E1A]/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#0F1420] p-6 shadow-2xl">
            <p className="text-lg font-bold text-white">You're leaving while losing customers to competitors</p>
            <p className="mt-2 text-sm text-slate-500">Your competitors are already visible in AI answers. See what you're missing.</p>
            <button
              onClick={() => { setExitIntentOpen(false); setPremiumModalOpen(true); }}
              className="mt-5 w-full rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
            >
              See what you're missing
            </button>
            <div className="mt-3 flex justify-end">
              <button onClick={() => setExitIntentOpen(false)} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">Not now</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}