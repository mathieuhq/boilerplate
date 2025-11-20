import { CommandSearch } from "@/components/features/dashboard/command/command-search";
import { ThemeToggle } from "@/components/features/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export const SidebarHeader = () => {
  return (
    <header
      className={cn(
        "bg-background z-50 flex h-16 shrink-0 items-center gap-2 border-b px-4",
        "sticky top-0",
      )}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <div className="flex w-full items-center justify-between">
        <CommandSearch />
        <ThemeToggle />
      </div>
    </header>
  );
};
