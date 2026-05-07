import { createFileRoute } from "@tanstack/react-router";

import { SITE_CONFIG } from "@/lib/site-config";

function createOpenGraphSvg() {
  return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#0f172a"/>
  <rect x="80" y="80" width="1040" height="470" rx="32" fill="#111827" stroke="#334155" stroke-width="2"/>
  <text x="600" y="285" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="72" font-weight="700" fill="#f8fafc">${SITE_CONFIG.TITLE}</text>
  <text x="600" y="355" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" fill="#cbd5e1">A modern full-stack TanStack Start boilerplate</text>
  <text x="600" y="435" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="20" fill="#94a3b8">by ${SITE_CONFIG.MAKER.NAME}</text>
</svg>`;
}

export const Route = createFileRoute("/opengraph-image")({
  server: {
    handlers: {
      GET: async () =>
        new Response(createOpenGraphSvg(), {
          headers: {
            "content-type": "image/svg+xml; charset=utf-8",
            "cache-control": "public, max-age=86400",
          },
        }),
    },
  },
});
