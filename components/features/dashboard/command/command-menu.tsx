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
import { useSession } from "@/lib/auth-client";

import { SIDEBAR_ITEMS } from "../sidebar/sidebar.constants";

export const CommandMenu = () => {
  const router = useRouter();
  const { setTheme } = useTheme();
  const { open, setOpen } = useSearch();
  const { data: session } = useSession();

  const isAdmin = session?.user.role === "admin";

  const filteredItems = React.useMemo(() => {
    return SIDEBAR_ITEMS.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if ("adminOnly" in item && item.adminOnly) {
          return isAdmin;
        }
        return true;
      }),
    }));
  }, [isAdmin]);

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
          {filteredItems.map((group) => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.flatMap((navItem) => {
                if ("url" in navItem && typeof navItem.url === "string") {
                  return (
                    <CommandItem
                      value={navItem.title}
                      key={navItem.url}
                      onSelect={() => {
                        runCommand(() => router.push(navItem.url as string));
                      }}
                    >
                      <ArrowRight className="text-muted-foreground/80 size-4" />
                      {navItem.title}
                    </CommandItem>
                  );
                }
                if ("items" in navItem && Array.isArray(navItem.items)) {
                  return navItem.items.map((subItem, j) => (
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
                  ));
                }
                return [];
              })}
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
