import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { LogOut, Monitor, Smartphone, Tablet } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  UserSessionDTO,
  UserSessionListDTO,
} from "@/features/auth/application/dto/user-session.dto";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import {
  revokeOtherUserSessionsAction,
  revokeUserSessionAction,
} from "@/server-functions/session.functions";

import { ConfirmDialogTemplate } from "../confirm-dialog-template";

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
} as const;

export const SessionsForm = ({ sessions, canManage }: UserSessionListDTO) => {
  const t = useTranslations("settings.security.sessions");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const hasOtherSessions = sessions.some((session) => !session.isCurrent);

  const revokeMutation = useMutation({
    mutationFn: async (sessionId: string) =>
      unwrapActionData(await revokeUserSessionAction({ sessionId })),
    onSuccess: () => {
      toast.success(t("revoked"));
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message || t("revokeError")),
  });

  const revokeOthersMutation = useMutation({
    mutationFn: async () =>
      unwrapActionData(await revokeOtherUserSessionsAction()),
    onSuccess: ({ revokedCount }) => {
      toast.success(t("revokedOthers", { count: revokedCount }));
      setConfirmOpen(false);
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("revokeOthersError")),
  });

  return (
    <div className="space-y-4">
      <ul className="divide-y rounded-md border">
        {sessions.map((session) => (
          <SessionRow
            key={session.id}
            session={session}
            canRevoke={canManage && !session.isCurrent}
            pending={revokeMutation.isPending}
            onRevoke={() => revokeMutation.mutate(session.id)}
          />
        ))}
      </ul>

      {!canManage && (
        <p className="text-sm text-muted-foreground">{t("impersonating")}</p>
      )}

      {canManage && !hasOtherSessions && (
        <p className="text-sm text-muted-foreground">{t("noOtherSessions")}</p>
      )}

      {canManage && hasOtherSessions && (
        <Button variant="outline" onClick={() => setConfirmOpen(true)}>
          {t("revokeOthers")}
        </Button>
      )}

      <ConfirmDialogTemplate
        destructive
        open={confirmOpen}
        title={t("revokeOthersTitle")}
        description={t("revokeOthersDescription")}
        confirmLabel={t("revokeOthersConfirm")}
        cancelLabel={tCommon("cancel")}
        pending={revokeOthersMutation.isPending}
        onConfirm={() => revokeOthersMutation.mutate()}
        onOpenChange={setConfirmOpen}
      />
    </div>
  );
};

const SessionRow = ({
  session,
  canRevoke,
  pending,
  onRevoke,
}: {
  session: UserSessionDTO;
  canRevoke: boolean;
  pending: boolean;
  onRevoke: () => void;
}) => {
  const t = useTranslations("settings.security.sessions");
  const DeviceIcon = DEVICE_ICONS[session.deviceType];

  const browser = session.browser
    ? [session.browser, session.browserVersion].filter(Boolean).join(" ")
    : t("unknownBrowser");

  return (
    <li className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <DeviceIcon
          aria-label={t(`deviceTypes.${session.deviceType}`)}
          className="size-4 shrink-0 text-muted-foreground"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium">
              {t("device", { browser, os: session.os ?? t("unknownOs") })}
            </p>
            {session.isCurrent && (
              <Badge variant="secondary">{t("current")}</Badge>
            )}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {[
              session.ipAddress ?? t("unknownIp"),
              session.lastActiveAt &&
                t("lastActive", {
                  date: format(new Date(session.lastActiveAt), "PPp"),
                }),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      </div>
      {canRevoke && (
        <Button
          size="icon"
          variant="ghost"
          title={t("revoke")}
          aria-label={t("revoke")}
          disabled={pending}
          onClick={onRevoke}
        >
          <LogOut className="size-4" />
        </Button>
      )}
    </li>
  );
};
