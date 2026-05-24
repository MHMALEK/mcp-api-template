import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ServerConfig } from "../config.js";
import { apiFetch } from "../http/client.js";
import { fromError, fromFetch } from "./shared.js";

export function registerApiHealth(server: McpServer, config: ServerConfig): void {
  server.registerTool(
    "api_health",
    {
      description:
        `Hit ${config.apiBaseUrl}${config.healthPath} (no auth) to verify ` +
        "the API is reachable and the configured base URL is correct. " +
        "Use this first when something looks wrong.",
    },
    async () => {
      try {
        const result = await apiFetch(config, config.healthPath, { auth: false });
        return fromFetch(result);
      } catch (e) {
        return fromError(e);
      }
    },
  );
}
