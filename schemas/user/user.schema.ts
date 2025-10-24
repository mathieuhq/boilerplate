import { z } from "zod";

/**
 * User ID validation schema
 */
export const userIdSchema = z.object({
  id: z.string().min(1, "User ID is required"),
});

/**
 * User profile update schema
 */
export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  email: z.email("Invalid email format").optional(),
  image: z.url("Invalid image URL").optional(),
});

/**
 * List users query parameters schema
 */
export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
});

/**
 * Delete user confirmation schema
 */
export const deleteUserConfirmationSchema = z.object({
  confirmation: z.boolean().refine((val) => val === true, {
    message: "You must confirm account deletion",
  }),
});

/**
 * Update user with ID schema (for admin/controller use)
 */
export const updateUserWithIdSchema = z.object({
  id: userIdSchema.shape.id,
  name: z.string().min(1).max(100).optional(),
  email: z.email().optional(),
  image: z.url().optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type UserIdInput = z.infer<typeof userIdSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type ListUsersQueryInput = z.infer<typeof listUsersQuerySchema>;
export type DeleteUserConfirmationInput = z.infer<
  typeof deleteUserConfirmationSchema
>;
export type UpdateUserWithIdInput = z.infer<typeof updateUserWithIdSchema>;
