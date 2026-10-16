import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, realpathSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import test from "node:test";
import { config } from "../src/config.ts";
import { command } from "../src/register.ts";
import { makeRest } from "../src/rest.ts";
import { required } from "./fixtures.ts";

test("registration exposes only one self-service command without destructive bulk replacement", () => {
  assert.equal(command.name, "accesssprig");
  assert.equal(command.type, 1);
  assert.ok(!("default_member_permissions" in command));
  assert.ok(!("contexts" in command));
  assert.deepEqual(
    required(command.options[0]).choices.map((choice) => choice.value),
    ["tr", "en"],
  );
});
test("configuration rejects missing values without disclosing input", () => {
  assert.throws(() => config({}), /setup/);
  assert.throws(
    () =>
      config({
        DISCORD_TOKEN: "SECRET_INPUT",
        DISCORD_APPLICATION_ID: "bad",
        DISCORD_GUILD_ID: "bad",
      }),
    (error: Error) => !error.message.includes("SECRET_INPUT"),
  );
});
test("REST disables retries and rejects rate-limit queues", async () => {
  const rest = makeRest("fake-test-token");
  assert.equal(rest.options.retries, 0);
  assert.equal(rest.options.timeout, 10_000);
  assert.equal(typeof rest.options.rejectOnRateLimit, "function");
});
for (const entry of ["src/main.ts", "src/register.ts", "scripts/setup.mjs"])
  test(`unconfigured ${entry} exits 1 without writing configuration or contacting Discord`, () => {
    const directory = mkdtempSync(join(tmpdir(), "accesssprig-smoke-"));
    const parent = realpathSync(tmpdir());
    const actual = realpathSync(directory);
    assert.ok(actual.startsWith(parent + sep) && actual !== parent);
    try {
      const env = { ...process.env };
      for (const key of [
        "DISCORD_TOKEN",
        "DISCORD_APPLICATION_ID",
        "DISCORD_GUILD_ID",
        "NODE_OPTIONS",
      ])
        delete env[key];
      const result = spawnSync(process.execPath, [resolve(entry)], {
        cwd: actual,
        env,
        encoding: "utf8",
        timeout: 15_000,
      });
      assert.equal(result.status, 1, result.stderr);
      assert.ok(!result.error);
      assert.deepEqual(readdirSync(actual), []);
    } finally {
      rmSync(actual, { recursive: true, force: true });
    }
  });
