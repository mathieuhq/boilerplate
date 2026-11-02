type EnvValue = boolean | number | string | undefined;
type EnvLike = Record<string, EnvValue>;

type EnvGroupDefinition<
  RequiredKey extends string = string,
  OptionalKey extends string = string,
> = {
  name: string;
  required: readonly RequiredKey[];
  optional?: readonly OptionalKey[];
};

type EnvGroupValues<
  RequiredKey extends string,
  OptionalKey extends string,
> = Record<RequiredKey, string> & Partial<Record<OptionalKey, string>>;

type EmailEnvConfig = {
  from: string;
  apiKey: string;
  baseUrl: string;
  contactListId?: string;
};

type ObjectStorageEnvConfig = {
  endpoint: string;
  forcePathStyle: boolean;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
};

type RedisEnvConfig = {
  url: string;
};

type OAuthEnvConfig = {
  clientId: string;
  clientSecret: string;
};

function getEnvString(env: EnvLike, key: string) {
  const value = env[key];

  if (value === undefined || value === "") return undefined;

  return String(value);
}

function readEnvGroup<
  const RequiredKey extends string,
  const OptionalKey extends string = never,
>(
  env: EnvLike,
  definition: EnvGroupDefinition<RequiredKey, OptionalKey>,
): EnvGroupValues<RequiredKey, OptionalKey> | null {
  const optional = definition.optional ?? [];
  const keys = [...definition.required, ...optional];
  const hasAnyValue = keys.some((key) => getEnvString(env, key));

  if (!hasAnyValue) return null;

  const missing = definition.required.filter((key) => !getEnvString(env, key));

  if (missing.length > 0)
    throw new Error(
      `${definition.name} environment variables are incomplete. Missing: ${missing.join(
        ", ",
      )}`,
    );

  return Object.fromEntries(
    keys.flatMap((key) => {
      const value = getEnvString(env, key);
      return value ? [[key, value]] : [];
    }),
  ) as EnvGroupValues<RequiredKey, OptionalKey>;
}

export function getEmailEnvConfig(env: EnvLike): EmailEnvConfig | null {
  const group = readEnvGroup(env, {
    name: "Email",
    required: ["EMAIL_API_KEY", "EMAIL_FROM"],
    optional: ["EMAIL_API_BASE_URL", "EMAIL_CONTACT_LIST_ID"],
  });

  if (!group) return null;

  return {
    from: group.EMAIL_FROM,
    apiKey: group.EMAIL_API_KEY,
    contactListId: group.EMAIL_CONTACT_LIST_ID,
    baseUrl: group.EMAIL_API_BASE_URL ?? "https://next-api.useplunk.com",
  };
}

export function getObjectStorageEnvConfig(
  env: EnvLike,
): ObjectStorageEnvConfig | null {
  const group = readEnvGroup(env, {
    name: "Cloudflare R2",
    required: ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"],
    optional: ["R2_ACCOUNT_ID", "R2_ENDPOINT"],
  });

  if (!group) return null;

  if (!group.R2_ACCOUNT_ID && !group.R2_ENDPOINT)
    throw new Error(
      "Cloudflare R2 environment variables are incomplete. Missing: R2_ACCOUNT_ID or R2_ENDPOINT",
    );

  return {
    endpoint:
      group.R2_ENDPOINT ??
      `https://${group.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: Boolean(group.R2_ENDPOINT),
    accessKeyId: group.R2_ACCESS_KEY_ID,
    secretAccessKey: group.R2_SECRET_ACCESS_KEY,
    bucketName: group.R2_BUCKET_NAME,
  };
}

export function getRedisEnvConfig(env: EnvLike): RedisEnvConfig | null {
  const group = readEnvGroup(env, {
    name: "Redis",
    required: ["REDIS_URL"],
  });

  if (!group) return null;

  return {
    url: group.REDIS_URL,
  };
}

export function getGithubOAuthEnvConfig(env: EnvLike): OAuthEnvConfig | null {
  const group = readEnvGroup(env, {
    name: "GitHub OAuth",
    required: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  });

  if (!group) return null;

  return {
    clientId: group.GITHUB_CLIENT_ID,
    clientSecret: group.GITHUB_CLIENT_SECRET,
  };
}

export function getGoogleOAuthEnvConfig(env: EnvLike): OAuthEnvConfig | null {
  const group = readEnvGroup(env, {
    name: "Google OAuth",
    required: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  });

  if (!group) return null;

  return {
    clientId: group.GOOGLE_CLIENT_ID,
    clientSecret: group.GOOGLE_CLIENT_SECRET,
  };
}

export function validateEnvConfigGroups(env: EnvLike) {
  getEmailEnvConfig(env);
  getObjectStorageEnvConfig(env);
  getRedisEnvConfig(env);
  getGithubOAuthEnvConfig(env);
  getGoogleOAuthEnvConfig(env);
}
