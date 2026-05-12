import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Ban, RotateCcw, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

import { AdminPagination } from "@/components/features/dashboard/admin/admin-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminUserListDTO,
  AdminUserListItemDTO,
} from "@/features/admin/application/dto/admin-user-list-item.dto";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { cn, formatDate } from "@/lib/utils";
import {
  banAdminUserAction,
  setAdminUserRoleAction,
  unbanAdminUserAction,
} from "@/server-functions/admin.functions";

type AdminUsersTableProps = {
  users: AdminUserListDTO;
  filters: AdminUserFilters;
};

export type AdminUserFilters = {
  page: number;
  limit: number;
  search?: string;
  banned?: boolean;
  role?: "user" | "admin";
  emailVerified?: boolean;
};

type UserActionTarget =
  | {
      type: "role";
      user: AdminUserListItemDTO;
    }
  | {
      type: "ban";
      user: AdminUserListItemDTO;
    }
  | {
      type: "unban";
      user: AdminUserListItemDTO;
    };

export const AdminUsersTable = ({ users, filters }: AdminUsersTableProps) => {
  const [target, setTarget] = useState<UserActionTarget | null>(null);

  return (
    <div className="space-y-4">
      <AdminUsersFilters filters={filters} />
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <AdminUsersTableHeader />
          <TableBody>
            {users.items.length > 0 ? (
              users.items.map((user) => (
                <AdminUsersTableRow
                  user={user}
                  key={user.id}
                  onAction={setTarget}
                />
              ))
            ) : (
              <AdminUsersEmptyRow />
            )}
          </TableBody>
        </Table>
      </div>
      <AdminPagination
        search={filters}
        page={users.page}
        basePath="/admin/users"
        pageCount={users.pageCount}
      />
      <AdminUserActionDialog target={target} onOpenChange={setTarget} />
    </div>
  );
};

const AdminUsersFilters = ({ filters }: { filters: AdminUserFilters }) => {
  const router = useRouter();
  const t = useTranslations("admin");

  const [search, setSearch] = useState(filters.search ?? "");
  const [role, setRole] = useState<"all" | "admin" | "user">(
    filters.role ?? "all",
  );
  const [banned, setBanned] = useState(toSelectBoolean(filters.banned));
  const [emailVerified, setEmailVerified] = useState(
    toSelectBoolean(filters.emailVerified),
  );

  return (
    <form
      className="flex flex-col gap-2 lg:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        router.push(
          buildUsersHref({
            page: 1,
            search,
            limit: filters.limit,
            banned: fromSelectBoolean(banned),
            role: role === "all" ? undefined : role,
            emailVerified: fromSelectBoolean(emailVerified),
          }),
        );
      }}
    >
      <Input
        value={search}
        className="lg:max-w-xs"
        placeholder={t("users.filters.search")}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Select
        value={role}
        onValueChange={(value) =>
          setRole(value === "admin" || value === "user" ? value : "all")
        }
      >
        <SelectTrigger className="w-full lg:w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("users.filters.allRoles")}</SelectItem>
          <SelectItem value="admin">{t("roles.admin")}</SelectItem>
          <SelectItem value="user">{t("roles.user")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={banned} onValueChange={setBanned}>
        <SelectTrigger className="w-full lg:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("users.filters.allBans")}</SelectItem>
          <SelectItem value="true">{t("users.filters.banned")}</SelectItem>
          <SelectItem value="false">{t("users.filters.notBanned")}</SelectItem>
        </SelectContent>
      </Select>
      <Select value={emailVerified} onValueChange={setEmailVerified}>
        <SelectTrigger className="w-full lg:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t("users.filters.allVerification")}
          </SelectItem>
          <SelectItem value="true">{t("users.filters.verified")}</SelectItem>
          <SelectItem value="false">{t("users.filters.unverified")}</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit">{t("actions.apply")}</Button>
    </form>
  );
};

