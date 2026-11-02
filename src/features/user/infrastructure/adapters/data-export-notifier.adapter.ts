import type { ReactElement } from "react";

import { MarkdownEmail } from "@/components/features/email/email-markdown";
import { escapeMarkdown } from "@/features/email/application/services/escape-markdown";
import type { SendNotificationDTO } from "@/features/notification/application/dto/send-notification.dto";

import type {
  DataExportReadyNotification,
  IDataExportNotifierPort,
} from "../../application/ports/data-export-notifier.port";
import { getDataExportDownloadPath } from "../../domain/data-export.policy";

import { getDataExportTranslator } from "./data-export-i18n";

const DATA_EXPORT_SETTINGS_PATH = "/settings/profile";

type DataExportNotifierDependencies = {
  serverUrl: string;
  siteName: string;
  sendNotification: (input: SendNotificationDTO) => Promise<unknown>;
  queueEmail: (input: {
    to: string;
    subject: string;
    html: ReactElement;
  }) => Promise<unknown>;
  onError: (message: string, details: Record<string, unknown>) => void;
};

export class DataExportNotifierAdapter implements IDataExportNotifierPort {
  constructor(private readonly dependencies: DataExportNotifierDependencies) {}

  async notifyReady(input: DataExportReadyNotification): Promise<void> {
    const { t, formatDate } = getDataExportTranslator(
      input.language,
      "dataExport.email",
    );
    const expiresOn = formatDate(input.expiresAt);

    const [notification, email] = await Promise.allSettled([
      this.dependencies.sendNotification({
        audience: { kind: "users", userIds: [input.userId] },
        type: "user.data-export-ready",
        data: { expiresOn },
        link: getDataExportDownloadPath(input.exportId),
      }),
      this.dependencies.queueEmail({
        to: input.email,
        subject: t("subject"),
        html: MarkdownEmail({
          preview: t("preview", { site: this.dependencies.siteName }),
          markdown: t("body", {
            name: escapeMarkdown(input.name),
            url: `${this.dependencies.serverUrl}${DATA_EXPORT_SETTINGS_PATH}`,
            date: expiresOn,
          }),
        }),
      }),
    ]);

    if (notification.status === "rejected")
      this.dependencies.onError("Failed to send data export notification", {
        exportId: input.exportId,
        error: notification.reason,
      });

    if (email.status === "rejected")
      this.dependencies.onError("Failed to send data export email", {
        exportId: input.exportId,
        error: email.reason,
      });
  }
}
