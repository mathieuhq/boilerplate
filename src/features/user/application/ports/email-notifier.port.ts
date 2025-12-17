import type { User } from "../../domain/entities/user.entity";

export type IEmailNotifierPort = {
  unsubscribeContact: (contactId: string) => Promise<void>;
  subscribeContact: (user: User) => Promise<string | undefined>;
};
