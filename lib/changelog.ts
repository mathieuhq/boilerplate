import fs from "fs";
import matter from "gray-matter";
import path from "path";

export type ChangelogType = "Feature" | "Fix" | "Critical";

export type ChangelogEntry = {
  slug: string;
  content: string;
  meta: {
    date: string;
    title: string;
    version: string;
    type: ChangelogType;
  };
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

      const typedData = data as Partial<{
        date: string;
        title: string;
        version: string;
        type: ChangelogType;
      }>;

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

function getLatestChangelog(): ChangelogEntry | null {
  const changelogs = getChangelogs();
  return changelogs[0] ?? null;
}

export function getLatestVersion(): string | null {
  const latest = getLatestChangelog();
  return latest?.meta.version ?? null;
}
