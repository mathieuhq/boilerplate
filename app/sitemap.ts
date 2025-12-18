import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.SERVER.PROD_URL;

  return [
    {
      priority: 1,
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
    },
    {
      priority: 0.8,
      lastModified: new Date(),
      changeFrequency: "yearly",
      url: `${baseUrl}/auth/signin`,
    },
    {
      priority: 0.8,
      lastModified: new Date(),
      changeFrequency: "yearly",
      url: `${baseUrl}/auth/signup`,
    },
    {
      priority: 0.5,
      lastModified: new Date(),
      changeFrequency: "yearly",
      url: `${baseUrl}/auth/forget-password`,
    },
  ];
}
