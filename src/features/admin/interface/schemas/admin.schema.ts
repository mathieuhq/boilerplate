import { z } from "zod";

export const removeUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

export const listUsersSchema = z.object({
  sortBy: z.string().optional(),
  searchValue: z.string().optional(),
  searchField: z.enum(["email", "name"]).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

export const setUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
  userId: z.string().min(1, "User ID is required"),
});

export const setUserPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export type RemoveUserInput = z.infer<typeof removeUserSchema>;
export type ListUsersSchemaInput = z.infer<typeof listUsersSchema>;
export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;
export type SetUserPasswordInput = z.infer<typeof setUserPasswordSchema>;
