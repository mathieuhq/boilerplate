import type { PrismaClient } from "@/lib/generated/prisma/client";

import type {
  DailyRegistrationStat,
  IAdminRepository,
} from "../../domain/repositories/admin.repository.interface";

export class PrismaAdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getRegistrationsByDay(days: number): Promise<DailyRegistrationStat[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const countsByDate = new Map<string, number>();

    for (let i = 0; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateKey = date.toISOString().split("T")[0];
      countsByDate.set(dateKey, 0);
    }

    for (const user of users) {
      const dateKey = user.createdAt.toISOString().split("T")[0];
      const currentCount = countsByDate.get(dateKey) ?? 0;
      countsByDate.set(dateKey, currentCount + 1);
    }

    return Array.from(countsByDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }
}
