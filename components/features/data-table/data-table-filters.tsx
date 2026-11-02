import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Check, PlusCircle } from "lucide-react";
import type { DateRange as CalendarRange } from "react-day-picker";
import { fr } from "react-day-picker/locale";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useDebounce } from "@/hooks/use-debounce";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocale, useTranslations } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  formatDateRange,
  isoDayToLocalDate,
  parseDateRange,
  toIsoDay,
} from "@/shared/domain/list-query";

import type {
  DataTableFilter,
  DataTableFilterOption,
  DataTableFilterValue,
} from "./data-table.types";

const ALL_VALUE = "__all__";

const COMMAND_SEARCH_THRESHOLD = 7;

const MAX_VISIBLE_BADGES = 2;

type FilterControlProps<TFilter extends DataTableFilter> = {
  filter: TFilter;
  value: unknown;
  onChange: (value: unknown) => void;
};

export const DataTableFilterControl = ({
  filter,
  value,
  onChange,
}: FilterControlProps<DataTableFilter>) => {
  if (filter.type === "select")
    return <SelectFilter filter={filter} value={value} onChange={onChange} />;

  if (filter.type === "multiSelect")
    return (
      <MultiSelectFilter filter={filter} value={value} onChange={onChange} />
    );

  if (filter.type === "text")
    return <TextFilter filter={filter} value={value} onChange={onChange} />;

  return <DateRangeFilter filter={filter} value={value} onChange={onChange} />;
};

export const DataTableSearchInput = ({
  value,
  placeholder,
  onChange,
  className,
}: {
  value?: string;
  placeholder: string;
  onChange: (value: string | undefined) => void;
  className?: string;
}) => {
  const [draft, setDraft] = useState(value ?? "");
  const [syncedValue, setSyncedValue] = useState(value);
  const debouncedChange = useDebounce((next: string) =>
    onChange(next.trim() || undefined),
  );

  if (value !== syncedValue) {
    setSyncedValue(value);

    if (draft.trim() !== (value ?? "")) setDraft(value ?? "");
  }

  return (
    <Input
      type="search"
      value={draft}
      aria-label={placeholder}
      placeholder={placeholder}
      className={cn("h-8", className)}
      onChange={(event) => {
        setDraft(event.target.value);
        debouncedChange(event.target.value);
      }}
    />
  );
};

const TextFilter = ({
  filter,
  value,
  onChange,
}: FilterControlProps<Extract<DataTableFilter, { type: "text" }>>) => (
  <DataTableSearchInput
    className="w-full sm:w-44"
    value={typeof value === "string" ? value : undefined}
    placeholder={filter.placeholder ?? filter.label}
    onChange={onChange}
  />
);

