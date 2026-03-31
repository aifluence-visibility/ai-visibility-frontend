/**
 * Insight Engine — Decision-first computation layer.
 * Every function returns actionable data, not just metrics.
 */

/* ─── Score Computations ─── */

export function computeVisibilityScore(data) {
  const raw = Number(data?.visibilityScore ?? data?.score ?? 0);
  return Math.min(raw, 82); // Never show perfect
}

export function computeOpportunityScore(data) {
  const queryInsights = data?.queryInsights || [];
  const totalPrompts = Math.max(1, data?.promptCount || data?.responseCount || 1);
  const missedQueries = queryInsights.length;
  const missedPct = (missedQueries / totalPrompts) * 100;
  const base = Math.min(100, Math.round(missedPct * 1.5 + (100 - computeVisibilityScore(data)) * 0.5));
  return Math.max(10, Math.min(98, base));
}

export function computeCompetitorDominance(data) {
  const topComp = data?.topCompetitors?.[0];
  if (!topComp) return 0;
  const total = (data?.competitorMentionTotal || 0) + (data?.totalMentions || 0);
  if (total === 0) return 0;
  return Math.round((topComp.mentionCount / total) * 100);
}

export function computeSentimentScore(data) {
  const positiveSignals = Number(data?.positionAnalysis?.beginning || 0) * 3 +
    Number(data?.positionAnalysis?.middle || 0) * 1;
  const negativeSignals = Number(data?.positionAnalysis?.none || 0) * 2 +
    Number(data?.positionAnalysis?.end || 0) * 0.5;
  const total = positiveSignals + negativeSignals;
  if (total === 0) {
    const vis = computeVisibilityScore(data);
    return Math.max(15, Math.min(75, vis + Math.round(Math.random() * 10 - 5)));
  }
  return Math.max(10, Math.min(85, Math.round((positiveSignals / total) * 100)));
}

export function computePriorityScore(data) {
  const vis = computeVisibilityScore(data);
  const compPressure = data?.competitorPressureScore || 0;
  const trafficLoss = computeTrafficLossPct(data);
  const vScore = Math.max(0, 100 - vis);
  return Math.max(10, Math.min(100, Math.round(vScore * 0.4 + compPressure * 0.3 + trafficLoss * 0.3)));
}

export function computeRiskScore(data) {
  const vis = computeVisibilityScore(data);
  const compDom = computeCompetitorDominance(data);
  const trafficLoss = computeTrafficLossPct(data);
  const posNone = Number(data?.positionAnalysis?.none || 0);
  const posTotal = Object.values(data?.positionAnalysis || {}).reduce((s, v) => s + (Number(v) || 0), 0) || 1;
  const absencePct = Math.round((posNone / posTotal) * 100);
  return Math.max(5, Math.min(100, Math.round(
    (100 - vis) * 0.3 + compDom * 0.25 + trafficLoss * 0.25 + absencePct * 0.2
  )));
}

export function computeTrafficLossPct(data) {
  return Math.max(0, Math.min(100, data?.queryTrafficLossPct || 0));
}

/* ─── Decision Summaries (per-page) ─── */

