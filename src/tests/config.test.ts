import test from "node:test";
import assert from "node:assert/strict";
import { defaultConfig, loadConfig } from "../config.js";

test("loadConfig: returns defaults when env is empty", () => {
  const saved = { ...process.env };
  for (const k of [
    "API_BASE_URL",
    "API_OPENAPI_PATH",
    "API_HEALTH_PATH",
    "MCP_SERVER_NAME",
    "MCP_SERVER_VERSION",
  ]) {
    delete process.env[k];
  }
  try {
    assert.deepEqual(loadConfig(), defaultConfig);
  } finally {
    process.env = saved;
  }
});

test("loadConfig: strips trailing slash from apiBaseUrl", () => {
  process.env.API_BASE_URL = "https://example.com/api/";
  try {
    assert.equal(loadConfig().apiBaseUrl, "https://example.com/api");
  } finally {
    delete process.env.API_BASE_URL;
  }
});

test("loadConfig: empty-string env is treated as unset", () => {
  process.env.API_BASE_URL = "   ";
  try {
    assert.equal(loadConfig().apiBaseUrl, defaultConfig.apiBaseUrl);
  } finally {
    delete process.env.API_BASE_URL;
  }
});
