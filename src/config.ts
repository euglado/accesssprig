import { isId } from "./snapshot.ts";
export function config(env: NodeJS.ProcessEnv = process.env) {
  const token = env.DISCORD_TOKEN;
  const applicationId = env.DISCORD_APPLICATION_ID;
  const guildId = env.DISCORD_GUILD_ID;
  if (!token || !/^[A-Za-z0-9_.-]{30,200}$/.test(token) || !isId(applicationId) || !isId(guildId))
    throw new Error("Run npm run setup first / Önce npm run setup çalıştır.");
  return { token, applicationId, guildId };
}