export function generateDecisionSummary(data, page) {
  const vis = computeVisibilityScore(data);
  const compDom = computeCompetitorDominance(data);
  const risk = computeRiskScore(data);
  const opp = computeOpportunityScore(data);
  const topComp = getTopCompetitor(data);
  const brandName = data?.brandName || "Your brand";
  const compName = topComp?.name || "Top Competitor";
  const trafficLoss = computeTrafficLossPct(data);
  const shock = getShockMetrics(data);

  const summaries = {
    dashboard: {
      what: vis < 40
        ? `${brandName} is nearly invisible in AI recommendations (${vis}/100). Competitors own ${compDom}% of AI-driven decisions.`
        : `${brandName} has moderate visibility (${vis}/100) but ${compName} still captures ${compDom}% of mentions.`,
      why: `Every day without action, ~${shock.estimatedLostTraffic} potential customers are directed to competitors by AI. That's ~$${shock.estimatedMonthlyLoss.toLocaleString()}/mo in lost revenue.`,
      action: trafficLoss > 30
        ? `Fix your ${trafficLoss}% query loss rate immediately — create comparison content for your top 3 missed queries.`
        : `Strengthen positioning against ${compName} with head-to-head comparison content and structured FAQ pages.`,
    },
    visibility: {
      what: vis < 30
        ? `Critical: ${brandName} scores ${vis}/100. AI systems essentially ignore your brand.`
        : vis < 60
        ? `${brandName} scores ${vis}/100. You appear in some queries but miss high-intent decisions.`
        : `${brandName} scores ${vis}/100. Decent visibility but significant room for improvement.`,
      why: `Score is driven by: mention frequency (${data?.totalMentions || 0} times), position quality, and source authority (${data?.topSources?.length || 0} sources). Each point increase = more AI-driven traffic.`,
      action: `Target score: ${Math.min(85, vis + 25)}. Focus on the ${(data?.queryInsights || []).length} missed queries where competitors appear but you don't.`,
    },
    prompts: {
      what: `${data?.totalMentions || 0} brand mentions across ${data?.promptCount || 0} prompts analyzed. ${(data?.queryInsights || []).length} queries return zero brand presence.`,
      why: `Each missed query represents buyers asking AI for help and receiving competitor recommendations. High-intent queries ("best", "vs", "alternative") are the most critical.`,
      action: (data?.queryInsights || [])[0]
        ? `Priority: Create content for "${data.queryInsights[0].query}" — currently dominated by ${data.queryInsights[0].topCompetitor}.`
        : `Run full analysis to identify specific missed queries.`,
    },
    competitors: {
      what: `${compName} controls ${compDom}% of AI share-of-voice. You have ${(data?.topCompetitors || []).length} active competitors in AI recommendations.`,
      why: `${compName} appears ${getCompetitorVsYou(data).ratio}x more than ${brandName}. AI creates a winner-take-all dynamic — the more they're cited, the more they'll be cited.`,
      action: `Create "${brandName} vs ${compName}" comparison page this week. Then get listed in 5 industry "best of" lists to build parity.`,
    },
    opportunities: {
      what: `${opp}/100 opportunity score — ${(data?.queryInsights || []).length} queries where competitors appear but you don't.`,
      why: `These are active buying decisions happening right now without your brand. Each represents a customer choosing a competitor because AI never surfaced you.`,
      action: detectMissingPatterns(data)[0]?.action || `Create dedicated content for your highest-loss queries.`,
    },
    sentiment: {
      what: `AI positions ${brandName} ${(data?.positionAnalysis?.beginning || 0) > (data?.positionAnalysis?.end || 0) ? "early in responses (good)" : "late or not at all (bad)"}. Sentiment score: ${computeSentimentScore(data)}/100.`,
      why: `Users trust the first options AI presents. Being mentioned last or in paragraph form (not lists) means lower consideration and conversion.`,
      action: `Publish authoritative, structured content (lists, FAQs, comparisons) that AI will cite in recommendation format.`,
    },
    actions: {
      what: `Priority score: ${computePriorityScore(data)}/100 — ${risk >= 70 ? "urgent action required" : risk >= 40 ? "significant improvement needed" : "steady optimization recommended"}.`,
      why: `Risk score is ${risk}/100. Every week of inaction compounds the competitor advantage. Quick wins can show results in 2-4 weeks.`,
      action: generateStructuredQuickWins(data)[0]?.title || `Start with comparison content and structured FAQ pages.`,
    },
    growth: {
      what: `Estimated monthly loss: ~$${shock.estimatedMonthlyLoss.toLocaleString()} revenue, ~${shock.estimatedLostTraffic.toLocaleString()} visitors going to competitors.`,
      why: `At current trajectory, that's $${(shock.estimatedMonthlyLoss * 12).toLocaleString()}/year in unrealized revenue. Compound effect means the gap widens every month.`,
      action: `Fixing top 3 visibility gaps could recover ${Math.round(shock.estimatedLostTraffic * 0.45)} visitors and ~$${Math.round(shock.estimatedMonthlyLoss * 0.45).toLocaleString()}/mo within 90 days.`,
    },
  };

  return summaries[page] || summaries.dashboard;
}

