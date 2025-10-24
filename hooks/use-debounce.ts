import { useRef } from "react";

/**
 * React hook that debounces function calls
 */
export const useDebounce = <T extends unknown[]>(
  callback: (...args: T) => void,
  time = 300,
) => {
  const debounce = useRef<number>(0);

  const onDebounce = (...args: T) => {
    clearTimeout(debounce.current);

    debounce.current = setTimeout(
      () => callback(...args),
      time,
    ) as unknown as number;
  };

  return onDebounce;
};
