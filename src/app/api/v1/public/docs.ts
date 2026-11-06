import { createFileRoute } from "@tanstack/react-router";

import { SITE_CONFIG } from "@/lib/site-config";
import { createCspNonce } from "@/shared/infrastructure/http/security-headers";

const SWAGGER_UI = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.34.0";

const SWAGGER_UI_CSS_SRI =
  "sha384-4c3vsE5f+trhFyHrFrLM1fFGUn531NIaC7dcqEWIJdoRQJ5CkJbSuSCwXLpaS1KF";

const SWAGGER_UI_JS_SRI =
  "sha384-9Td7MKiIr2S83E1kZyyVi8KdJw/S8CpAvu0llLyMeg0xq/hDGiZJfVn0fV4llCmK";

const renderDocs = (nonce: string) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${SITE_CONFIG.TITLE} API</title>
    <link rel="stylesheet" href="${SWAGGER_UI}/swagger-ui.css" integrity="${SWAGGER_UI_CSS_SRI}" crossorigin="anonymous" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script nonce="${nonce}" src="${SWAGGER_UI}/swagger-ui-bundle.js" integrity="${SWAGGER_UI_JS_SRI}" crossorigin="anonymous"></script>
    <script nonce="${nonce}">
      SwaggerUIBundle({ url: "/api/v1/public/openapi.json", dom_id: "#swagger-ui", validatorUrl: null, deepLinking: true });
    </script>
  </body>
</html>`;

export const Route = createFileRoute("/api/v1/public/docs")({
  server: {
    handlers: {
      GET: () => {
        const nonce = createCspNonce();

        return new Response(renderDocs(nonce), {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Content-Security-Policy": [
              "default-src 'none'",
              `script-src 'nonce-${nonce}'`,
              "style-src https://cdn.jsdelivr.net 'unsafe-inline'",
              "img-src 'self' data:",
              "connect-src 'self'",
              "frame-ancestors 'none'",
              "base-uri 'none'",
              "form-action 'none'",
            ].join("; "),
          },
        });
      },
    },
  },
});
