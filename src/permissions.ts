export const P = {
  admin: 8n,
  react: 64n,
  view: 1024n,
  send: 2048n,
  embed: 16384n,
  attach: 32768n,
  history: 65536n,
} as const;
export const CHECKS = ["view", "send", "embed", "attach", "history", "react"] as const;
export type Check = (typeof CHECKS)[number];
export type Layer =
  | "roles"
  | "everyone"
  | "channelRoles"
  | "member"
  | "owner"
  | "admin"
  | "timeout"
  | "screening"
  | "hidden"
  | "cannotSend"
  | "noHistory";
export interface Role {
  id: string;
  permissions: bigint;
}
export interface Overwrite {
  id: string;
  type: 0 | 1;
  allow: bigint;
  deny: bigint;
}
export interface Member {
  id: string;
  roles: string[];
  pending: boolean;
  timeout: number | null;
}
export interface Snapshot {
  guildId: string;
  ownerId: string;
  channelId: string;
  roles: Role[];
  overwrites: Overwrite[];
  member: Member;
  bot: Member;
}
export interface Result {
  permissions: bigint;
  elevated: boolean;
  rows: Record<Check, { allowed: boolean; layer: Layer }>;
}
export function calculate(snapshot: Snapshot, member: Member, now: number): Result {
  const everyone = snapshot.roles.find((role) => role.id === snapshot.guildId);
  if (!everyone) throw new Error("Incomplete permissions");
  let bits = everyone.permissions;
  for (const id of member.roles) {
    if (id === snapshot.guildId) throw new Error("Invalid member roles");
    const role = snapshot.roles.find((item) => item.id === id);
    if (!role) throw new Error("Incomplete member roles");
    bits |= role.permissions;
  }
  const owner = member.id === snapshot.ownerId;
  const admin = (bits & P.admin) !== 0n;
  const elevated = owner || admin;
  const rows = Object.fromEntries(
    CHECKS.map((key) => [key, { allowed: (bits & P[key]) !== 0n, layer: "roles" }]),
  ) as Result["rows"];
  const apply = (deny: bigint, allow: bigint, layer: Layer) => {
    bits = (bits & ~deny) | allow;
    for (const key of CHECKS) {
      if (((deny | allow) & P[key]) !== 0n) {
        rows[key] = { allowed: (bits & P[key]) !== 0n, layer };
      }
    }
  };
  if (elevated) {
    for (const key of CHECKS) rows[key] = { allowed: true, layer: owner ? "owner" : "admin" };
    bits |= Object.values(P).reduce((a, b) => a | b, 0n);
  } else {
    const base = snapshot.overwrites.find(
      (item) => item.id === snapshot.guildId && item.type === 0,
    );
    if (base) apply(base.deny, base.allow, "everyone");
    let allow = 0n;
    let deny = 0n;
    for (const overwrite of snapshot.overwrites) {
      if (overwrite.type === 0 && member.roles.includes(overwrite.id)) {
        allow |= overwrite.allow;
        deny |= overwrite.deny;
      }
    }
    apply(deny, allow, "channelRoles");
    const personal = snapshot.overwrites.find((item) => item.type === 1 && item.id === member.id);
    if (personal) apply(personal.deny, personal.allow, "member");
    if (member.timeout !== null && member.timeout > now) {
      for (const key of CHECKS) {
        if (key !== "view" && key !== "history") rows[key] = { allowed: false, layer: "timeout" };
      }
      bits &= P.view | P.history;
    }
  }
  if (member.pending) {
    for (const key of ["send", "embed", "attach", "react"] as const) {
      rows[key] = { allowed: false, layer: "screening" };
    }
  }
  if (!rows.view.allowed) {
    for (const key of CHECKS) {
      if (key !== "view") rows[key] = { allowed: false, layer: "hidden" };
    }
  } else {
    if (!rows.send.allowed) {
      for (const key of ["embed", "attach"] as const) {
        rows[key] = { allowed: false, layer: "cannotSend" };
      }
    }
    if (!rows.history.allowed) rows.react = { allowed: false, layer: "noHistory" };
  }
  return { permissions: bits, elevated, rows };
}
