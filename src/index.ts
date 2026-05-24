#!/usr/bin/env node
/**
 * mcp-api-template — a generic OpenAPI/HTTP MCP server template.
 *
 * Boots an MCP server over stdio that exposes three tools wrapping a
 * configurable HTTP API: api_health, api_openapi, and api_request.
 *
 * Configure with environment variables:
 *
 *   API_BASE_URL          Origin of the API to wrap (default jsonplaceholder.typicode.com)
 *   API_HEALTH_PATH       Path used by api_health
 *   API_OPENAPI_PATH      Path used by api_openapi
 *   MCP_SERVER_NAME       Name advertised over MCP
 *   MCP_SERVER_VERSION    Version advertised over MCP
 *
 *   BEARER_TOKEN          Static Bearer token, OR ...
 *   OAUTH_TOKEN_URL       client_credentials token endpoint
 *   OAUTH_CLIENT_ID       client_credentials client id
 *   OAUTH_CLIENT_SECRET   client_credentials client secret
 *
 * To customize: fork the repo and add tools under src/tools/. The
 * existing three are deliberately minimal so they generalize; add
 * typed endpoint-specific tools alongside them as your API grows.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { loadConfig } from "./config.js";
import { registerApiHealth } from "./tools/api-health.js";
import { registerApiOpenApi } from "./tools/api-openapi.js";
import { registerApiRequest } from "./tools/api-request.js";

async function main(): Promise<void> {
  const config = loadConfig();
  const server = new McpServer({
    name: config.serverName,
    version: config.serverVersion,
  });

  registerApiHealth(server, config);
  registerApiOpenApi(server, config);
  registerApiRequest(server, config);

  // Log startup to stderr — stdout is reserved for the MCP protocol.
  console.error(
    `[${config.serverName}] connected to ${config.apiBaseUrl} (3 tools: api_health, api_openapi, api_request)`,
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
