const SIGNATURE_PARAMS = ["sig", "exp", "ba_iat", "ba_pl", "ba_param"];

export const OAUTH_AUTHORIZE_PATH = "/api/v1/private/auth/oauth2/authorize";

export function getSignedOAuthQuery(search: string) {
  const params = new URLSearchParams(search);
  const signedNames = new Set(params.getAll("ba_param"));

  if (!params.has("sig") || signedNames.size === 0) return null;

  const signedParams = new URLSearchParams();

  for (const [name, value] of params)
    if (name === "sig" || name === "ba_param" || signedNames.has(name))
      signedParams.append(name, value);

  return signedParams.toString();
}

export function getOAuthAuthorizeUrl(search: string) {
  const signedQuery = getSignedOAuthQuery(search);

  if (!signedQuery) return null;

  const params = new URLSearchParams(signedQuery);

  if (!params.has("client_id")) return null;

  for (const name of SIGNATURE_PARAMS) params.delete(name);

  const prompt = params
    .get("prompt")
    ?.split(" ")
    .filter((value) => value && value !== "login")
    .join(" ");

  if (prompt) params.set("prompt", prompt);
  else params.delete("prompt");

  return `${OAUTH_AUTHORIZE_PATH}?${params.toString()}`;
}
