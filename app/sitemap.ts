import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/lib/site-config";

type SitemapEntry = MetadataRoute.Sitemap[number];

const staticRoutes: {
  path: string;
  priority: SitemapEntry["priority"];
  changeFrequency: SitemapEntry["changeFrequency"];
}[] = [
  { path: "", priority: 1.0, changeFrequency: "weekly" },
  { path: "/auth/signin", priority: 0.8, changeFrequency: "yearly" },
  { path: "/auth/signup", priority: 0.8, changeFrequency: "yearly" },
  { path: "/auth/forget-password", priority: 0.5, changeFrequency: "yearly" },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_CONFIG.SERVER.PROD_URL;

  const lastModified = new Date();

  return staticRoutes.map(({ path, priority, changeFrequency }) => ({
    priority,
    lastModified,
    changeFrequency,
    url: `${baseUrl}${path}`,
  }));
}
