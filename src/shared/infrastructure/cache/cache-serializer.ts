const DATE_TAG = "$date";

type TaggedDate = { [DATE_TAG]: string };

function isTaggedDate(value: unknown): value is TaggedDate {
  if (typeof value !== "object" || value === null) return false;

  const keys = Object.keys(value);

  return (
    keys.length === 1 &&
    keys[0] === DATE_TAG &&
    typeof (value as TaggedDate)[DATE_TAG] === "string"
  );
}

export function serializeCacheValue(value: unknown): string {
  return JSON.stringify(value, function (key: string, current: unknown) {
    const raw: unknown = (this as Record<string, unknown>)[key];

    return raw instanceof Date ? { [DATE_TAG]: raw.toISOString() } : current;
  });
}

export function deserializeCacheValue<T>(payload: string): T {
  return JSON.parse(payload, (_key, value: unknown) =>
    isTaggedDate(value) ? new Date(value[DATE_TAG]) : value,
  ) as T;
}
