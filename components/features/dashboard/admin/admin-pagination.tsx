import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/i18n";
import Link from "@/lib/navigation";
import { cn } from "@/lib/utils";

type AdminPaginationProps = {
  page: number;
  basePath: string;
  pageCount: number;
  search: Record<string, string | number | boolean | undefined | null>;
};

export const AdminPagination = ({
  page,
  search,
  basePath,
  pageCount,
}: AdminPaginationProps) => {
  const t = useTranslations("admin");
  const previousPage = Math.max(1, page - 1);
  const nextPage = Math.min(pageCount, page + 1);

  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {t("pagination.page", { page, pageCount })}
      </p>
      <div className="flex items-center gap-2">
        <PaginationButton
          icon="previous"
          label={t("pagination.previous")}
          disabled={page <= 1}
          href={buildPageHref(basePath, search, previousPage)}
        />
        <PaginationButton
          icon="next"
          label={t("pagination.next")}
          disabled={page >= pageCount}
          href={buildPageHref(basePath, search, nextPage)}
        />
      </div>
    </div>
  );
};

const PaginationButton = ({
  href,
  icon,
  label,
  disabled,
}: {
  href: string;
  label: string;
  disabled: boolean;
  icon: "previous" | "next";
}) => {
  const content =
    icon === "previous" ? (
      <ChevronLeft className="size-4" />
    ) : (
      <ChevronRight className="size-4" />
    );

  return (
    <Button
      title={label}
      size="icon-sm"
      variant="outline"
      aria-label={label}
      asChild={!disabled}
      disabled={disabled}
      className={cn(disabled && "pointer-events-none")}
    >
      {disabled ? <span>{content}</span> : <Link href={href}>{content}</Link>}
    </Button>
  );
};

function buildPageHref(
  basePath: string,
  search: AdminPaginationProps["search"],
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  params.set("page", String(page));

  return `${basePath}?${params.toString()}`;
}
