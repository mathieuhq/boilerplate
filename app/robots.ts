import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = SITE_CONFIG.SERVER.PROD_URL;

  return {
    rules: [
      {
        allow: "/",
        userAgent: "*",
        disallow: ["/api/", "/admin/", "/_next/", "/settings/"],
      },
    ],
    host: baseUrl,
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
