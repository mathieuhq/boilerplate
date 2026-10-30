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
