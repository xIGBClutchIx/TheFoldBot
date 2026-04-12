import { config as loadDotenv } from "dotenv";

const requiredEnvKeys = ["DISCORD_BOT_TOKEN", "DISCORD_GUILD_ID"] as const;

type RequiredEnvKey = (typeof requiredEnvKeys)[number];

export interface BotEnv {
  readonly botToken: string;
  readonly guildId: string;
}

function readRequiredEnv(source: NodeJS.ProcessEnv, key: RequiredEnvKey): string {
  const value = source[key]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

export function parseBotEnv(source: NodeJS.ProcessEnv): BotEnv {
  return {
    botToken: readRequiredEnv(source, "DISCORD_BOT_TOKEN"),
    guildId: readRequiredEnv(source, "DISCORD_GUILD_ID"),
  };
}

export function loadBotEnv(source: NodeJS.ProcessEnv = process.env): BotEnv {
  if (source === process.env) {
    loadDotenv();
  }

  return parseBotEnv(source);
}
