import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { OrganizationInviteMemberForm } from "@/components/features/dashboard/form/organization-invite-member-form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import type { OrganizationInvitationResponseDTO } from "@/features/organization/application/dto/organization-invitation-response.dto";
import type { OrganizationMemberResponseDTO } from "@/features/organization/application/dto/organization-member-response.dto";
import { useTranslations } from "@/i18n";
import { unwrapActionData } from "@/lib/actions/actions-utils";
import { useRouter } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  cancelOrganizationInvitationAction,
  removeOrganizationMemberAction,
} from "@/server-functions/organization.functions";

type OrganizationMembersTableProps = {
  organizationId: string;
  members: OrganizationMemberResponseDTO[];
  invitations: OrganizationInvitationResponseDTO[];
  canInvite: boolean;
};

type OrganizationRemovalTarget =
  | {
      kind: "member";
      id: string;
    }
  | {
      kind: "invitation";
      id: string;
    };

type OrganizationTableRow = {
  key: string;
  email: string;
  initials: string;
  canRemove: boolean;
  displayName: string;
  image: string | null;
  isCurrentUser: boolean;
  removalTarget: OrganizationRemovalTarget;
  role: OrganizationMemberResponseDTO["role"];
  status: OrganizationMemberResponseDTO["status"] | "pending";
};

type OrganizationTranslator = ReturnType<typeof useTranslations>;

