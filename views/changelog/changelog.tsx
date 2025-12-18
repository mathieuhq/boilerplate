import type { ReactNode } from "react";

import { ChangelogClient } from "./changelog-client";

type ChangelogViewProps = {
  children: ReactNode;
  latestVersion: string | null;
};

export const ChangelogView = ({
  children,
  latestVersion,
}: ChangelogViewProps) => {
  return (
    <div
      data-layout="fixed"
      className="flex flex-1 flex-col gap-4 overflow-hidden p-4"
    >
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Changelog
        </h1>
        <p className="text-muted-foreground">
          Discover the latest updates and improvements to the application.
        </p>
      </div>
      <ChangelogClient latestVersion={latestVersion}>
        {children}
      </ChangelogClient>
    </div>
  );
};
