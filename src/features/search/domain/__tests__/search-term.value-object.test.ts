import { describe, expect, it } from "vitest";

import { ValueObject } from "@/shared/domain/value-object.base";

import { InvalidSearchTermError } from "../errors/invalid-search-term.error";
import {
  SEARCH_TERM_MAX_LENGTH,
  SearchTerm,
} from "../value-objects/search-term.value-object";

class OtherValueObject extends ValueObject<{ value: string }> {
  constructor(value: string) {
    super({ value });
  }

  equals() {
    return false;
  }
}

describe("SearchTerm", () => {
  it("trims and collapses whitespace", () => {
    expect(SearchTerm.create("  jane   doe ").value).toBe("jane doe");
  });

  it("rejects terms shorter than two characters", () => {
    expect(() => SearchTerm.create(" a ")).toThrow(InvalidSearchTermError);
  });

  it("rejects terms longer than the maximum length", () => {
    expect(() =>
      SearchTerm.create("a".repeat(SEARCH_TERM_MAX_LENGTH + 1)),
    ).toThrow("between 2 and 100 characters");
  });

  it("compares terms by value", () => {
    const term = SearchTerm.create("jane");

    expect(term.equals(SearchTerm.create(" jane "))).toBe(true);
    expect(term.equals(SearchTerm.create("john"))).toBe(false);
    expect(term.equals(new OtherValueObject("jane"))).toBe(false);
  });
});