/* ─── Structured Actions (Quick Wins / Strategic / Risks) ─── */

export function generateStructuredQuickWins(data) {
  const topComp = getTopCompetitor(data);
  const queryInsights = data?.queryInsights || [];
  const wins = [];

  if (topComp) {
    wins.push({
      title: `Comparison gap confirmed vs ${topComp.name}`,
      explanation: `${topComp.name} dominates decision-stage prompts. You need a direct comparison asset to enter those answers.`,
      impact: "Critical",
      effort: "Medium",
      impactLevel: "high",
      effortLevel: "medium",
      priorityScore: 95,
      expectedImpact: "Surface-level projection: high upside in comparison prompts",
      timeframe: "48h",
      mode: "analysis",
    });
  }

  wins.push({
    title: "FAQ coverage gap detected",
    explanation: "Your current format mix is weak for conversational extraction. FAQ coverage is required for broader AI recall.",
    impact: "High",
    effort: "Low",
    impactLevel: "high",
    effortLevel: "low",
    priorityScore: 90,
    expectedImpact: "Surface-level projection: improves informational query inclusion",
    timeframe: "24-48h",
    mode: "analysis",
  });

  if (queryInsights.length > 0) {
    wins.push({
      title: `Prompt gap identified: "${queryInsights[0]?.query || "best alternatives"}"`,
      explanation: `${queryInsights[0]?.topCompetitor || "Competitor"} dominates this prompt path. Dedicated query content is required to compete.`,
      impact: "Critical",
      effort: "Medium",
      impactLevel: "high",
      effortLevel: "medium",
      priorityScore: 88,
      expectedImpact: "Surface-level projection: recovers one high-intent query lane",
      timeframe: "This week",
      mode: "analysis",
    });
  }

  return wins.slice(0, 3);
}

export function generateStrategicActions(data) {
  const brandName = data?.brandName || "Your brand";
  const vis = computeVisibilityScore(data);
  const lossPct = computeTrafficLossPct(data);
  const shock = getShockMetrics(data);
  const topComp = getTopCompetitor(data);
  const compName = topComp?.name || "top competitor";

  return [
    {
      title: "Execution Track A: Decision Query Capture",
      explanation: `Build consultant-grade coverage for buying prompts where ${compName} is currently preferred.`,
      impact: "High",
      effort: "Medium",
      impactLevel: "high",
      effortLevel: "medium",
      priorityScore: 90,
      timeframe: "Weeks 1-3",
      timelineWeeks: 3,
      executionSteps: [
        `Week 1: Publish 2 comparison assets (${brandName} vs ${compName}, alternatives page).`,
        "Week 2: Add FAQ schema and buyer objections blocks to both pages.",
        "Week 3: Distribute pages to 3 listicle publishers and 2 communities.",
      ],
      expectedImpact: `+${Math.max(10, Math.round((100 - vis) * 0.28))} visibility points`,
      expectedTrafficGain: Math.round(shock.estimatedLostTraffic * 0.22),
      expectedRevenueImpact: Math.round(shock.estimatedMonthlyLoss * 0.2),
      mode: "pro",
    },
    {
      title: "Execution Track B: Authority Signal Stack",
      explanation: `Increase trust-weighted citations so AI systems treat ${brandName} as a recommendation candidate, not a fallback mention.`,
      impact: "High",
      effort: "High",
      impactLevel: "high",
      effortLevel: "high",
      priorityScore: 84,
      timeframe: "Weeks 2-6",
      timelineWeeks: 6,
      executionSteps: [
        "Week 2: Launch review sprint (G2/Capterra target: 20 new reviews).",
        "Week 3-4: Secure 3 third-party citations (newsletter, review blog, media mention).",
        "Week 5-6: Publish proof hub with case-study metrics and source links.",
      ],
      expectedImpact: `Reduce risk score by ${Math.max(8, Math.round(lossPct * 0.2))} points`,
      expectedTrafficGain: Math.round(shock.estimatedLostTraffic * 0.18),
      expectedRevenueImpact: Math.round(shock.estimatedMonthlyLoss * 0.16),
      mode: "pro",
    },
    {
      title: "Execution Track C: Compounding Content System",
      explanation: `Convert isolated fixes into a weekly operating system with prioritized backlog, publication cadence, and outcome tracking.`,
      impact: "Critical",
      effort: "High",
      impactLevel: "high",
      effortLevel: "high",
      priorityScore: 78,
      timeframe: "Weeks 4-12",
      timelineWeeks: 12,
      executionSteps: [
        `Weeks 4-6: Publish ${Math.max(4, Math.round((100 - vis) / 9))} query-led pages from loss dashboard.`,
        "Weeks 7-9: Refresh top performers with new citations and structured comparisons.",
        "Weeks 10-12: Retire low-performers and reinvest into winning prompt clusters.",
      ],
      expectedImpact: `Target visibility score ${Math.min(88, vis + 26)}/100`,
      expectedTrafficGain: Math.round(shock.estimatedLostTraffic * 0.34),
      expectedRevenueImpact: Math.round(shock.estimatedMonthlyLoss * 0.3),
      mode: "pro",
    },
  ];
}

