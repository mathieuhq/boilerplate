import { createFileRoute } from "@tanstack/react-router";

import { SITE_CONFIG } from "@/lib/site-config";

const staticRoutes = [
  { path: "", priority: "1.0", changeFrequency: "weekly" },
  { path: "/auth/signin", priority: "0.8", changeFrequency: "yearly" },
  { path: "/auth/signup", priority: "0.8", changeFrequency: "yearly" },
  {
    path: "/auth/forget-password",
    priority: "0.5",
    changeFrequency: "yearly",
  },
];

function createSitemapXml() {
  const baseUrl = SITE_CONFIG.SERVER.PROD_URL;
  const lastModified = new Date().toISOString();
  const urls = staticRoutes
    .map(
      ({ path, priority, changeFrequency }) => `
  <url>
    <loc>${baseUrl}${path}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${changeFrequency}</changefreq>
    <priority>${priority}</priority>
  </url>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () =>
        new Response(createSitemapXml(), {
          headers: {
            "content-type": "application/xml; charset=utf-8",
          },
        }),
    },
  },
});
