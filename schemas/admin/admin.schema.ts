import { z } from "zod";

/**
 * Schema for removing a user
 */
export const removeUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Schema for listing users with pagination and search
 */
export const listUsersSchema = z.object({
  sortBy: z.string().optional(),
  searchValue: z.string().optional(),
  searchField: z.enum(["email", "name"]).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Schema for setting a user's role
 */
export const setUserRoleSchema = z.object({
  role: z.enum(["user", "admin"]),
  userId: z.string().min(1, "User ID is required"),
});

/**
 * Schema for setting a user's password
 */
export const setUserPasswordSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * TypeScript types inferred from schemas
 */
export type RemoveUserInput = z.infer<typeof removeUserSchema>;
export type ListUsersInput = z.infer<typeof listUsersSchema>;
export type SetUserRoleInput = z.infer<typeof setUserRoleSchema>;
export type SetUserPasswordInput = z.infer<typeof setUserPasswordSchema>;
