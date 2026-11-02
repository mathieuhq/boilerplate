export const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userOrganizations: (userId: string) => `user:${userId}:organizations`,
  adminOverviewMetrics: () => "admin:overview-metrics",
};

export const CacheTtl = {
  user: 300,
  userOrganizations: 300,
  adminOverviewMetrics: 60,
};
