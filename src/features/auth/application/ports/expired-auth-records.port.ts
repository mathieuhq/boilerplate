export type PurgedAuthRecords = {
  sessions: number;
  verifications: number;
  oauthAccessTokens: number;
  oauthRefreshTokens: number;
  oauthClientAssertions: number;
};

export type IExpiredAuthRecordsPort = {
  purgeExpiredBefore: (date: Date) => Promise<PurgedAuthRecords>;
};
