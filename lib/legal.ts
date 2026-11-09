import fs from "fs";
import path from "path";

export type LegalPage = "terms" | "privacy";

export function getLegalContent(page: LegalPage): string {
  return fs.readFileSync(
    path.join(process.cwd(), "legal", `${page}.md`),
    "utf8",
  );
}
