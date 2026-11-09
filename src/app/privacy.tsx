import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getLegalPageData } from "@/server-functions/page-data.functions";
import { LegalView } from "@/views/legal/legal";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: getPageMetaTags("privacy"),
  }),
  loader: async () => getLegalPageData({ data: "privacy" }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return <LegalView content={Route.useLoaderData()} />;
}
