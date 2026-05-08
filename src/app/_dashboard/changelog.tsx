import { createFileRoute } from "@tanstack/react-router";

import { ChangelogEntry } from "@/components/features/changelog/changelog-entry";
import { getPageMetaTags } from "@/lib/seo";
import { getChangelogData } from "@/server-functions/page-data.functions";
import { ChangelogView } from "@/views/changelog/changelog";

export const Route = createFileRoute("/_dashboard/changelog")({
  head: () => ({
    meta: getPageMetaTags("changelog"),
  }),
  loader: async () => getChangelogData(),
  component: ChangelogPage,
});

function ChangelogPage() {
  const { entries, latestVersion } = Route.useLoaderData();

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
