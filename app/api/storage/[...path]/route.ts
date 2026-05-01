import { type NextRequest, NextResponse } from "next/server";

import { container } from "@/shared/infrastructure/di/container";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  const key = path.join("/");

  if (!key) return ApiResponse.badRequest("MISSING_PATH", "Missing file path");

  try {
    const storageController = container.getStorageController();
    const result = await storageController.generateDownloadUrl(key);

    return NextResponse.redirect(result.downloadUrl, 302);
  } catch {
    return ApiResponse.notFound("File");
  }
}
