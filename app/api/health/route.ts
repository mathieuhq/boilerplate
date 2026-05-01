import { ApiResponse } from "@/shared/infrastructure/http";

export async function GET() {
  const response = ApiResponse.success({
    status: "ok",
    timestamp: new Date().toISOString(),
  });

  response.headers.set("Cache-Control", "no-store");

  return response;
}
