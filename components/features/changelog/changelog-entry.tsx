import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { ChangelogEntry as ChangelogEntryType } from "@/lib/changelog";
import { formatDate } from "@/lib/utils";

import { ChangelogTypeBadge } from "./changelog-type-badge";

type ChangelogEntryProps = {
  entry: ChangelogEntryType;
};

export const ChangelogEntry = ({ entry }: ChangelogEntryProps) => {
  return (
    <article className="relative border-l-2 border-muted pb-8 pl-6 last:pb-0">
      <div className="absolute top-0 -left-2 size-4 rounded-full border-2 border-primary bg-background" />

      <header className="mb-4 flex flex-wrap items-center gap-3">
        <span className="font-mono text-lg font-semibold text-primary tabular-nums">
          v{entry.meta.version}
        </span>
        <ChangelogTypeBadge type={entry.meta.type} />
        <time
          dateTime={entry.meta.date}
          className="text-sm text-muted-foreground"
        >
          {formatDate(entry.meta.date)}
        </time>
      </header>

      <h3 className="mb-3 text-xl font-semibold">{entry.meta.title}</h3>

      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-base prose-headings:font-semibold prose-ul:my-2 prose-li:my-0">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {entry.content}
        </ReactMarkdown>
      </div>
    </article>
  );
};
