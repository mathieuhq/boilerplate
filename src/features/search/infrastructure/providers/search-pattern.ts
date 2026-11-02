export function toContainsPattern(term: string) {
  return `%${term.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}

export function toPrefixPattern(term: string) {
  return `${term.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
}
