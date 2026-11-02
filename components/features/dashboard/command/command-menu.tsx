import * as React from "react";
import { useMatch } from "@tanstack/react-router";
import {
  ArrowRight,
  Building2,
  History,
  Laptop,
  type LucideIcon,
  Moon,
  Settings,
  Shield,
  Sun,
  Trash2,
  User,
  Users,
} from "lucide-react";

import { useTheme } from "@/components/features/theme/theme-provider";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Loader } from "@/components/ui/loader";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearch } from "@/contexts/command-search.context";
import { matchesSearchTerm } from "@/features/search/domain/search-text";
import type { SearchResultIcon } from "@/features/search/domain/search.types";
import { SEARCH_TERM_MIN_LENGTH } from "@/features/search/domain/value-objects/search-term.value-object";
import { useAccess } from "@/hooks/use-access";
import { useDebounce } from "@/hooks/use-debounce";
import { useGlobalSearch } from "@/hooks/use-global-search";
import { useRecentSearches } from "@/hooks/use-recent-searches";
import { useTranslations } from "@/i18n";
import { getAdminPages } from "@/lib/admin-access";
import { useRouter } from "@/lib/navigation";

import { useSidebarItems } from "../sidebar/sidebar.constants";

import { SearchHighlight } from "./search-highlight";

const SEARCH_DEBOUNCE_MS = 250;

const SEARCH_RESULT_ICONS: Record<SearchResultIcon, LucideIcon> = {
  page: ArrowRight,
  settings: Settings,
  admin: Shield,
  user: User,
  organization: Building2,
  member: Users,
};

export const CommandMenu = () => {
  const router = useRouter();

  const tTheme = useTranslations("theme");
  const tCommon = useTranslations("common");
  const tCommand = useTranslations("command");

  const { setTheme } = useTheme();

  const { open, setOpen } = useSearch();
  const { access } = useAccess();

  const dashboardMatch = useMatch({ from: "/_dashboard", shouldThrow: false });
  const userId = dashboardMatch?.context.user.id;

  const [query, setQuery] = React.useState("");
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const updateDebouncedQuery = useDebounce(
    setDebouncedQuery,
    SEARCH_DEBOUNCE_MS,
  );

  const term = query.trim();
  const isSearching = Boolean(userId) && term.length >= SEARCH_TERM_MIN_LENGTH;

  const search = useGlobalSearch(debouncedQuery, open && Boolean(userId));
  const { recentSearches, addRecentSearch, clearRecentSearches } =
    useRecentSearches(userId);

  const isPending =
    isSearching && (search.isFetching || debouncedQuery.trim() !== term);
  const groups = isSearching ? (search.data?.groups ?? []) : [];

  const sidebarItems = useSidebarItems();

  const hasAdminAccess = getAdminPages(access).length > 0;

  const filteredItems = React.useMemo(() => {
    return sidebarItems.map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if ("adminOnly" in item && item.adminOnly) return hasAdminAccess;

        return true;
      }),
    }));
  }, [hasAdminAccess, sidebarItems]);

  const themeItems = [
    { value: "light", label: tTheme("light"), icon: Sun },
    { value: "dark", label: tTheme("dark"), icon: Moon },
    { value: "system", label: tTheme("system"), icon: Laptop },
  ] as const;

  const visibleThemeItems = isSearching
    ? themeItems.filter((item) => matchesSearchTerm([item.label], term))
    : themeItems;

  const changeQuery = (value: string) => {
    setQuery(value);
    updateDebouncedQuery(value);
  };

  const changeOpen = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) return;

    setQuery("");
    setDebouncedQuery("");
  };

  const runCommand = (command: () => unknown) => {
    changeOpen(false);
    command();
  };

  return (
    <CommandDialog
      modal
      open={open}
      onOpenChange={changeOpen}
      shouldFilter={!isSearching}
    >
      <CommandInput
        value={query}
        onValueChange={changeQuery}
        placeholder={tCommand("searchPlaceholder")}
      />
      <CommandList>
        <ScrollArea type="hover" className="h-72 pr-1">
          <CommandEmpty>
            {isPending ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Loader className="size-4" />
                {tCommand("searching")}
              </span>
            ) : isSearching ? (
              tCommand("noResultsFor", { query: term })
            ) : (
              tCommon("noResults")
            )}
          </CommandEmpty>
          {isSearching ? (
            <>
              {isPending && groups.length > 0 && (
                <div
                  role="status"
                  className="flex items-center gap-2 px-4 py-2 text-xs text-muted-foreground"
                >
                  <Loader className="size-3" />
                  {tCommand("searching")}
                </div>
              )}
              {search.isError && !isPending && (
                <p role="alert" className="px-4 py-2 text-xs text-destructive">
                  {tCommand("searchError")}
                </p>
              )}
              {groups.map((group) => (
                <CommandGroup
                  key={group.type}
                  heading={tCommand(`groups.${group.type}`)}
                >
                  {group.results.map((result) => {
                    const Icon = SEARCH_RESULT_ICONS[result.icon];

                    return (
                      <CommandItem
                        key={`${result.type}:${result.id}`}
                        value={`${result.type}:${result.id}`}
                        onSelect={() => {
                          addRecentSearch(term);
                          runCommand(() => router.push(result.href));
                        }}
                      >
                        <Icon className="size-4 text-muted-foreground/80" />
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">
                            <SearchHighlight text={result.title} term={term} />
                          </span>
                          {result.subtitle && (
                            <span className="truncate text-xs text-muted-foreground">
                              <SearchHighlight
                                text={result.subtitle}
                                term={term}
                              />
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
              {search.data && search.data.failedTypes.length > 0 && (
                <p className="px-4 py-2 text-xs text-muted-foreground">
                  {tCommand("partialResults")}
                </p>
              )}
            </>
          ) : (
            <>
              {term.length === 0 && recentSearches.length > 0 && (
                <>
                  <CommandGroup heading={tCommand("recentSearches")}>
                    {recentSearches.map((recentSearch) => (
                      <CommandItem
                        key={recentSearch}
                        value={`recent:${recentSearch}`}
                        onSelect={() => changeQuery(recentSearch)}
                      >
                        <History className="size-4" />
                        <span className="truncate">{recentSearch}</span>
                      </CommandItem>
                    ))}
                    <CommandItem
                      value="recent:clear"
                      onSelect={clearRecentSearches}
                    >
                      <Trash2 className="size-4" />
                      <span>{tCommand("clearRecentSearches")}</span>
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                </>
              )}
              {filteredItems.map((group) => (
                <CommandGroup key={group.title} heading={group.title}>
                  {group.items.flatMap((navItem) => {
                    if ("url" in navItem && typeof navItem.url === "string") {
                      return (
                        <CommandItem
                          key={navItem.url}
                          value={navItem.title}
                          onSelect={() => {
                            runCommand(() =>
                              router.push(navItem.url as string),
                            );
                          }}
                        >
                          <ArrowRight className="size-4 text-muted-foreground/80" />
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
                          <ArrowRight className="size-4 text-muted-foreground/80" />
                          {subItem.title}
                        </CommandItem>
                      ));
                    }
                    return [];
                  })}
                </CommandGroup>
              ))}
            </>
          )}
          {visibleThemeItems.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={tTheme("toggle")}>
                {visibleThemeItems.map((item) => (
                  <CommandItem
                    key={item.value}
                    value={item.label}
                    onSelect={() => runCommand(() => setTheme(item.value))}
                  >
                    <item.icon className="size-4" />
                    <span>
                      {isSearching ? (
                        <SearchHighlight text={item.label} term={term} />
                      ) : (
                        item.label
                      )}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  );
};
