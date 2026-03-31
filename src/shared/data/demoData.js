/**
 * LUMIO AI — Demo Mode Dataset
 * Fictional brand: "Lumora AI" — AI productivity & workflow automation platform.
 * Competitors: Nexvia AI · Stratify AI · Dataflare
 *
 * This dataset feeds every existing dashboard engine (charts, insights, gap analysis, etc.)
 * without any API call. The shape matches mapApiResponse() exactly.
 * No value is ever 0 — weak presence is shown as 2–5 to reflect realistic AI indexing.
 */

export const DEMO_BRAND = "Lumora AI";

// ─── Rich insights (unique categories: visibility / content / competitor / source) ─────────
export const DEMO_INSIGHTS = [
  {
    id: 1,
    category: "visibility",
    severity: "critical",
    title: "Germany visibility gap — nobody owns this market yet",
    what:
      "Lumora AI scores 28/100 in Germany vs 68/100 in the US. Weak presence in just 3 out of 14 tracked German-language AI prompts.",
    why:
      "Nexvia AI and Stratify AI have German-language comparison lists. Lumora AI has minimal German-language content indexed by AI engines — 3 weak mentions vs Nexvia's 11.",
    source: "List articles + Reddit.de + Country-level visibility analysis",
    action:
      "Create 2 German-language landing pages targeting 'beste KI Produktivitätswerkzeuge' and 'KI Workflow Automatisierung'. AI rewards any brand that fills the language gap first.",
    impact: "+18 visibility points in Germany — equivalent to ~320 new monthly visits.",
  },
  {
    id: 2,
    category: "content",
    severity: "critical",
    title: "Missing from every 'best of' list article — Nexvia appears in 7",
    what:
      "Lumora AI appears in only 2 list articles with weak mentions. Nexvia AI appears in 7 separate 'Best AI Tools' list articles as a top-3 recommendation.",
    why:
      "AI recommendation engines use list articles as their primary citation source for product queries. With only 2 mentions vs 7+, you are crowded out of 'best tools' prompts.",
    source: "towardsdatascience.com · medium.com · g2.com — all tracked sources",
    action:
      "Publish 3 list-style comparison articles to Medium and towardsdatascience.com within 7 days. Title format: 'Best AI Productivity Tools in 2025'. Pitch 5 existing articles for inclusion.",
    impact: "+12 visibility points globally — moves you from 54 → ~66 without any paid acquisition.",
  },
  {
    id: 3,
    category: "competitor",
    severity: "high",
    title: "Comparison page gap — Nexvia AI alternatives dominated 71% by Stratify AI",
    what:
      "When users search 'Nexvia AI alternatives', Stratify AI and Dataflare appear. Lumora AI has only 3 weak comparison-page appearances.",
    why:
      "No structured comparison page exists on lumora.ai. Nexvia AI and Stratify AI both have structured '/vs' pages with feature tables that AI can parse and cite directly.",
    source: "Prompt analysis: 'Nexvia AI alternatives' — dominated 71% by Stratify AI",
    action:
      "Build a '/nexvia-ai-vs-lumora-ai' page with a structured feature comparison table, pricing side-by-side, and use-case differentiation. AI will start citing it within 2 weeks.",
    impact: "+9 visibility points in comparison-intent queries — recovers ~180 visits/month.",
  },
  {
    id: 4,
    category: "source",
    severity: "medium",
    title: "Reddit mention gap — 4x below Nexvia AI across tracked subreddits",
    what:
      "Lumora AI has 4 Reddit mentions across tracked subreddits. Nexvia AI has 14 and Stratify AI has 9. Reddit threads are one of the most AI-indexed community sources.",
    why:
      "Minimal community presence. Product use-case threads in r/artificial or r/productivity are absent. Nexvia AI users post about it weekly — those posts become AI training references.",
    source: "Reddit community analysis — r/artificial, r/productivity, r/SaaS",
    action:
      "Participate in 3 existing high-traffic threads this week and publish one detailed product use-case post. Be specific — generic posts do not get indexed by AI systems.",
    impact: "+6 tracked mentions per month — compounds over 6 weeks as threads stay indexed.",
  },
];

