"use client";

import { AlertTriangle, Bug, LayersPlus, Sparkles } from "lucide-react";
import type { JSX } from "react";

import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChangelogType } from "@/lib/changelog";
import { cn } from "@/lib/utils";

type FilterItem = {
  value: ChangelogType | "all";
  label: string;
  icon: JSX.Element;
};

const FILTER_ITEMS: FilterItem[] = [
  { value: "all", label: "All", icon: <Sparkles /> },
  { value: "Feature", label: "New Features", icon: <LayersPlus /> },
  { value: "Fix", label: "Fixes", icon: <Bug /> },
  { value: "Critical", label: "Critical", icon: <AlertTriangle /> },
];

type Props = {
  activeFilter: ChangelogType | "all";
  onFilterChange: (filter: ChangelogType | "all") => void;
} & React.HTMLAttributes<HTMLElement>;

export const ChangelogSidebar = ({
  className,
  activeFilter,
  onFilterChange,
  ...props
}: Props) => {
  return (
    <>
      <div className="p-1 md:hidden">
        <Select
          value={activeFilter}
          onValueChange={(value) =>
            onFilterChange(value as ChangelogType | "all")
          }
        >
          <SelectTrigger className="h-10 sm:w-48">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            {FILTER_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                <div className="flex gap-x-4 px-2 py-0.5">
                  <span className="scale-125 [&_svg]:size-4">{item.icon}</span>
                  <span className="text-md">{item.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea
        type="always"
        className="bg-background hidden w-full min-w-48 px-1 py-2 md:block"
      >
        <nav
          className={cn(
            "flex space-x-2 py-1 lg:flex-col lg:space-y-1 lg:space-x-0",
            className,
          )}
          {...props}
        >
          {FILTER_ITEMS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onFilterChange(item.value)}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                activeFilter === item.value
                  ? "bg-muted hover:bg-muted"
                  : "hover:bg-transparent hover:underline",
                "justify-start",
              )}
            >
              <span className="[&_svg]:size-4">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </ScrollArea>
    </>
  );
};
