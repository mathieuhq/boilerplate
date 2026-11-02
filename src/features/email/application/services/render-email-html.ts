import { pretty, render } from "react-email";

export async function renderEmailHtml(html: string | React.ReactElement) {
  if (typeof html === "string") return html;

  return pretty(await render(html));
}
