import { Routes } from "discord.js";
import { config } from "./config.ts";
import { makeRest } from "./rest.ts";
export const command = {
  name: "accesssprig",
  description: "Privately explain your permissions in this text channel",
  description_localizations: { tr: "Bu metin kanalındaki kendi izinlerini özel olarak açıkla" },
  type: 1,
  options: [
    {
      name: "language",
      description: "Report language / Rapor dili",
      type: 3,
      required: false,
      choices: [
        { name: "Türkçe", value: "tr" },
        { name: "English", value: "en" },
      ],
    },
  ],
};
export async function register() {
  const { token, applicationId, guildId } = config();
  // Create/upsert this one named guild command; do not bulk-replace other commands.
  await makeRest(token).post(Routes.applicationGuildCommands(applicationId, guildId), {
    body: command,
  });
  console.log(
    "/accesssprig registered for the configured server / Komut seçili sunucuda kaydedildi.",
  );
}
if (import.meta.main)
  register().catch(() => {
    console.error(
      "Registration failed. Run setup and check the bot installation / Kurulumu ve bot davetini kontrol et.",
    );
    process.exitCode = 1;
  });