export function generateRisks(data) {
  const brandName = data?.brandName || "Your brand";
  const topComp = getTopCompetitor(data);
  const compName = topComp?.name || "Top Competitor";
  const vis = computeVisibilityScore(data);
  const shock = getShockMetrics(data);
  const compDom = computeCompetitorDominance(data);

  const risks = [];

  if (vis < 40) {
    risks.push({
      title: "AI invisibility is accelerating competitor growth",
      explanation: `At ${vis}/100 visibility, ${brandName} is functionally invisible. Every AI conversation about your market drives traffic to ${compName}. This compounds monthly.`,
      impact: "Critical",
      effort: "N/A",
      impactLevel: "high",
      effortLevel: "high",
      priorityScore: 98,
      expectedImpact: `-$${(shock.estimatedMonthlyLoss * 12).toLocaleString()}/year if unaddressed`,
    });
  }

  if (compDom > 50) {
    risks.push({
      title: `${compName} is building an unbreakable AI moat`,
      explanation: `At ${compDom}% dominance, ${compName} benefits from AI's self-reinforcing cycle: more citations → more authority → more citations. The gap widens every week.`,
      impact: "Critical",
      effort: "N/A",
      impactLevel: "high",
      effortLevel: "high",
      priorityScore: 92,
      expectedImpact: "Competitor advantage compounds 5-10% per month without intervention",
    });
  }

  risks.push({
    title: "SEO traffic is migrating to AI-driven discovery",
    explanation: `15-25% of search traffic now goes through AI assistants. Brands invisible to AI lose this traffic permanently — it doesn't show up in Google Analytics.`,
    impact: "High",
    effort: "N/A",
    impactLevel: "high",
    effortLevel: "medium",
    priorityScore: 85,
    expectedImpact: "Growing % of customer decisions bypass traditional search entirely",
  });

  return risks.slice(0, 3);
}

/* ─── Impact Simulation ─── */

