import { CHECKS, type Check, type Layer, type Result } from "./permissions.ts";
export type Language = "tr" | "en";
export const language = (locale: string): Language =>
  locale.toLowerCase().startsWith("tr") ? "tr" : "en";
const labels: Record<Language, Record<Check, string>> = {
  en: {
    view: "View channel",
    send: "Send messages",
    embed: "Embed links",
    attach: "Attach files",
    history: "Read message history",
    react: "Add a NEW reaction",
  },
  tr: {
    view: "Kanalı gör",
    send: "Mesaj gönder",
    embed: "Bağlantı önizlemesi",
    attach: "Dosya ekle",
    history: "Mesaj geçmişini gör",
    react: "YENİ tepki ekle",
  },
};
const layers: Record<Language, Record<Layer, string>> = {
  en: {
    roles: "server roles",
    everyone: "channel everyone overwrite",
    channelRoles: "combined channel role overwrites",
    member: "channel member overwrite",
    owner: "server owner",
    admin: "Administrator",
    timeout: "active timeout",
    screening: "membership screening pending",
    hidden: "channel visibility required",
    cannotSend: "Send Messages required",
    noHistory: "Read Message History required",
  },
  tr: {
    roles: "sunucu rolleri",
    everyone: "kanal everyone izni",
    channelRoles: "birleşik kanal rol izinleri",
    member: "kişisel kanal izni",
    owner: "sunucu sahibi",
    admin: "Yönetici",
    timeout: "etkin zaman aşımı",
    screening: "üyelik taraması bekliyor",
    hidden: "kanalı görme gerekli",
    cannotSend: "Mesaj Gönder gerekli",
    noHistory: "Mesaj Geçmişini Gör gerekli",
  },
};
export function report(result: Result, lang: Language, now: number): string {
  const tr = lang === "tr";
  const rows = CHECKS.map(
    (key) =>
      `${result.rows[key].allowed ? (tr ? "İZİN VAR" : "ALLOWED") : tr ? "ENGELLİ" : "BLOCKED"} — ${labels[lang][key]}: ${layers[lang][result.rows[key].layer]}`,
  );
  return [
    tr
      ? "**AccessSprig • Bu kanaldaki kendi izinlerin**"
      : "**AccessSprig • Your permissions in this channel**",
    ...rows,
    "",
    `${tr ? "Kontrol (UTC)" : "Checked (UTC)"}: ${new Date(now).toISOString()}`,
    tr
      ? "Sonuç, hesaplanan izin anlık görüntüsüdür; mesaj gönderme garantisi değildir. Yavaş mod, AutoMod, hesap doğrulama ve uygulamaya özel komut kuralları değerlendirilmez. Yeni tepki, mevcut tepkiye katılmaktan farklıdır."
      : "This is a calculated permission snapshot, not a delivery guarantee. Slowmode, AutoMod, account verification and app-specific command rules are not evaluated. Adding a new reaction differs from joining an existing one.",
    tr
      ? "Yalnızca sana görünür. Yenile güncel verileri tekrar okur; oturum 5 dakika sürer. İzinleri bir sunucu yöneticisiyle görüş."
      : "Only you can see this. Refresh reads current data again; the session lasts 5 minutes. Discuss permissions with a server manager.",
  ].join("\n");
}
export const errorText = (lang: Language) =>
  lang === "tr"
    ? "Kontrol yapılamadı. Normal bir sunucu metin kanalını, botun Kanalı Gör iznini ve Yönetici izni olmadığını doğrula. Düğme eskimiş/meşgul olabilir; 5 saniye bekleyip /accesssprig kullan. İzin değiştirilmedi."
    : "Could not check. Use a normal server text channel; verify the bot can View Channel and has no Administrator permission. The button may be expired or busy; wait 5 seconds and use /accesssprig. No permissions were changed.";
export const closedText = (lang: Language) =>
  lang === "tr"
    ? "AccessSprig raporu kapatıldı. Yeni kontrol için /accesssprig kullan."
    : "AccessSprig report closed. Use /accesssprig for a new check.";
