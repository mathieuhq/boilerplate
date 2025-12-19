export type IAuthProviderPort = {
  getUser: () => Promise<{
    id: string;
    name: string;
    email: string;
    role?: string;
    image?: string;
  } | null>;
  getRequiredUser: () => Promise<{
    id: string;
    name: string;
    email: string;
    role?: string;
    image?: string;
  }>;
};