// ─── Prompt-level performance rows (no zero brand mentions — weak = 2–4) ─────────────────
const PROMPT_ROWS = [
  {
    prompt: "best AI productivity tools 2025",
    status: "Weak",
    brandMentions: 2,
    competitors: ["Nexvia AI", "Stratify AI", "Dataflare"],
  },
  {
    prompt: "AI workflow automation software",
    status: "Weak",
    brandMentions: 3,
    competitors: ["Stratify AI", "Nexvia AI"],
  },
  {
    prompt: "AI tools for marketing teams",
    status: "Seen",
    brandMentions: 5,
    competitors: ["Nexvia AI", "Stratify AI"],
  },
  {
    prompt: "Nexvia AI alternatives",
    status: "Weak",
    brandMentions: 2,
    competitors: ["Stratify AI", "Dataflare"],
  },
  {
    prompt: "enterprise AI platform comparison",
    status: "Weak",
    brandMentions: 3,
    competitors: ["Nexvia AI", "Dataflare"],
  },
  {
    prompt: "AI productivity software Reddit",
    status: "Seen",
    brandMentions: 6,
    competitors: ["Nexvia AI"],
  },
  {
    prompt: "top AI tools for startups 2025",
    status: "Weak",
    brandMentions: 2,
    competitors: ["Nexvia AI", "Stratify AI"],
  },
  {
    prompt: "best AI assistant for teams",
    status: "Weak",
    brandMentions: 3,
    competitors: ["Nexvia AI", "Stratify AI", "Dataflare"],
  },
];

