import type { JSX } from "react";

import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "@/lib/navigation";
import { cn } from "@/lib/utils";

type SectionNavItem = {
  value: string;
  label: string;
  icon: JSX.Element;
  href?: string;
};

type SectionNavTemplateProps = {
  value: string;
  items: SectionNavItem[];
  placeholder?: string;
  onValueChange: (value: string) => void;
};

export const SectionNavTemplate = ({
  value,
  items,
  placeholder,
  onValueChange,
}: SectionNavTemplateProps) => {
  return (
    <>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full md:hidden">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.icon}
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <nav className="-mx-1 hidden gap-1 overflow-x-auto px-1 py-1 md:flex lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const className = cn(
            buttonVariants({ variant: "ghost" }),
            "shrink-0 justify-start",
            item.value === value
              ? "bg-muted hover:bg-muted font-medium"
              : "text-muted-foreground hover:text-foreground",
          );

          if (item.href)
            return (
              <Link key={item.value} href={item.href} className={className}>
                {item.icon}
                {item.label}
              </Link>
            );

          return (
            <button
              key={item.value}
              type="button"
              className={className}
              onClick={() => onValueChange(item.value)}
            >
              {item.icon}
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );
};
