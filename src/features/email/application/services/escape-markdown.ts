const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const MARKDOWN_PUNCTUATION = /[!#$%()*+,\-./:;=?@[\\\]^_`{|}~]/g;
const HTML_SPECIAL_CHARACTERS = /[&<>"']/g;
const LINE_BREAKS = /[\r\n]+/g;

export function escapeMarkdown(value: string): string {
  return value
    .replace(LINE_BREAKS, " ")
    .replace(MARKDOWN_PUNCTUATION, "\\$&")
    .replace(HTML_SPECIAL_CHARACTERS, (character) => HTML_ENTITIES[character]);
}

const URL_BREAKING_CHARACTERS = /[()<>\s\\]/g;

export function escapeMarkdownUrl(url: string): string {
  return url.replace(
    URL_BREAKING_CHARACTERS,
    (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase().padStart(2, "0")}`,
  );
}
