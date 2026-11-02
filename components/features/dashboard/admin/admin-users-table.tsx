import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Ban, RotateCcw, UserCog } from "lucide-react";
import { toast } from "sonner";

import { AdminImpersonateUserButton } from "@/components/features/dashboard/admin/admin-impersonate-user-button";
import {
  findAdminRoleLabel,
  getAdminRoleLabel,
} from "@/components/features/dashboard/admin/admin-role-label";
import { DataTable } from "@/components/features/data-table/data-table";
import type {
  DataTableColumn,
  DataTableFilter,
} from "@/components/features/data-table/data-table.types";
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
import type { AdminRoleDTO } from "@/features/admin/application/dto/admin-role.dto";
import type {
  AdminUserListDTO,
  AdminUserListItemDTO,
} from "@/features/admin/application/dto/admin-user-list-item.dto";
import type { AdminListUsersInput } from "@/features/admin/domain/repositories/admin.repository.interface";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { cn, formatDate } from "@/lib/utils";
import {
  banAdminUserAction,
  setAdminUserRoleAction,
  unbanAdminUserAction,
} from "@/server-functions/admin.functions";
import { type AccessGrants, hasAccess } from "@/shared/domain/access-control";

type AdminUsersTableProps = {
  query: AdminListUsersInput;
  users: AdminUserListDTO | null;
  roles: AdminRoleDTO[];
  access: AccessGrants;
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

type BulkActionTarget = {
  type: "ban" | "unban";
  users: AdminUserListItemDTO[];
  onDone: () => void;
};

export const AdminUsersTable = ({
  query,
  users,
  roles,
  access,
}: AdminUsersTableProps) => {
  const t = useTranslations("admin");
  const [target, setTarget] = useState<UserActionTarget | null>(null);
  const [bulkTarget, setBulkTarget] = useState<BulkActionTarget | null>(null);
  const canWrite = hasAccess(access, "users", "write");
  const canImpersonate = hasAccess(access, "impersonation", "write");

  const columns = useMemo<DataTableColumn<AdminUserListItemDTO>[]>(
    () => [
      {
        id: "name",
        header: t("users.table.user"),
        sortable: true,
        hideable: false,
        cell: (user) => (
          <div className="max-w-72 min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-sm text-muted-foreground">
              {user.email}
            </p>
          </div>
        ),
      },
      {
        id: "role",
        header: t("users.table.role"),
        sortable: true,
        cell: (user) => (
          <Badge variant={user.role === "user" ? "outline" : "secondary"}>
            {findAdminRoleLabel(roles, user.role, t)}
          </Badge>
        ),
      },
      {
        id: "status",
        header: t("users.table.status"),
        cell: (user) => (
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge active={!user.banned} />
            <VerificationBadge verified={user.emailVerified} />
          </div>
        ),
      },
      {
        id: "lastLoginAt",
        header: t("users.table.activity"),
        sortable: true,
        cellClassName: "text-sm text-muted-foreground",
        cell: (user) => (
          <>
            <div>
              {t("users.table.sessions", { count: user.activeSessionsCount })}
            </div>
            <div>
              {user.lastLoginAt
                ? formatDate(user.lastLoginAt)
                : t("users.table.never")}
            </div>
          </>
        ),
      },
      {
        id: "createdAt",
        header: t("users.table.created"),
        sortable: true,
        defaultHidden: true,
        cellClassName: "text-sm text-muted-foreground",
        cell: (user) => formatDate(user.createdAt),
      },
      ...(canWrite || canImpersonate
        ? [
            {
              id: "actions",
              header: t("users.table.actions"),
              hideable: false,
              align: "right" as const,
              cell: (user: AdminUserListItemDTO) => (
                <AdminUserRowActions
                  access={access}
                  canWrite={canWrite}
                  user={user}
                  onAction={setTarget}
                />
              ),
            },
          ]
        : []),
    ],
    [access, canImpersonate, canWrite, roles, t],
  );

  const filters = useMemo<DataTableFilter[]>(
    () => [
      {
        type: "multiSelect",
        key: "role",
        label: t("users.filters.role"),
        options: roles.map((role) => ({
          value: role.key,
          label: getAdminRoleLabel(role, t),
        })),
      },
      {
        type: "select",
        key: "banned",
        label: t("users.filters.access"),
        options: [
          { value: false, label: t("users.filters.notBanned") },
          { value: true, label: t("users.filters.banned") },
        ],
      },
      {
        type: "select",
        key: "emailVerified",
        label: t("users.filters.verification"),
        options: [
          { value: true, label: t("users.filters.verified") },
          { value: false, label: t("users.filters.unverified") },
        ],
      },
      {
        type: "dateRange",
        key: "createdAt",
        label: t("users.filters.createdAt"),
      },
    ],
    [roles, t],
  );

  return (
    <>
      <DataTable
        id="admin-users"
        query={query}
        result={users}
        columns={columns}
        filters={filters}
        defaultSort="createdAt.desc"
        getRowId={(user) => user.id}
        emptyMessage={t("users.empty")}
        exportHref="/api/admin/users/export"
        searchPlaceholder={t("users.filters.search")}
        bulkActions={
          canWrite
            ? ({ rows, clearSelection }) => (
                <AdminUsersBulkActions
                  users={rows}
                  onAction={(type, targets) =>
                    setBulkTarget({
                      type,
                      users: targets,
                      onDone: clearSelection,
                    })
                  }
                />
              )
            : undefined
        }
      />
      <AdminUserActionDialog
        roles={roles}
        target={target}
        onOpenChange={setTarget}
      />
      <AdminUsersBulkDialog target={bulkTarget} onOpenChange={setBulkTarget} />
    </>
  );
};

const AdminUserRowActions = ({
  access,
  canWrite,
  user,
  onAction,
}: {
  access: AccessGrants;
  canWrite: boolean;
  user: AdminUserListItemDTO;
  onAction: (target: UserActionTarget) => void;
}) => {
  const t = useTranslations("admin");

  return (
    <div className="flex justify-end gap-1">
      <AdminImpersonateUserButton access={access} user={user} />
      {canWrite && (
        <>
          <Button
            size="icon-sm"
            variant="ghost"
            title={t("users.actions.changeRole")}
            aria-label={t("users.actions.changeRole")}
            onClick={() => onAction({ type: "role", user })}
          >
            <UserCog className="size-4" />
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
        </>
      )}
    </div>
  );
};

const AdminUsersBulkActions = ({
  users,
  onAction,
}: {
  users: AdminUserListItemDTO[];
  onAction: (type: "ban" | "unban", users: AdminUserListItemDTO[]) => void;
}) => {
  const t = useTranslations("admin");
  const bannable = users.filter((user) => !user.banned);
  const unbannable = users.filter((user) => user.banned);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={unbannable.length === 0}
        onClick={() => onAction("unban", unbannable)}
      >
        <RotateCcw />
        {t("users.bulk.unban", { count: unbannable.length })}
      </Button>
      <Button
        size="sm"
        variant="destructive"
        disabled={bannable.length === 0}
        onClick={() => onAction("ban", bannable)}
      >
        <Ban />
        {t("users.bulk.ban", { count: bannable.length })}
      </Button>
    </>
  );
};

