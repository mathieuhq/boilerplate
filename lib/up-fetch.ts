import { up } from "up-fetch";

/**
 * Enhanced fetch client with Zod validation and automatic JSON handling
 *
 * @example
 * const result = await upfetch("/api/users", {
 *   schema: z.object({ users: z.array(UserSchema) })
 * });
 */
export const upfetch = up(fetch);
