import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { ConfirmDialogTemplate } from "@/components/features/dashboard/confirm-dialog-template";
import { IMPERSONATION_SESSION_DURATION_SECONDS } from "@/features/admin/domain/impersonation";
import { ADMIN_ROLE } from "@/features/admin/domain/roles";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { impersonateUserAction } from "@/server-functions/impersonation.functions";
import { type AccessGrants, hasAccess } from "@/shared/domain/access-control";

type ImpersonationUser = {
  id: string;
  email: string;
  role: string;
  banned: boolean;
};

export function canImpersonateUser(
  access: AccessGrants,
  user: ImpersonationUser,
) {
  return (
    hasAccess(access, "impersonation", "write") &&
    !user.banned &&
    user.role !== ADMIN_ROLE
  );
}

export const AdminImpersonateUserDialog = ({
  user,
  onOpenChange,
}: {
  user: ImpersonationUser | null;
  onOpenChange: (user: ImpersonationUser | null) => void;
}) => {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const mutation = useMutation({
    mutationFn: async (userId: string) =>
      unwrapActionData(await impersonateUserAction({ userId })),
    onSuccess: () => window.location.assign("/"),
    onError: (error: Error) =>
      toast.error(error.message || t("users.actions.impersonateError")),
  });

  return (
    <ConfirmDialogTemplate
      open={user !== null}
      title={t("users.actions.impersonateTitle")}
      description={t("users.actions.impersonateDescription", {
        user: user?.email ?? "",
        minutes: IMPERSONATION_SESSION_DURATION_SECONDS / 60,
      })}
      confirmLabel={t("users.actions.impersonateConfirm")}
      cancelLabel={tCommon("cancel")}
      pending={mutation.isPending || mutation.isSuccess}
      onConfirm={() => {
        if (user) mutation.mutate(user.id);
      }}
      onOpenChange={(open) => {
        if (!open) onOpenChange(null);
      }}
    />
  );
};
