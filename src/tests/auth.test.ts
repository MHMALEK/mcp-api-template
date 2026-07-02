import test from "node:test";
import assert from "node:assert/strict";
import { getAuthHeaders } from "../http/auth.js";

test("getAuthHeaders: returns bearer auth when BEARER_TOKEN is set", async () => {
  const saved = { ...process.env };
  process.env.BEARER_TOKEN = "bearer-test-token";
  delete process.env.API_KEY_VALUE;
  try {
    assert.deepEqual(await getAuthHeaders(), {
      Authorization: "Bearer bearer-test-token",
    });
  } finally {
    process.env = saved;
  }
});

test("getAuthHeaders: returns API key header when API_KEY_VALUE is set", async () => {
  const saved = { ...process.env };
  delete process.env.BEARER_TOKEN;
  delete process.env.OAUTH_TOKEN_URL;
  delete process.env.OAUTH_CLIENT_ID;
  delete process.env.OAUTH_CLIENT_SECRET;
  process.env.API_KEY_HEADER = "x-api-key";
  process.env.API_KEY_VALUE = "test-key";
  try {
    assert.deepEqual(await getAuthHeaders(), {
      "x-api-key": "test-key",
    });
  } finally {
    process.env = saved;
  }
});

test("getAuthHeaders: uses x-api-key as the default API key header", async () => {
  const saved = { ...process.env };
  delete process.env.BEARER_TOKEN;
  delete process.env.OAUTH_TOKEN_URL;
  delete process.env.OAUTH_CLIENT_ID;
  delete process.env.OAUTH_CLIENT_SECRET;
  delete process.env.API_KEY_HEADER;
  process.env.API_KEY_VALUE = "test-key";
  try {
    assert.deepEqual(await getAuthHeaders(), {
      "x-api-key": "test-key",
    });
  } finally {
    process.env = saved;
  }
});
