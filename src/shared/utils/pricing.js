export const PLAN_DETAILS = {
  pro: {
    id: "pro",
    label: "PRO",
    name: "Pro",
    launchPrice: 29,
    originalPrice: 49,
    price: "$29",
    originalPriceFormatted: "$49",
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
    launchPrice: 299,
    originalPrice: 499,
    price: "$299",
    originalPriceFormatted: "$499",
    cadence: "/month",
    features: ["Everything in PRO", "Multi-brand", "Team features", "Reports & exports", "Priority support"],
  },
};

export const PRICING_PLAN_ORDER = ["pro", "enterprise"];

export const PRICING_PLANS = PRICING_PLAN_ORDER.map((planId) => PLAN_DETAILS[planId]);

export const ADD_ON_DETAILS = {
  id: "ai_strategy_recovery",
  name: "AI Strategy & 7-Day Recovery Plan",
  price: 19,
  cadence: "/month",
  description: "Actionable strategy and execution sequence to recover AI-lost visibility fast.",
};

export const PRO_UPGRADE_COPY =
  "Upgrade to Pro for full AI analysis, competitor insights, content generation, tracking, and strategy recommendations.";