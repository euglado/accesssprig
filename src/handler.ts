import { calculate, type Snapshot } from "./permissions.ts";
import type { Context } from "./snapshot.ts";
import { Gate, type Session, Sessions } from "./state.ts";
import { closedText, errorText, type Language, report } from "./text.ts";
export interface Payload {
  content: string;
  allowed_mentions: { parse: never[] };
  components: { type: 1; components: { type: 2; style: 2; label: string; custom_id: string }[] }[];
}
export interface Port extends Context {
  language: Language;
  action: "command" | "refresh" | "close";
  key: string;
  messageId: string;
  privateMessage: boolean;
  defer: () => Promise<void>;
  edit: (payload: Payload) => Promise<string>;
  reject: (content: string) => Promise<void>;
}
function payload(content: string, key: string | null, language: Language): Payload {
  return {
    content,
    allowed_mentions: { parse: [] },
    components: key
      ? [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 2,
                label: language === "tr" ? "Yenile" : "Refresh",
                custom_id: `as:refresh:${key}`,
              },
              {
                type: 2,
                style: 2,
                label: language === "tr" ? "Kapat" : "Close",
                custom_id: `as:close:${key}`,
              },
            ],
          },
        ]
      : [],
  };
}
export class Handler {
  readonly sessions = new Sessions();
  readonly gate = new Gate();
  readonly load: (context: Context) => Promise<Snapshot>;
  readonly now: () => number;
  constructor(load: (context: Context) => Promise<Snapshot>, now: () => number = Date.now) {
    this.load = load;
    this.now = now;
  }
  async handle(port: Port) {
    const context: Context = {
      guildId: port.guildId,
      channelId: port.channelId,
      userId: port.userId,
      botId: port.botId,
    };
    let release: (() => void) | undefined;
    let session: Session | undefined;
    let deferred = false;
    let key = port.key;
    let lang = port.language;
    try {
      if (port.action !== "command") {
        if (!port.privateMessage) throw new Error("Not private");
        session = this.sessions.get(key, context, port.messageId, this.now());
        lang = session.language;
        session.busy = true;
      }
      if (port.action === "close") {
        await port.defer();
        deferred = true;
        this.sessions.items.delete(key);
        await port.edit(payload(closedText(lang), null, lang));
        return;
      }
      release = this.gate.enter(`${port.guildId}:${port.userId}`, this.now());
      await port.defer();
      deferred = true;
      const snapshot = await this.load(context);
      const bot = calculate(snapshot, snapshot.bot, this.now());
      const member = calculate(snapshot, snapshot.member, this.now());
      if (bot.elevated || !bot.rows.view.allowed || !member.rows.view.allowed)
        throw new Error("Access denied");
      if (session && (session.expires <= this.now() || this.sessions.items.get(key) !== session))
        throw new Error("Session ended during check");
      if (port.action === "command") key = this.sessions.create(context, lang, this.now());
      const messageId = await port.edit(payload(report(member, lang, this.now()), key, lang));
      const current = this.sessions.items.get(key);
      if (current) current.messageId = messageId;
    } catch {
      // Never log API errors, tokens, member objects, or report payloads.
      if (deferred) {
        if (key) this.sessions.items.delete(key);
        await port.edit(payload(errorText(lang), null, lang)).catch(() => {});
      } else {
        await port.reject(errorText(lang)).catch(() => {});
      }
    } finally {
      if (session) session.busy = false;
      release?.();
    }
  }
}
