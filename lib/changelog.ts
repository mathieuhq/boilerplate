import fs from "fs";
import matter from "gray-matter";
import path from "path";

export type ChangelogType = "Feature" | "Fix" | "Critical";

export type ChangelogMeta = {
  date: string;
  title: string;
  version: string;
  type: ChangelogType;
};

export type ChangelogEntry = {
  slug: string;
  content: string;
  meta: ChangelogMeta;
};

const CHANGELOGS_DIR = path.join(process.cwd(), "changelogs");

function ensureChangelogsDir(): boolean {
  return fs.existsSync(CHANGELOGS_DIR);
}

export function getChangelogs(): ChangelogEntry[] {
  if (!ensureChangelogsDir()) return [];

  const files = fs.readdirSync(CHANGELOGS_DIR);

  const mdFiles = files.filter(
    (file) => file.endsWith(".md") || file.endsWith(".mdx"),
  );

  return mdFiles
    .map((filename) => {
      const filePath = path.join(CHANGELOGS_DIR, filename);
      const fileContent = fs.readFileSync(filePath, "utf8");
      const { data, content } = matter(fileContent);

      const typedData = data as Partial<ChangelogMeta>;

      return {
        meta: {
          type: typedData.type ?? "Feature",
          title: typedData.title ?? "Untitled",
          version: typedData.version ?? "0.0.0",
          date: typedData.date ?? new Date().toISOString(),
        },
        content,
        slug: filename.replace(/\.(md|mdx)$/, ""),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.meta.date).getTime() - new Date(a.meta.date).getTime(),
    );
}

export function getLatestChangelog(): ChangelogEntry | null {
  const changelogs = getChangelogs();
  return changelogs[0] ?? null;
}

export function getLatestVersion(): string | null {
  const latest = getLatestChangelog();
  return latest?.meta.version ?? null;
}

export function getChangelogsByType(type: ChangelogType): ChangelogEntry[] {
  return getChangelogs().filter((entry) => entry.meta.type === type);
}

export function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
} {
  const [major = 0, minor = 0, patch = 0] = version.split(".").map(Number);
  return { major, minor, patch };
}

export function compareVersions(v1: string, v2: string): number {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  if (parsed1.major !== parsed2.major) return parsed1.major - parsed2.major;
  if (parsed1.minor !== parsed2.minor) return parsed1.minor - parsed2.minor;
  return parsed1.patch - parsed2.patch;
}

export function isNewerVersion(current: string, lastSeen: string): boolean {
  return compareVersions(current, lastSeen) > 0;
}
