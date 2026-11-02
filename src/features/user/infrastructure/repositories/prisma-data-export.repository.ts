import type { PrismaClient } from "@/lib/generated/prisma/client";
import type { DataExportStatus as PrismaDataExportStatus } from "@/lib/generated/prisma/enums";

import type {
  DataExport,
  DataExportStatus,
} from "../../domain/entities/data-export.types";
import type {
  CreateDataExportInput,
  IDataExportRepository,
  MarkDataExportReadyInput,
} from "../../domain/repositories/data-export.repository.interface";

type PrismaDataExport = {
  id: string;
  userId: string | null;
  status: PrismaDataExportStatus;
  fileKey: string | null;
  size: number | null;
  createdAt: Date;
  completedAt: Date | null;
  expiresAt: Date;
};

const TO_PRISMA_STATUS: Record<DataExportStatus, PrismaDataExportStatus> = {
  pending: "PENDING",
  ready: "READY",
  failed: "FAILED",
};

const FROM_PRISMA_STATUS: Record<PrismaDataExportStatus, DataExportStatus> = {
  PENDING: "pending",
  READY: "ready",
  FAILED: "failed",
};

export class PrismaDataExportRepository implements IDataExportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateDataExportInput): Promise<DataExport> {
    const dataExport = await this.prisma.dataExport.create({
      data: { userId: input.userId, expiresAt: input.expiresAt },
    });

    return toDataExport(dataExport);
  }

  async findById(id: string): Promise<DataExport | null> {
    const dataExport = await this.prisma.dataExport.findUnique({
      where: { id },
    });

    return dataExport ? toDataExport(dataExport) : null;
  }

  async findLatestByUserId(
    userId: string,
    statuses: DataExportStatus[],
  ): Promise<DataExport | null> {
    const dataExport = await this.prisma.dataExport.findFirst({
      where: {
        userId,
        status: { in: statuses.map((status) => TO_PRISMA_STATUS[status]) },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });

    return dataExport ? toDataExport(dataExport) : null;
  }

  async markReady(
    id: string,
    input: MarkDataExportReadyInput,
  ): Promise<DataExport> {
    const dataExport = await this.prisma.dataExport.update({
      where: { id },
      data: {
        status: "READY",
        fileKey: input.fileKey,
        size: input.size,
        completedAt: input.completedAt,
        expiresAt: input.expiresAt,
      },
    });

    return toDataExport(dataExport);
  }

  async markFailed(id: string): Promise<void> {
    await this.prisma.dataExport.updateMany({
      where: { id, status: { not: "READY" } },
      data: { status: "FAILED" },
    });
  }

  async findExpired(now: Date, limit: number): Promise<DataExport[]> {
    const dataExports = await this.prisma.dataExport.findMany({
      where: { expiresAt: { lte: now } },
      orderBy: { expiresAt: "asc" },
      take: limit,
    });

    return dataExports.map(toDataExport);
  }

  async deleteMany(ids: string[]): Promise<number> {
    const result = await this.prisma.dataExport.deleteMany({
      where: { id: { in: ids } },
    });

    return result.count;
  }
}

function toDataExport(dataExport: PrismaDataExport): DataExport {
  return {
    id: dataExport.id,
    userId: dataExport.userId,
    status: FROM_PRISMA_STATUS[dataExport.status],
    fileKey: dataExport.fileKey,
    size: dataExport.size,
    createdAt: dataExport.createdAt,
    completedAt: dataExport.completedAt,
    expiresAt: dataExport.expiresAt,
  };
}
