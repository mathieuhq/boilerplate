import { type JSX, useId } from "react";
import { motion } from "motion/react";

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
  const indicatorId = useId();

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

      <nav className="isolate -mx-1 hidden gap-1 overflow-x-auto px-1 py-1 md:flex lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active = item.value === value;
          const className = cn(
            buttonVariants({ variant: "ghost" }),
            "relative shrink-0 justify-start",
            active
              ? "font-medium hover:bg-transparent dark:hover:bg-transparent"
              : "text-muted-foreground hover:text-foreground",
          );
          const content = (
            <>
              {active && (
                <motion.span
                  layoutId={indicatorId}
                  className="absolute inset-0 -z-10 rounded-md bg-muted"
                />
              )}
              {item.icon}
              {item.label}
            </>
          );

          if (item.href)
            return (
              <Link
                key={item.value}
                href={item.href}
                className={className}
                aria-current={active ? "page" : undefined}
              >
                {content}
              </Link>
            );

          return (
            <button
              key={item.value}
              type="button"
              className={className}
              aria-pressed={active}
              onClick={() => onValueChange(item.value)}
            >
              {content}
            </button>
          );
        })}
      </nav>
    </>
  );
};
