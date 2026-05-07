import { createFileRoute } from "@tanstack/react-router";

import { SITE_CONFIG } from "@/lib/site-config";

function createRobotsTxt() {
  const baseUrl = SITE_CONFIG.SERVER.PROD_URL;
  const disallow = ["/api/", "/admin/", "/settings/"].join("\nDisallow: ");

  return [
    "User-agent: Googlebot",
    "Allow: /",
    `Disallow: ${disallow}`,
    "",
    "User-agent: *",
    "Allow: /",
    "Crawl-delay: 1",
    `Disallow: ${disallow}`,
    "",
    `Host: ${baseUrl}`,
    `Sitemap: ${baseUrl}/sitemap.xml`,
    "",
  ].join("\n");
}

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async () =>
        new Response(createRobotsTxt(), {
          headers: {
            "content-type": "text/plain; charset=utf-8",
          },
        }),
    },
  },
});
