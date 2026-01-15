import type { User } from "../entities/user.entity";
import type { Email } from "../value-objects/email.value-object";
import type { UserId } from "../value-objects/user-id.value-object";

export type IUserRepository = {
  save: (user: User) => Promise<User>;
  delete: (id: UserId) => Promise<void>;
  findById: (id: UserId) => Promise<User | null>;
  findByEmail: (email: Email) => Promise<User | null>;
  isEmailTaken: (email: Email, excludeUserId?: UserId) => Promise<boolean>;
};