const SelectFilter = ({
  filter,
  value,
  onChange,
}: FilterControlProps<Extract<DataTableFilter, { type: "select" }>>) => {
  const t = useTranslations("dataTable");
  const selected = filter.options.find((option) => option.value === value);

  return (
    <Select
      value={selected ? String(selected.value) : ALL_VALUE}
      onValueChange={(next) =>
        onChange(
          next === ALL_VALUE
            ? undefined
            : filter.options.find((option) => String(option.value) === next)
                ?.value,
        )
      }
    >
      <SelectTrigger
        size="sm"
        aria-label={filter.label}
        className={cn(
          "w-full border-dashed sm:w-auto",
          selected && "border-solid",
        )}
      >
        <SelectValue>
          {selected ? `${filter.label}: ${selected.label}` : filter.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{t("filters.all")}</SelectItem>
        {filter.options.map((option) => (
          <SelectItem key={String(option.value)} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const MultiSelectFilter = ({
  filter,
  value,
  onChange,
}: FilterControlProps<Extract<DataTableFilter, { type: "multiSelect" }>>) => {
  const t = useTranslations("dataTable");
  const selectedValues = toValueList(value);
  const selectedOptions = filter.options.filter((option) =>
    selectedValues.includes(option.value),
  );

  const toggle = (option: DataTableFilterOption) => {
    const next = selectedValues.includes(option.value)
      ? selectedValues.filter((item) => item !== option.value)
      : [...selectedValues, option.value];

    onChange(next.length > 0 ? next : undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "w-full min-w-0 justify-start overflow-hidden border-dashed sm:w-auto",
            selectedOptions.length > 0 && "border-solid",
          )}
        >
          <PlusCircle />
          {filter.label}
          {selectedOptions.length > 0 && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              {selectedOptions.length > MAX_VISIBLE_BADGES ? (
                <Badge variant="secondary" className="rounded-sm px-1">
                  {t("filters.selectedCount", {
                    count: selectedOptions.length,
                  })}
                </Badge>
              ) : (
                selectedOptions.map((option) => (
                  <Badge
                    variant="secondary"
                    key={String(option.value)}
                    className="rounded-sm px-1"
                  >
                    {option.label}
                  </Badge>
                ))
              )}
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-0" align="start">
        <Command>
          {filter.options.length > COMMAND_SEARCH_THRESHOLD && (
            <CommandInput placeholder={filter.label} />
          )}
          <CommandList>
            <CommandEmpty>{t("filters.noOptions")}</CommandEmpty>
            <CommandGroup>
              {filter.options.map((option) => {
                const isSelected = selectedValues.includes(option.value);

                return (
                  <CommandItem
                    key={String(option.value)}
                    value={`${option.label} ${String(option.value)}`}
                    onSelect={() => toggle(option)}
                  >
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded-[4px] border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input [&_svg]:invisible",
                      )}
                    >
                      <Check className="size-3.5 text-current" />
                    </span>
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
            {selectedOptions.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    className="justify-center"
                    onSelect={() => onChange(undefined)}
                  >
                    {t("filters.clear")}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const DateRangeFilter = ({
  filter,
  value,
  onChange,
}: FilterControlProps<Extract<DataTableFilter, { type: "dateRange" }>>) => {
  const t = useTranslations("dataTable");
  const locale = useLocale();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const range = toCalendarRange(typeof value === "string" ? value : undefined);
  const [draft, setDraft] = useState<CalendarRange | undefined>(range);

  const label = range?.from || range?.to ? formatRangeLabel(range) : null;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDraft(range);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className={cn(
            "w-full min-w-0 justify-start border-dashed sm:w-auto",
            label && "border-solid",
          )}
        >
          <CalendarIcon />
          {filter.label}
          {label && (
            <>
              <Separator orientation="vertical" className="mx-1 h-4" />
              <span className="truncate font-normal">{label}</span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto bg-popover! p-0 backdrop-filter-none! data-[state=open]:blur-in-0!"
        align="start"
      >
        <Calendar
          mode="range"
          selected={draft}
          onSelect={setDraft}
          defaultMonth={draft?.from}
          numberOfMonths={isMobile ? 1 : 2}
          locale={locale === "fr" ? fr : undefined}
        />
        <div className="flex justify-end gap-2 border-t p-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              onChange(undefined);
              setOpen(false);
            }}
          >
            {t("filters.clear")}
          </Button>
          <Button
            size="sm"
            disabled={!draft?.from}
            onClick={() => {
              onChange(
                formatDateRange({
                  from: draft?.from ? toIsoDay(draft.from) : undefined,
                  to: draft?.to ? toIsoDay(draft.to) : undefined,
                }),
              );
              setOpen(false);
            }}
          >
            {t("filters.apply")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function hasFilterValue(value: unknown) {
  if (value === undefined || value === null || value === "") return false;

  return !Array.isArray(value) || value.length > 0;
}

function toValueList(value: unknown): DataTableFilterValue[] {
  if (Array.isArray(value)) return value as DataTableFilterValue[];
  if (typeof value === "string" || typeof value === "boolean") return [value];

  return [];
}

function toCalendarRange(value: string | undefined): CalendarRange | undefined {
  const range = parseDateRange(value);

  if (!range) return undefined;

  return {
    from: range.from ? isoDayToLocalDate(range.from) : undefined,
    to: range.to ? isoDayToLocalDate(range.to) : undefined,
  };
}

function formatRangeLabel(range: CalendarRange) {
  const from = range.from ? format(range.from, "dd/MM/yy") : "…";
  const to = range.to ? format(range.to, "dd/MM/yy") : "…";

  return from === to ? from : `${from} – ${to}`;
}
