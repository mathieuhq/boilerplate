import { adminRoute } from "@/lib/zod-route";
import { container } from "@/shared/infrastructure/di/container";
import { ApiResponse } from "@/shared/infrastructure/http/api-response";

export const GET = adminRoute.handler(async () => {
  const adminController = container.getAdminController();
  const stats = await adminController.getRegistrationStats(30);

  return ApiResponse.success({ stats });
});