const AdminUsersBulkDialog = ({
  target,
  onOpenChange,
}: {
  target: BulkActionTarget | null;
  onOpenChange: (target: BulkActionTarget | null) => void;
}) => {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [reason, setReason] = useState("");
  const count = target?.users.length ?? 0;
  const isBan = target?.type === "ban";

  const close = () => {
    setReason("");
    onOpenChange(null);
  };

  const mutation = useMutation({
    mutationFn: async () => {
      if (!target) return { succeeded: 0, failed: 0 };

      const results = await Promise.allSettled(
        target.users.map(async (user) =>
          unwrapActionData(
            target.type === "ban"
              ? await banAdminUserAction({
                  userId: user.id,
                  reason: reason.trim() || undefined,
                })
              : await unbanAdminUserAction({ userId: user.id }),
          ),
        ),
      );
      const failed = results.filter(
        (result) => result.status === "rejected",
      ).length;

      return { succeeded: results.length - failed, failed };
    },
    onSuccess: ({ succeeded, failed }) => {
      if (succeeded > 0)
        toast.success(
          t(isBan ? "users.bulk.banSuccess" : "users.bulk.unbanSuccess", {
            count: succeeded,
          }),
        );

      if (failed > 0)
        toast.error(t("users.bulk.partialError", { count: failed }));

      target?.onDone();
      close();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t(isBan ? "users.bulk.banTitle" : "users.bulk.unbanTitle", {
              count,
            })}
          </DialogTitle>
          <DialogDescription>
            {t(
              isBan
                ? "users.bulk.banDescription"
                : "users.bulk.unbanDescription",
              { count },
            )}
          </DialogDescription>
        </DialogHeader>
        {isBan && (
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
            onClick={close}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant={isBan ? "destructive" : "default"}
            disabled={!target || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {t(isBan ? "users.bulk.ban" : "users.bulk.unban", { count })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminUserActionDialog = ({
  roles,
  target,
  onOpenChange,
}: {
  roles: AdminRoleDTO[];
  target: UserActionTarget | null;
  onOpenChange: (target: UserActionTarget | null) => void;
}) => {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const nextRole = selectedRole ?? target?.user.role ?? "user";

  const resetDialog = () => {
    setReason("");
    setSelectedRole(null);
    onOpenChange(null);
  };

  const copy = useMemo(() => getActionDialogCopy(target, t), [target, t]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!target) return null;

      if (target.type === "role") {
        const result = await setAdminUserRoleAction({
          userId: target.user.id,
          role: nextRole,
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
      resetDialog();
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || copy.error),
  });

  return (
    <Dialog
      open={Boolean(target)}
      onOpenChange={(open) => {
        if (!open) resetDialog();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        {target?.type === "role" && (
          <Select value={nextRole} onValueChange={setSelectedRole}>
            <SelectTrigger
              className="w-full"
              aria-label={t("users.actions.roleLabel")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.key} value={role.key}>
                  {getAdminRoleLabel(role, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
            onClick={resetDialog}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant={target?.type === "ban" ? "destructive" : "default"}
            disabled={
              !target ||
              mutation.isPending ||
              (target.type === "role" && nextRole === target.user.role)
            }
            onClick={() => mutation.mutate()}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

function getActionDialogCopy(
  target: UserActionTarget | null,
  t: ReturnType<typeof useTranslations>,
) {
  if (target?.type === "role") {
    return {
      title: t("users.actions.changeRoleTitle"),
      description: t("users.actions.changeRoleDescription", {
        user: target.user.email,
      }),
      confirm: t("users.actions.changeRole"),
      success: t("users.actions.changeRoleSuccess"),
      error: t("users.actions.changeRoleError"),
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
