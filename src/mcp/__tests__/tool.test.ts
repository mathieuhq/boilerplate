import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { ActionError } from "@/lib/errors/action-error";
import type { McpServer } from "@modelcontextprotocol/server";

import {
  defineMcpTool,
  getAvailableMcpTools,
  type McpUser,
  registerMcpTools,
  toMcpToolError,
  toMcpToolResult,
} from "../tool";

type ToolCallback = (input: unknown) => Promise<unknown>;

const user: McpUser = { id: "user-1", email: "user@example.com", name: "User" };
const admin: McpUser = { ...user, id: "admin-1", role: "admin" };

const userTool = defineMcpTool({
  name: "echo",
  title: "Echo",
  description: "Echoes the input",
  inputSchema: z.object({ value: z.string() }),
  handler: async ({ value }, context) => ({ value, userId: context.user.id }),
});

const adminTool = defineMcpTool({
  name: "admin_echo",
  title: "Admin echo",
  description: "Echoes for admins",
  inputSchema: z.object({}),
  adminOnly: true,
  handler: async () => ({ ok: true }),
});

function createFakeServer() {
  const callbacks = new Map<string, ToolCallback>();
  const registerTool = vi.fn(
    (name: string, _config: unknown, callback: ToolCallback) => {
      callbacks.set(name, callback);
    },
  );

  return {
    callbacks,
    registerTool,
    server: { registerTool } as unknown as McpServer,
  };
}

function parseText(result: { content: { type: string; text?: string }[] }) {
  return JSON.parse(result.content[0]?.text ?? "null") as unknown;
}

describe("getAvailableMcpTools", () => {
  it("hides admin tools from regular users", () => {
    expect(getAvailableMcpTools([userTool, adminTool], user)).toEqual([
      userTool,
    ]);
  });

  it("exposes admin tools to admins", () => {
    expect(getAvailableMcpTools([userTool, adminTool], admin)).toEqual([
      userTool,
      adminTool,
    ]);
  });
});

describe("toMcpToolResult", () => {
  it("serializes data as JSON text", () => {
    const result = toMcpToolResult({ id: 1 });

    expect(result.isError).toBeUndefined();
    expect(parseText(result)).toEqual({ id: 1 });
  });

  it("serializes undefined as null", () => {
    expect(parseText(toMcpToolResult(undefined))).toBeNull();
  });
});

describe("toMcpToolError", () => {
  it("exposes the code and message of known errors", () => {
    const result = toMcpToolError(ActionError.forbidden("Not allowed"));

    expect(result.isError).toBe(true);
    expect(parseText(result)).toMatchObject({
      code: "FORBIDDEN",
      message: "Not allowed",
    });
  });

  it("hides unknown errors behind an internal error", () => {
    const result = toMcpToolError(new Error("database password leaked"));

    expect(result.isError).toBe(true);
    expect(parseText(result)).toMatchObject({ code: "INTERNAL_ERROR" });
  });
});

describe("registerMcpTools", () => {
  it("registers only the tools available to the user", () => {
    const { server, registerTool } = createFakeServer();

    registerMcpTools(server, [userTool, adminTool], { user });

    expect(registerTool).toHaveBeenCalledTimes(1);
    expect(registerTool).toHaveBeenCalledWith(
      "echo",
      expect.objectContaining({
        title: "Echo",
        inputSchema: userTool.inputSchema,
      }),
      expect.any(Function),
    );
  });

  it("runs the handler with the request user", async () => {
    const { server, callbacks } = createFakeServer();

    registerMcpTools(server, [userTool], { user });

    const result = (await callbacks.get("echo")?.({ value: "hello" })) as {
      content: { type: string; text?: string }[];
    };

    expect(parseText(result)).toEqual({ value: "hello", userId: "user-1" });
  });

  it("maps handler errors before returning them", async () => {
    const { server, callbacks } = createFakeServer();
    const failingTool = defineMcpTool({
      name: "fail",
      title: "Fail",
      description: "Always fails",
      inputSchema: z.object({}),
      mapError: () => ActionError.conflict("TAKEN", "Already taken"),
      handler: async () => {
        throw new Error("raw failure");
      },
    });

    registerMcpTools(server, [failingTool], { user });

    const result = (await callbacks.get("fail")?.({})) as {
      isError?: boolean;
      content: { type: string; text?: string }[];
    };

    expect(result.isError).toBe(true);
    expect(parseText(result)).toMatchObject({
      code: "TAKEN",
      message: "Already taken",
    });
  });
});
