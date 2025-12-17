export type AuthUser = {
  id: string;
  name: string;
  email: string;
  image?: string;
};

export type IAuthProviderPort = {
  getUser: () => Promise<AuthUser | null>;
  getRequiredUser: () => Promise<AuthUser>;
};
