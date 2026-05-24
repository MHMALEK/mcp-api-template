import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ServerConfig } from "../config.js";
import { apiFetch } from "../http/client.js";
import { coerceQuery } from "../http/query.js";
import { fromError, fromFetch } from "./shared.js";

/**
 * Single passthrough tool that covers every method/path the API has,
 * without needing per-endpoint definitions. The agent learns endpoints
 * from api_openapi and calls them here.
 *
 * The agent-policy line in the description nudges the model to ask
 * the user for missing payload fields instead of inventing values —
 * critical for write operations against real APIs.
 */
export function registerApiRequest(server: McpServer, config: ServerConfig): void {
  server.registerTool(
    "api_request",
    {
      description:
        `Generic passthrough to any endpoint of ${config.apiBaseUrl}. ` +
        "Call api_openapi first to discover endpoint shapes; this tool sends arbitrary " +
        "method + path + body + query. " +
        "auth defaults to true — set false for public endpoints (health, openapi). " +
        "Agent policy: do NOT invent payload values. If the user has not supplied " +
        "enough information to build a valid body, stop and ask them for the missing fields.",
      inputSchema: {
        method: z
          .enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
          .describe("HTTP method"),
        path: z.string().min(1).describe("API path, e.g. /posts/1 or /v2/users"),
        body: z
          .unknown()
          .optional()
          .describe("Request body for POST/PUT/PATCH (JSON object or array)"),
        query: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Query params, keyed using the OpenAPI names verbatim (e.g. filter[name])"),
        auth: z
          .boolean()
          .optional()
          .describe("Attach Bearer token (default true). Set false for public endpoints."),
      },
    },
    async (args) => {
      try {
        const result = await apiFetch(config, args.path, {
          auth: args.auth ?? true,
          method: args.method,
          ...(args.body !== undefined ? { jsonBody: args.body } : {}),
          query: coerceQuery(args.query),
        });
        return fromFetch(result);
      } catch (e) {
        return fromError(e);
      }
    },
  );
}
