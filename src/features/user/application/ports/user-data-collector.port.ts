import type { UserDataSnapshot } from "../dto/user-data-snapshot.dto";

export type IUserDataCollectorPort = {
  collect: (userId: string) => Promise<UserDataSnapshot | null>;
};
