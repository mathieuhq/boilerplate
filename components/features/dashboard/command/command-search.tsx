"use client";

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSearch } from "@/contexts/command-search.context";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export const CommandSearch = ({ className = "" }: Props) => {
  const t = useTranslations("common");
  const placeholder = t("search");
  const { setOpen } = useSearch();

  return (
    <Button
      variant="outline"
      onClick={() => setOpen(true)}
      className={cn(
        "bg-muted/25 text-muted-foreground hover:bg-muted/50 relative h-8 w-full justify-start rounded-md text-sm font-normal shadow-none sm:pr-12 md:w-40 lg:w-56 xl:w-64",
        className,
      )}
    >
      <Search
        aria-hidden="true"
        className="absolute top-1/2 left-1.5 -translate-y-1/2"
      />
      <span className="ml-3">{placeholder}</span>
      <kbd className="bg-muted pointer-events-none absolute top-[0.3rem] right-[0.3rem] hidden h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium opacity-100 select-none sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
};