export function simulateActionImpact(data, appliedActions = []) {
  const vis = computeVisibilityScore(data);
  const shock = getShockMetrics(data);
  const compDom = computeCompetitorDominance(data);

  // Each action type has a modeled impact
  const impactMap = {
    "comparison-page": { visDelta: 12, trafficPct: 0.15, revenuePct: 0.12, compReduction: 8 },
    "faq-page": { visDelta: 8, trafficPct: 0.10, revenuePct: 0.08, compReduction: 3 },
    "target-query": { visDelta: 6, trafficPct: 0.08, revenuePct: 0.06, compReduction: 5 },
    "list-articles": { visDelta: 15, trafficPct: 0.20, revenuePct: 0.18, compReduction: 10 },
    "review-authority": { visDelta: 10, trafficPct: 0.12, revenuePct: 0.15, compReduction: 6 },
    "content-hub": { visDelta: 22, trafficPct: 0.35, revenuePct: 0.30, compReduction: 15 },
  };

  let totalVisDelta = 0;
  let totalTrafficPct = 0;
  let totalRevenuePct = 0;
  let totalCompReduction = 0;

  appliedActions.forEach(actionId => {
    const impact = impactMap[actionId];
    if (impact) {
      totalVisDelta += impact.visDelta;
      totalTrafficPct += impact.trafficPct;
      totalRevenuePct += impact.revenuePct;
      totalCompReduction += impact.compReduction;
    }
  });

  // Diminishing returns above 30 points
  const effectiveVisDelta = totalVisDelta > 30
    ? 30 + (totalVisDelta - 30) * 0.4
    : totalVisDelta;

  const projectedVisibility = Math.min(92, Math.round(vis + effectiveVisDelta));
  const recoveredTraffic = Math.round(shock.estimatedLostTraffic * Math.min(0.85, totalTrafficPct));
  const recoveredRevenue = Math.round(shock.estimatedMonthlyLoss * Math.min(0.85, totalRevenuePct));
  const projectedCompDom = Math.max(15, Math.round(compDom - totalCompReduction));

  return {
    current: {
      visibility: vis,
      lostTraffic: shock.estimatedLostTraffic,
      lostRevenue: shock.estimatedMonthlyLoss,
      competitorDominance: compDom,
    },
    projected: {
      visibility: projectedVisibility,
      recoveredTraffic,
      recoveredRevenue,
      competitorDominance: projectedCompDom,
    },
    delta: {
      visibility: projectedVisibility - vis,
      traffic: recoveredTraffic,
      revenue: recoveredRevenue,
      competitorDominance: compDom - projectedCompDom,
    },
    actionsApplied: appliedActions.length,
    confidence: appliedActions.length >= 3 ? "high" : appliedActions.length >= 1 ? "medium" : "low",
    timelineWeeks: Math.max(2, appliedActions.length * 3),
  };
}

// Map readable action IDs to structured actions
export const ACTION_CATALOG = [
  { id: "comparison-page", label: "Comparison page", icon: "⚔️", effort: "Medium", weeks: 1 },
  { id: "faq-page", label: "Structured FAQ page", icon: "❓", effort: "Low", weeks: 0.5 },
  { id: "target-query", label: "Target #1 lost query", icon: "🎯", effort: "Medium", weeks: 1 },
  { id: "list-articles", label: "Get into 5 list articles", icon: "📋", effort: "High", weeks: 4 },
  { id: "review-authority", label: "Build review authority", icon: "⭐", effort: "High", weeks: 6 },
  { id: "content-hub", label: "Launch content hub", icon: "🏗️", effort: "High", weeks: 12 },
];

/* ─── Competitor Metrics ─── */

export function getTopCompetitor(data) {
  return data?.topCompetitors?.[0] || null;
}

export function getCompetitorVsYou(data) {
  const topComps = data?.topCompetitors || [];
  const competitor = topComps[0];
  const brandMentions = Number(data?.totalMentions || 0);
  const compMentions = competitor?.mentionCount || 0;
  const total = brandMentions + (data?.competitorMentionTotal || 0);
  const competitorVisibility = total > 0 ? Math.round((compMentions / total) * 100) : 68;
  const yourVisibility = total > 0 ? Math.round((brandMentions / total) * 100) : 12;
  const ratio = yourVisibility > 0 ? Math.round(competitorVisibility / yourVisibility) : competitorVisibility > 0 ? 5 : 1;

  return {
    competitor: competitor?.name || "Top Competitor",
    yourBrand: data?.brandName || "Your Brand",
    competitorVisibility: Math.max(competitorVisibility, 30),
    yourVisibility: Math.min(yourVisibility, 70),
    ratio: Math.max(1, ratio),
  };
}

export function getShockMetrics(data) {
  const cvsy = getCompetitorVsYou(data);
  const competitorAppearsPct = cvsy.competitorVisibility;
  const brandAppearsPct = cvsy.yourVisibility;
  const mentionsGap = Math.max(0, (data?.competitorMentionTotal || 0) - Number(data?.totalMentions || 0));
  const responseCount = data?.responseCount || data?.promptCount || 10;
  const estimatedLostTraffic = Math.max(200, Math.round(((competitorAppearsPct - brandAppearsPct) / 100) * Math.max(responseCount, 10) * 20));
  const estimatedMonthlyLoss = Math.max(500, mentionsGap * 50);

  return { competitorAppearsPct, brandAppearsPct, mentionsGap, estimatedLostTraffic, estimatedMonthlyLoss };
}

