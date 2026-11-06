import type {
  DataExportReadmeInput,
  IDataExportReadmePort,
} from "../../application/ports/data-export-readme.port";

import { getDataExportTranslator } from "./data-export-i18n";

const FILE_DESCRIPTION_KEYS: Record<string, string> = {
  "profile.json": "profile",
  "accounts.json": "accounts",
  "sessions.json": "sessions",
  "passkeys.json": "passkeys",
  "memberships.json": "memberships",
  "invitations.json": "invitations",
  "notifications.json": "notifications",
  "audit-logs.json": "auditLogs",
  "connected-apps.json": "connectedApps",
  "stored-files.json": "storedFiles",
};

export class I18nDataExportReadmeAdapter implements IDataExportReadmePort {
  constructor(private readonly siteName: string) {}

  render(input: DataExportReadmeInput): string {
    const { t } = getDataExportTranslator(input.language, "dataExport.readme");
    const files = input.files.map(
      (file) =>
        `- \`${file}\`: ${t(`files.${FILE_DESCRIPTION_KEYS[file] ?? "attachment"}`)}`,
    );

    return [
      `# ${t("title")}`,
      "",
      t("intro", { site: this.siteName }),
      "",
      `- ${t("generatedAt", { date: input.generatedAt.toISOString() })}`,
      `- ${t("expiresAt", { date: input.expiresAt.toISOString() })}`,
      "",
      `## ${t("filesTitle")}`,
      "",
      ...files,
      "",
      t("secrets"),
      "",
    ].join("\n");
  }
}
