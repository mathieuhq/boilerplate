import { describe, expect, it } from "vitest";

import {
  getOAuthAuthorizeUrl,
  getSignedOAuthQuery,
  OAUTH_AUTHORIZE_PATH,
} from "../oauth-query";

const signedSearch = [
  "?response_type=code",
  "client_id=client-1",
  "redirect_uri=http%3A%2F%2F127.0.0.1%3A9999%2Fcallback",
  "scope=openid+profile",
  "state=abc",
  "exp=1793609393",
  "ba_iat=1793608793477",
  "ba_param=ba_iat",
  "ba_param=ba_param",
  "ba_param=client_id",
  "ba_param=exp",
  "ba_param=redirect_uri",
  "ba_param=response_type",
  "ba_param=scope",
  "ba_param=state",
  "sig=signature",
].join("&");

describe("getSignedOAuthQuery", () => {
  it("keeps only the signed parameters and the signature", () => {
    const query = getSignedOAuthQuery(`${signedSearch}&utm_source=mail`);

    const params = new URLSearchParams(query ?? "");

    expect(params.get("sig")).toBe("signature");
    expect(params.get("client_id")).toBe("client-1");
    expect(params.getAll("ba_param")).toHaveLength(8);
    expect(params.has("utm_source")).toBe(false);
  });

  it("returns null when the query is not signed", () => {
    expect(getSignedOAuthQuery("?client_id=client-1&sig=signature")).toBeNull();
    expect(getSignedOAuthQuery("?client_id=client-1&ba_param=client_id")).toBe(
      null,
    );
  });
});

describe("getOAuthAuthorizeUrl", () => {
  it("rebuilds the authorize URL without signature parameters", () => {
    const url = getOAuthAuthorizeUrl(signedSearch);

    expect(url?.startsWith(`${OAUTH_AUTHORIZE_PATH}?`)).toBe(true);

    const params = new URLSearchParams(url?.split("?")[1]);

    expect(params.get("client_id")).toBe("client-1");
    expect(params.get("redirect_uri")).toBe("http://127.0.0.1:9999/callback");
    expect(params.get("scope")).toBe("openid profile");
    expect(params.get("state")).toBe("abc");

    for (const name of ["sig", "exp", "ba_iat", "ba_param"])
      expect(params.has(name)).toBe(false);
  });

  it("drops the login prompt to avoid a sign-in loop", () => {
    const loginOnly = getOAuthAuthorizeUrl(
      `${signedSearch}&prompt=login&ba_param=prompt`,
    );
    const loginAndConsent = getOAuthAuthorizeUrl(
      `${signedSearch}&prompt=login+consent&ba_param=prompt`,
    );

    expect(new URLSearchParams(loginOnly?.split("?")[1]).has("prompt")).toBe(
      false,
    );
    expect(
      new URLSearchParams(loginAndConsent?.split("?")[1]).get("prompt"),
    ).toBe("consent");
  });

  it("returns null without a client id or a signature", () => {
    expect(getOAuthAuthorizeUrl("?callbackUrl=%2Fsettings")).toBeNull();
    expect(
      getOAuthAuthorizeUrl("?response_type=code&ba_param=response_type&sig=s"),
    ).toBeNull();
  });
});
