import { describe, expect, it, vi } from "vitest";

import {
  createCsvStream,
  type CsvColumn,
  csvResponse,
  escapeCsvValue,
  toCsv,
  toCsvFilename,
  toCsvLine,
} from "../csv";

type Row = { name: string; count: number };

const columns: CsvColumn<Row>[] = [
  { header: "Name", value: (row) => row.name },
  { header: "Count", value: (row) => row.count },
];

async function readStream(stream: ReadableStream<Uint8Array>) {
  const buffer = await new Response(stream).arrayBuffer();

  return new TextDecoder("utf-8", { ignoreBOM: true }).decode(buffer);
}

describe("escapeCsvValue", () => {
  it.each([
    [null, ""],
    [undefined, ""],
    ["plain", "plain"],
    [42, "42"],
    [-3, "-3"],
    [true, "true"],
    [new Date("2026-01-02T03:04:05.000Z"), "2026-01-02T03:04:05.000Z"],
    [new Date("invalid"), ""],
    ["a,b", '"a,b"'],
    ['say "hi"', '"say ""hi"""'],
    ["line\nbreak", '"line\nbreak"'],
    ["carriage\rreturn", '"carriage\rreturn"'],
    [" padded ", '" padded "'],
  ])("escapes %j", (value, expected) => {
    expect(escapeCsvValue(value)).toBe(expected);
  });

  it.each([
    ["=SUM(A1:A2)", "'=SUM(A1:A2)"],
    ["+1", "'+1"],
    ["-1+1", "'-1+1"],
    ["@cmd", "'@cmd"],
    ["\tvalue", "'\tvalue"],
    ["\rvalue", '"\'\rvalue"'],
    ['=HYPERLINK("x")', '"\'=HYPERLINK(""x"")"'],
  ])("neutralizes the formula %j", (value, expected) => {
    expect(escapeCsvValue(value)).toBe(expected);
  });

  it.each([
    ["Bob;=1+1;", '"Bob;=1+1;"'],
    ["a;b", '"a;b"'],
    ["=1;+2", '"\'=1;+2"'],
  ])("quotes the semicolon value %j", (value, expected) => {
    expect(escapeCsvValue(value)).toBe(expected);
  });

  it.each([",", ";"])(
    "never starts a %j separated cell with a formula prefix",
    (separator) => {
      const values = ["Bob;=1+1;", "x,=1+1", "a;+b,-c", "@x;\t=1", "ok"];
      const line = values.map(escapeCsvValue).join(separator);
      const cells = splitCsvLine(line, separator);

      expect(cells).toHaveLength(values.length);

      for (const cell of cells) {
        expect(["=", "+", "-", "@", "\t", "\r"]).not.toContain(cell[0]);
      }
    },
  );
});

function splitCsvLine(line: string, separator: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];

    if (quoted && char === '"' && line[index + 1] === '"') {
      cell += '"';
      index++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === separator) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }

  return [...cells, cell];
}

describe("toCsvLine", () => {
  it("joins escaped values with a CRLF line break", () => {
    expect(toCsvLine(["a", "b,c", null])).toBe('a,"b,c",\r\n');
  });
});

describe("toCsv", () => {
  it("writes a BOM, the headers and the rows", () => {
    expect(toCsv(columns, [{ name: "Acme, Inc", count: 2 }])).toBe(
      '﻿Name,Count\r\n"Acme, Inc",2\r\n',
    );
  });
});

describe("createCsvStream", () => {
  it("streams the headers then every batch", async () => {
    async function* batches() {
      yield [{ name: "One", count: 1 }];
      yield [
        { name: "Two", count: 2 },
        { name: "=Three", count: 3 },
      ];
    }

    const text = await readStream(createCsvStream(columns, batches()));

    expect(text).toBe("﻿Name,Count\r\nOne,1\r\nTwo,2\r\n'=Three,3\r\n");
  });

  it("errors the stream when a batch fails", async () => {
    async function* batches(): AsyncGenerator<Row[]> {
      yield [{ name: "One", count: 1 }];
      throw new Error("Database unavailable");
    }

    await expect(
      readStream(createCsvStream(columns, batches())),
    ).rejects.toThrow("Database unavailable");
  });

  it("stops the source when the stream is cancelled", async () => {
    const returnSpy = vi.fn(async () => ({ done: true as const, value: [] }));
    const source: AsyncIterable<Row[]> = {
      [Symbol.asyncIterator]: () => ({
        next: async () => ({ done: false, value: [{ name: "One", count: 1 }] }),
        return: returnSpy,
      }),
    };
    const reader = createCsvStream(columns, source).getReader();

    await reader.read();
    await reader.cancel();

    expect(returnSpy).toHaveBeenCalled();
  });

  it("supports sources without a return method", async () => {
    let done = false;
    const source: AsyncIterable<Row[]> = {
      [Symbol.asyncIterator]: () => ({
        next: async () => {
          if (done) return { done: true, value: undefined };

          done = true;
          return { done: false, value: [{ name: "One", count: 1 }] };
        },
      }),
    };
    const reader = createCsvStream(columns, source).getReader();

    await reader.read();
    await expect(reader.cancel()).resolves.toBeUndefined();
  });
});

describe("toCsvFilename", () => {
  it("slugifies the name and appends the date", () => {
    expect(
      toCsvFilename("Audit Logs / 2026", new Date("2026-11-02T10:00:00Z")),
    ).toBe("audit-logs-2026-2026-11-02.csv");
  });

  it("falls back to a default name", () => {
    expect(toCsvFilename("***", new Date("2026-11-02T10:00:00Z"))).toBe(
      "export-2026-11-02.csv",
    );
  });
});

describe("csvResponse", () => {
  it("returns a downloadable CSV response", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-02T10:00:00Z"));

    const response = csvResponse("a,b\r\n", "users");

    vi.useRealTimers();

    expect(response.headers.get("Content-Type")).toBe(
      "text/csv; charset=utf-8",
    );
    expect(response.headers.get("Content-Disposition")).toBe(
      'attachment; filename="users-2026-11-02.csv"',
    );
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(await response.text()).toBe("a,b\r\n");
  });
});
