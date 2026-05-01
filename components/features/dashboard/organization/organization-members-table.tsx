"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  cancelOrganizationInvitationAction,
  removeOrganizationMemberAction,
} from "@/actions/organization/organization.action";
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
import {
  getActionErrorMessage,
  isActionSuccessful,
} from "@/lib/actions/actions-utils";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";

type OrganizationMembersTableProps = {
  invitations: OrganizationInvitationResponseDTO[];
  members: OrganizationMemberResponseDTO[];
  organizationId: string;
};

type OrganizationTableRow =
  | {
      kind: "member";
      member: OrganizationMemberResponseDTO;
    }
  | {
      kind: "invitation";
      invitation: OrganizationInvitationResponseDTO;
    };

type OrganizationTranslator = ReturnType<typeof useTranslations>;

export const OrganizationMembersTable = ({
  invitations,
  members,
  organizationId,
}: OrganizationMembersTableProps) => {
  const router = useRouter();
  const t = useTranslations("organization");
  const tCommon = useTranslations("common");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [rowToRemove, setRowToRemove] = useState<OrganizationTableRow | null>(
    null,
  );
  const rows: OrganizationTableRow[] = [
    ...members.map((member) => ({ kind: "member" as const, member })),
    ...invitations.map((invitation) => ({
      kind: "invitation" as const,
      invitation,
    })),
  ];

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const result = await removeOrganizationMemberAction({
        memberId,
        organizationId,
      });

      if (!isActionSuccessful(result))
        throw new Error(getActionErrorMessage(result));

      return result.data;
    },
    onSuccess: () => {
      toast.success(t("membersTable.removeSuccess"));
      setRowToRemove(null);
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

      if (!isActionSuccessful(result))
        throw new Error(getActionErrorMessage(result));

      return result.data;
    },
    onSuccess: () => {
      toast.success(t("membersTable.cancelInvitationSuccess"));
      setRowToRemove(null);
      router.refresh();
    },
    onError: (error: Error) =>
      toast.error(error.message || t("membersTable.cancelInvitationError")),
  });

  const isRemoving = removeMember.isPending || cancelInvitation.isPending;

  return (
    <section className="space-y-4 border-t pt-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h4 className="text-base font-medium">{t("membersTable.title")}</h4>
          <p className="text-muted-foreground text-sm">
            {t("membersTable.description")}
          </p>
        </div>
        <Button onClick={() => setInviteOpen(true)}>
          {t("membersTable.invite")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/50 text-muted-foreground">
            <TableRow>
              <TableHead className="text-muted-foreground px-4">
                {t("membersTable.member")}
              </TableHead>
              <TableHead className="text-muted-foreground hidden px-4 md:table-cell">
                {t("membersTable.role")}
              </TableHead>
              <TableHead className="text-muted-foreground hidden px-4 sm:table-cell">
                {t("membersTable.status")}
              </TableHead>
              <TableHead className="text-muted-foreground px-4 text-right">
                {t("membersTable.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <TableRow key={getRowKey(row)}>
                  <TableCell className="px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-9">
                        {row.kind === "member" && (
                          <AvatarImage
                            src={row.member.user.image ?? undefined}
                            alt={row.member.user.name}
                          />
                        )}
                        <AvatarFallback>{getRowInitials(row)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium">
                            {getRowDisplayName(row)}
                          </span>
                          {row.kind === "member" &&
                            row.member.isCurrentUser && (
                              <Badge variant="outline">
                                {t("membersTable.you")}
                              </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground truncate">
                          {getRowEmail(row)}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 md:table-cell">
                    <RoleBadge role={getRowRole(row)} />
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 sm:table-cell">
                    <StatusBadge status={getRowStatus(row)} />
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      disabled={!canRemoveRow(row) || isRemoving}
                      aria-label={getRowRemoveLabel(row, t)}
                      title={
                        canRemoveRow(row)
                          ? getRowRemoveLabel(row, t)
                          : t("membersTable.removeUnavailable")
                      }
                      onClick={() => setRowToRemove(row)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground h-24 px-4 text-center"
                >
                  {t("membersTable.empty")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

      <Dialog
        open={Boolean(rowToRemove)}
        onOpenChange={(open) => {
          if (!open) setRowToRemove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getRemoveDialogTitle(rowToRemove, t)}</DialogTitle>
            <DialogDescription>
              {getRemoveDialogDescription(rowToRemove, t)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isRemoving}
              onClick={() => setRowToRemove(null)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!rowToRemove || isRemoving}
              onClick={() => {
                if (!rowToRemove) return;
                if (rowToRemove.kind === "member")
                  removeMember.mutate(rowToRemove.member.id);
                else cancelInvitation.mutate(rowToRemove.invitation.id);
              }}
            >
              {getRemoveDialogConfirm(rowToRemove, t)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
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

const StatusBadge = ({ status }: { status: "active" | "pending" }) => {
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

function getRowKey(row: OrganizationTableRow) {
  if (row.kind === "member") return `member-${row.member.id}`;

  return `invitation-${row.invitation.id}`;
}

function getRowDisplayName(row: OrganizationTableRow) {
  if (row.kind === "member") return row.member.user.name;

  return row.invitation.email;
}

function getRowEmail(row: OrganizationTableRow) {
  if (row.kind === "member") return row.member.user.email;

  return row.invitation.email;
}

function getRowInitials(row: OrganizationTableRow) {
  const value = getRowDisplayName(row) || getRowEmail(row);
  const parts = value.trim().split(/\s+/);

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function getRowRole(row: OrganizationTableRow) {
  if (row.kind === "member") return row.member.role;

  return row.invitation.role;
}

function getRowStatus(row: OrganizationTableRow) {
  if (row.kind === "member") return row.member.status;

  return "pending";
}

function canRemoveRow(row: OrganizationTableRow) {
  if (row.kind === "member") return row.member.canRemove;

  return true;
}

function getRowRemoveLabel(
  row: OrganizationTableRow,
  t: OrganizationTranslator,
) {
  if (row.kind === "member") return t("membersTable.remove");

  return t("membersTable.cancelInvitation");
}

function getRemoveDialogTitle(
  row: OrganizationTableRow | null,
  t: OrganizationTranslator,
) {
  if (row?.kind === "invitation")
    return t("membersTable.cancelInvitationTitle");

  return t("membersTable.removeTitle");
}

function getRemoveDialogDescription(
  row: OrganizationTableRow | null,
  t: OrganizationTranslator,
) {
  if (row?.kind === "invitation") {
    return t("membersTable.cancelInvitationDescription", {
      email: row.invitation.email,
    });
  }

  return t("membersTable.removeDescription", {
    member: row?.kind === "member" ? row.member.user.name : "",
  });
}

function getRemoveDialogConfirm(
  row: OrganizationTableRow | null,
  t: OrganizationTranslator,
) {
  if (row?.kind === "invitation")
    return t("membersTable.confirmCancelInvitation");

  return t("membersTable.confirmRemove");
}
