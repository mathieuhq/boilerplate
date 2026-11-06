import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import {
  createJobProcessor,
  InvalidJobDataError,
  type JobSchemas,
  UnknownJobError,
} from "../job-processor";

type TestJobs = {
  "report.build": { reportId: string };
};

const schemas: JobSchemas<TestJobs> = {
  "report.build": z.object({ reportId: z.string() }),
};

describe("createJobProcessor", () => {
  it("dispatches the parsed job data to its handler and returns its result", async () => {
    const handler = vi.fn().mockResolvedValue({ rows: 3 });
    const process = createJobProcessor<TestJobs>(
      { "report.build": handler },
      schemas,
    );

    await expect(
      process({
        name: "report.build",
        data: { reportId: "r1", injected: "<a>" },
      }),
    ).resolves.toEqual({ rows: 3 });
    expect(handler).toHaveBeenCalledWith({ reportId: "r1" });
  });

  it("rejects jobs without a handler", async () => {
    const process = createJobProcessor<TestJobs>(
      { "report.build": vi.fn() },
      schemas,
    );

    await expect(process({ name: "toString", data: {} })).rejects.toThrow(
      UnknownJobError,
    );
  });

  it("rejects job data that does not match the job schema", async () => {
    const handler = vi.fn();
    const process = createJobProcessor<TestJobs>(
      { "report.build": handler },
      schemas,
    );

    await expect(
      process({ name: "report.build", data: { reportId: 42 } }),
    ).rejects.toThrow(InvalidJobDataError);
    expect(handler).not.toHaveBeenCalled();
  });
});
