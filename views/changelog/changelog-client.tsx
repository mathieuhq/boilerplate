"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { ChangelogList } from "@/components/features/changelog/changelog-list";
import { ChangelogSidebar } from "@/components/features/changelog/changelog-sidebar";
import { useChangelogNotification } from "@/hooks/use-changelog-notification";
import type { ChangelogType } from "@/lib/changelog";

type ChangelogClientProps = {
  children: ReactNode;
  latestVersion: string | null;
};

export const ChangelogClient = ({
  children,
  latestVersion,
}: ChangelogClientProps) => {
  const [activeFilter, setActiveFilter] = useState<ChangelogType | "all">(
    "all",
  );
  const { markAsSeen } = useChangelogNotification(latestVersion);

  useEffect(() => {
    if (latestVersion) markAsSeen(latestVersion);
  }, [latestVersion, markAsSeen]);

  return (
    <div className="flex flex-1 flex-col space-y-8 overflow-auto md:space-y-2 md:overflow-hidden lg:flex-row lg:space-y-0 lg:space-x-12">
      <aside className="lg:sticky lg:w-1/5">
        <ChangelogSidebar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </aside>
      <div className="flex w-full overflow-y-scroll p-1 pr-4 pl-2 md:overflow-y-hidden">
        <ChangelogList activeFilter={activeFilter}>{children}</ChangelogList>
      </div>
    </div>
  );
};
