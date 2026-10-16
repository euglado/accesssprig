import { existsSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
import { config } from "../src/config.ts";

async function setup() {
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("Open a terminal / Bir terminal aç.");
  if (existsSync(".env"))
    throw new Error(
      ".env already exists; it will not be overwritten / .env zaten var; üzerine yazılmaz.",
    );
  let hidden = false;
  const output = new Writable({
    write(chunk, _encoding, callback) {
      if (!hidden) process.stdout.write(chunk);
      callback();
    },
  });
  const reader = createInterface({ input: process.stdin, output, terminal: true, historySize: 0 });
  try {
    const application = (await reader.question("Application ID / Uygulama kimliği: ")).trim();
    const guild = (await reader.question("Server ID / Sunucu kimliği: ")).trim();
    process.stdout.write("Bot token (hidden / gizli): ");
    hidden = true;
    const token = (await reader.question("")).trim();
    hidden = false;
    process.stdout.write("\n");
    const data = config({
      DISCORD_TOKEN: token,
      DISCORD_APPLICATION_ID: application,
      DISCORD_GUILD_ID: guild,
    });
    writeFileSync(
      ".env",
      `DISCORD_TOKEN=${data.token}\nDISCORD_APPLICATION_ID=${data.applicationId}\nDISCORD_GUILD_ID=${data.guildId}\n`,
      { flag: "wx", mode: 0o600 },
    );
    console.log(
      "Saved .env locally. Next: npm run register, then npm start / Sonra komutu kaydet ve botu başlat.",
    );
  } finally {
    reader.close();
  }
}
setup().catch((error) => {
  console.error(
    error instanceof Error && !error.message.includes("token")
      ? error.message
      : "Setup failed; verify your inputs / Kurulum başarısız; bilgileri kontrol et.",
  );
  process.exitCode = 1;
});
