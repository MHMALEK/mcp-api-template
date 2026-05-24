/**
 * Coerce a free-form record into the (string | number)-valued shape
 * apiFetch wants. Booleans become "true"/"false"; nulls and
 * undefineds drop out; objects and arrays are dropped (warn on stderr).
 *
 * This exists so tool definitions can accept `z.record(z.unknown())`
 * and still get sensible URLSearchParams behavior.
 */
export function coerceQuery(
  q: Record<string, unknown> | undefined,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (!q) return out;
  for (const [key, value] of Object.entries(q)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number") {
      out[key] = value;
      continue;
    }
    if (typeof value === "boolean") {
      out[key] = value ? "true" : "false";
      continue;
    }
    console.error(`[mcp-api-template] dropping non-scalar query param ${key}`);
  }
  return out;
}