const AdminUsersTableHeader = () => {
  const t = useTranslations("admin");

  return (
    <TableHeader className="bg-muted/50">
      <TableRow>
        <TableHead className="px-4">{t("users.table.user")}</TableHead>
        <TableHead className="hidden px-4 md:table-cell">
          {t("users.table.role")}
        </TableHead>
        <TableHead className="hidden px-4 lg:table-cell">
          {t("users.table.status")}
        </TableHead>
        <TableHead className="hidden px-4 xl:table-cell">
          {t("users.table.activity")}
        </TableHead>
        <TableHead className="px-4 text-right">
          {t("users.table.actions")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

const AdminUsersTableRow = ({
  user,
  onAction,
}: {
  user: AdminUserListItemDTO;
  onAction: (target: UserActionTarget) => void;
}) => {
  const t = useTranslations("admin");

  return (
    <TableRow>
      <TableCell className="px-4 py-3">
        <div className="min-w-0">
          <p className="truncate font-medium">{user.name}</p>
          <p className="text-muted-foreground truncate text-sm">{user.email}</p>
        </div>
      </TableCell>
      <TableCell className="hidden px-4 py-3 md:table-cell">
        <RoleBadge role={user.role} />
      </TableCell>
      <TableCell className="hidden px-4 py-3 lg:table-cell">
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge active={!user.banned} />
          <VerificationBadge verified={user.emailVerified} />
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground hidden px-4 py-3 text-sm xl:table-cell">
        <div>
          {t("users.table.sessions", { count: user.activeSessionsCount })}
        </div>
        <div>
          {user.lastLoginAt
            ? formatDate(user.lastLoginAt)
            : t("users.table.never")}
        </div>
      </TableCell>
      <TableCell className="px-4 py-3">
        <div className="flex justify-end gap-1">
          <Button
            size="icon-sm"
            variant="ghost"
            title={
              user.role === "admin"
                ? t("users.actions.demote")
                : t("users.actions.promote")
            }
            aria-label={
              user.role === "admin"
                ? t("users.actions.demote")
                : t("users.actions.promote")
            }
            onClick={() => onAction({ type: "role", user })}
          >
            {user.role === "admin" ? (
              <ShieldOff className="size-4" />
            ) : (
              <ShieldCheck className="size-4" />
            )}
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            title={
              user.banned ? t("users.actions.unban") : t("users.actions.ban")
            }
            aria-label={
              user.banned ? t("users.actions.unban") : t("users.actions.ban")
            }
            onClick={() =>
              onAction({ type: user.banned ? "unban" : "ban", user })
            }
          >
            {user.banned ? (
              <RotateCcw className="size-4" />
            ) : (
              <Ban className="size-4" />
            )}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminUsersEmptyRow = () => {
  const t = useTranslations("admin");

  return (
    <TableRow>
      <TableCell
        colSpan={5}
        className="text-muted-foreground h-24 px-4 text-center"
      >
        {t("users.empty")}
      </TableCell>
    </TableRow>
  );
};

const AdminUserActionDialog = ({
  target,
  onOpenChange,
}: {
  target: UserActionTarget | null;
  onOpenChange: (target: UserActionTarget | null) => void;
}) => {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [reason, setReason] = useState("");

  const copy = useMemo(() => getActionDialogCopy(target, t), [target, t]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!target) return null;

      if (target.type === "role") {
        const result = await setAdminUserRoleAction({
          userId: target.user.id,
          role: target.user.role === "admin" ? "user" : "admin",
        });

        return unwrapActionData(result);
      }

      if (target.type === "ban") {
        const result = await banAdminUserAction({
          userId: target.user.id,
          reason: reason.trim() || undefined,
        });

        return unwrapActionData(result);
      }

      const result = await unbanAdminUserAction({
        userId: target.user.id,
      });

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(copy.success);
      setReason("");
      onOpenChange(null);
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || copy.error),
  });

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) {
          setReason("");
          onOpenChange(null);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        {target?.type === "ban" && (
          <Input
            value={reason}
            placeholder={t("users.actions.banReasonPlaceholder")}
            onChange={(event) => setReason(event.target.value)}
          />
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={mutation.isPending}
            onClick={() => onOpenChange(null)}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant={target?.type === "ban" ? "destructive" : "default"}
            disabled={!target || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RoleBadge = ({ role }: { role: AdminUserListItemDTO["role"] }) => {
  const t = useTranslations("admin");

  return (
    <Badge variant={role === "admin" ? "secondary" : "outline"}>
      {t(`roles.${role}`)}
    </Badge>
  );
};

const StatusBadge = ({ active }: { active: boolean }) => {
  const t = useTranslations("admin");

  return (
    <Badge
      variant="outline"
      className={cn(
        active && "border-emerald-200 bg-emerald-50 text-emerald-700",
        !active && "border-red-200 bg-red-50 text-red-700",
      )}
    >
      {active ? t("users.status.active") : t("users.status.banned")}
    </Badge>
  );
};

const VerificationBadge = ({ verified }: { verified: boolean }) => {
  const t = useTranslations("admin");

  return (
    <Badge variant="outline">
      {verified ? t("users.status.verified") : t("users.status.unverified")}
    </Badge>
  );
};

function toSelectBoolean(value?: boolean) {
  if (value === undefined) return "all";

  return value ? "true" : "false";
}

function fromSelectBoolean(value: string) {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function buildUsersHref(filters: AdminUserFilters) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(filters) as [string, unknown][]) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }

  return `/admin/users?${params.toString()}`;
}

function getActionDialogCopy(
  target: UserActionTarget | null,
  t: ReturnType<typeof useTranslations>,
) {
  if (target?.type === "role") {
    const actionKey = target.user.role === "admin" ? "demote" : "promote";

    return {
      title: t(`users.actions.${actionKey}Title`),
      description: t(`users.actions.${actionKey}Description`, {
        user: target.user.email,
      }),
      confirm: t(`users.actions.${actionKey}`),
      success: t(`users.actions.${actionKey}Success`),
      error: t(`users.actions.${actionKey}Error`),
    };
  }

  if (target?.type === "unban") {
    return {
      title: t("users.actions.unbanTitle"),
      description: t("users.actions.unbanDescription", {
        user: target.user.email,
      }),
      confirm: t("users.actions.unban"),
      success: t("users.actions.unbanSuccess"),
      error: t("users.actions.unbanError"),
    };
  }

  return {
    title: t("users.actions.banTitle"),
    description: t("users.actions.banDescription", {
      user: target?.user.email ?? "",
    }),
    confirm: t("users.actions.ban"),
    success: t("users.actions.banSuccess"),
    error: t("users.actions.banError"),
  };
}
