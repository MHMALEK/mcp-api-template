import test from "node:test";
import assert from "node:assert/strict";
import { coerceQuery } from "../http/query.js";

test("coerceQuery: undefined input -> empty object", () => {
  assert.deepEqual(coerceQuery(undefined), {});
});

test("coerceQuery: strings, numbers pass through", () => {
  assert.deepEqual(
    coerceQuery({ name: "ada", page: 2 }),
    { name: "ada", page: 2 },
  );
});

test("coerceQuery: booleans become 'true' / 'false'", () => {
  assert.deepEqual(
    coerceQuery({ active: true, deleted: false }),
    { active: "true", deleted: "false" },
  );
});

test("coerceQuery: null and undefined values drop out", () => {
  assert.deepEqual(
    coerceQuery({ a: 1, b: null, c: undefined }),
    { a: 1 },
  );
});

test("coerceQuery: objects and arrays are dropped (with warning)", () => {
  const origErr = console.error;
  let warned = 0;
  console.error = () => {
    warned++;
  };
  try {
    assert.deepEqual(
      coerceQuery({ keep: "x", obj: { a: 1 }, arr: [1, 2] }),
      { keep: "x" },
    );
    assert.equal(warned, 2);
  } finally {
    console.error = origErr;
  }
});

test("coerceQuery: preserves OpenAPI-style bracket keys", () => {
  assert.deepEqual(
    coerceQuery({ "page[limit]": 50, "filter[name]": "ada" }),
    { "page[limit]": 50, "filter[name]": "ada" },
  );
});