// ─── 7-Day Execution Plan (Task / Output / Expected Result / Time / Difficulty) ──────────
export const DEMO_EXECUTION_PLAN = [
  {
    day: 1,
    title: "Map prompt gaps — find exactly where competitors beat you",
    theme: "Discovery & Audit",
    icon: "🔍",
    task: "Run the 8 tracked prompts in ChatGPT, Perplexity, and Google AI. Screenshot every result. Record every competitor that appears and rank where Lumora AI appears.",
    output: [
      "Prompt audit sheet with 8 rows: prompt / who appears / position / Lumora AI appearing?",
      "Screenshot folder organized by prompt",
      "Priority list: top 3 prompts with highest competitor dominance",
    ],
    result: "Precise map of where AI ignores you. This turns vague 'we need more visibility' into 'we need a comparison page for prompt X by Wednesday'.",
    actions: [
      "Open ChatGPT, Perplexity, and Google AI in three browser tabs",
      "Run each of the 8 tracked prompts in all three — record results in a spreadsheet",
      "Flag any prompt where Nexvia AI or Stratify AI appears and Lumora AI does not",
      "Sort by competitor dominance % — highest gap = first action",
      "Share the audit sheet with your content lead before Day 2",
    ],
    estimatedImpact: "Foundation for all 7 days — directly determines which content recovers the most traffic",
    trafficGain: 0,
    impactLevel: "medium",
    timeRequired: "2–3 hours",
    difficulty: "Easy",
    objective: "Audit all 8 tracked prompts and rank competitor dominance gaps",
  },
  {
    day: 2,
    title: "Build the Nexvia AI vs Lumora AI comparison page",
    theme: "Comparison Content",
    icon: "⚔️",
    task: "Build a structured '/nexvia-ai-vs-lumora-ai' comparison page. Feature table, pricing comparison, use-case differentiation, and a clear 'Why Lumora AI wins' section.",
    output: [
      "1 published comparison page (min. 800 words)",
      "Feature comparison table: 6+ categories side-by-side",
      "Pricing comparison block",
      "3 customer use-case callouts specific to Lumora AI",
    ],
    result: "AI systems will start citing this page within 14 days for 'Nexvia AI alternatives' queries — a prompt currently dominated 71% by Stratify AI.",
    actions: [
      "Create /nexvia-ai-vs-lumora-ai as a new page on your CMS",
      "Open Nexvia AI's pricing and features page — list every feature they claim",
      "Build a side-by-side table: Nexvia AI column vs Lumora AI column per category",
      "Add a pricing block with monthly costs and what each includes",
      "Write a 200-word 'When to choose Lumora AI' section addressing specific use-cases",
      "Publish and submit the URL to Google Search Console for priority indexing",
    ],
    estimatedImpact: "+12 visibility points on comparison-intent queries within 3 weeks",
    trafficGain: 180,
    impactLevel: "high",
    timeRequired: "4–5 hours",
    difficulty: "Medium",
    objective: "Capture the 'Nexvia AI alternatives' query currently dominated by Stratify AI",
  },
  {
    day: 3,
    title: "Create 20-question FAQ page with AI-extractable Schema markup",
    theme: "Structured Content",
    icon: "📋",
    task: "Write a /faq page with exactly 20 questions and answers structured with JSON-LD FAQ Schema. Cover: what, how, pricing, comparisons to Nexvia AI, integrations, use-cases.",
    output: [
      "Published /faq page with 20 Q&As (min. 50 words each)",
      "JSON-LD FAQ Schema markup embedded in page head",
      "5 questions that directly address common competitor comparisons",
    ],
    result: "AI systems extract FAQ content to answer conversational queries. This one page can appear in 4–6 new prompts where you currently show only 2–3 weak mentions.",
    actions: [
      "Draft 20 questions — use the prompt audit sheet from Day 1 to find real user questions",
      "Write detailed answers (50–100 words each) — include specific data, features, and differentiators",
      "Add FAQ schema: copy the JSON-LD template from schema.org/FAQPage",
      "Include 5 comparison questions: 'How does Lumora AI compare to Nexvia AI?' format",
      "Publish page, link from homepage footer and main navigation",
      "Test with Google Rich Results tester to confirm schema is valid",
    ],
    estimatedImpact: "+8 visibility points on informational queries — surfaces in 4–6 new prompt types",
    trafficGain: 140,
    impactLevel: "high",
    timeRequired: "3–4 hours",
    difficulty: "Easy",
    objective: "Make Lumora AI AI-extractable for conversational and informational queries",
  },
  {
    day: 4,
    title: "Pitch 5 'Best AI Tools' articles for inclusion",
    theme: "List Article Coverage",
    icon: "📣",
    task: "Identify 5 existing 'best AI productivity tools' articles and send personalized outreach to get Lumora AI added or updated in the listicle.",
    output: [
      "5 article targets identified (from towardsdatascience.com, medium.com, or similar)",
      "5 personalized outreach emails sent",
      "One-page data brief: Lumora AI stats, features, differentiators for authors",
    ],
    result: "+15 visibility on list-format prompts after 3–4 inclusions. List articles are the #1 AI citation source — Nexvia AI appears in 7 of them. You need 4 minimum.",
    actions: [
      "Search Google for 'best AI productivity tools 2025 site:medium.com OR site:towardsdatascience.com'",
      "Pick 5 articles published within the last 6 months with 500+ estimated reads",
      "Find the author's email or LinkedIn — do not use generic contact forms",
      "Write one personalized email per article: reference their specific list, explain what makes Lumora AI different, offer data or exclusive insights as a hook",
      "Attach or link a 1-page media brief with Lumora AI stats and quotes",
      "Follow up once after 5 business days if no reply",
    ],
    estimatedImpact: "+15 visibility points when 3+ inclusions land — recovers ~250 visits/month from list prompts",
    trafficGain: 250,
    impactLevel: "high",
    timeRequired: "2–3 hours",
    difficulty: "Medium",
    objective: "Break into 'best of' list articles that currently drive Nexvia AI's AI mention advantage",
  },
  {
    day: 5,
    title: "Publish 2 Reddit threads and engage 3 existing discussions",
    theme: "Community Presence",
    icon: "💬",
    task: "Post 2 detailed Reddit threads in r/artificial and r/productivity. Engage genuinely in 3 existing threads where productivity tools are being discussed.",
    output: [
      "2 original Reddit posts (min. 300 words each) with real use-case detail",
      "3 substantive replies to existing high-traffic threads",
      "One post comparing Lumora AI to Nexvia AI with specific data",
    ],
    result: "+6 tracked community mentions per month. Reddit threads stay indexed and become AI reference material within 3–6 weeks — this compounds over time.",
    actions: [
      "Search r/artificial and r/productivity for threads about AI productivity tools in the last 30 days",
      "Find 3 threads where Nexvia AI or Stratify AI are being discussed",
      "Write a substantive reply (100+ words) adding Lumora AI perspective — be specific, not promotional",
      "Create a new thread in r/artificial: 'I compared Lumora AI vs Nexvia AI for 30 days — here's what I found'",
      "Create a second thread in r/productivity: 'How we use AI workflow automation to save 8 hours/week'",
      "Be honest, data-driven, and reply to every comment within 24 hours",
    ],
    estimatedImpact: "+6 community citations/month — compounds to +18 monthly mentions by week 6",
    trafficGain: 90,
    impactLevel: "medium",
    timeRequired: "2 hours",
    difficulty: "Easy",
    objective: "Close the 4x Reddit mention gap vs Nexvia AI — currently Lumora AI's biggest source deficit",
  },
  {
    day: 6,
    title: "Localize 2 core pages for Germany — first mover advantage",
    theme: "Region Expansion",
    icon: "🌍",
    task: "Translate and adapt your homepage and top comparison page into German. Target the queries 'beste KI Produktivitätswerkzeuge' and 'KI Workflow Automatisierung'.",
    output: [
      "German variant of homepage (/de) — translated and localized (not just Google Translate)",
      "German comparison page: 'Nexvia AI Alternative — Lumora AI im Vergleich'",
      "Hreflang tags on both pages for German language targeting",
    ],
    result: "+18 visibility points in Germany. Germany currently scores 28/100. No major competitor has localized. You have a 4–6 month window before Nexvia AI catches up.",
    actions: [
      "Use a professional translator or DeepL Pro + editor review — no raw machine translation",
      "Adapt pricing for € currency and mention GDPR compliance explicitly",
      "Create /de landing page with localized headline, hero section, and FAQ",
      "Create /de/nexvia-ai-alternative comparison page targeting German alternative queries",
      "Add hreflang: <link rel='alternate' hreflang='de' href='https://lumora.ai/de/'> in head",
      "Submit both /de URLs to Google Search Console under Germany as a target country",
    ],
    estimatedImpact: "+18 visibility points in Germany — first-mover advantage worth ~320 new monthly visits/month",
    trafficGain: 320,
    impactLevel: "high",
    timeRequired: "4–6 hours",
    difficulty: "Medium",
    objective: "Capture Germany visibility (currently 28/100) — no competitor is invested here yet",
  },
  {
    day: 7,
    title: "Track all prompt wins, schedule 3 new pages from data",
    theme: "Measure & Scale",
    icon: "📈",
    task: "Re-run the 8 tracked prompts from Day 1. Record changes. Identify which new content is being cited. Schedule 3 more pages based on what worked first.",
    output: [
      "Updated prompt audit sheet with Day 1 baseline vs Day 7 results",
      "Change log: prompts where Lumora AI appeared for the first time",
      "Content calendar: 3 new pages scheduled for Week 2 based on gap data",
    ],
    result: "Compound effect begins: Day 2–6 content is being indexed. New pages scheduled for Week 2 using real data instead of guesses. Trajectory: +22 additional visits in Week 2.",
    actions: [
      "Re-run all 8 prompts in ChatGPT, Perplexity, and Google AI",
      "Record: any new appearances by Lumora AI? Any drop in competitor dominance?",
      "Note which prompt types responded fastest to new content (comparison, FAQ, Reddit)",
      "Identify 3 new prompts with high traffic potential from the audit",
      "Schedule pages for the 3 new prompts using the comparison or FAQ format that worked",
      "Send a summary to your team: what changed, what to build next, what the trajectory looks like",
    ],
    estimatedImpact: "Establishes a compound growth loop — each week compounds the last. Week 2 target: +22 additional visits.",
    trafficGain: 220,
    impactLevel: "high",
    timeRequired: "2–3 hours",
    difficulty: "Easy",
    objective: "Lock in the growth loop — turn first-week wins into a repeatable AI visibility system",
  },
];