export const OrganizationMembersTable = ({
  members,
  invitations,
  organizationId,
  canInvite,
}: OrganizationMembersTableProps) => {
  const router = useRouter();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [rowToRemove, setRowToRemove] = useState<OrganizationTableRow | null>(
    null,
  );

  const rows = getOrganizationRows(members, invitations);

  const { confirmRemoval, isRemoving } = useOrganizationMemberRemoval({
    organizationId,
    onRemoved: () => setRowToRemove(null),
  });

  return (
    <section className="space-y-4 border-t pt-6">
      <OrganizationMembersHeader
        onInvite={canInvite ? () => setInviteOpen(true) : undefined}
      />
      <OrganizationMembersDataTable
        rows={rows}
        isRemoving={isRemoving}
        onRemove={setRowToRemove}
      />

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <OrganizationInviteMemberForm
            organizationId={organizationId}
            onCancelAction={() => setInviteOpen(false)}
            onSuccessAction={() => {
              setInviteOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <RemoveOrganizationRowDialog
        row={rowToRemove}
        isRemoving={isRemoving}
        onCancel={() => setRowToRemove(null)}
        onConfirm={() => {
          if (rowToRemove) confirmRemoval(rowToRemove);
        }}
      />
    </section>
  );
};

const OrganizationMembersHeader = ({ onInvite }: { onInvite?: () => void }) => {
  const t = useTranslations("organization");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h4 className="text-base font-medium">{t("membersTable.title")}</h4>
        <p className="text-sm text-muted-foreground">
          {t("membersTable.description")}
        </p>
      </div>
      {onInvite && (
        <Button onClick={onInvite}>{t("membersTable.invite")}</Button>
      )}
    </div>
  );
};

const OrganizationMembersDataTable = ({
  rows,
  onRemove,
  isRemoving,
}: {
  isRemoving: boolean;
  rows: OrganizationTableRow[];
  onRemove: (row: OrganizationTableRow) => void;
}) => (
  <div className="overflow-hidden rounded-lg border">
    <Table>
      <OrganizationMembersTableHeader />
      <TableBody>
        {rows.length > 0 ? (
          rows.map((row) => (
            <OrganizationMembersTableRow
              key={row.key}
              row={row}
              isRemoving={isRemoving}
              onRemove={onRemove}
            />
          ))
        ) : (
          <OrganizationMembersEmptyRow />
        )}
      </TableBody>
    </Table>
  </div>
);

const OrganizationMembersTableHeader = () => {
  const t = useTranslations("organization");

  return (
    <TableHeader className="bg-muted/50 text-muted-foreground">
      <TableRow>
        <TableHead className="px-4 text-muted-foreground">
          {t("membersTable.member")}
        </TableHead>
        <TableHead className="hidden px-4 text-muted-foreground md:table-cell">
          {t("membersTable.role")}
        </TableHead>
        <TableHead className="hidden px-4 text-muted-foreground sm:table-cell">
          {t("membersTable.status")}
        </TableHead>
        <TableHead className="px-4 text-right text-muted-foreground">
          {t("membersTable.actions")}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
};

const OrganizationMembersTableRow = ({
  row,
  onRemove,
  isRemoving,
}: {
  isRemoving: boolean;
  row: OrganizationTableRow;
  onRemove: (row: OrganizationTableRow) => void;
}) => {
  const t = useTranslations("organization");

  const removeLabel = getRowRemoveLabel(row, t);

  return (
    <TableRow>
      <TableCell className="px-4 py-3">
        <OrganizationMemberIdentityCell row={row} />
      </TableCell>
      <TableCell className="hidden px-4 py-3 md:table-cell">
        <RoleBadge role={row.role} />
      </TableCell>
      <TableCell className="hidden px-4 py-3 sm:table-cell">
        <StatusBadge status={row.status} />
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <Button
          size="icon-sm"
          variant="ghost"
          disabled={!row.canRemove || isRemoving}
          aria-label={removeLabel}
          title={
            row.canRemove ? removeLabel : t("membersTable.removeUnavailable")
          }
          onClick={() => onRemove(row)}
        >
          <Trash2 className="size-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

const OrganizationMemberIdentityCell = ({
  row,
}: {
  row: OrganizationTableRow;
}) => {
  const t = useTranslations("organization");

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar className="size-9">
        {row.image && <AvatarImage src={row.image} alt={row.displayName} />}
        <AvatarFallback>{row.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{row.displayName}</span>
          {row.isCurrentUser && (
            <Badge variant="outline">{t("membersTable.you")}</Badge>
          )}
        </div>
        <p className="truncate text-muted-foreground">{row.email}</p>
      </div>
    </div>
  );
};

const OrganizationMembersEmptyRow = () => {
  const t = useTranslations("organization");

  return (
    <TableRow>
      <TableCell
        colSpan={4}
        className="h-24 px-4 text-center text-muted-foreground"
      >
        {t("membersTable.empty")}
      </TableCell>
    </TableRow>
  );
};

const RemoveOrganizationRowDialog = ({
  row,
  onCancel,
  onConfirm,
  isRemoving,
}: {
  isRemoving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  row: OrganizationTableRow | null;
}) => {
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");

  const copy = getRemoveDialogCopy(row, t);

  return (
    <Dialog
      open={Boolean(row)}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isRemoving}
            onClick={onCancel}
          >
            {tCommon("cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!row || isRemoving}
            onClick={onConfirm}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const RoleBadge = ({
  role,
}: {
  role: OrganizationMemberResponseDTO["role"];
}) => {
  const t = useTranslations("organization");

  return (
    <Badge
      variant={role === "member" ? "outline" : "secondary"}
      className={cn(role === "owner" && "border-transparent")}
    >
      {t(`roles.${role}`)}
    </Badge>
  );
};

const StatusBadge = ({
  status,
}: {
  status: OrganizationTableRow["status"];
}) => {
  const t = useTranslations("organization");

  return (
    <Badge
      variant="outline"
      className={cn(
        status === "active" &&
          "border-emerald-200 bg-emerald-50 text-emerald-700",
        status === "pending" && "border-amber-200 bg-amber-50 text-amber-700",
      )}
    >
      {t(`memberStatus.${status}`)}
    </Badge>
  );
};

function useOrganizationMemberRemoval({
  onRemoved,
  organizationId,
}: {
  onRemoved: () => void;
  organizationId: string;
}) {
  const router = useRouter();

  const t = useTranslations("organization");

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const result = await removeOrganizationMemberAction({
        memberId,
        organizationId,
      });

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(t("membersTable.removeSuccess"));
      onRemoved();
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("membersTable.removeError")),
  });

  const cancelInvitation = useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await cancelOrganizationInvitationAction({
        invitationId,
      });

      return unwrapActionData(result);
    },
    onSuccess: () => {
      toast.success(t("membersTable.cancelInvitationSuccess"));
      onRemoved();
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("membersTable.cancelInvitationError")),
  });

  return {
    confirmRemoval: (row: OrganizationTableRow) => {
      if (row.removalTarget.kind === "member") {
        removeMember.mutate(row.removalTarget.id);
        return;
      }

      cancelInvitation.mutate(row.removalTarget.id);
    },
    isRemoving: removeMember.isPending || cancelInvitation.isPending,
  };
}

function getOrganizationRows(
  members: OrganizationMemberResponseDTO[],
  invitations: OrganizationInvitationResponseDTO[],
): OrganizationTableRow[] {
  return [
    ...members.map((member) => {
      const displayName = member.user.name;

      return {
        displayName,
        role: member.role,
        status: member.status,
        email: member.user.email,
        image: member.user.imageUrl ?? null,
        key: `member-${member.id}`,
        canRemove: member.canRemove,
        isCurrentUser: member.isCurrentUser,
        initials: getInitials(displayName || member.user.email),
        removalTarget: {
          kind: "member" as const,
          id: member.id,
        },
      };
    }),
    ...invitations.map((invitation) => ({
      image: null,
      canRemove: true,
      isCurrentUser: false,
      role: invitation.role,
      email: invitation.email,
      status: "pending" as const,
      displayName: invitation.email,
      key: `invitation-${invitation.id}`,
      initials: getInitials(invitation.email),
      removalTarget: {
        kind: "invitation" as const,
        id: invitation.id,
      },
    })),
  ];
}

function getInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getRowRemoveLabel(
  row: OrganizationTableRow,
  t: OrganizationTranslator,
) {
  if (row.removalTarget.kind === "member") return t("membersTable.remove");

  return t("membersTable.cancelInvitation");
}

function getRemoveDialogCopy(
  row: OrganizationTableRow | null,
  t: OrganizationTranslator,
) {
  if (row?.removalTarget.kind === "invitation") {
    return {
      title: t("membersTable.cancelInvitationTitle"),
      description: t("membersTable.cancelInvitationDescription", {
        email: row.email,
      }),
      confirm: t("membersTable.confirmCancelInvitation"),
    };
  }

  return {
    title: t("membersTable.removeTitle"),
    description: t("membersTable.removeDescription", {
      member: row?.displayName ?? "",
    }),
    confirm: t("membersTable.confirmRemove"),
  };
}
