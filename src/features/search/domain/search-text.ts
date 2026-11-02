const DIACRITICS = /\p{Diacritic}/gu;

type SearchMatch = {
  start: number;
  end: number;
};

function normalizeCharacter(character: string) {
  return character.normalize("NFD").replace(DIACRITICS, "").toLowerCase();
}

export function normalizeSearchText(value: string) {
  return Array.from(value, normalizeCharacter).join("");
}

export function findSearchMatch(
  text: string,
  term: string,
): SearchMatch | null {
  const normalizedTerm = normalizeSearchText(term.trim());

  if (!normalizedTerm) return null;

  const starts: number[] = [];
  const ends: number[] = [];
  let normalizedText = "";
  let offset = 0;

  for (const character of text) {
    const normalized = normalizeCharacter(character);
    const end = offset + character.length;

    if (!normalized && ends.length > 0) ends[ends.length - 1] = end;

    starts.push(...Array.from({ length: normalized.length }, () => offset));
    ends.push(...Array.from({ length: normalized.length }, () => end));

    normalizedText += normalized;
    offset += character.length;
  }

  const index = normalizedText.indexOf(normalizedTerm);

  if (index === -1) return null;

  return {
    start: starts[index],
    end: ends[index + normalizedTerm.length - 1],
  };
}

export function matchesSearchTerm(values: readonly string[], term: string) {
  return values.some((value) => findSearchMatch(value, term) !== null);
}