// ─── Full Analysis Dataset — shape matches mapApiResponse() return ────────────────────────
export const DEMO_DATA = {
  brandName: "Lumora AI",
  industry: "AI productivity tools",
  country: "Auto (US, UK, Germany)",

  // Core scores
  score: 54,
  visibilityScore: 54,
  visibilityRiskScore: 46,
  coverage: 54,
  efficiency: 54,
  potentialImpressionGain: 37,

  // Mention stats
  totalMentions: 14,
  promptCount: 8,
  responseCount: 8,
  sourceDomainCount: 5,
  competitorMentionTotal: 47,
  competitorPressureScore: 47,
  queryTrafficLossPct: 63,
  hasSufficientData: true,

  // Data quality
  confidenceLevel: "high",
  sourceConfidence: "high",
  sourceConfidenceScore: 78,
  fallbackInjected: false,
  dataSource: "demo",
  isDemo: true,

  // Key insight & recs
  summaryInsight:
    "Nexvia AI dominates AI recommendations in your market while Lumora AI is under-represented. You appear at the bottom of list results when you appear at all — comparison prompts and zero list-article presence are the two highest-leverage gaps to close.",

  recommendations: [
    "Publish an 'Nexvia AI vs Lumora AI' comparison page this week — highest single ROI content move available right now.",
    "Create 3 list-style articles ('Best AI Productivity Tools', 'AI Workflow Automation Software', 'Top AI Tools for Startups') and submit to Medium and towardsdatascience.com.",
    "Target Germany first: localize 2 core pages for German-language AI search. No major competitor has done this — the window is open.",
    "Increase Reddit presence in r/artificial and r/productivity. Nexvia AI's mention count is 4x Lumora AI's — closeable in 2 weeks.",
  ],

  channelPerformance: [],

  // Competitors
  topCompetitors: [
    {
      name: "Nexvia AI",
      mentionCount: 22,
      appearanceRate: 47,
      score: 22,
      relevanceScore: 85,
      source: "detected",
      whyItAppears:
        "Nexvia AI is mentioned 22 times across AI responses — dominates best-of lists and comparison-intent prompts. Strong Reddit and blog coverage compounds their lead.",
    },
    {
      name: "Stratify AI",
      mentionCount: 14,
      appearanceRate: 30,
      score: 14,
      relevanceScore: 72,
      source: "detected",
      whyItAppears:
        "Stratify AI appears in 14 AI responses — particularly strong in workflow automation and enterprise comparison segments with structured documentation.",
    },
    {
      name: "Dataflare",
      mentionCount: 11,
      appearanceRate: 23,
      score: 11,
      relevanceScore: 61,
      source: "detected",
      whyItAppears:
        "Dataflare is consistently mentioned in data-driven AI tool comparisons with 11 tracked mentions — growing in the analytics-adjacent segment.",
    },
  ],

  // Sources
  topSources: [
    {
      name: "towardsdatascience.com",
      source: "towardsdatascience.com",
      type: "blog",
      confidence: "high",
      mentionCount: 7,
      score: 7,
    },
    {
      name: "medium.com",
      source: "medium.com",
      type: "blog",
      confidence: "medium",
      mentionCount: 6,
      score: 6,
    },
    {
      name: "reddit.com",
      source: "reddit.com",
      type: "community",
      confidence: "medium",
      mentionCount: 4,
      score: 4,
    },
    {
      name: "g2.com",
      source: "g2.com",
      type: "review",
      confidence: "medium",
      mentionCount: 3,
      score: 3,
    },
    {
      name: "techcrunch.com",
      source: "techcrunch.com",
      type: "news",
      confidence: "low",
      mentionCount: 2,
      score: 2,
    },
  ],

  // Query insights (prompts where brand is absent)
  queryInsights: [
    {
      query: "best AI productivity tools 2025",
      brandMentions: 2,
      topCompetitor: "Nexvia AI",
      topCompetitorMentions: 5,
      dominancePct: 74,
    },
    {
      query: "AI workflow automation software",
      brandMentions: 3,
      topCompetitor: "Stratify AI",
      topCompetitorMentions: 4,
      dominancePct: 68,
    },
    {
      query: "Nexvia AI alternatives",
      brandMentions: 2,
      topCompetitor: "Stratify AI",
      topCompetitorMentions: 4,
      dominancePct: 71,
    },
    {
      query: "enterprise AI platform comparison",
      brandMentions: 3,
      topCompetitor: "Nexvia AI",
      topCompetitorMentions: 3,
      dominancePct: 65,
    },
    {
      query: "top AI tools for startups 2025",
      brandMentions: 2,
      topCompetitor: "Nexvia AI",
      topCompetitorMentions: 4,
      dominancePct: 78,
    },
  ],

  // Prompt rows for the prompt performance page
  promptRows: PROMPT_ROWS,

  // Visibility trend (6 data points — slight decline showing urgency)
  trend: [
    { month: "Oct", total: 3 },
    { month: "Nov", total: 2 },
    { month: "Dec", total: 4 },
    { month: "Jan", total: 2 },
    { month: "Feb", total: 1 },
    { month: "Mar", total: 2 },
  ],

  // Regional performance
  regionVisibility: [
    { region: "US", score: 68 },
    { region: "UK", score: 46 },
    { region: "Germany", score: 28 },
  ],
  strongestRegion: "US",
  weakestRegion: "Germany",
  regionInsight:
    "You are strong in US (68/100) but weak in Germany (28/100). Germany is a high-opportunity market — no major competitor has localized for it yet.",

  // Position in AI response (must sum to 100)
  positionAnalysis: {
    beginning: 8,
    middle: 22,
    end: 48,
    none: 22,
  },

  // Context format analysis (raw counts)
  contextAnalysis: {
    listFormat: 3,
    comparisonFormat: 2,
    paragraphExplanation: 5,
  },

  // Category visibility scores by intent
  globalCategoryScores: {
    generic: 38,
    comparison: 26,
    brand: 44,
    niche: 24,
  },
  countryCategoryScores: {
    US: { generic: 44, comparison: 34, brand: 52, niche: 28 },
    UK: { generic: 30, comparison: 22, brand: 36, niche: 16 },
    Germany: { generic: 16, comparison: 12, brand: 22, niche: 10 },
  },

  // Detail (unused but expected)
  detail: { globalResults: [], countryResults: [] },
  queryLossInsights: [],

  // Competitor breakdowns
  userCompetitors: [],
  detectedCompetitors: ["Nexvia AI", "Stratify AI", "Dataflare"],
  mergedCompetitors: [
    { name: "Nexvia AI", mentionCount: 22, source: "detected" },
    { name: "Stratify AI", mentionCount: 14, source: "detected" },
    { name: "Dataflare", mentionCount: 11, source: "detected" },
  ],
  detectedOnlyCount: 3,

  // 3-week strategy seeds
  strategySeeds: [
    {
      phase: "stabilize",
      week: 1,
      objective: "Stop losses on 'best AI productivity tools 2025'",
      kpi: "Reduce prompt loss by 12 pts",
    },
    {
      phase: "expand",
      week: 2,
      objective: "Capture comparison intent vs Nexvia AI",
      kpi: "Gain 280 visits/mo",
    },
    {
      phase: "compound",
      week: 3,
      objective: "Build source diversity and authority signals",
      kpi: "Add 4 high-trust citations",
    },
  ],

  // Rich demo-specific insights (WHAT/WHY/SOURCE/ACTION/IMPACT)
  demoInsights: DEMO_INSIGHTS,

  // 7-day execution plan for demo mode (unlocked, shows full value)
  demoExecutionPlan: DEMO_EXECUTION_PLAN,
};
