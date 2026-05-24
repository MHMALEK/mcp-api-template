/**
 * Runtime configuration, read from environment.
 *
 * The defaults point at https://jsonplaceholder.typicode.com — a free
 * public REST API — so the server boots and the tools work without
 * any setup. Override via env vars to wrap your own API.
 */

export interface ServerConfig {
  /** The HTTP origin of the API you're wrapping. No trailing slash. */
  apiBaseUrl: string;
  /** Path to the OpenAPI spec. Used by the api_openapi tool. */
  openapiPath: string;
  /** Path to a health endpoint. Used by the api_health tool. */
  healthPath: string;
  /** Name advertised to MCP clients. Defaults to "api". */
  serverName: string;
  /** Server version advertised over MCP. */
  serverVersion: string;
}

/** Default config — points at jsonplaceholder.typicode.com. */
export const defaultConfig: ServerConfig = {
  apiBaseUrl: "https://jsonplaceholder.typicode.com",
  openapiPath: "/openapi.json", // jsonplaceholder doesn't actually serve one; the tool will return 404 — that's a demo of the tool working
  healthPath: "/posts/1", // first post is the closest jsonplaceholder gets to a health endpoint
  serverName: "mcp-api-template",
  serverVersion: "0.1.0",
};

/** Load config from environment. Unset vars fall back to defaults. */
export function loadConfig(): ServerConfig {
  return {
    apiBaseUrl: stripTrailingSlash(env("API_BASE_URL", defaultConfig.apiBaseUrl)),
    openapiPath: env("API_OPENAPI_PATH", defaultConfig.openapiPath),
    healthPath: env("API_HEALTH_PATH", defaultConfig.healthPath),
    serverName: env("MCP_SERVER_NAME", defaultConfig.serverName),
    serverVersion: env("MCP_SERVER_VERSION", defaultConfig.serverVersion),
  };
}

function env(key: string, fallback: string): string {
  const v = process.env[key]?.trim();
  return v && v.length > 0 ? v : fallback;
}

function stripTrailingSlash(s: string): string {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}
