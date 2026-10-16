import assert from "node:assert/strict";
import test from "node:test";
import { isId, parseSnapshot, readSnapshot } from "../src/snapshot.ts";
import { context, raw, snapshot } from "./fixtures.ts";

test("complete raw REST objects parse without keeping names or API objects", () => {
  assert.deepEqual(parseSnapshot(raw(), context), snapshot());
  assert.ok(!JSON.stringify(raw()).includes("token"));
});
test("fresh snapshot uses exactly five GET endpoints without member lists or messages", async () => {
  const paths: string[] = [];
  const values = raw();
  const parsed = await readSnapshot(
    {
      get: async (path) => {
        paths.push(path);
        return values[paths.length - 1];
      },
    },
    context,
  );
  assert.deepEqual(parsed, snapshot());
  assert.deepEqual(paths, [
    `/guilds/${context.guildId}`,
    `/guilds/${context.guildId}/roles`,
    `/channels/${context.channelId}`,
    `/guilds/${context.guildId}/members/${context.userId}`,
    `/guilds/${context.guildId}/members/${context.botId}`,
  ]);
});
for (const [name, index, field, value] of [
  ["guild mismatch", 0, "id", "100000000000000099"],
  ["missing owner", 0, "owner_id", null],
  ["channel mismatch", 2, "id", "100000000000000099"],
  ["foreign guild", 2, "guild_id", "100000000000000099"],
  ["thread", 2, "type", 11],
  ["announcement", 2, "type", 5],
  ["forum", 2, "type", 15],
  ["voice", 2, "type", 2],
  ["obfuscated metadata", 2, "name", null],
  ["missing overwrites", 2, "permission_overwrites", null],
  [
    "bad overwrite type",
    2,
    "permission_overwrites",
    [{ id: context.guildId, type: 3, deny: "0", allow: "0" }],
  ],
  [
    "negative bits",
    2,
    "permission_overwrites",
    [{ id: context.guildId, type: 0, deny: "-1", allow: "0" }],
  ],
  ["wrong user", 3, "user", { id: context.botId }],
  ["wrong bot", 4, "user", { id: context.userId }],
  ["bad roles", 3, "roles", null],
  ["duplicate member role", 3, "roles", ["100000000000000006", "100000000000000006"]],
  ["bad screening", 3, "pending", "false"],
  ["invalid timeout", 3, "communication_disabled_until", "tomorrow"],
] as const)
  test(`reject ${name}`, () => {
    const values = raw();
    (values[index] as Record<string, unknown>)[field] = value;
    assert.throws(() => parseSnapshot(values, context));
  });
test("duplicate guild roles and duplicate overwrites are rejected", () => {
  const values = raw();
  const roles = values[1] as unknown[];
  roles.push(roles[0]);
  assert.throws(() => parseSnapshot(values, context));
  const s = snapshot();
  s.overwrites = [
    { id: s.guildId, type: 0, deny: 0n, allow: 0n },
    { id: s.guildId, type: 0, deny: 0n, allow: 0n },
  ];
  assert.throws(() => parseSnapshot(raw(s), context));
});
test("malformed contexts are rejected before issuing REST requests", async () => {
  let calls = 0;
  await assert.rejects(
    readSnapshot(
      {
        get: async () => {
          calls++;
          return {};
        },
      },
      { ...context, userId: "../users" },
    ),
  );
  assert.equal(calls, 0);
  assert.ok(isId(context.guildId));
  assert.ok(!isId("18446744073709551616"));
});
