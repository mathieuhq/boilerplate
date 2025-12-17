export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
  role?: string;
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
  periodStart?: Date;
  periodEnd?: Date;
};

export type ListUsersParams = {
  searchValue?: string;
  searchField?: "email" | "name";
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
};

export type ListUsersResult = {
  users: AuthUser[];
  total: number;
};

export type IAuthProviderPort = {
  getSession: () => Promise<AuthSession | null>;
  getUser: () => Promise<AuthUser | null>;
  getRequiredUser: () => Promise<AuthUser>;
  getActiveSubscriptions: () => Promise<Subscription[]>;
  setUserRole: (userId: string, role: "user" | "admin") => Promise<void>;
  createUser: (data: {
    email: string;
    password: string;
    name: string;
    role?: "user" | "admin";
  }) => Promise<AuthUser>;
  removeUser: (userId: string) => Promise<void>;
  listUsers: (params: ListUsersParams) => Promise<ListUsersResult>;
  setUserPassword: (userId: string, newPassword: string) => Promise<void>;
};
