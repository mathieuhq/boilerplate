import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslations } from "@/i18n";
import { PAGE_SIZE_OPTIONS } from "@/shared/domain/list-query";

type DataTablePaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  pageCount: number;
  selectedCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
};

export const DataTablePagination = ({
  page,
  total,
  pageSize,
  pageCount,
  onPageChange,
  selectedCount,
  onPageSizeChange,
}: DataTablePaginationProps) => {
  const t = useTranslations("dataTable.pagination");

  const pageSizes = [...new Set([...PAGE_SIZE_OPTIONS, pageSize])].sort(
    (first, second) => first - second,
  );

  return (
    <div className="flex shrink-0 flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {selectedCount > 0
          ? t("selected", { count: selectedCount, total })
          : t("total", { count: total })}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end sm:gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap">{t("pageSize")}</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => onPageSizeChange(Number(value))}
          >
            <SelectTrigger
              size="sm"
              className="w-18"
              aria-label={t("pageSize")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent side="top">
              {pageSizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm font-medium whitespace-nowrap">
          {t("page", { page, pageCount })}
        </span>
        <div className="flex items-center gap-1">
          <PaginationButton
            label={t("first")}
            disabled={page <= 1}
            className="hidden sm:inline-flex"
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft />
          </PaginationButton>
          <PaginationButton
            label={t("previous")}
            disabled={page <= 1}
            onClick={() => onPageChange(Math.min(page - 1, pageCount))}
          >
            <ChevronLeft />
          </PaginationButton>
          <PaginationButton
            label={t("next")}
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight />
          </PaginationButton>
          <PaginationButton
            label={t("last")}
            disabled={page >= pageCount}
            className="hidden sm:inline-flex"
            onClick={() => onPageChange(pageCount)}
          >
            <ChevronsRight />
          </PaginationButton>
        </div>
      </div>
    </div>
  );
};

const PaginationButton = ({
  label,
  disabled,
  className,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  className?: string;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Button
    size="icon-sm"
    variant="outline"
    title={label}
    aria-label={label}
    disabled={disabled}
    className={className}
    onClick={onClick}
  >
    {children}
  </Button>
);
