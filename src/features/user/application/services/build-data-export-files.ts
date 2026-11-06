import type { UserDataSnapshot } from "../dto/user-data-snapshot.dto";
import type { ArchiveFile } from "../ports/archive.port";

export type DataExportAttachment = {
  key: string;
  purpose: UserDataSnapshot["storedFiles"][number]["purpose"];
  content: Buffer | null;
};

function toJsonFile(path: string, value: unknown): ArchiveFile {
  return { path, content: `${JSON.stringify(value, null, 2)}\n` };
}

function getAttachmentPath(attachment: DataExportAttachment) {
  const fileName = attachment.key.split("/").at(-1);

  return `files/${attachment.purpose}-${fileName}`;
}

export function buildDataExportFiles(
  snapshot: UserDataSnapshot,
  attachments: DataExportAttachment[],
): ArchiveFile[] {
  const storedFiles = attachments.map((attachment) => ({
    key: attachment.key,
    purpose: attachment.purpose,
    path: attachment.content ? getAttachmentPath(attachment) : null,
    size: attachment.content?.byteLength ?? null,
  }));

  return [
    toJsonFile("profile.json", snapshot.profile),
    toJsonFile("accounts.json", snapshot.accounts),
    toJsonFile("sessions.json", snapshot.sessions),
    toJsonFile("passkeys.json", snapshot.passkeys),
    toJsonFile("memberships.json", snapshot.memberships),
    toJsonFile("invitations.json", snapshot.invitations),
    toJsonFile("notifications.json", snapshot.notifications),
    toJsonFile("audit-logs.json", snapshot.auditLogs),
    toJsonFile("connected-apps.json", snapshot.connectedApps),
    toJsonFile("stored-files.json", storedFiles),
    ...attachments.flatMap((attachment) =>
      attachment.content
        ? [
            {
              path: getAttachmentPath(attachment),
              content: new Uint8Array(attachment.content),
            },
          ]
        : [],
    ),
  ];
}
