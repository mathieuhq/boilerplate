import { createElement } from "react";
import { Markdown, render } from "react-email";
import { describe, expect, it } from "vitest";

import { escapeMarkdown, escapeMarkdownUrl } from "../services/escape-markdown";

async function renderMarkdown(markdown: string) {
  return render(createElement(Markdown, null, markdown));
}

describe("escapeMarkdown", () => {
  it("should not let raw HTML through", async () => {
    const html = await renderMarkdown(
      `Join **${escapeMarkdown('<a href="https://evil.test">Accept</a>')}**`,
    );

    expect(html).not.toContain("<a");
    expect(html).toContain("&lt;a href=");
  });

  it("should not let Markdown links through", async () => {
    const html = await renderMarkdown(
      escapeMarkdown("[Verify your account](https://evil.test)"),
    );

    expect(html).not.toContain("<a");
    expect(html).toContain("[Verify your account](https://evil.test)");
  });

  it("should not let bare URLs or emails become links", async () => {
    const html = await renderMarkdown(
      escapeMarkdown("Visit https://evil.test or www.evil.test or a@evil.test"),
    );

    expect(html).not.toContain("<a");
  });

  it("should not let block syntax start on a new line", async () => {
    const html = await renderMarkdown(
      `Hello ${escapeMarkdown("Acme\n# Urgent\n![x](https://evil.test/p.png)")}`,
    );

    expect(html).not.toContain("<h1");
    expect(html).not.toContain("<img");
  });

  it("should keep ordinary names readable", async () => {
    const html = await renderMarkdown(escapeMarkdown("Jean-Luc's Café & Co."));

    expect(html).toContain("<p>Jean-Luc&#39;s Café &amp; Co.</p>");
  });
});

describe("escapeMarkdownUrl", () => {
  it("should keep a single link when the URL contains parentheses", async () => {
    const url =
      "https://app.test/reset-password/token?callbackURL=%2F)(https://www.example.test";
    const html = await renderMarkdown(
      `[Reset your password](${escapeMarkdownUrl(url)})`,
    );

    expect(html.match(/<a /g)).toHaveLength(1);
    expect(html).toContain(
      'href="https://app.test/reset-password/token?callbackURL=%2F%29%28https://www.example.test"',
    );
  });

  it("should encode whitespace, angle brackets and backslashes", () => {
    expect(escapeMarkdownUrl("https://a.test/a b<c>\\d")).toBe(
      "https://a.test/a%20b%3Cc%3E%5Cd",
    );
  });
});
