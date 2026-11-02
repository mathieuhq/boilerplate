import { beforeEach, describe, expect, it, vi } from "vitest";

import type { IAuditLogPort } from "@/shared/application/ports/audit-log.port";

import type { OrganizationOperationError } from "../errors/organization-operation.error";
import { RecordOrganizationActivityUseCase } from "../use-cases/record-organization-activity.use-case";

describe("RecordOrganizationActivityUseCase", () => {
  let auditLog: IAuditLogPort;
  let useCase: RecordOrganizationActivityUseCase;

  beforeEach(() => {
    auditLog = { record: vi.fn() };
    useCase = new RecordOrganizationActivityUseCase(auditLog);
  });

  it("should record the activity against the organization", async () => {
    const result = await useCase.execute({
      action: "organization.invitation.created",
      actorUserId: "user-1",
      organizationId: "org-1",
      resourceType: "invitation",
      resourceId: "invitation-1",
      metadata: { email: "bob@example.com", role: "member" },
    });

    expect(result.value).toEqual({ recorded: true });
    expect(auditLog.record).toHaveBeenCalledWith({
      actorType: "user",
      actorUserId: "user-1",
      action: "organization.invitation.created",
      resourceType: "invitation",
      resourceId: "invitation-1",
      organizationId: "org-1",
      metadata: { email: "bob@example.com", role: "member" },
    });
  });

  it("should flag activity done through an impersonation", async () => {
    await useCase.execute({
      action: "organization.member.removed",
      actorUserId: "user-1",
      organizationId: "org-1",
      resourceType: "member",
      resourceId: "member-2",
      impersonatedBy: "support-1",
    });

    expect(auditLog.record).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { impersonatedBy: "support-1" },
      }),
    );
  });

  it.each([
    ["organization", { organizationId: "", actorUserId: "user-1" }],
    ["actor", { organizationId: "org-1", actorUserId: "" }],
  ])("should refuse activity without %s", async (_label, ids) => {
    const result = await useCase.execute({
      action: "organization.updated",
      resourceType: "organization",
      resourceId: "org-1",
      ...ids,
    });

    expect((result.error as OrganizationOperationError).code).toBe(
      "ORGANIZATION_ACTIVITY_INVALID",
    );
    expect(auditLog.record).not.toHaveBeenCalled();
  });
});
