import type { ReactNode } from "react";

import { useTranslations } from "@/i18n";

import { ChangelogClient } from "./changelog-client";

type ChangelogViewProps = {
  children: ReactNode;
  latestVersion: string | null;
};

export const ChangelogView = ({
  children,
  latestVersion,
}: ChangelogViewProps) => {
  const t = useTranslations("changelog");

  return (
    <div
      data-layout="fixed"
      className="flex flex-1 flex-col gap-4 overflow-hidden p-4"
    >
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          {t("title")}
        </h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <ChangelogClient latestVersion={latestVersion}>
        {children}
      </ChangelogClient>
    </div>
  );
};
