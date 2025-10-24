import { useSyncExternalStore } from "react";

/**
 * React hook that returns true once client-side hydration is complete
 */
export const useClient = () =>
  useSyncExternalStore(
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    () => () => {},
    () => true,
    () => false,
  );
