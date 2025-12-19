export const PLANS = {
  pro: {
    nameKey: "pricing.pro.name",
    descriptionKey: "pricing.pro.description",
    features: [
      { key: "pricing.features.unlimitedProjects", included: true },
      { key: "pricing.features.advancedAnalytics", included: true },
      { key: "pricing.features.prioritySupport", included: true },
      { key: "pricing.features.apiAccess", included: true },
      { key: "pricing.features.customIntegrations", included: true },
      { key: "pricing.features.teamCollaboration", included: true },
      { key: "pricing.features.exportReports", included: true },
    ],
    pricing: { amount: 9, currency: "EUR" },
    highlighted: true,
  },
} as const;
