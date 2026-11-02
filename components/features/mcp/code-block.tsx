import { useEffect, useState } from "react";
import { Check, Copy } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";

type CodeBlockProps = {
  code: string;
};

export const CodeBlock = ({ code }: CodeBlockProps) => {
  const t = useTranslations("mcp");

  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;

    const timeout = setTimeout(() => setCopied(false), 2000);

    return () => clearTimeout(timeout);
  }, [copied]);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
  };

  return (
    <div className="relative rounded-lg border bg-muted/50">
      <pre className="overflow-x-auto py-2.5 pr-11 pl-3 font-mono text-sm leading-6">
        <code>{code}</code>
      </pre>
      <Button
        size="icon"
        type="button"
        variant="ghost"
        onClick={() => void copy()}
        aria-label={copied ? t("copied") : t("copy")}
        className="absolute top-1.5 right-1.5 size-8"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={copied ? "copied" : "copy"}
            initial={{ scale: 0.5, opacity: 0, filter: "blur(4px)" }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
            exit={{ scale: 0.5, opacity: 0, filter: "blur(4px)" }}
          >
            {copied ? <Check /> : <Copy />}
          </motion.span>
        </AnimatePresence>
      </Button>
    </div>
  );
};
