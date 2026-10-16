import { type REST, Routes } from "discord.js";
import type { Member, Overwrite, Role, Snapshot } from "./permissions.ts";

export const isId = (value: unknown): value is string =>
  typeof value === "string" && /^[0-9]{17,20}$/.test(value) && BigInt(value) < 1n << 64n;
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid data");
  return value as Record<string, unknown>;
}
function id(value: unknown): string {
  if (!isId(value)) throw new Error("Invalid identifier");
  return value;
}
function array(value: unknown, max: number): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error("Invalid list");
  return value;
}
function bits(value: unknown): bigint {
  if (typeof value !== "string" || !/^[0-9]{1,40}$/.test(value)) throw new Error("Invalid bits");
  return BigInt(value);
}
function unique(values: string[]) {
  if (new Set(values).size !== values.length) throw new Error("Duplicate identifiers");
}
function member(value: unknown, expected: string): Member {
  const data = object(value);
  const memberId = id(object(data.user).id);
  if (memberId !== expected) throw new Error("Wrong member");
  const roles = array(data.roles, 250).map(id);
  unique(roles);
  if (data.pending !== undefined && typeof data.pending !== "boolean")
    throw new Error("Invalid screening");
  const raw = data.communication_disabled_until;
  const timeout = raw == null ? null : typeof raw === "string" ? Date.parse(raw) : Number.NaN;
  if (timeout !== null && !Number.isFinite(timeout)) throw new Error("Invalid timeout");
  return { id: memberId, roles, pending: data.pending === true, timeout };
}
export interface Context {
  guildId: string;
  channelId: string;
  userId: string;
  botId: string;
}
export function parseSnapshot(values: unknown[], context: Context): Snapshot {
  const [rawGuild, rawRoles, rawChannel, rawMember, rawBot] = values;
  const guild = object(rawGuild);
  const channel = object(rawChannel);
  if (
    id(guild.id) !== context.guildId ||
    id(channel.id) !== context.channelId ||
    id(channel.guild_id) !== context.guildId ||
    channel.type !== 0 ||
    typeof channel.name !== "string"
  )
    throw new Error("Unsupported or inaccessible channel");
  const roles: Role[] = array(rawRoles, 250).map((item) => {
    const role = object(item);
    return { id: id(role.id), permissions: bits(role.permissions) };
  });
  unique(roles.map((role) => role.id));
  const overwrites: Overwrite[] = array(channel.permission_overwrites, 1000).map((item) => {
    const overwrite = object(item);
    if (overwrite.type !== 0 && overwrite.type !== 1) throw new Error("Invalid overwrite");
    return {
      id: id(overwrite.id),
      type: overwrite.type,
      allow: bits(overwrite.allow),
      deny: bits(overwrite.deny),
    };
  });
  unique(overwrites.map((overwrite) => `${overwrite.type}:${overwrite.id}`));
  return {
    guildId: context.guildId,
    ownerId: id(guild.owner_id),
    channelId: context.channelId,
    roles,
    overwrites,
    member: member(rawMember, context.userId),
    bot: member(rawBot, context.botId),
  };
}
export async function readSnapshot(rest: Pick<REST, "get">, context: Context): Promise<Snapshot> {
  if (!Object.values(context).every(isId)) throw new Error("Invalid context");
  const { guildId, channelId, userId, botId } = context;
  const values = await Promise.all([
    rest.get(Routes.guild(guildId)),
    rest.get(Routes.guildRoles(guildId)),
    rest.get(Routes.channel(channelId)),
    rest.get(Routes.guildMember(guildId, userId)),
    rest.get(Routes.guildMember(guildId, botId)),
  ]);
  return parseSnapshot(values, context);
}
