import {
  Client,
  Events,
  GatewayIntentBits,
  type Interaction,
  MessageFlags,
  Options,
} from "discord.js";
import { config } from "./config.ts";
import { Handler } from "./handler.ts";
import { makeRest } from "./rest.ts";
import { readSnapshot } from "./snapshot.ts";
import { type Language, language } from "./text.ts";
export async function start() {
  const { token, guildId, applicationId } = config();
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: { parse: [], repliedUser: false },
    makeCache: Options.cacheWithLimits({
      MessageManager: 0,
      GuildMemberManager: 0,
      UserManager: 0,
      ThreadManager: 0,
    }),
    rest: { retries: 0, timeout: 10_000, rejectOnRateLimit: () => true },
  });
  const rest = makeRest(token);
  const handler = new Handler((context) => readSnapshot(rest, context));
  async function route(interaction: Interaction) {
    const isCommand = interaction.isChatInputCommand() && interaction.commandName === "accesssprig";
    const isButton = interaction.isButton() && interaction.customId.startsWith("as:");
    if (!isCommand && !isButton) return;
    if (!interaction.isChatInputCommand() && !interaction.isButton()) return;
    const lang: Language = interaction.isChatInputCommand()
      ? interaction.options.getString("language") === "tr"
        ? "tr"
        : interaction.options.getString("language") === "en"
          ? "en"
          : language(interaction.locale)
      : language(interaction.locale);
    if (
      !interaction.inGuild() ||
      interaction.guildId !== guildId ||
      !interaction.channelId ||
      !client.user ||
      client.user.id !== applicationId
    ) {
      await interaction.reply({
        content:
          lang === "tr"
            ? "Bu bot yalnızca yapılandırılmış sunucuda çalışır."
            : "This bot only works in its configured server.",
        flags: MessageFlags.Ephemeral,
        allowedMentions: { parse: [] },
      });
      return;
    }
    const match = interaction.isButton()
      ? /^as:(refresh|close):([a-f0-9]{32})$/.exec(interaction.customId)
      : null;
    if (interaction.isButton() && !match) return;
    await handler.handle({
      guildId,
      channelId: interaction.channelId,
      userId: interaction.user.id,
      botId: client.user.id,
      language: lang,
      action: isCommand ? "command" : match?.[1] === "close" ? "close" : "refresh",
      key: match?.[2] ?? "",
      messageId: interaction.isButton() ? interaction.message.id : "",
      privateMessage:
        interaction.isButton() &&
        interaction.message.flags.has(MessageFlags.Ephemeral) &&
        interaction.message.author.id === client.user.id,
      defer: async () => {
        if (interaction.isButton()) await interaction.deferUpdate();
        else await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      },
      edit: async (payload) => {
        const message = await interaction.editReply({
          content: payload.content,
          components: payload.components,
          allowedMentions: { parse: [] },
        });
        return message.id;
      },
      reject: async (content) => {
        await interaction.reply({
          content,
          flags: MessageFlags.Ephemeral,
          allowedMentions: { parse: [] },
        });
      },
    });
  }
  client.on(Events.InteractionCreate, (interaction) => {
    void route(interaction).catch(() => {
      console.error("Interaction could not be acknowledged / Etkileşim yanıtlanamadı.");
    });
  });
  client.on(Events.Error, () => {
    console.error("Discord connection error / Discord bağlantı hatası.");
  });
  client.once(Events.ClientReady, (ready) => {
    if (ready.user.id !== applicationId) {
      console.error("Application ID does not match token / Uygulama kimliği token ile eşleşmiyor.");
      client.destroy();
      process.exitCode = 1;
      return;
    }
    console.log("AccessSprig connected / bağlandı. Use /accesssprig in the configured server.");
  });
  const cleanup = setInterval(() => {
    handler.sessions.prune(Date.now());
    handler.gate.prune(Date.now());
  }, 30_000);
  cleanup.unref();
  for (const signal of ["SIGINT", "SIGTERM"] as const)
    process.once(signal, () => {
      clearInterval(cleanup);
      handler.sessions.items.clear();
      client.destroy();
    });
  await client.login(token);
}
if (import.meta.main)
  start().catch(() => {
    console.error(
      "Startup failed. Run npm run setup; check token and network / Kurulumu, tokenı ve ağı kontrol et.",
    );
    process.exitCode = 1;
  });
