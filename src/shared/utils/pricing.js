export const LAUNCH_PRICING = {
  badge: "🚀 Launch Pricing – Limited Time",
  availability: "Available for first 3 months only",
  lockInCopy: "Early users lock this price forever",
  durationMonths: 3,
  countdownEndsAt: "2026-06-30T23:59:59Z",
};

export function getLaunchCountdownLabel(now = new Date()) {
  const endDate = new Date(LAUNCH_PRICING.countdownEndsAt);
  const remainingMs = endDate.getTime() - now.getTime();

  if (Number.isNaN(endDate.getTime()) || remainingMs <= 0) {
    return "Launch pricing window is closing";
  }

  const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));
  return `${remainingDays} days left at launch pricing`;
}

export const PLAN_DETAILS = {
  starter: {
    id: "starter",
    label: "STARTER",
    name: "Starter",
    launchPrice: 59,
    originalPrice: 99,
    price: "$59",
    originalPriceFormatted: "$99",
    cadence: "/month",
    premiumFeature: "Launch plan for baseline AI visibility monitoring",
    features: [
      "Full AI visibility analysis",
      "US, UK, Germany coverage",
      "Prompt-level competitor detection",
      "Instant decision dashboard",
      "Core visibility monitoring",
    ],
  },
  pro: {
    id: "pro",
    label: "PRO",
    name: "Pro",
    launchPrice: 149,
    originalPrice: 199,
    price: "$149",
    originalPriceFormatted: "$199",
    cadence: "/month",
    badge: "Most Popular",
    premiumFeature: "Dashboard history + continuous tracking",
    features: [
      "Full AI analysis",
      "Competitor insights",
      "Tracking over time",
      "Multiple analyses",
      "Saved reports",
      "Dashboard history",
    ],
  },
  enterprise: {
    id: "enterprise",
    label: "ENTERPRISE",
    name: "Enterprise",
    launchPrice: 399,
    originalPrice: 499,
    price: "$399",
    originalPriceFormatted: "$499",
    cadence: "/month",
    premiumFeature: "Built for multi-brand teams and heavier reporting needs",
    features: ["Everything in PRO", "Multi-brand", "Team features", "Reports & exports", "Priority support"],
  },
};

export const PRICING_PLAN_ORDER = ["starter", "pro", "enterprise"];

export const PRICING_PLANS = PRICING_PLAN_ORDER.map((planId) => PLAN_DETAILS[planId]);

export const ADD_ON_DETAILS = {
  id: "ai_strategy_recovery",
  name: "7-Day Recovery Plan",
  price: 19,
  cadence: "/month",
  description: "Actionable strategy and execution sequence to recover AI-lost visibility fast.",
};

export const PRO_UPGRADE_COPY =
  "Upgrade to Pro for full AI analysis, competitor insights, content generation, tracking, and strategy recommendations.";