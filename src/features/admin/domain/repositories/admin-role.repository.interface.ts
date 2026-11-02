import type { AccessGrants } from "@/shared/domain/access-control";

export type AdminCustomRole = {
  key: string;
  name: string;
  description: string | null;
  access: AccessGrants;
  createdAt: string;
  updatedAt: string;
};

export type AdminSaveRoleInput = {
  key: string;
  name: string;
  description: string | null;
  access: AccessGrants;
};

export type IAdminRoleRepository = {
  listRoles: () => Promise<AdminCustomRole[]>;
  findRoleByKey: (key: string) => Promise<AdminCustomRole | null>;
  createRole: (input: AdminSaveRoleInput) => Promise<AdminCustomRole>;
  updateRole: (input: AdminSaveRoleInput) => Promise<AdminCustomRole>;
  deleteRole: (key: string) => Promise<void>;
  countUsersByRole: () => Promise<Record<string, number>>;
};
