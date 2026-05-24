import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "../config.js";
import { apiFetch } from "../http/client.js";
import { fromError, fromFetch } from "./shared.js";

export function registerApiOpenApi(server: McpServer, config: ServerConfig): void {
  server.registerTool(
    "api_openapi",
    {
      description:
        `Fetch the live OpenAPI spec from ${config.apiBaseUrl}${config.openapiPath}. ` +
        "Call this to discover endpoints and request/response shapes before constructing payloads — " +
        "the spec is the canonical source of truth, not anything cached in this server.",
    },
    async () => {
      try {
        const result = await apiFetch(config, config.openapiPath, { auth: false });
        return fromFetch(result);
      } catch (e) {
        return fromError(e);
      }
    },
  );
}
