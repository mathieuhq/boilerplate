"use client";

import { Children, isValidElement } from "react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

import type { ChangelogType } from "@/lib/changelog";

type ChangelogListProps = {
  children: ReactNode;
  activeFilter: ChangelogType | "all";
};

export const ChangelogList = ({
  children,
  activeFilter,
}: ChangelogListProps) => {
  const t = useTranslations("changelog");

  const filteredChildren = Children.toArray(children).filter((child) => {
    if (activeFilter === "all") return true;
    if (isValidElement<{ "data-type"?: ChangelogType }>(child)) {
      return child.props["data-type"] === activeFilter;
    }
    return true;
  });

  return (
    <div className="space-y-0">
      {filteredChildren.length === 0 ? (
        <p className="text-muted-foreground">{t("noEntriesFound")}</p>
      ) : (
        filteredChildren
      )}
    </div>
  );
};
