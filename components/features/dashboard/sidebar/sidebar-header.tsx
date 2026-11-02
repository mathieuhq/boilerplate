import { ChangelogNotification } from "@/components/features/changelog/changelog-notification";
import { CommandSearch } from "@/components/features/dashboard/command/command-search";
import { NotificationBell } from "@/components/features/notification/notification-bell";
import { ThemeToggle } from "@/components/features/theme/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type SidebarHeaderProps = {
  latestVersion: string | null;
};

export const SidebarHeader = ({ latestVersion }: SidebarHeaderProps) => {
  return (
    <header
      className={cn(
        "material-bar z-50 flex h-14 shrink-0 items-center gap-2 border-b px-4",
        "sticky top-0",
      )}
    >
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-[orientation=vertical]:h-4"
      />
      <div className="flex min-w-0 flex-1 items-center justify-between gap-4">
        <CommandSearch />
        <div className="flex shrink-0 items-center gap-1">
          <NotificationBell />
          <ChangelogNotification latestVersion={latestVersion} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};
