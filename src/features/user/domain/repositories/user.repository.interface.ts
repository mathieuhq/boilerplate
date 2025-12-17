import type { User } from "../entities/user.entity";
import type { Email } from "../value-objects/email.value-object";
import type { UserId } from "../value-objects/user-id.value-object";

export type IUserRepository = {
  findById: (id: UserId) => Promise<User | null>;
  findByEmail: (email: Email) => Promise<User | null>;
  findByStripeCustomerId: (customerId: string) => Promise<User | null>;
  save: (user: User) => Promise<User>;
  delete: (id: UserId) => Promise<void>;
  isEmailTaken: (email: Email, excludeUserId?: UserId) => Promise<boolean>;
};
