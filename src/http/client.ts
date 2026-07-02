/**
 * Thin HTTP client used by every tool. Reads the API base URL from
 * config at call time so test/CLI scripts can swap it without
 * restarting the server.
 */
import type { ServerConfig } from "../config.js";
import { getAuthHeaders } from "./auth.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiFetchOptions {
  /** Attach Bearer token. Set false for /health, /openapi.json, etc. */
  auth: boolean;
  method?: HttpMethod;
  /** Serialized as JSON; sets Content-Type: application/json. */
  jsonBody?: unknown;
  /** URL query string. Use OpenAPI keys verbatim (e.g. `filter[name]`). */
  query?: Record<string, string | number | undefined | null>;
  /** Override Accept; defaults to application/json. */
  accept?: string;
}

export interface ApiFetchResult<T = unknown> {
  status: number;
  ok: boolean;
  body: T;
}

/**
 * Perform a request against the configured API.
 *
 * - Builds the URL by joining config.apiBaseUrl with `path`.
 * - Appends query params (skipping null/undefined values).
 * - If `auth: true`, calls getAccessToken; throws with a setup hint
 *   if no auth is configured.
 * - Returns the parsed JSON body, or the raw text if parsing failed.
 */
export async function apiFetch<T = unknown>(
  config: ServerConfig,
  path: string,
  options: ApiFetchOptions,
): Promise<ApiFetchResult<T>> {
  const pathPart = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(pathPart, `${config.apiBaseUrl}/`);

  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null) continue;
      url.searchParams.append(key, String(value));
    }
  }

  const headers: Record<string, string> = {
    Accept: options.accept ?? "application/json",
  };

  if (options.auth) {
    const authHeaders = await getAuthHeaders();
    if (!authHeaders) {
      throw new Error(
        "auth: true but no token configured. Set BEARER_TOKEN, " +
          "OAUTH_TOKEN_URL + OAUTH_CLIENT_ID + OAUTH_CLIENT_SECRET, " +
          "or API_KEY_VALUE.",
      );
    }
    Object.assign(headers, authHeaders);
  }

  let requestBody: string | undefined;
  if (options.jsonBody !== undefined) {
    headers["Content-Type"] = "application/json";
    requestBody = JSON.stringify(options.jsonBody);
  }

  const res = await fetch(url.toString(), {
    method: options.method ?? "GET",
    headers,
    body: requestBody,
  });

  const text = await res.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  return { status: res.status, ok: res.ok, body: body as T };
}
