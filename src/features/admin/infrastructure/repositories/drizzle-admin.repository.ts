import { asc, gte } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

import type * as schema from "@/db/schema";
import { users } from "@/db/schema";

import type {
  DailyRegistrationStat,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";

export class DrizzleAdminRepository implements IAdminRepository {
  constructor(private readonly db: PostgresJsDatabase<typeof schema>) {}

  async getRegistrationsByDay(days: number): Promise<DailyRegistrationStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const usersList = await this.db
      .select({ createdAt: users.createdAt })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .orderBy(asc(users.createdAt));

    const countsByDate = new Map<string, number>();

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      countsByDate.set(dateKey, 0);
    }

    for (const user of usersList) {
      if (user.createdAt) {
        const dateKey = user.createdAt.toISOString().split("T")[0];
        const currentCount = countsByDate.get(dateKey) ?? 0;
        countsByDate.set(dateKey, currentCount + 1);
      }
    }

    return Array.from(countsByDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }
}
