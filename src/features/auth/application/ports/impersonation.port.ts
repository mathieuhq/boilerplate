export type StartedImpersonation = {
  expiresAt: Date;
};

export type IImpersonationPort = {
  startImpersonation: (
    userId: string,
    expiresInSeconds: number,
  ) => Promise<StartedImpersonation>;
  stopImpersonation: () => Promise<void>;
};
