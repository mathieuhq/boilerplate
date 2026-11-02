import { useCallback, useEffect, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";

type SearchPatch = Record<string, unknown>;

type NavigateOptions = {
  resetPage?: boolean;
  replace?: boolean;
};

const PENDING_DELAY_MS = 150;

export function useDataTableNavigation() {
  const navigate = useNavigate();

  return useCallback(
    async (
      patch: SearchPatch,
      { resetPage = true, replace }: NavigateOptions = {},
    ) =>
      navigate({
        to: ".",
        replace,
        resetScroll: false,
        search: ((previous: SearchPatch) =>
          cleanSearch({
            ...previous,
            ...(resetPage ? { page: undefined } : {}),
            ...patch,
          })) as never,
      }),
    [navigate],
  );
}

export function useDataTablePending() {
  const isLoading = useRouterState({
    select: (state) =>
      state.isLoading &&
      state.location.pathname === state.resolvedLocation?.pathname,
  });
  const [isDelayed, setIsDelayed] = useState(false);

  useEffect(() => {
    if (!isLoading) return;

    const timeout = setTimeout(() => setIsDelayed(true), PENDING_DELAY_MS);

    return () => {
      clearTimeout(timeout);
      setIsDelayed(false);
    };
  }, [isLoading]);

  return isLoading && isDelayed;
}

function cleanSearch(search: SearchPatch) {
  return Object.fromEntries(
    Object.entries(search).filter(([key, value]) => {
      if (key === "page" && value === 1) return false;
      if (value === undefined || value === null || value === "") return false;

      return !Array.isArray(value) || value.length > 0;
    }),
  );
}
