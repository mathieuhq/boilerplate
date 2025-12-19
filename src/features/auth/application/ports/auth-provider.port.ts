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

export type IAuthProviderPort = {
  getUser: () => Promise<AuthUser | null>;
  getRequiredUser: () => Promise<AuthUser>;
  getSession: () => Promise<AuthSession | null>;
  getActiveSubscriptions: () => Promise<Subscription[]>;
  setUserRole: (userId: string, role: "user" | "admin") => Promise<void>;
};