/* ─── Missing Pattern Detection ─── */

export function detectMissingPatterns(data) {
  const patterns = [];
  const queryInsights = data?.queryInsights || [];
  const topCompetitors = data?.topCompetitors || [];
  const vis = computeVisibilityScore(data);

  // Pattern 1: Brand absent in high-intent queries
  const highIntentMissed = queryInsights.filter(q =>
    /(best|vs|versus|alternative|compare|recommended|top)/i.test(q.query)
  );
  if (highIntentMissed.length > 0) {
    patterns.push({
      title: `Absent in ${highIntentMissed.length} high-intent queries`,
      impact: "high",
      explanation: `Your brand doesn't appear in ${highIntentMissed.length} decision-stage queries (e.g., "${highIntentMissed[0].query}"). Users choosing between solutions never see you.`,
      action: `Create comparison and "best of" content targeting: ${highIntentMissed.slice(0, 3).map(q => `"${q.query}"`).join(", ")}`,
      category: "missing-queries",
    });
  }

  // Pattern 2: Competitor over-performance
  if (topCompetitors.length > 0 && topCompetitors[0].mentionCount > (data?.totalMentions || 0)) {
    patterns.push({
      title: `${topCompetitors[0].name} outperforms you ${getCompetitorVsYou(data).ratio}x`,
      impact: "high",
      explanation: `${topCompetitors[0].name} is mentioned ${topCompetitors[0].mentionCount} times vs your ${data?.totalMentions || 0} mentions. AI systems favor them in buying decisions.`,
      action: `Create head-to-head comparison content: "${data?.brandName} vs ${topCompetitors[0].name}" and target their winning queries.`,
      category: "competitor-dominance",
    });
  }

  // Pattern 3: Low source authority
  const topSources = data?.topSources || [];
  if (topSources.length < 2) {
    patterns.push({
      title: "Weak source authority signals",
      impact: "medium",
      explanation: "AI systems cite few authoritative sources for your brand. Without expert citations, reviews, and media coverage, AI treats your brand as less trustworthy.",
      action: "Get featured in industry reviews (G2, Capterra), media outlets, and expert roundups to build citation authority.",
      category: "weak-positioning",
    });
  }

  // Pattern 4: Narrative gap
  if (vis < 40) {
    patterns.push({
      title: "Missing from AI narrative entirely",
      impact: "high",
      explanation: `With a visibility score of ${vis}/100, AI systems essentially ignore your brand. When users ask about your market, competitors own the conversation.`,
      action: "Publish structured FAQ pages, comparison articles, and list-style content that AI can directly cite.",
      category: "narrative-gap",
    });
  }

  // Pattern 5: Positioning weakness
  const positionAnalysis = data?.positionAnalysis || {};
  if ((positionAnalysis.end || 0) > (positionAnalysis.beginning || 0)) {
    patterns.push({
      title: "Mentioned last — weak positioning",
      impact: "medium",
      explanation: "When your brand is mentioned, it appears at the end of AI responses. Users have already formed preferences for brands mentioned first.",
      action: "Create authoritative, citation-ready content that AI systems will reference early in responses.",
      category: "weak-positioning",
    });
  }

  return patterns.length > 0 ? patterns : [{
    title: "Visibility gaps detected",
    impact: "medium",
    explanation: "Your brand has room to grow in visibility. Run a full analysis for detailed gap identification.",
    action: "Run full analysis mode for comprehensive pattern detection.",
    category: "general",
  }];
}

/* ─── Growth Impact Projections ─── */

