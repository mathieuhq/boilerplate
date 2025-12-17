import { ApiResponse } from "@/shared/infrastructure/http";

export async function GET() {
  return ApiResponse.success({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
