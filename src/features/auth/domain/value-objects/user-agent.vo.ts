import { ValueObject } from "@/shared/domain/value-object.base";

export type DeviceType = "desktop" | "mobile" | "tablet";

type UserAgentProps = {
  raw: string | null;
  browser: string | null;
  browserVersion: string | null;
  os: string | null;
  deviceType: DeviceType;
};

const BROWSER_PATTERNS: readonly [string, RegExp][] = [
  ["Edge", /Edg(?:e|A|iOS)?\/(\d+)/],
  ["Opera", /(?:OPR|Opera)\/(\d+)/],
  ["Samsung Internet", /SamsungBrowser\/(\d+)/],
  ["Firefox", /(?:Firefox|FxiOS)\/(\d+)/],
  ["Chrome", /(?:Chrome|CriOS)\/(\d+)/],
  ["Safari", /Version\/(\d+)[^ ]* (?:Mobile\/\S+ )?Safari\//],
];

const OS_PATTERNS: readonly [string, RegExp][] = [
  ["iOS", /iPhone|iPad|iPod/],
  ["Android", /Android/],
  ["ChromeOS", /CrOS/],
  ["Windows", /Windows/],
  ["macOS", /Macintosh|Mac OS X/],
  ["Linux", /Linux/],
];

export class UserAgent extends ValueObject<UserAgentProps> {
  get raw(): string | null {
    return this.props.raw;
  }

  get browser(): string | null {
    return this.props.browser;
  }

  get browserVersion(): string | null {
    return this.props.browserVersion;
  }

  get os(): string | null {
    return this.props.os;
  }

  get deviceType(): DeviceType {
    return this.props.deviceType;
  }

  equals(vo: UserAgent): boolean {
    return this.props.raw === vo.props.raw;
  }

  static parse(raw?: string | null): UserAgent {
    const value = raw?.trim();

    if (!value)
      return new UserAgent({
        raw: null,
        browser: null,
        browserVersion: null,
        os: null,
        deviceType: "desktop",
      });

    const browser = BROWSER_PATTERNS.map(
      ([name, pattern]) => [name, pattern.exec(value)] as const,
    ).find(([, match]) => match);

    return new UserAgent({
      raw: value,
      browser: browser?.[0] ?? null,
      browserVersion: browser?.[1]?.[1] ?? null,
      os: OS_PATTERNS.find(([, pattern]) => pattern.test(value))?.[0] ?? null,
      deviceType: getDeviceType(value),
    });
  }
}

function getDeviceType(value: string): DeviceType {
  if (/iPad|Tablet/.test(value)) return "tablet";

  if (value.includes("Android") && !value.includes("Mobile")) return "tablet";

  if (/Mobi|iPhone|iPod|Android/.test(value)) return "mobile";

  return "desktop";
}
