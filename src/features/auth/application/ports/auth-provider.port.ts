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
    activeOrganizationId: string | null;
  };
};

export type IAuthProviderPort = {
  getUser: () => Promise<AuthUser | null>;
  getRequiredUser: () => Promise<AuthUser>;
  getSession: () => Promise<AuthSession | null>;
  setUserRole: (userId: string, role: "user" | "admin") => Promise<void>;
};
