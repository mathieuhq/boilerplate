import type { PrismaClient } from "@/lib/generated/prisma/client";

import type {
  IExpiredAuthRecordsPort,
  PurgedAuthRecords,
} from "../../application/ports/expired-auth-records.port";

export class PrismaExpiredAuthRecordsRepository implements IExpiredAuthRecordsPort {
  constructor(private readonly prisma: PrismaClient) {}

  async purgeExpiredBefore(date: Date): Promise<PurgedAuthRecords> {
    const expired = { expiresAt: { lt: date } };

    const [
      oauthAccessTokens,
      oauthRefreshTokens,
      oauthClientAssertions,
      verifications,
      sessions,
    ] = await this.prisma.$transaction([
      this.prisma.oauthAccessToken.deleteMany({ where: expired }),
      this.prisma.oauthRefreshToken.deleteMany({ where: expired }),
      this.prisma.oauthClientAssertion.deleteMany({ where: expired }),
      this.prisma.verification.deleteMany({ where: expired }),
      this.prisma.session.deleteMany({ where: expired }),
    ]);

    return {
      sessions: sessions.count,
      verifications: verifications.count,
      oauthAccessTokens: oauthAccessTokens.count,
      oauthRefreshTokens: oauthRefreshTokens.count,
      oauthClientAssertions: oauthClientAssertions.count,
    };
  }
}
