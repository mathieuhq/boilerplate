import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY_PREFIX = "recent_searches";
const MAX_RECENT_SEARCHES = 5;
const NO_RECENT_SEARCHES: string[] = [];

const snapshots = new Map<string, { raw: string | null; value: string[] }>();

function getStorageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${userId}`;
}

function readStorage(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseRecentSearches(raw: string | null) {
  if (!raw) return NO_RECENT_SEARCHES;

  try {
    const value: unknown = JSON.parse(raw);

    if (!Array.isArray(value)) return NO_RECENT_SEARCHES;

    return value
      .filter((item): item is string => typeof item === "string")
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return NO_RECENT_SEARCHES;
  }
}

function getRecentSearches(key: string) {
  const raw = readStorage(key);
  const snapshot = snapshots.get(key);

  if (snapshot?.raw === raw) return snapshot.value;

  const value = parseRecentSearches(raw);
  snapshots.set(key, { raw, value });

  return value;
}

function writeRecentSearches(key: string, values: string[]) {
  try {
    if (values.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(values));
  } catch {
    return;
  }

  window.dispatchEvent(new StorageEvent("storage", { key }));
}

function subscribeToStorage(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function useRecentSearches(userId: string | undefined) {
  const key = userId ? getStorageKey(userId) : null;

  const recentSearches = useSyncExternalStore(
    subscribeToStorage,
    () => (key ? getRecentSearches(key) : NO_RECENT_SEARCHES),
    () => NO_RECENT_SEARCHES,
  );

  const addRecentSearch = useCallback(
    (query: string) => {
      const value = query.trim();

      if (!key || !value) return;

      writeRecentSearches(
        key,
        [
          value,
          ...getRecentSearches(key).filter(
            (item) => item.toLowerCase() !== value.toLowerCase(),
          ),
        ].slice(0, MAX_RECENT_SEARCHES),
      );
    },
    [key],
  );

  const clearRecentSearches = useCallback(() => {
    if (key) writeRecentSearches(key, []);
  }, [key]);

  return { recentSearches, addRecentSearch, clearRecentSearches };
}
