"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { ArrowRight, Laptop, Moon, Sun } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearch } from "@/contexts/command-search.context";

import { SIDEBAR_ITEMS } from "../sidebar/sidebar.constants";

export const CommandMenu = () => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { open, setOpen } = useSearch();

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    [setOpen],
  );

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <ScrollArea type="hover" className="h-72 pr-1">
          <CommandEmpty>No results found.</CommandEmpty>
          {SIDEBAR_ITEMS.map((item) => (
            <CommandGroup key={item.title} heading={item.title}>
              {item.items.flatMap((navItem) =>
                navItem.items.map((subItem, j) => (
                  <CommandItem
                    value={subItem.title}
                    key={`${subItem.url}-${j}`}
                    onSelect={() => {
                      runCommand(() => router.push(subItem.url));
                    }}
                  >
                    <ArrowRight className="text-muted-foreground/80 size-4" />
                    {subItem.title}
                  </CommandItem>
                )),
              )}
            </CommandGroup>
          ))}
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => runCommand(() => setTheme("light"))}>
              <Sun className="size-4" />
              <span>Light</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("dark"))}>
              <Moon className="size-4" />
              <span>Dark</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme("system"))}>
              <Laptop className="size-4" />
              <span>System</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  );
};
