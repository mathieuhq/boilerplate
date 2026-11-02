import { useSyncExternalStore } from "react";

import { getOAuthAuthorizeUrl } from "@/shared/infrastructure/http/oauth-query";

function subscribe() {
  return () => undefined;
}

export function useOAuthAuthorizeUrl() {
  return useSyncExternalStore(
    subscribe,
    () => getOAuthAuthorizeUrl(window.location.search),
    () => null,
  );
}
