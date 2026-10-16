import assert from "node:assert/strict";
import test from "node:test";
import { Handler } from "../src/handler.ts";
import { P } from "../src/permissions.ts";
import { readSnapshot } from "../src/snapshot.ts";
import { Gate, Sessions, TTL } from "../src/state.ts";
import { context, messageId, port, raw, required, snapshot } from "./fixtures.ts";

async function opened() {
  let now = 0;
  let calls = 0;
  let data = snapshot();
  const handler = new Handler(
    async (ids) => {
      assert.deepEqual(ids, context);
      calls++;
      return data;
    },
    () => now,
  );
  const first = port();
  await handler.handle(first.value);
  const key = required([...handler.sessions.items.keys()][0]);
  return {
    handler,
    key,
    first,
    advance: (n = 5000) => {
      now += n;
    },
    calls: () => calls,
    set: (value: ReturnType<typeof snapshot>) => {
      data = value;
    },
  };
}
test("real handler and raw snapshot adapter receive only four IDs from full interaction port", async () => {
  let calls = 0;
  const handler = new Handler(
    (ids) => readSnapshot({ get: async () => raw()[calls++ % 5] }, ids),
    () => 0,
  );
  const p = port();
  await handler.handle(p.value);
  assert.equal(calls, 5);
  assert.equal(p.defers(), 1);
  assert.equal(p.errors.length, 0);
  assert.ok(required(p.edits[0]).content.includes("ALLOWED"));
  assert.deepEqual(required(p.edits[0]).allowed_mentions, { parse: [] });
  const session = required([...handler.sessions.items.values()][0]);
  assert.deepEqual(
    Object.keys(session).sort(),
    ["guildId", "channelId", "userId", "botId", "language", "messageId", "expires", "busy"].sort(),
  );
  assert.equal(session.messageId, messageId);
});
test("refresh reads current data and explains changed permissions without extending TTL", async () => {
  const f = await opened();
  f.advance();
  const s = snapshot();
  required(s.roles[0]).permissions &= ~P.send;
  f.set(s);
  const p = port({ action: "refresh", key: f.key });
  await f.handler.handle(p.value);
  assert.equal(f.calls(), 2);
  assert.ok(required(p.edits[0]).content.includes("BLOCKED — Send messages"));
  assert.equal(required(f.handler.sessions.items.get(f.key)).expires, TTL);
});
test("close works during read cooldown, clears RAM and removes buttons without REST reads", async () => {
  const f = await opened();
  const p = port({ action: "close", key: f.key });
  await f.handler.handle(p.value);
  assert.equal(f.calls(), 1);
  assert.equal(f.handler.sessions.items.size, 0);
  assert.deepEqual(required(p.edits[0]).components, []);
  assert.ok(required(p.edits[0]).content.includes("closed"));
});
for (const field of ["guildId", "channelId", "userId", "botId", "messageId"] as const)
  test(`button rejects changed ${field} before loading`, async () => {
    const f = await opened();
    f.advance();
    const p = port({ action: "refresh", key: f.key, [field]: "100000000000000099" });
    await f.handler.handle(p.value);
    assert.equal(f.calls(), 1);
    assert.equal(p.errors.length, 1);
    assert.equal(p.defers(), 0);
    assert.ok(f.handler.sessions.items.has(f.key));
  });
test("public-message buttons are rejected without reading or altering a report", async () => {
  const f = await opened();
  f.advance();
  const p = port({ action: "refresh", key: f.key, privateMessage: false });
  await f.handler.handle(p.value);
  assert.equal(p.errors.length, 1);
  assert.equal(f.calls(), 1);
});
test("expired controls reject at the exact TTL", async () => {
  const f = await opened();
  f.advance(TTL);
  const p = port({ action: "refresh", key: f.key });
  await f.handler.handle(p.value);
  assert.equal(p.errors.length, 1);
  assert.equal(f.handler.sessions.items.size, 0);
});
for (const reason of ["botAdmin", "botHidden", "userHidden", "missingRole"] as const)
  test(`fresh ${reason} fails privately and removes stale controls`, async () => {
    const f = await opened();
    f.advance();
    const s = snapshot();
    if (reason === "botAdmin") {
      s.bot.roles = [required(s.roles[1]).id];
      required(s.roles[1]).permissions = P.admin;
    }
    if (reason === "botHidden") s.overwrites = [{ id: s.bot.id, type: 1, deny: P.view, allow: 0n }];
    if (reason === "userHidden")
      s.overwrites = [{ id: s.member.id, type: 1, deny: P.view, allow: 0n }];
    if (reason === "missingRole") s.roles = [required(s.roles[0])];
    f.set(s);
    const p = port({ action: "refresh", key: f.key });
    await f.handler.handle(p.value);
    assert.equal(f.handler.sessions.items.size, 0);
    assert.equal(required(p.edits[0]).components.length, 0);
    assert.ok(!required(p.edits[0]).content.includes("ALLOWED"));
  });
