export const PLANS = {
  pro: {
    name: "Pro",
    description: "For professionals ",
    features: [
      { name: "Unlimited projects", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Priority support", included: true },
      { name: "API access", included: true },
      { name: "Custom integrations", included: true },
      { name: "Team collaboration", included: true },
      { name: "Export & reports", included: true },
    ],
    pricing: { amount: 9, currency: "EUR" },
    highlighted: true,
  },
} as const;
