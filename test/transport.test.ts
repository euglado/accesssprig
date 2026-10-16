import assert from "node:assert/strict";
import { Readable } from "node:stream";
import test from "node:test";
import { Routes } from "discord.js";
import { makeRest } from "../src/rest.ts";
import { context } from "./fixtures.ts";

for (const mode of ["server-error", "rate-limit", "connection-reset"] as const)
  test(`actual REST adapter makes one request for ${mode} without network or retry`, async () => {
    const rest = makeRest("fake-test-token");
    let calls = 0;
    rest.options.makeRequest = async () => {
      calls++;
      if (mode === "connection-reset")
        throw Object.assign(new Error("test connection reset"), { code: "ECONNRESET" });
      const status = mode === "server-error" ? 503 : 429;
      const text = JSON.stringify({ message: "test failure", retry_after: 0.01, global: false });
      return {
        status,
        statusText: "test error",
        ok: false,
        bodyUsed: false,
        body: Readable.from([text]),
        headers: new Headers({
          "content-type": "application/json",
          "retry-after": "0.01",
          "x-ratelimit-limit": "1",
          "x-ratelimit-remaining": "0",
          "x-ratelimit-reset-after": "0.01",
        }),
        json: async () => JSON.parse(text),
        text: async () => text,
        arrayBuffer: async () => new ArrayBuffer(0),
      };
    };
    try {
      await assert.rejects(rest.get(Routes.guild(context.guildId)));
      assert.equal(calls, 1);
    } finally {
      rest.clearHashSweeper();
      rest.clearHandlerSweeper();
    }
  });
