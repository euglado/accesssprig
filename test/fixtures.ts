import type { Payload, Port } from "../src/handler.ts";
import { P, type Snapshot } from "../src/permissions.ts";
import type { Context } from "../src/snapshot.ts";
export function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Missing test fixture");
  return value;
}
export const context: Context = {
  guildId: "100000000000000001",
  channelId: "100000000000000002",
  userId: "100000000000000003",
  botId: "100000000000000004",
};
export const roleId = "100000000000000006";
export const otherRoleId = "100000000000000007";
export const messageId = "100000000000000008";
export const all = P.view | P.send | P.embed | P.attach | P.history | P.react;
export function snapshot(): Snapshot {
  return {
    guildId: context.guildId,
    channelId: context.channelId,
    ownerId: "100000000000000005",
    roles: [
      { id: context.guildId, permissions: all },
      { id: roleId, permissions: 0n },
      { id: otherRoleId, permissions: 0n },
    ],
    overwrites: [],
    member: { id: context.userId, roles: [roleId], pending: false, timeout: null },
    bot: { id: context.botId, roles: [], pending: false, timeout: null },
  };
}
export function raw(s = snapshot()): unknown[] {
  return [
    { id: s.guildId, owner_id: s.ownerId },
    s.roles.map((role) => ({ id: role.id, permissions: role.permissions.toString() })),
    {
      id: s.channelId,
      guild_id: s.guildId,
      name: "test-channel",
      type: 0,
      permission_overwrites: s.overwrites.map((o) => ({
        ...o,
        allow: o.allow.toString(),
        deny: o.deny.toString(),
      })),
    },
    {
      user: { id: s.member.id },
      roles: s.member.roles,
      pending: s.member.pending,
      communication_disabled_until:
        s.member.timeout === null ? null : new Date(s.member.timeout).toISOString(),
    },
    {
      user: { id: s.bot.id },
      roles: s.bot.roles,
      pending: s.bot.pending,
      communication_disabled_until:
        s.bot.timeout === null ? null : new Date(s.bot.timeout).toISOString(),
    },
  ];
}
export function port(overrides: Partial<Port> = {}) {
  const edits: Payload[] = [];
  const errors: string[] = [];
  let defers = 0;
  const value: Port = {
    ...context,
    language: "en",
    action: "command",
    key: "",
    messageId,
    privateMessage: true,
    defer: async () => {
      defers++;
    },
    edit: async (payload) => {
      edits.push(payload);
      return messageId;
    },
    reject: async (content) => {
      errors.push(content);
    },
    ...overrides,
  };
  return { value, edits, errors, defers: () => defers };
}
