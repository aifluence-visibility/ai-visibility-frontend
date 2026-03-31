function topCompetitorName(data) {
  return data?.topCompetitors?.[0]?.name || "your top competitor";
}

function firstMissedQuery(data) {
  return data?.queryInsights?.[0]?.query || `best ${data?.industry || "AI tools"}`;
}

export function detectActionContentType(action) {
  const source = `${action?.title || ""} ${action?.description || ""} ${action?.reasoning || ""} ${action?.explanation || ""}`.toLowerCase();
  if (/(comparison|vs\s|alternative|alternatives)/.test(source)) return "comparison";
  if (/(faq|schema|q&a|question)/.test(source)) return "faq";
  if (/(list|best\s|roundup|top\s)/.test(source)) return "list";
  if (/(query|prompt)/.test(source) && /(best|top|alternative)/.test(firstMissedQuery({ queryInsights: [{ query: source }] }))) return "list";
  return null;
}

export function generateActionContentDraft({ action, data, variant = 0 }) {
  const type = detectActionContentType(action);
  if (!type) return null;

  const brandName = data?.brandName || "Your Brand";
  const industry = data?.industry || "AI Visibility";
  const competitor = topCompetitorName(data);
  const missedQuery = firstMissedQuery(data);
  const valueProp = data?.summaryInsight || `${brandName} helps teams improve AI visibility and decision-stage demand.`;
  const variantLabel = variant % 2 === 0 ? "practical" : "strategic";

  if (type === "comparison") {
    return [
      `# ${brandName} vs ${competitor}`,
      "",
      "## Quick verdict",
      `${brandName} is the better fit for teams that want faster AI visibility improvement, clearer recovery priorities, and a tighter decision engine. ${competitor} may already own more citations today, but ${brandName} can win with stronger structured content and faster execution.`,
      "",
      "## What this page covers",
      `This ${variantLabel} comparison explains where ${brandName} wins, where ${competitor} currently has stronger visibility, and how buyers should evaluate the two options.`,
      "",
      `## Why teams compare ${brandName} and ${competitor}`,
      `${missedQuery} is already a live decision query. Buyers are actively asking AI systems which platform to choose, and a direct comparison page gives ${brandName} a better chance of being cited in those answers.`,
      "",
      `## Where ${brandName} wins`,
      `### 1. Clearer visibility diagnostics`,
      `${brandName} shows where your brand is missing, why competitors win, and exactly what to do next without forcing teams to piece together reports manually.`,
      `### 2. Faster execution path`,
      `Instead of raw analytics alone, ${brandName} translates insight into actions, content recommendations, and recovery priorities.`,
      `### 3. Better fit for growth teams`,
      `${brandName} is built for teams that need a growth system, not just a dashboard.`,
      "",
      `## Where ${competitor} may be stronger today`,
      `### Existing citation footprint`,
      `${competitor} may already be referenced more often across list articles, community threads, or comparison pages. That is a visibility advantage, not necessarily a product advantage.`,
      `### Legacy presence`,
      `If ${competitor} has older content assets live in market, AI systems may surface them more often until ${brandName} builds direct competitive pages and FAQ support.`,
      "",
      `## Feature comparison`,
      `### Visibility analysis`,
      `${brandName} focuses on prompt-level gaps, competitors, insights, and execution paths.`,
      `### Actionability`,
      `${brandName} turns AI visibility gaps into specific actions and content opportunities.`,
      `### Decision support`,
      `${brandName} is designed for operators who want to improve performance, not just monitor it.`,
      "",
      `## Who should choose ${brandName}`,
      `Choose ${brandName} if your team wants a system that identifies visibility gaps, explains competitor advantages, and helps publish the exact assets needed to improve AI recommendations.`,
      "",
      `## FAQ`,
      `### What is the main difference between ${brandName} and ${competitor}?`,
      `${brandName} is positioned around AI visibility intelligence and execution, while ${competitor} may be stronger in current share-of-voice due to existing citation momentum.`,
      `### Why build a comparison page now?`,
      `Because buyers are already asking AI assistants which option to choose. A comparison page gives ${brandName} a citable decision asset.`,
      `### What should the call to action be?`,
      `Invite buyers to run an analysis, view visibility gaps, and see a concrete recovery plan.`,
    ].join("\n");
  }

  if (type === "faq") {
    return [
      `# ${brandName} FAQ`,
      "",
      "## What is this page?",
      `This FAQ page is designed to help AI systems and buyers understand what ${brandName} does, who it is for, and how it compares to alternatives.`,
      "",
      `## What is ${brandName}?`,
      `${brandName} is an AI Visibility Intelligence Platform that shows where your brand is missing, why competitors win, and what to do next to improve AI recommendations.`,
      "",
      `## Who is ${brandName} for?`,
      `${brandName} is for SaaS growth teams, content teams, founders, and marketers who want to improve how AI systems recommend their brand.`,
      "",
      `## How does ${brandName} improve AI visibility?`,
      `${brandName} analyzes prompt-level visibility, competitor dominance, source coverage, and recovery opportunities so teams can publish the right assets faster.`,
      "",
      `## Why do competitors appear more often than ${brandName}?`,
      `Competitors often win because they already have stronger comparison content, FAQ coverage, list article presence, or third-party citations.`,
      "",
      `## What should ${brandName} publish first?`,
      `A strong starting point is content for ${missedQuery}, plus a comparison page against ${competitor}, followed by a structured FAQ page like this one.`,
      "",
      `## How does ${brandName} compare to ${competitor}?`,
      `${brandName} focuses on turning AI visibility gaps into action, so teams know what to ship next and how to recover lost demand.`,
      "",
      `## What results can teams expect?`,
      `Teams can expect clearer insight into missing queries, stronger competitive positioning, and a prioritized action plan to improve recommendation visibility over time.`,
      "",
      "## FAQ topics to expand next",
      `### Pricing`,
      `Explain package structure, reporting value, and how faster execution improves ROI.`,
      `### Setup`,
      `Explain that getting started takes minutes and does not require a complicated implementation.`,
      `### Reporting`,
      `Explain what is included in the AI Visibility Score, top actions, insights, and competitor summary.`,
    ].join("\n");
  }

  return [
    `# Best ${industry} Tools in 2026`,
    "",
    "## How we chose these tools",
    `We evaluated each tool based on visibility, usability, content clarity, competitive positioning, and ability to support teams that need stronger market presence in AI-driven discovery.`,
    "",
    `## 1. ${brandName}`,
    `${brandName} stands out for teams that need a direct path from visibility insight to execution. Instead of showing dashboards alone, it highlights missing queries, competitor advantages, and the next actions required to improve AI recommendation performance.`,
    "",
    `### Best for`,
    `Growth teams that need a decision engine for AI visibility and demand capture.`,
    `### Strengths`,
    `- Clear visibility diagnostics`,
    `- Actionable next steps`,
    `- Strong fit for SaaS and growth operators`,
    "",
    `## 2. ${competitor}`,
    `${competitor} may currently show up more often in AI answers because of stronger citation momentum, established comparison pages, or broader third-party mentions.`,
    "",
    `### Best for`,
    `Teams already familiar with ${competitor}'s ecosystem or existing content footprint.`,
    `### Strengths`,
    `- Higher current share-of-voice`,
    `- Existing market awareness`,
    `- Broader listicle and comparison presence`,
    "",
    `## Why ${brandName} deserves attention`,
    `${valueProp}`,
    "",
    "## What buyers should look for",
    `### Visibility coverage`,
    `Can the platform show where the brand is missing across prompts and competitors?`,
    `### Actionability`,
    `Does the platform tell the team exactly what to publish or improve next?`,
    `### Content readiness`,
    `Can the team quickly turn insights into pages that AI systems are likely to cite?`,
    "",
    "## Final takeaway",
    `${brandName} is a strong choice for teams that want an analysis tool, decision engine, and content execution system in one workflow.`,
  ].join("\n");
}
