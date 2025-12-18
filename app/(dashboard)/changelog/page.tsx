import type { Metadata } from "next";

import { ChangelogEntry } from "@/components/features/changelog/changelog-entry";
import { getChangelogs, getLatestVersion } from "@/lib/changelog";
import { getPageMetadata } from "@/lib/seo";
import { ChangelogView } from "@/views/changelog/changelog";

export const metadata: Metadata = getPageMetadata("changelog");

export default function ChangelogPage() {
  const entries = getChangelogs();
  const latestVersion = getLatestVersion();

  return (
    <ChangelogView latestVersion={latestVersion}>
      {entries.map((entry) => (
        <div key={entry.slug} data-type={entry.meta.type}>
          <ChangelogEntry entry={entry} />
        </div>
      ))}
    </ChangelogView>
  );
}
