import { lt } from "drizzle-orm";

import type { Database } from "@/lib/db";
import {
  oauthAccessToken,
  oauthClientAssertion,
  oauthRefreshToken,
  session,
  verification,
} from "@/lib/schema";

import type {
  IExpiredAuthRecordsPort,
  PurgedAuthRecords,
} from "../../application/ports/expired-auth-records.port";

export class DrizzleExpiredAuthRecordsRepository implements IExpiredAuthRecordsPort {
  constructor(private readonly db: Database) {}

  async purgeExpiredBefore(date: Date): Promise<PurgedAuthRecords> {
    return this.db.transaction(async (tx) => {
      const oauthAccessTokens = await tx
        .delete(oauthAccessToken)
        .where(lt(oauthAccessToken.expiresAt, date))
        .returning({ id: oauthAccessToken.id });
      const oauthRefreshTokens = await tx
        .delete(oauthRefreshToken)
        .where(lt(oauthRefreshToken.expiresAt, date))
        .returning({ id: oauthRefreshToken.id });
      const oauthClientAssertions = await tx
        .delete(oauthClientAssertion)
        .where(lt(oauthClientAssertion.expiresAt, date))
        .returning({ id: oauthClientAssertion.id });
      const verifications = await tx
        .delete(verification)
        .where(lt(verification.expiresAt, date))
        .returning({ id: verification.id });
      const sessions = await tx
        .delete(session)
        .where(lt(session.expiresAt, date))
        .returning({ id: session.id });

      return {
        sessions: sessions.length,
        verifications: verifications.length,
        oauthAccessTokens: oauthAccessTokens.length,
        oauthRefreshTokens: oauthRefreshTokens.length,
        oauthClientAssertions: oauthClientAssertions.length,
      };
    });
  }
}
