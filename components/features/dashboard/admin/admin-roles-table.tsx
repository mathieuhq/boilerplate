import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { getAdminRoleLabel } from "@/components/features/dashboard/admin/admin-role-label";
import { AdminRoleForm } from "@/components/features/dashboard/form/admin-role-form";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminRoleDTO } from "@/features/admin/application/dto/admin-role.dto";
import { isEditableRoleKey } from "@/features/admin/domain/roles";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { deleteAdminRoleAction } from "@/server-functions/admin.functions";
import {
  ACCESS_FEATURE_KEYS,
  type AccessGrants,
  coversAccess,
  getFullAccess,
  hasAccess,
  hasAnyAccess,
} from "@/shared/domain/access-control";

type AdminRolesTableProps = {
  roles: AdminRoleDTO[];
  access: AccessGrants;
};

type RoleFormTarget = { role?: AdminRoleDTO };

export const AdminRolesTable = ({ roles, access }: AdminRolesTableProps) => {
  const t = useTranslations("admin");
  const router = useRouter();

  const [formTarget, setFormTarget] = useState<RoleFormTarget | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<AdminRoleDTO | null>(null);

  const canManage = hasAccess(access, "roles", "write");

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={() => setFormTarget({})}>
            <Plus className="size-4" />
            {t("roles.create")}
          </Button>
        </div>
      )}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="px-4">{t("roles.table.role")}</TableHead>
              <TableHead className="hidden px-4 md:table-cell">
                {t("roles.table.access")}
              </TableHead>
              <TableHead className="hidden px-4 sm:table-cell">
                {t("roles.table.users")}
              </TableHead>
              <TableHead className="px-4 text-right">
                {t("roles.table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles.map((role) => (
              <AdminRolesTableRow
                key={role.key}
                role={role}
                editable={
                  canManage &&
                  isEditableRoleKey(role.key) &&
                  coversAccess(access, role.access)
                }
                onEdit={() => setFormTarget({ role })}
                onDelete={() => setRoleToDelete(role)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={Boolean(formTarget)}
        onOpenChange={(open) => {
          if (!open) setFormTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          {formTarget && (
            <AdminRoleForm
              key={formTarget.role?.key ?? "new"}
              role={formTarget.role}
              actorAccess={access}
              onCancelAction={() => setFormTarget(null)}
              onSuccessAction={() => {
                setFormTarget(null);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <DeleteAdminRoleDialog
        role={roleToDelete}
        onOpenChange={setRoleToDelete}
      />
    </div>
  );
};

const AdminRolesTableRow = ({
  role,
  editable,
  onEdit,
  onDelete,
}: {
  role: AdminRoleDTO;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const t = useTranslations("admin");

  const inUse = role.usersCount > 0;

  return (
    <TableRow>
      <TableCell className="px-4 py-3 whitespace-normal">
        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{getAdminRoleLabel(role, t)}</p>
            {role.system && (
              <Badge variant="outline">{t("roles.table.system")}</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {role.system
              ? t(`systemRoleDescriptions.${role.key}`)
              : role.description}
          </p>
        </div>
      </TableCell>
      <TableCell className="hidden px-4 py-3 whitespace-normal md:table-cell">
        <AdminRoleAccess access={role.access} />
      </TableCell>
      <TableCell className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
        {t("roles.table.usersCount", { count: role.usersCount })}
      </TableCell>
      <TableCell className="px-4 py-3">
        {editable && (
          <div className="flex justify-end gap-1">
            <Button
              size="icon-sm"
              variant="ghost"
              title={t("roles.actions.edit")}
              aria-label={t("roles.actions.edit")}
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </Button>
            {!role.system && (
              <Button
                size="icon-sm"
                variant="ghost"
                disabled={inUse}
                title={
                  inUse
                    ? t("roles.actions.deleteInUse")
                    : t("roles.actions.delete")
                }
                aria-label={t("roles.actions.delete")}
                onClick={onDelete}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        )}
      </TableCell>
    </TableRow>
  );
};

const AdminRoleAccess = ({ access }: { access: AccessGrants }) => {
  const t = useTranslations("admin");

  if (!hasAnyAccess(access))
    return (
      <span className="text-sm text-muted-foreground">
        {t("roles.table.noAccess")}
      </span>
    );

  if (coversAccess(access, getFullAccess()))
    return <Badge variant="secondary">{t("roles.table.fullAccess")}</Badge>;

  return (
    <div className="flex flex-wrap gap-1.5">
      {ACCESS_FEATURE_KEYS.flatMap((feature) => {
        const level = access[feature];

        return level
          ? [
              <Badge key={feature} variant="outline">
                {t(`access.features.${feature}.label`)} ·{" "}
                {t(`access.levels.${level}`)}
              </Badge>,
            ]
          : [];
      })}
    </div>
  );
};

const DeleteAdminRoleDialog = ({
  role,
  onOpenChange,
}: {
  role: AdminRoleDTO | null;
  onOpenChange: (role: AdminRoleDTO | null) => void;
}) => {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async (key: string) =>
      unwrapActionData(await deleteAdminRoleAction({ key })),
    onSuccess: () => {
      toast.success(t("roles.actions.deleteSuccess"));
      onOpenChange(null);
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("roles.actions.deleteError")),
  });

  return (
    <Dialog
      open={Boolean(role)}
      onOpenChange={(open) => {
        if (!open) onOpenChange(null);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("roles.actions.deleteTitle")}</DialogTitle>
          <DialogDescription>
            {t("roles.actions.deleteDescription", { role: role?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>
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
            variant="destructive"
            disabled={!role || mutation.isPending}
            onClick={() => {
              if (role) mutation.mutate(role.key);
            }}
          >
            {t("roles.actions.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
