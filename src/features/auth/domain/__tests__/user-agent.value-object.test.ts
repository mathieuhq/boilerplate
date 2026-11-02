import { describe, expect, it } from "vitest";

import { UserAgent } from "../value-objects/user-agent.value-object";

const AGENTS = {
  chromeMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  safariIpad:
    "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  firefoxWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0",
  edgeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  operaLinux:
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 OPR/115.0.0.0",
  samsungAndroid:
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36",
  chromeAndroidTablet:
    "Mozilla/5.0 (Linux; Android 13; SM-X700) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  chromeIos:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1",
  chromeOs:
    "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  curl: "curl/8.7.1",
};

describe("UserAgent value object", () => {
  it.each([
    [AGENTS.chromeMac, "Chrome", "130", "macOS", "desktop"],
    [AGENTS.safariIphone, "Safari", "18", "iOS", "mobile"],
    [AGENTS.safariIpad, "Safari", "17", "iOS", "tablet"],
    [AGENTS.firefoxWindows, "Firefox", "132", "Windows", "desktop"],
    [AGENTS.edgeWindows, "Edge", "130", "Windows", "desktop"],
    [AGENTS.operaLinux, "Opera", "115", "Linux", "desktop"],
    [AGENTS.samsungAndroid, "Samsung Internet", "26", "Android", "mobile"],
    [AGENTS.chromeAndroidTablet, "Chrome", "130", "Android", "tablet"],
    [AGENTS.chromeIos, "Chrome", "130", "iOS", "mobile"],
    [AGENTS.chromeOs, "Chrome", "130", "ChromeOS", "desktop"],
  ])("should parse %s", (raw, browser, version, os, deviceType) => {
    const userAgent = UserAgent.parse(raw);

    expect(userAgent.raw).toBe(raw);
    expect(userAgent.browser).toBe(browser);
    expect(userAgent.browserVersion).toBe(version);
    expect(userAgent.os).toBe(os);
    expect(userAgent.deviceType).toBe(deviceType);
  });

  it("should keep unknown agents without guessing", () => {
    const userAgent = UserAgent.parse(AGENTS.curl);

    expect(userAgent.browser).toBeNull();
    expect(userAgent.browserVersion).toBeNull();
    expect(userAgent.os).toBeNull();
    expect(userAgent.deviceType).toBe("desktop");
  });

  it.each([undefined, null, "", "   "])(
    "should treat %j as an empty agent",
    (raw) => {
      const userAgent = UserAgent.parse(raw);

      expect(userAgent.raw).toBeNull();
      expect(userAgent.browser).toBeNull();
      expect(userAgent.os).toBeNull();
      expect(userAgent.deviceType).toBe("desktop");
    },
  );

  it("should compare agents by their raw value", () => {
    expect(
      UserAgent.parse(AGENTS.chromeMac).equals(
        UserAgent.parse(AGENTS.chromeMac),
      ),
    ).toBe(true);
    expect(
      UserAgent.parse(AGENTS.chromeMac).equals(UserAgent.parse(AGENTS.curl)),
    ).toBe(false);
  });
});
