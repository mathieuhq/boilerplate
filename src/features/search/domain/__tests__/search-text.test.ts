import { describe, expect, it } from "vitest";

import {
  findSearchMatch,
  matchesSearchTerm,
  normalizeSearchText,
} from "../search-text";

describe("normalizeSearchText", () => {
  it("removes accents and lowercases", () => {
    expect(normalizeSearchText("Élodie CÔTÉ")).toBe("elodie cote");
  });
});

describe("findSearchMatch", () => {
  it("matches regardless of case and accents", () => {
    expect(findSearchMatch("Paramètres", "METRE")).toEqual({
      start: 4,
      end: 9,
    });
    expect(findSearchMatch("Parametres", "mètre")).toEqual({
      start: 4,
      end: 9,
    });
  });

  it("maps matches back to decomposed characters", () => {
    const text = "Café noir";

    const match = findSearchMatch(text, "café");

    expect(match).toEqual({ start: 0, end: 5 });
    expect(text.slice(match?.start, match?.end)).toBe("Café");
  });

  it("ignores combining marks without a base character", () => {
    expect(findSearchMatch("\u0301abc", "ab")).toEqual({ start: 1, end: 3 });
  });

  it("keeps surrogate pairs intact", () => {
    const text = "🚀 Launch";

    expect(findSearchMatch(text, "launch")).toEqual({ start: 3, end: 9 });
  });

  it("returns null for empty terms or missing matches", () => {
    expect(findSearchMatch("Dashboard", "   ")).toBeNull();
    expect(findSearchMatch("Dashboard", "users")).toBeNull();
  });
});

describe("matchesSearchTerm", () => {
  it("matches when any value contains the term", () => {
    expect(matchesSearchTerm(["Settings", "Sécurité"], "secu")).toBe(true);
    expect(matchesSearchTerm(["Settings", "Profile"], "secu")).toBe(false);
  });
});
