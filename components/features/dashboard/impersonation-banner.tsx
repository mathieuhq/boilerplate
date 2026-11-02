import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { stopImpersonationAction } from "@/server-functions/impersonation.functions";

import { LoadingButton } from "../form/form-button";

type ImpersonationBannerProps = {
  name: string;
  email: string;
  expiresAt: string;
};

export const ImpersonationBanner = ({
  name,
  email,
  expiresAt,
}: ImpersonationBannerProps) => {
  const t = useTranslations("impersonation");

  const mutation = useMutation({
    mutationFn: async () => unwrapActionData(await stopImpersonationAction()),
    onSuccess: () => window.location.assign("/admin/users"),
    onError: (error: Error) => toast.error(error.message || t("stopError")),
  });

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 border-b border-amber-300 bg-amber-100 px-4 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
    >
      <p>
        <span className="font-medium">{t("banner", { name, email })}</span>{" "}
        {t("expires", { time: format(new Date(expiresAt), "p") })}
      </p>
      <LoadingButton
        size="sm"
        variant="outline"
        className="h-7 border-amber-400 bg-transparent hover:bg-amber-200 dark:border-amber-700 dark:hover:bg-amber-900"
        loading={mutation.isPending || mutation.isSuccess}
        onClick={() => mutation.mutate()}
      >
        {t("stop")}
      </LoadingButton>
    </div>
  );
};
