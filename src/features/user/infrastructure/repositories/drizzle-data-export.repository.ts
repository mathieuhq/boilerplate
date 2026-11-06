import { and, asc, desc, eq, inArray, lte, ne } from "drizzle-orm";

import type { Database } from "@/lib/db";
import { dataExport as dataExportTable } from "@/lib/schema";

import type {
  DataExport,
  DataExportStatus,
} from "../../domain/entities/data-export.types";
import type {
  CreateDataExportInput,
  IDataExportRepository,
  MarkDataExportReadyInput,
} from "../../domain/repositories/data-export.repository.interface";

type DataExportRow = typeof dataExportTable.$inferSelect;

type DbDataExportStatus = DataExportRow["status"];

const TO_DB_STATUS: Record<DataExportStatus, DbDataExportStatus> = {
  pending: "PENDING",
  ready: "READY",
  failed: "FAILED",
};

const FROM_DB_STATUS: Record<DbDataExportStatus, DataExportStatus> = {
  PENDING: "pending",
  READY: "ready",
  FAILED: "failed",
};

export class DrizzleDataExportRepository implements IDataExportRepository {
  constructor(private readonly db: Database) {}

  async create(input: CreateDataExportInput): Promise<DataExport> {
    const [dataExport] = await this.db
      .insert(dataExportTable)
      .values({ userId: input.userId, expiresAt: input.expiresAt })
      .returning();

    return toDataExport(dataExport);
  }

  async findById(id: string): Promise<DataExport | null> {
    const dataExport = await this.db.query.dataExport.findFirst({
      where: eq(dataExportTable.id, id),
    });

    return dataExport ? toDataExport(dataExport) : null;
  }

  async findLatestByUserId(
    userId: string,
    statuses: DataExportStatus[],
  ): Promise<DataExport | null> {
    const dataExport = await this.db.query.dataExport.findFirst({
      where: and(
        eq(dataExportTable.userId, userId),
        inArray(
          dataExportTable.status,
          statuses.map((status) => TO_DB_STATUS[status]),
        ),
      ),
      orderBy: [desc(dataExportTable.createdAt), desc(dataExportTable.id)],
    });

    return dataExport ? toDataExport(dataExport) : null;
  }

  async markReady(
    id: string,
    input: MarkDataExportReadyInput,
  ): Promise<DataExport> {
    const dataExports = await this.db
      .update(dataExportTable)
      .set({
        status: "READY",
        fileKey: input.fileKey,
        size: input.size,
        completedAt: input.completedAt,
        expiresAt: input.expiresAt,
      })
      .where(eq(dataExportTable.id, id))
      .returning();

    if (dataExports.length === 0)
      throw new Error(`Data export ${id} not found`);

    return toDataExport(dataExports[0]);
  }

  async markFailed(id: string): Promise<void> {
    await this.db
      .update(dataExportTable)
      .set({ status: "FAILED" })
      .where(
        and(eq(dataExportTable.id, id), ne(dataExportTable.status, "READY")),
      );
  }

  async findExpired(now: Date, limit: number): Promise<DataExport[]> {
    const dataExports = await this.db.query.dataExport.findMany({
      where: lte(dataExportTable.expiresAt, now),
      orderBy: asc(dataExportTable.expiresAt),
      limit,
    });

    return dataExports.map(toDataExport);
  }

  async deleteMany(ids: string[]): Promise<number> {
    const deleted = await this.db
      .delete(dataExportTable)
      .where(inArray(dataExportTable.id, ids))
      .returning({ id: dataExportTable.id });

    return deleted.length;
  }
}

function toDataExport(dataExport: DataExportRow): DataExport {
  return {
    id: dataExport.id,
    userId: dataExport.userId,
    status: FROM_DB_STATUS[dataExport.status],
    fileKey: dataExport.fileKey,
    size: dataExport.size,
    createdAt: dataExport.createdAt,
    completedAt: dataExport.completedAt,
    expiresAt: dataExport.expiresAt,
  };
}
