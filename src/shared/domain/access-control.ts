export const ACCESS_LEVELS = ["read", "write"] as const;

export type AccessLevel = (typeof ACCESS_LEVELS)[number];

type AccessFeatureDefinition = {
  group: string;
  levels: readonly AccessLevel[];
};

export const ACCESS_FEATURES = {
  overview: { group: "administration", levels: ["read"] },
  users: { group: "administration", levels: ["read", "write"] },
  organizations: { group: "administration", levels: ["read"] },
  "audit-logs": { group: "administration", levels: ["read"] },
  roles: { group: "administration", levels: ["read", "write"] },
} as const satisfies Record<string, AccessFeatureDefinition>;

export type AccessFeature = keyof typeof ACCESS_FEATURES;

export type AccessGrants = Partial<Record<AccessFeature, AccessLevel>>;

export const ACCESS_FEATURE_KEYS = Object.keys(
  ACCESS_FEATURES,
) as AccessFeature[];

export function isAccessFeature(value: string): value is AccessFeature {
  return Object.hasOwn(ACCESS_FEATURES, value);
}

export function getFeatureLevels(
  feature: AccessFeature,
): readonly AccessLevel[] {
  return ACCESS_FEATURES[feature].levels;
}

function levelRank(level: AccessLevel | undefined) {
  return level ? ACCESS_LEVELS.indexOf(level) + 1 : 0;
}

export function hasAccess(
  grants: AccessGrants,
  feature: AccessFeature,
  level: AccessLevel,
) {
  return levelRank(grants[feature]) >= levelRank(level);
}

export function coversAccess(granted: AccessGrants, required: AccessGrants) {
  return ACCESS_FEATURE_KEYS.every((feature) => {
    const level = required[feature];

    return !level || hasAccess(granted, feature, level);
  });
}

export function getFullAccess(): AccessGrants {
  return Object.fromEntries(
    ACCESS_FEATURE_KEYS.map((feature) => [
      feature,
      getFeatureLevels(feature).at(-1),
    ]),
  );
}

export function normalizeAccessGrants(
  grants: Partial<Record<string, string>>,
): AccessGrants {
  const normalized: AccessGrants = {};

  for (const feature of ACCESS_FEATURE_KEYS) {
    const requested = grants[feature];
    const levels = getFeatureLevels(feature);
    const level = levels
      .filter(
        (supported) =>
          levelRank(supported) <= levelRank(requested as AccessLevel),
      )
      .at(-1);

    if (level) normalized[feature] = level;
  }

  return normalized;
}

export function toAccessEntries(grants: AccessGrants): string[] {
  return ACCESS_FEATURE_KEYS.flatMap((feature) => {
    const level = grants[feature];

    return level ? [`${feature}:${level}`] : [];
  });
}

export function fromAccessEntries(entries: readonly string[]): AccessGrants {
  return normalizeAccessGrants(
    Object.fromEntries(entries.map((entry) => entry.split(":", 2))),
  );
}

export function hasAnyAccess(grants: AccessGrants) {
  return ACCESS_FEATURE_KEYS.some((feature) => Boolean(grants[feature]));
}
