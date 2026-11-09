import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { Logo } from "@/components/ui/logo";
import Link from "@/lib/navigation";

type LegalViewProps = {
  content: string;
};

export function LegalView({ content }: LegalViewProps) {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/">
        <Logo width={32} height={32} />
      </Link>
      <article className="prose mt-10 max-w-none dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </article>
    </main>
  );
}
