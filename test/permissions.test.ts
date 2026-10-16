import assert from "node:assert/strict";
import test from "node:test";
import { CHECKS, calculate, P } from "../src/permissions.ts";
import { language, report } from "../src/text.ts";
import { all, context, otherRoleId, required, roleId, snapshot } from "./fixtures.ts";

test("server role union grants member permissions without using role positions", () => {
  const s = snapshot();
  required(s.roles[0]).permissions = P.view;
  required(s.roles[1]).permissions = all;
  assert.ok(CHECKS.every((key) => calculate(s, s.member, 0).rows[key].allowed));
});
for (const key of CHECKS) {
  test(`everyone overwrite denies ${key}`, () => {
    const s = snapshot();
    s.overwrites = [{ id: s.guildId, type: 0, deny: P[key], allow: 0n }];
    assert.equal(calculate(s, s.member, 0).rows[key].allowed, false);
  });
  test(`member overwrite restores ${key} after role deny`, () => {
    const s = snapshot();
    s.overwrites = [
      { id: roleId, type: 0, deny: P[key], allow: 0n },
      { id: s.member.id, type: 1, deny: 0n, allow: P[key] },
    ];
    const row = calculate(s, s.member, 0).rows[key];
    assert.equal(row.allowed, true);
    assert.equal(row.layer, "member");
  });
}
test("conflicting member-role overwrites combine allows after all denies in any order", () => {
  const s = snapshot();
  s.member.roles.push(otherRoleId);
  s.overwrites = [
    { id: roleId, type: 0, deny: all, allow: 0n },
    { id: otherRoleId, type: 0, deny: 0n, allow: all },
  ];
  assert.ok(CHECKS.every((key) => calculate(s, s.member, 0).rows[key].allowed));
  s.overwrites.reverse();
  assert.ok(CHECKS.every((key) => calculate(s, s.member, 0).rows[key].allowed));
});
test("unrelated role and unrelated member overwrites do not apply", () => {
  const s = snapshot();
  s.overwrites = [
    { id: otherRoleId, type: 0, deny: all, allow: 0n },
    { id: s.bot.id, type: 1, deny: all, allow: 0n },
  ];
  assert.ok(CHECKS.every((key) => calculate(s, s.member, 0).rows[key].allowed));
});
for (const kind of ["owner", "admin"] as const) {
  test(`${kind} bypasses channel overwrites and timeout`, () => {
    const s = snapshot();
    if (kind === "owner") s.ownerId = s.member.id;
    else required(s.roles[1]).permissions = P.admin;
    s.member.timeout = 100;
    s.overwrites = [{ id: s.member.id, type: 1, deny: all, allow: 0n }];
    const result = calculate(s, s.member, 0);
    assert.equal(result.elevated, true);
    assert.ok(CHECKS.every((key) => result.rows[key].allowed && result.rows[key].layer === kind));
  });
}
test("active timeout retains only visibility/history; exact expiry restores permissions", () => {
  const s = snapshot();
  s.member.timeout = 50;
  const result = calculate(s, s.member, 49);
  assert.ok(result.rows.view.allowed && result.rows.history.allowed);
  assert.ok(!result.rows.send.allowed && !result.rows.react.allowed);
  assert.ok(CHECKS.every((key) => calculate(s, s.member, 50).rows[key].allowed));
});
test("pending screening denies message actions and new reactions", () => {
  const s = snapshot();
  s.member.pending = true;
  const result = calculate(s, s.member, 0);
  assert.ok(result.rows.view.allowed && result.rows.history.allowed);
  for (const key of ["send", "embed", "attach", "react"] as const)
    assert.equal(result.rows[key].allowed, false);
});
test("hidden channel implicitly blocks every channel action", () => {
  const s = snapshot();
  required(s.roles[0]).permissions = all & ~P.view;
  assert.ok(CHECKS.every((key) => !calculate(s, s.member, 0).rows[key].allowed));
});
test("Send Messages gates embeds/files; new reaction needs history but not sending", () => {
  const s = snapshot();
  required(s.roles[0]).permissions = all & ~P.send;
  const result = calculate(s, s.member, 0);
  assert.equal(result.rows.embed.layer, "cannotSend");
  assert.equal(result.rows.attach.allowed, false);
  assert.equal(result.rows.react.allowed, true);
  required(s.roles[0]).permissions &= ~P.history;
  assert.equal(calculate(s, s.member, 0).rows.react.layer, "noHistory");
});
test("missing everyone or a deleted member role fails closed", () => {
  const s = snapshot();
  s.roles.shift();
  assert.throws(() => calculate(s, s.member, 0));
  const t = snapshot();
  t.member.roles.push("100000000000000099");
  assert.throws(() => calculate(t, t.member, 0));
});
test("4096 base/deny/allow combinations match independent per-permission precedence", () => {
  const keys = ["view", "send", "embed", "history"] as const;
  const mask = (n: number) =>
    keys.reduce((bits, key, index) => bits | (n & (1 << index) ? P[key] : 0n), 0n);
  for (let base = 0; base < 16; base++)
    for (let deny = 0; deny < 16; deny++)
      for (let allow = 0; allow < 16; allow++) {
        const s = snapshot();
        required(s.roles[0]).permissions = mask(base);
        s.overwrites = [{ id: context.guildId, type: 0, deny: mask(deny), allow: mask(allow) }];
        const result = calculate(s, s.member, 0);
        const raw = keys.map(
          (_key, i) =>
            Boolean(allow & (1 << i)) || (Boolean(base & (1 << i)) && !(deny & (1 << i))),
        );
        assert.equal(result.rows.view.allowed, raw[0]);
        assert.equal(result.rows.send.allowed, raw[0] && raw[1]);
        assert.equal(result.rows.embed.allowed, raw[0] && raw[1] && raw[2]);
        assert.equal(result.rows.history.allowed, raw[0] && raw[3]);
      }
});
for (const lang of ["tr", "en"] as const)
  test(`${lang} output fits Discord, includes caveats and never includes identifiers`, () => {
    const s = snapshot();
    const text = report(calculate(s, s.member, 0), lang, 0);
    assert.ok(text.length < 2000);
    for (const id of Object.values(context)) assert.ok(!text.includes(id));
    assert.ok(text.includes("AutoMod") && text.includes("1970-01-01T00:00:00.000Z"));
  });
test("language fallback is deterministic", () => {
  assert.equal(language("tr-TR"), "tr");
  assert.equal(language("de"), "en");
});
