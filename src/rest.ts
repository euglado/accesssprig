import { REST } from "discord.js";
export function makeRest(token: string): REST {
  return new REST({
    version: "10",
    retries: 0,
    timeout: 10_000,
    rejectOnRateLimit: () => true,
  }).setToken(token);
}
