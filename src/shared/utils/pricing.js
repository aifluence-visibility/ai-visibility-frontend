export const PLAN_DETAILS = {
  free: {
    id: "free",
    label: "FREE",
    name: "Free",
    price: "$0",
    cadence: "",
    features: ["3 analyses / month", "Basic insights", "Visibility score", "Competitor overview"],
  },
  pro: {
    id: "pro",
    label: "PRO",
    name: "Pro",
    launchPrice: 29,
    originalPrice: 49,
    price: "$29",
    originalPriceFormatted: "$49",
    cadence: "/month",
    badge: "Most Valuable",
    premiumFeature: "7-Day Recovery Plan",
    features: [
      "Full AI analysis",
      "Competitor insights",
      "Content generation",
      "Tracking",
      "Strategy recommendations",
    ],
  },
  enterprise: {
    id: "enterprise",
    label: "ENTERPRISE",
    name: "Enterprise",
    price: "Custom pricing",
    cadence: "",
    launchPrice: 299,
    originalPrice: 499,
    price: "$299",
    originalPriceFormatted: "$499",
    cadence: "/month",
    features: ["Everything in PRO", "Multi-brand", "Team features", "Reports & exports", "Priority support"],
  },
};

export const PRICING_PLAN_ORDER = ["free", "pro", "enterprise"];

export const PRICING_PLANS = PRICING_PLAN_ORDER.map((planId) => PLAN_DETAILS[planId]);

export const ADD_ON_DETAILS = {
  id: "recovery_plan",
  name: "7-Day Recovery Plan",
  price: 19,
  cadence: "/month",
  description: "Day-by-day execution sequence to recover AI-lost visibility fast.",
};

export const PRO_UPGRADE_COPY =
  "Upgrade to Pro for full AI analysis, competitor insights, content generation, tracking, and strategy recommendations.";