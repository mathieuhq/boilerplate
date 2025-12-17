export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role?: string;
  image?: string;
};

export type AuthSession = {
  user: AuthUser;
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
  };
};

export type Subscription = {
  id: string;
  plan: string;
  status: string;
  periodEnd?: Date;
  periodStart?: Date;
};

export type ListUsersParams = {
  limit?: number;
  offset?: number;
  sortBy?: string;
  searchValue?: string;
  searchField?: "email" | "name";
  sortDirection?: "asc" | "desc";
};

export type ListUsersResult = {
  total: number;
  users: AuthUser[];
};

export type IAuthProviderPort = {
  getUser: () => Promise<AuthUser | null>;
  getRequiredUser: () => Promise<AuthUser>;
  getSession: () => Promise<AuthSession | null>;
  removeUser: (userId: string) => Promise<void>;
  getActiveSubscriptions: () => Promise<Subscription[]>;
  listUsers: (params: ListUsersParams) => Promise<ListUsersResult>;
  setUserRole: (userId: string, role: "user" | "admin") => Promise<void>;
  setUserPassword: (userId: string, newPassword: string) => Promise<void>;
  createUser: (data: {
    email: string;
    password: string;
    name: string;
    role?: "user" | "admin";
  }) => Promise<AuthUser>;
};