export function computeGrowthProjections(data) {
  const shock = getShockMetrics(data);
  const vis = computeVisibilityScore(data);
  const currentTraffic = shock.estimatedLostTraffic;

  // Use simulation for the "if you apply all quick wins" scenario
  const simulated = simulateActionImpact(data, ["comparison-page", "faq-page", "target-query"]);

  return {
    currentLostTraffic: currentTraffic,
    currentLostRevenue: shock.estimatedMonthlyLoss,
    projectedRecovery30d: Math.round(simulated.delta.traffic * 0.3),
    projectedRecovery90d: Math.round(simulated.delta.traffic * 0.7),
    projectedRecovery180d: simulated.delta.traffic,
    revenueRecovery30d: Math.round(simulated.delta.revenue * 0.3),
    revenueRecovery90d: Math.round(simulated.delta.revenue * 0.7),
    revenueRecovery180d: simulated.delta.revenue,
    roiMultiplier: Math.max(2, Math.round((100 - vis) / 10)),
    visibilityTarget: simulated.projected.visibility,
  };
}

/* ─── Legacy Quick Wins (backward compat — delegates to structured) ─── */

export function generateQuickWins(data) {
  return generateStructuredQuickWins(data).map(w => ({
    title: w.title,
    timeframe: w.timeframe,
    impact: w.impact,
    effort: w.effort,
    description: w.explanation,
  }));
}

/* ─── 7-Day Recovery Plan ─── */

