export type CsvValue = string | number | boolean | Date | null | undefined;

export type CsvColumn<T> = {
  header: string;
  value: (row: T) => CsvValue;
};

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

const BYTE_ORDER_MARK = "﻿";

const LINE_BREAK = "\r\n";

export function escapeCsvValue(value: CsvValue): string {
  if (value === null || value === undefined) return "";

  if (value instanceof Date)
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();

  let text = String(value);

  if (
    typeof value === "string" &&
    FORMULA_PREFIXES.some((prefix) => text.startsWith(prefix))
  )
    text = `'${text}`;

  if (/[",\r\n]/.test(text) || text !== text.trim())
    return `"${text.replaceAll('"', '""')}"`;

  return text;
}

export function toCsvLine(values: CsvValue[]) {
  return `${values.map(escapeCsvValue).join(",")}${LINE_BREAK}`;
}

function toCsvRows<T>(columns: CsvColumn<T>[], rows: T[]) {
  return rows
    .map((row) => toCsvLine(columns.map((column) => column.value(row))))
    .join("");
}

export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]) {
  return `${BYTE_ORDER_MARK}${toCsvLine(columns.map((column) => column.header))}${toCsvRows(columns, rows)}`;
}

export function createCsvStream<T>(
  columns: CsvColumn<T>[],
  batches: AsyncIterable<T[]>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const iterator = batches[Symbol.asyncIterator]();

  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encoder.encode(
          `${BYTE_ORDER_MARK}${toCsvLine(columns.map((column) => column.header))}`,
        ),
      );
    },
    async pull(controller) {
      try {
        const next = await iterator.next();

        if (next.done) return controller.close();

        controller.enqueue(encoder.encode(toCsvRows(columns, next.value)));
      } catch (error) {
        controller.error(error);
      }
    },
    async cancel() {
      await iterator.return?.();
    },
  });
}

export function toCsvFilename(name: string, date = new Date()) {
  const slug = name
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/^-+|-+$/g, "");

  return `${slug || "export"}-${date.toISOString().slice(0, 10)}.csv`;
}

export function csvResponse(
  body: ReadableStream<Uint8Array> | string,
  name: string,
) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${toCsvFilename(name)}"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
