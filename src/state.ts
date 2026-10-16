import { randomBytes } from "node:crypto";
import type { Context } from "./snapshot.ts";
import type { Language } from "./text.ts";
export const TTL = 5 * 60_000;
export interface Session extends Context {
  language: Language;
  messageId: string;
  expires: number;
  busy: boolean;
}
export class Sessions {
  readonly items = new Map<string, Session>();
  prune(now: number) {
    for (const [key, item] of this.items) if (item.expires <= now) this.items.delete(key);
  }
  create(context: Context, language: Language, now: number): string {
    this.prune(now);
    for (const [key, item] of this.items) {
      if (
        item.userId === context.userId &&
        item.guildId === context.guildId &&
        item.channelId === context.channelId
      )
        this.items.delete(key);
    }
    if (this.items.size >= 100) throw new Error("Session capacity");
    const key = randomBytes(16).toString("hex");
    this.items.set(key, {
      guildId: context.guildId,
      channelId: context.channelId,
      userId: context.userId,
      botId: context.botId,
      language,
      messageId: "",
      expires: now + TTL,
      busy: false,
    });
    return key;
  }
  get(key: string, context: Context, messageId: string, now: number): Session {
    this.prune(now);
    const item = this.items.get(key);
    if (
      !item ||
      item.busy ||
      item.messageId !== messageId ||
      ["guildId", "channelId", "userId", "botId"].some(
        (field) => item[field as keyof Context] !== context[field as keyof Context],
      )
    )
      throw new Error("Invalid or expired session");
    return item;
  }
}
export class Gate {
  readonly cooldowns = new Map<string, number>();
  readonly active = new Set<string>();
  prune(now: number) {
    for (const [key, expiry] of this.cooldowns) if (expiry <= now) this.cooldowns.delete(key);
  }
  enter(key: string, now: number): () => void {
    this.prune(now);
    if (
      this.active.has(key) ||
      this.active.size >= 50 ||
      this.cooldowns.has(key) ||
      this.cooldowns.size >= 1000
    )
      throw new Error("Please wait");
    this.active.add(key);
    this.cooldowns.set(key, now + 5_000);
    return () => {
      this.active.delete(key);
    };
  }
}
