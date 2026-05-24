# mcp-api-template

A template MCP server that wraps any HTTP/OpenAPI API in three generic tools, so you can drop a new API into Claude / Cursor / VS Code in minutes instead of writing a per-endpoint server from scratch.

```
┌────────────────────────────────┐                     ┌───────────────┐
│  Claude / Cursor / Claude Code │── stdio (MCP) ──→   │ mcp-api-      │ ─ HTTP →  Your API
└────────────────────────────────┘                     │ template      │
                                                       └───────────────┘
                                                          api_health
                                                          api_openapi
                                                          api_request
```

## The three tools

| Tool | What it does |
|---|---|
| `api_health` | GETs the configured health path. Use first to verify connectivity. |
| `api_openapi` | Fetches the live OpenAPI spec. The agent learns endpoint shapes from this, not from anything baked into the server. |
| `api_request` | Generic passthrough: `method`, `path`, `body`, `query`, `auth`. Covers every endpoint without per-route definitions. |

The `api_request` description includes an **agent policy** nudge — "do NOT invent payload values; ask the user if anything required is missing" — which keeps Claude from confidently POSTing made-up data when the user has been vague.

## Quick start (against jsonplaceholder.typicode.com)

```sh
git clone https://github.com/MHMALEK/mcp-api-template
cd mcp-api-template
npm install
npm run build
node dist/index.js   # speaks MCP over stdio
```

Register in Claude Code:

```sh
claude mcp add api-template -- node /absolute/path/to/mcp-api-template/dist/index.js
```

Register in Cursor / Claude Desktop (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "api-template": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-api-template/dist/index.js"]
    }
  }
}
```

Now ask the agent: *"call api_request to fetch posts/1 from the API"* and it'll work, no further configuration needed.

## Wrapping your own API

Three environment variables get you running against your API:

```sh
export API_BASE_URL=https://api.example.com
export API_HEALTH_PATH=/health
export API_OPENAPI_PATH=/v1/openapi.json
```

Optional auth — pick whichever your API needs:

```sh
# Option A — static Bearer token
export BEARER_TOKEN="eyJhbGciOi..."

# Option B — OAuth2 client_credentials (server fetches + caches tokens)
export OAUTH_TOKEN_URL=https://auth.example.com/oauth2/token
export OAUTH_CLIENT_ID=your-client-id
export OAUTH_CLIENT_SECRET=your-client-secret
```

Token caching is automatic for OAuth2: the server refreshes 30s before expiry, keyed on (token URL, client id, client secret) so multiple clients in the same process don't step on each other.

See [`.env.example`](.env.example) for the full list.

## Extending it

The three generic tools cover most read flows out of the box. For repeated write operations (create user, place order, etc.) it's worth adding typed tools alongside `api_request` so the agent has a clearer schema target.

The pattern:

1. Add `src/tools/<your-tool>.ts` modeled on [`api-health.ts`](src/tools/api-health.ts) (simple) or [`api-request.ts`](src/tools/api-request.ts) (with Zod inputs).
2. Export a `register<Name>` function.
3. Call it from [`src/index.ts`](src/index.ts).

That's it — no plugin system, no registration ceremony. Each tool is one file, one register call.

Tips for write tools:

- Define `inputSchema` with Zod so the agent gets argument completion.
- Use the agent-policy line in the description (see [`api-request.ts`](src/tools/api-request.ts)) to discourage hallucinated payloads.
- Don't re-validate the request body in Zod — let the API return the canonical validation error. Maintaining a second copy of every payload schema is a maintenance trap.

## Repository layout

```
src/
├── config.ts           # env → ServerConfig
├── http/
│   ├── client.ts       # apiFetch — URL building, headers, auth attach
│   ├── auth.ts         # Bearer + OAuth2 client_credentials with cache
│   └── query.ts        # safe URL-search-params coercion
├── tools/
│   ├── api-health.ts   # GET <healthPath>
│   ├── api-openapi.ts  # GET <openapiPath>
│   ├── api-request.ts  # generic passthrough
│   └── shared.ts       # toolText / fromFetch / fromError
└── index.ts            # boots stdio MCP server
```

## Docker

```sh
docker build -t mcp-api-template .
docker run -i --rm \
  -e API_BASE_URL=https://api.example.com \
  -e BEARER_TOKEN=$TOKEN \
  mcp-api-template
```

Note the `-i` — MCP uses stdio, which means STDIN must stay open.

## Tests

```sh
npm test
```

Tests cover the pure pieces (`coerceQuery`, `loadConfig`). The HTTP client and tool registration paths are integration-test territory — easiest to verify by pointing the server at a real API and exercising it from Claude.

## License

[MIT](LICENSE)
