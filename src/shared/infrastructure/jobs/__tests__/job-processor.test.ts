import { describe, expect, it, vi } from "vitest";

import { createJobProcessor, UnknownJobError } from "../job-processor";

type TestJobs = {
  "report.build": { reportId: string };
};

describe("createJobProcessor", () => {
  it("dispatches the job data to its handler and returns its result", async () => {
    const handler = vi.fn().mockResolvedValue({ rows: 3 });
    const process = createJobProcessor<TestJobs>({ "report.build": handler });

    await expect(
      process({ name: "report.build", data: { reportId: "r1" } }),
    ).resolves.toEqual({ rows: 3 });
    expect(handler).toHaveBeenCalledWith({ reportId: "r1" });
  });

  it("rejects jobs without a handler", async () => {
    const process = createJobProcessor<TestJobs>({
      "report.build": vi.fn(),
    });

    await expect(process({ name: "toString", data: {} })).rejects.toThrow(
      UnknownJobError,
    );
  });
});
