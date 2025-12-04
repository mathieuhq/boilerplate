export const PLANS = {
  free: {
    name: "Free",
    description: "Get started with the essentials",
    features: [
      { name: "Up to 3 projects", included: true, limit: "3" },
      { name: "Basic analytics", included: true },
      { name: "Community support", included: true },
      { name: "API access", included: false },
      { name: "Priority support", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Custom integrations", included: false },
    ],
    pricing: {
      monthly: { amount: 0, currency: "EUR" },
    },
  },
  pro: {
    name: "Pro",
    description: "For professionals and growing teams",
    features: [
      { name: "Unlimited projects", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority support", included: true },
      { name: "API access", included: true },
      { name: "Custom integrations", included: true },
      { name: "Team collaboration", included: true },
      { name: "Export & reports", included: true },
    ],
    pricing: {
      monthly: { amount: 9, currency: "EUR" },
      annual: { amount: 90, currency: "EUR", discount: 17 },
    },
    highlighted: true,
  },
} as const;