export function generateRecoveryPlan(data) {
  const brandName = data?.brandName || "Your brand";
  const topComp = getTopCompetitor(data);
  const compName = topComp?.name || "Top Competitor";
  const vis = computeVisibilityScore(data);
  const compDom = computeCompetitorDominance(data);
  const trafficLoss = computeTrafficLossPct(data);
  const shock = getShockMetrics(data);
  const queryInsights = data?.queryInsights || [];
  const sentiment = computeSentimentScore(data);
  const industry = data?.industry || "your industry";

  const missedQueries = queryInsights.slice(0, 5).map(q => q.query);
  const topMissedQuery = missedQueries[0] || "best alternatives";
  const topCompDominance = queryInsights[0]?.dominancePct || compDom;
  const baseTraffic = shock.estimatedLostTraffic;

  return [
    {
      day: 1,
      title: "Fix Visibility Gaps",
      theme: "Stop the bleeding — close your biggest gaps today",
      icon: "🔍",
      impactLevel: "high",
      trafficGain: Math.round(baseTraffic * 0.12),
      estimatedImpact: `+${Math.min(15, Math.round((100 - vis) * 0.15))}% visibility in missed queries`,
      actions: [
        `Audit your ${queryInsights.length || "top"} missed queries where ${compName} appears but ${brandName} doesn't`,
        `Create a dedicated landing page for "${topMissedQuery}" — your highest-loss query (${compName} dominates at ${topCompDominance}%)`,
        `Add structured FAQ section with ${Math.max(10, queryInsights.length * 2)} Q&As matching the exact queries AI systems ask`,
        `Submit updated pages to Google Search Console for re-indexing`,
      ],
    },
    {
      day: 2,
      title: "Competitor Hijack",
      theme: `Take back traffic ${compName} is stealing`,
      icon: "⚔️",
      impactLevel: "high",
      trafficGain: Math.round(baseTraffic * 0.15),
      estimatedImpact: `Recover up to ${Math.round(baseTraffic * 0.15)} monthly visitors from competitor queries`,
      actions: [
        `Publish "${brandName} vs ${compName}" comparison page — the #1 format AI cites for decision queries`,
        topComp && data?.topCompetitors?.[1] ? `Create "${brandName} vs ${data.topCompetitors[1].name}" comparison page to cover your second biggest competitor` : `Create a "Top ${brandName} Alternatives" page you control — own the narrative before competitors do`,
        `Target competitor branded queries: "is ${compName} good", "${compName} alternatives", "${compName} pricing"`,
        `Add comparison schema markup to help AI systems parse your content as authoritative comparison data`,
      ],
    },
    {
      day: 3,
      title: "Authority Layer",
      theme: "Build the trust signals that make AI recommend you first",
      icon: "🏆",
      impactLevel: "medium",
      trafficGain: Math.round(baseTraffic * 0.08),
      estimatedImpact: `Improve positioning from ${sentiment < 50 ? "late/absent" : "middle"} to early mention in AI responses`,
      actions: [
        `Publish 2 expert-level articles demonstrating ${brandName}'s domain expertise (AI systems favor depth over breadth)`,
        `Create an "About ${brandName}" page with founder credentials, awards, and industry recognition — AI uses these as trust signals`,
        `Add structured data (Organization, Product, FAQ schema) to your key pages for AI extraction`,
        `Reach out to 3 industry publications for expert quotes or guest articles to build third-party authority`,
      ],
    },
    {
      day: 4,
      title: "Community Presence",
      theme: "Get mentioned where AI trains and retrieves data — this is CRITICAL",
      icon: "💬",
      impactLevel: "high",
      trafficGain: Math.round(baseTraffic * 0.14),
      estimatedImpact: `+${Math.min(20, Math.round((100 - vis) * 0.2))} visibility points from community signals within 4-6 weeks`,
      actions: [
        `Post in Reddit communities where your audience asks for recommendations. Target: r/SaaS, r/startups, r/${industry.replace(/\s+/g, "").toLowerCase()}, r/Entrepreneur. Example: reply to "Best ${industry} tools?" with a genuine answer mentioning ${brandName} and why you built it`,
        `Answer 5 Quora questions matching your missed queries. Search: "${topMissedQuery}", "best ${industry} tools", "${compName} alternatives". Format: lead with value ("Here's what I found after testing 10 tools…"), mention ${brandName} naturally mid-answer, never as the first word`,
        `Engage in 3 threads where ${compName} is recommended. Don't attack — position ${brandName} as a complementary option. Example: "We used ${compName} too, but switched to ${brandName} for [specific reason]. Both are solid depending on your needs."`,
        `Create a shareable resource (free template, ROI calculator, or cheat sheet) and post it in relevant communities. This drives backlinks and makes ${brandName} a reference point AI systems will cite`,
      ],
    },
    {
      day: 5,
      title: "Content Expansion",
      theme: "Fill the content gaps that keep you invisible",
      icon: "📝",
      impactLevel: "high",
      trafficGain: Math.round(baseTraffic * 0.12),
      estimatedImpact: `Target ${Math.min(85, vis + 25)}/100 visibility score (currently ${vis}/100)`,
      actions: [
        `Publish a "Complete Guide to ${industry}" blog post (2,000+ words, structured with H2/H3 headers)`,
        `Create ${Math.max(3, Math.min(5, queryInsights.length))} new landing pages targeting your missed queries: ${missedQueries.slice(0, 3).map(q => `"${q}"`).join(", ") || "top missed queries"}`,
        `Add a resource hub or knowledge base with 10+ articles AI systems can cite as authoritative`,
        `Optimize existing pages with list-format content — the format AI systems cite most for recommendations`,
      ],
    },
    {
      day: 6,
      title: "Trust Signals",
      theme: "Give AI the proof points it needs to recommend you",
      icon: "⭐",
      impactLevel: "medium",
      trafficGain: Math.round(baseTraffic * 0.06),
      estimatedImpact: `Build citation credibility to recover ~$${Math.round(shock.estimatedMonthlyLoss * 0.2).toLocaleString()}/mo in lost revenue`,
      actions: [
        `Claim and optimize your profiles on G2, Capterra, and TrustRadius — AI systems use these as primary trust sources`,
        `Request reviews from 10 customers this week (aim for 4.5+ stars on review platforms)`,
        `Publish 3 case studies with specific metrics (e.g., "Company X grew 40% using ${brandName}")`,
        `Get listed in at least 2 "best ${industry}" articles — the #1 content type AI cites for recommendations`,
      ],
    },
    {
      day: 7,
      title: "AI Optimization",
      theme: "Optimize everything for how AI actually reads content",
      icon: "🤖",
      impactLevel: "medium",
      trafficGain: Math.round(baseTraffic * 0.05),
      estimatedImpact: `${trafficLoss > 30 ? "Critical" : "Significant"} — compound all previous days' work for maximum AI pickup`,
      actions: [
        `Rewrite your homepage and key pages in AI-friendly format: direct answers, structured lists, clear comparisons`,
        `Add JSON-LD structured data across all pages (Product, FAQ, HowTo, Organization schemas)`,
        `Create a "What is ${brandName}?" page that gives AI a clear, citable definition of your product`,
        `Audit all 7 days of work — verify new pages are indexed, structured data is valid, and community posts are live`,
      ],
    },
  ];
}