test("cooldown denies repeated command and another channel without issuing reads", async () => {
  const f = await opened();
  const p = port({ channelId: "100000000000000099" });
  await f.handler.handle(p.value);
  assert.equal(f.calls(), 1);
  assert.equal(p.errors.length, 1);
});
test("concurrent refresh/close cannot mutate the same session during pending reads", async () => {
  const f = await opened();
  f.advance();
  let finish: ((value: ReturnType<typeof snapshot>) => void) | undefined;
  const handler = new Handler(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
    () => 5000,
  );
  handler.sessions.items.set(f.key, required(f.handler.sessions.items.get(f.key)));
  const a = port({ action: "refresh", key: f.key });
  const pending = handler.handle(a.value);
  await Promise.resolve();
  const b = port({ action: "close", key: f.key });
  await handler.handle(b.value);
  assert.equal(b.errors.length, 1);
  assert.equal(b.edits.length, 0);
  assert.ok(finish);
  finish(snapshot());
  await pending;
  assert.equal(a.edits.length, 1);
  assert.equal(handler.gate.active.size, 0);
});
test("expiry during API reads invalidates the old report", async () => {
  const f = await opened();
  let now = 5000;
  const handler = new Handler(
    async () => {
      now = TTL;
      return snapshot();
    },
    () => now,
  );
  handler.sessions.items.set(f.key, required(f.handler.sessions.items.get(f.key)));
  const p = port({ action: "refresh", key: f.key });
  await handler.handle(p.value);
  assert.equal(handler.sessions.items.size, 0);
  assert.equal(required(p.edits[0]).components.length, 0);
});
test("failed API read is sanitized, has no retry and releases the gate", async () => {
  let calls = 0;
  const handler = new Handler(
    async () => {
      calls++;
      throw new Error("SENSITIVE_FAKE_ERROR");
    },
    () => 0,
  );
  const p = port();
  await handler.handle(p.value);
  assert.equal(calls, 1);
  assert.ok(!required(p.edits[0]).content.includes("SENSITIVE"));
  assert.equal(handler.gate.active.size, 0);
});
test("failed acknowledgement never reads API; failed edits clear sessions", async () => {
  let calls = 0;
  const handler = new Handler(
    async () => {
      calls++;
      return snapshot();
    },
    () => 0,
  );
  await handler.handle(
    port({
      defer: async () => {
        throw new Error("ack");
      },
    }).value,
  );
  assert.equal(calls, 0);
  const other = port({
    userId: "100000000000000099",
    edit: async () => {
      throw new Error("edit");
    },
  });
  await handler.handle(other.value);
  assert.equal(handler.sessions.items.size, 0);
  assert.equal(handler.gate.active.size, 0);
});
test("a new command in the same channel revokes only that member's prior controls", async () => {
  const f = await opened();
  f.advance();
  const p = port();
  await f.handler.handle(p.value);
  assert.equal(f.handler.sessions.items.size, 1);
  assert.ok(!f.handler.sessions.items.has(f.key));
});
test("session capacity is bounded and expiry permits new sessions", () => {
  const sessions = new Sessions();
  for (let i = 0; i < 100; i++) sessions.create({ ...context, userId: String(i) }, "en", 0);
  assert.throws(() => sessions.create(context, "en", 0));
  sessions.create(context, "en", TTL);
  assert.equal(sessions.items.size, 1);
});
test("gates bound concurrent reads and cooldown records; pruning restores capacity", () => {
  const gate = new Gate();
  const releases: (() => void)[] = [];
  for (let i = 0; i < 50; i++) releases.push(gate.enter(String(i), 0));
  assert.throws(() => gate.enter("extra", 0));
  for (const release of releases) release();
  for (let i = 50; i < 1000; i++) gate.enter(String(i), 0)();
  assert.throws(() => gate.enter("extra", 0));
  gate.enter("extra", 5000)();
  assert.equal(gate.cooldowns.size, 1);
});
