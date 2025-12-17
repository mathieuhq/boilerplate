export type AuthUser = {
  id: string;
  email: string;
  name: string;
  image?: string;
};

export type IAuthProviderPort = {
  getUser: () => Promise<AuthUser | null>;
  getRequiredUser: () => Promise<AuthUser>;
};
