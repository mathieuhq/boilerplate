import type { User } from "../../domain/entities/user.entity";

export type IEmailNotifierPort = {
  subscribeContact: (user: User) => Promise<string | undefined>;
  unsubscribeContact: (contactId: string) => Promise<void>;
};
