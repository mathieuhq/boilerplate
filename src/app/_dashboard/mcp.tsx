import { createFileRoute } from "@tanstack/react-router";

import { getPageMetaTags } from "@/lib/seo";
import { getMcpPageData } from "@/server-functions/page-data.functions";
import { McpView } from "@/views/mcp/mcp";

export const Route = createFileRoute("/_dashboard/mcp")({
  head: () => ({
    meta: getPageMetaTags("mcp"),
  }),
  loader: async () => getMcpPageData(),
  component: McpPage,
});

function McpPage() {
  const { mcpUrl } = Route.useLoaderData();

  return <McpView mcpUrl={mcpUrl} />;
}
