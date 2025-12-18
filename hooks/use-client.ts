import { useSyncExternalStore } from "react";

/**
 * React hook that returns true once client-side hydration is complete
 */
export function useClient() {
  return useSyncExternalStore(
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => () => {},
    () => true,
    () => false,
  );
}
