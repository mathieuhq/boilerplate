import { useEffect, useState } from "react";

/**
 * React hook that returns true once client-side hydration is complete
 */
export const useClient = () => {
  const [isClient, setClient] = useState(false);

  useEffect(() => setClient(true), []);

  return isClient;
};
