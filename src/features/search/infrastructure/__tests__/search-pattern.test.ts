import { describe, expect, it } from "vitest";

import {
  toContainsPattern,
  toPrefixPattern,
} from "../providers/search-pattern";

describe("search patterns", () => {
  it("escapes LIKE wildcards", () => {
    expect(toContainsPattern("50%_off\\")).toBe("%50\\%\\_off\\\\%");
    expect(toPrefixPattern("a_b")).toBe("a\\_b%");
  });
});
