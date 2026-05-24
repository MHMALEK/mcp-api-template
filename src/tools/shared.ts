/**
 * Helpers shared by every tool. Keeping these in one place means
 * every tool returns the same shape and the same error envelope.
 */

import type { ApiFetchResult } from "../http/client.js";

export interface ToolResultPayload {
  content: { type: "text"; text: string }[];
  isError?: true;
  [x: string]: unknown;
}

/** Wrap any payload in the MCP content-list shape. */
export function toolText(payload: unknown, isError: boolean): ToolResultPayload {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload, null, 2);
  const base: ToolResultPayload = { content: [{ type: "text", text }] };
  return isError ? { ...base, isError: true } : base;
}

/** Format an ApiFetchResult for a tool response. */
export function fromFetch(result: ApiFetchResult): ToolResultPayload {
  return toolText({ status: result.status, ok: result.ok, body: result.body }, !result.ok);
}

/** Format a thrown error from a tool body uniformly. */
export function fromError(err: unknown): ToolResultPayload {
  const message = err instanceof Error ? err.message : String(err);
  return toolText({ error: message }, true);
}
