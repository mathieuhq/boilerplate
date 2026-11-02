import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ChangelogList } from "@/components/features/changelog/changelog-list";
import { ChangelogSidebar } from "@/components/features/changelog/changelog-sidebar";
import { SectionTemplate } from "@/components/features/dashboard/section-template";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChangelogNotification } from "@/hooks/use-changelog-notification";
import type { ChangelogType } from "@/lib/changelog";

type ChangelogClientProps = {
  title: string;
  description: string;
  children: ReactNode;
  latestVersion: string | null;
};

export const ChangelogClient = ({
  title,
  children,
  description,
  latestVersion,
}: ChangelogClientProps) => {
  const { markAsSeen } = useChangelogNotification(latestVersion);
  const [activeFilter, setActiveFilter] = useState<ChangelogType | "all">(
    "all",
  );

  useEffect(() => {
    if (latestVersion) markAsSeen(latestVersion);
  }, [latestVersion, markAsSeen]);

  return (
    <SectionTemplate
      title={title}
      description={description}
      nav={
        <ChangelogSidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      }
    >
      <ScrollArea className="-mx-1 min-w-0 flex-1">
        <div className="max-w-3xl px-3 pt-1 pb-16">
          <ChangelogList activeFilter={activeFilter}>{children}</ChangelogList>
        </div>
      </ScrollArea>
    </SectionTemplate>
  );
};
