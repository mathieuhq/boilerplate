import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSearch } from "@/contexts/command-search.context";
import { useTranslations } from "@/i18n";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export const CommandSearch = ({ className = "" }: Props) => {
  const { setOpen } = useSearch();
  const t = useTranslations("common");

  const placeholder = t("search");

  return (
    <Button
      variant="outline"
      onClick={() => setOpen(true)}
      className={cn(
        "bg-muted/25 text-muted-foreground hover:bg-muted/50 h-8 min-w-0 flex-1 justify-start gap-2 px-2.5 font-normal shadow-none md:w-56 md:flex-none lg:w-64",
        className,
      )}
    >
      <Search aria-hidden="true" />
      <span className="truncate">{placeholder}</span>
      <kbd className="pointer-events-none ml-auto hidden h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium select-none sm:inline-flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
};
