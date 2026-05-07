import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "last_seen_changelog_version";

type UseChangelogNotificationReturn = {
  hasNewChangelog: boolean;
  lastSeenVersion: string | null;
  markAsSeen: (version: string) => void;
};

function getStoredVersion(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

function subscribeToStorage(callback: () => void): () => void {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) callback();
  };
  window.addEventListener("storage", handleStorage);
  return () => window.removeEventListener("storage", handleStorage);
}

export const useChangelogNotification = (
  currentVersion: string | null,
): UseChangelogNotificationReturn => {
  const lastSeenVersion = useSyncExternalStore(
    subscribeToStorage,
    getStoredVersion,
    () => null,
  );

  const hasNewChangelog = Boolean(
    currentVersion && lastSeenVersion !== currentVersion,
  );

  const markAsSeen = useCallback((version: string) => {
    localStorage.setItem(STORAGE_KEY, version);
    window.dispatchEvent(
      new StorageEvent("storage", { key: STORAGE_KEY, newValue: version }),
    );
  }, []);

  return {
    markAsSeen,
    hasNewChangelog,
    lastSeenVersion,
  };
};
