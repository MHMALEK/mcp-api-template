/**
 * Auth strategies for the wrapped API.
 *
 * Two modes are supported out of the box:
 *
 *   1. Bearer token from env (BEARER_TOKEN). Cheapest path.
 *   2. OAuth2 client_credentials with token caching
 *      (OAUTH_TOKEN_URL, OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET).
 *   3. Static API key header (API_KEY_VALUE, optional API_KEY_HEADER).
 *
 * If neither is configured, calls with `auth: true` will throw a
 * clear error pointing at the env vars. Calls with `auth: false`
 * pass through unauthenticated (use for /health, /openapi.json, etc).
 */

interface TokenCacheEntry {
  token: string;
  expiresAtMs: number;
  cacheKey: string;
}

let tokenCache: TokenCacheEntry | null = null;

function cacheKey(tokenUrl: string, clientId: string, secret: string): string {
  return `${tokenUrl}|${clientId}|${secret}`;
}

/** Returns a Bearer access token, refreshing if expired or missing. */
export async function getAccessToken(): Promise<string | undefined> {
  const direct = process.env.BEARER_TOKEN?.trim();
  if (direct) return direct;

  const tokenUrl = process.env.OAUTH_TOKEN_URL?.trim();
  const clientId = process.env.OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.OAUTH_CLIENT_SECRET?.trim();
  if (!tokenUrl || !clientId || !clientSecret) return undefined;

  const key = cacheKey(tokenUrl, clientId, clientSecret);
  // Refresh 30s before expiry to avoid races with in-flight requests.
  if (tokenCache?.cacheKey === key && Date.now() < tokenCache.expiresAtMs - 30_000) {
    return tokenCache.token;
  }

  const fresh = await fetchClientCredentialsToken(tokenUrl, clientId, clientSecret);
  tokenCache = { ...fresh, cacheKey: key };
  return fresh.token;
}

/** Returns the configured auth headers for an upstream API request. */
export async function getAuthHeaders(): Promise<Record<string, string> | undefined> {
  const token = await getAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  const apiKey = process.env.API_KEY_VALUE?.trim();
  if (!apiKey) return undefined;

  const headerName = process.env.API_KEY_HEADER?.trim() || "x-api-key";
  return { [headerName]: apiKey };
}

/** Force a token refresh (e.g. on 401 from upstream). */
export function clearTokenCache(): void {
  tokenCache = null;
}

async function fetchClientCredentialsToken(
  tokenUrl: string,
  clientId: string,
  clientSecret: string,
): Promise<{ token: string; expiresAtMs: number }> {
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`OAuth token request failed: ${res.status} ${text.slice(0, 400)}`);
  }

  let data: { access_token?: string; expires_in?: number };
  try {
    data = JSON.parse(text) as { access_token?: string; expires_in?: number };
  } catch {
    throw new Error(`OAuth token response was not JSON: ${text.slice(0, 200)}`);
  }

  if (!data.access_token) {
    throw new Error("OAuth token response missing access_token");
  }

  const expiresIn =
    typeof data.expires_in === "number" && data.expires_in > 0 ? data.expires_in : 300;
  return {
    token: data.access_token,
    expiresAtMs: Date.now() + expiresIn * 1000,
  };
}
