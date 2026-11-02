import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { DataExportStatusDTO } from "@/features/user/application/dto/data-export.dto";
import { getDataExportDownloadPath } from "@/features/user/domain/data-export.policy";
import { useTranslations } from "@/i18n";
import { useRouter } from "@/lib/navigation";
import { requestDataExportAction } from "@/server-functions/user.functions";
import { isActionError } from "@/shared/infrastructure/http/api-response";

import { LoadingButton } from "../../form/form-button";

const DATE_FORMAT = "PPp";

function getNextAvailableAt(details: unknown) {
  if (
    details &&
    typeof details === "object" &&
    "nextAvailableAt" in details &&
    typeof details.nextAvailableAt === "string"
  )
    return details.nextAvailableAt;

  return undefined;
}

export const DataExportForm = ({ status }: { status: DataExportStatusDTO }) => {
  const t = useTranslations("settings.profile.dataExport");

  const router = useRouter();

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const result = await requestDataExportAction();

      if (!isActionError(result)) return result.data;

      const nextAvailableAt = getNextAvailableAt(result.error.details);

      if (result.error.code === "DATA_EXPORT_RATE_LIMITED" && nextAvailableAt)
        throw new Error(
          t("rateLimited", {
            date: format(new Date(nextAvailableAt), DATE_FORMAT),
          }),
        );

      throw new Error(result.error.message || t("requestError"));
    },
    onSuccess: () => {
      toast.success(t("requested"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || t("requestError")),
  });

  const { latest, nextAvailableAt } = status;

  return (
    <div className="space-y-4">
      {latest?.status === "pending" && (
        <p className="text-sm text-muted-foreground">{t("pending")}</p>
      )}
      {latest?.status === "failed" && (
        <p className="text-sm text-destructive">{t("failed")}</p>
      )}
      {latest?.status === "ready" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border px-4 py-3">
          <p className="text-sm">
            {t("ready", {
              date: format(new Date(latest.expiresAt), DATE_FORMAT),
            })}
          </p>
          <Button asChild variant="outline" size="sm">
            <a href={getDataExportDownloadPath(latest.id)}>{t("download")}</a>
          </Button>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <LoadingButton
          loading={isPending}
          disabled={isPending || Boolean(nextAvailableAt)}
          onClick={() => mutate()}
        >
          {t("request")}
        </LoadingButton>
        {nextAvailableAt && (
          <p className="text-sm text-muted-foreground">
            {t("nextAvailable", {
              date: format(new Date(nextAvailableAt), DATE_FORMAT),
            })}
          </p>
        )}
      </div>
    </div>
  );
};
