import type { Queue } from "bullmq";

import { SITE_CONFIG } from "@/lib/site-config";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { H3Adapter } from "@bull-board/h3";

export const BULL_BOARD_PATH = "/api/v1/private/admin/jobs";

export function createBullBoardApp(queue: Queue, readOnlyMode: boolean) {
  const serverAdapter = new H3Adapter().setBasePath(BULL_BOARD_PATH);

  createBullBoard({
    queues: [new BullMQAdapter(queue, { readOnlyMode })],
    serverAdapter,
    options: { uiConfig: { boardTitle: SITE_CONFIG.TITLE } },
  });

  return serverAdapter.registerHandlers();
}
