import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { getGlobalStartContext } from "@tanstack/react-start";

import { routeTree } from "./routeTree.gen";

function getCspNonce() {
  if (typeof document !== "undefined")
    return (
      document.querySelector<HTMLMetaElement>('meta[property="csp-nonce"]')
        ?.content ?? undefined
    );

  try {
    return getGlobalStartContext()?.nonce;
  } catch {
    return undefined;
  }
}

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    ssr: { nonce: getCspNonce() },
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
