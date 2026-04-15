import { test, expectTypeOf } from "vitest";
import { ToolMessage } from "@langchain/core/messages";
import { RunnableConfig } from "@langchain/core/runnables";
import { MultiServerMCPClient } from "../client.js";
import type {
  ResolvedStreamableHTTPConnection,
  ResolvedStdioConnection,
} from "../types.js";

test("check tool hooks types", () => {
  new MultiServerMCPClient({
    mcpServers: {
      filesystem: {
        transport: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "./"],
      },
    },
    beforeToolCall: (toolCallRequest, state, runtime) => {
      expectTypeOf(state).toMatchTypeOf<Record<string, unknown>>();
      expectTypeOf(runtime).toMatchTypeOf<RunnableConfig>();
      expectTypeOf(toolCallRequest).toMatchTypeOf<{
        name: string;
        serverName: string;
        args?: unknown;
      }>();
    },
    afterToolCall: (toolCallResult, state, runtime) => {
      expectTypeOf(state).toMatchTypeOf<Record<string, unknown>>();
      expectTypeOf(runtime).toMatchTypeOf<RunnableConfig>();
      expectTypeOf(toolCallResult.name).toMatchTypeOf<string>();
      expectTypeOf(toolCallResult.args).toMatchTypeOf<unknown>();
      expectTypeOf(toolCallResult.serverName).toMatchTypeOf<string>();
      return {
        result: new ToolMessage({
          content: "server-after",
          tool_call_id: "test-tool-call-id",
        }),
      };
    },
    onMessage: (message, server) => {
      expectTypeOf(message.logger).toMatchTypeOf<string | undefined>();
      expectTypeOf(server).toMatchTypeOf<{
        server: string;
        options: ResolvedStreamableHTTPConnection | ResolvedStdioConnection;
      }>();
    },
    onProgress: (progress, eventSource) => {
      expectTypeOf(progress).toMatchTypeOf<{
        percentage?: number;
        progress?: number;
        total?: number;
        message?: string;
      }>();
      expectTypeOf(eventSource).toMatchTypeOf<
        | {
            type: "tool";
            name: string;
            server: string;
            args?: unknown;
          }
        | {
            type: "unknown";
          }
      >();
    },
    onCancelled: (notification, server) => {
      expectTypeOf(notification.reason).toMatchTypeOf<string | undefined>();
      expectTypeOf(server).toMatchTypeOf<{
        server: string;
        options: ResolvedStreamableHTTPConnection | ResolvedStdioConnection;
      }>();
    },

    onInitialized: (server) => {
      expectTypeOf(server).toMatchTypeOf<{
        server: string;
        options: ResolvedStreamableHTTPConnection | ResolvedStdioConnection;
      }>();
    },

    onPromptsListChanged: (server) => {
      expectTypeOf(server).toMatchTypeOf<{
        server: string;
        options: ResolvedStreamableHTTPConnection | ResolvedStdioConnection;
      }>();
    },

    onResourcesListChanged: (server) => {
      expectTypeOf(server).toMatchTypeOf<{
        server: string;
        options: ResolvedStreamableHTTPConnection | ResolvedStdioConnection;
      }>();
    },

    onResourcesUpdated: (notification, server) => {
      expectTypeOf(notification.uri).toMatchTypeOf<string>();
      expectTypeOf(server).toMatchTypeOf<{
        server: string;
        options: ResolvedStreamableHTTPConnection | ResolvedStdioConnection;
      }>();
    },

    onRootsListChanged: (server) => {
      expectTypeOf(server).toMatchTypeOf<{
        server: string;
        options: ResolvedStreamableHTTPConnection | ResolvedStdioConnection;
      }>();
    },

    onToolsListChanged: (server) => {
      expectTypeOf(server).toMatchTypeOf<{
        server: string;
        options: ResolvedStreamableHTTPConnection | ResolvedStdioConnection;
      }>();
    },
  });
});
