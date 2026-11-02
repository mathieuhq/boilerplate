import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { VenetianMask } from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialogTemplate } from "@/components/features/dashboard/confirm-dialog-template";
import { Button } from "@/components/ui/button";
import { IMPERSONATION_SESSION_DURATION_SECONDS } from "@/features/admin/domain/impersonation";
import { ADMIN_ROLE } from "@/features/admin/domain/roles";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { impersonateUserAction } from "@/server-functions/impersonation.functions";
import { type AccessGrants, hasAccess } from "@/shared/domain/access-control";

type AdminImpersonateUserButtonProps = {
  access: AccessGrants;
  user: {
    id: string;
    email: string;
    role: string;
    banned: boolean;
  };
};

export const AdminImpersonateUserButton = ({
  access,
  user,
}: AdminImpersonateUserButtonProps) => {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  const mutation = useMutation({
    mutationFn: async () =>
      unwrapActionData(await impersonateUserAction({ userId: user.id })),
    onSuccess: () => window.location.assign("/"),
    onError: (error: Error) =>
      toast.error(error.message || t("users.actions.impersonateError")),
  });

  if (!hasAccess(access, "impersonation", "write")) return null;

  if (user.banned || user.role === ADMIN_ROLE) return null;

  return (
    <>
      <Button
        size="icon-sm"
        variant="ghost"
        title={t("users.actions.impersonate")}
        aria-label={t("users.actions.impersonate")}
        onClick={() => setOpen(true)}
      >
        <VenetianMask className="size-4" />
      </Button>
      <ConfirmDialogTemplate
        open={open}
        title={t("users.actions.impersonateTitle")}
        description={t("users.actions.impersonateDescription", {
          user: user.email,
          minutes: IMPERSONATION_SESSION_DURATION_SECONDS / 60,
        })}
        confirmLabel={t("users.actions.impersonateConfirm")}
        cancelLabel={tCommon("cancel")}
        pending={mutation.isPending || mutation.isSuccess}
        onConfirm={() => mutation.mutate()}
        onOpenChange={setOpen}
      />
    </>
  );
};
