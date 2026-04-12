import type { Client } from "discord.js";

export function handleReady(client: Client<true>, commandCount: number, guildId: string): void {
  console.info(`synced ${commandCount} command(s) for guild ${guildId}`);
  console.info(`logged in as ${client.user.tag}`);
}
