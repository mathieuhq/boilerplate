import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getLegalPageData } from "@/server-functions/page-data.functions";
import { LegalView } from "@/views/legal/legal";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: getPageMetaTags("terms"),
  }),
  loader: async () => getLegalPageData({ data: "terms" }),
  component: TermsPage,
});

function TermsPage() {
  return <LegalView content={Route.useLoaderData()} />;
}
