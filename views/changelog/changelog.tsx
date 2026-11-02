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
    <ChangelogClient
      title={t("title")}
      description={t("description")}
      latestVersion={latestVersion}
    >
      {children}
    </ChangelogClient>
  );
};
