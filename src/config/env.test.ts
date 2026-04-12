import { describe, expect, test } from "vite-plus/test";

import { parseBotEnv } from "./env.ts";

describe("parseBotEnv", () => {
  test("throws when a required environment variable is missing", () => {
    expect(() =>
      parseBotEnv({
        DISCORD_BOT_TOKEN: "",
        DISCORD_GUILD_ID: "guild",
      } as NodeJS.ProcessEnv),
    ).toThrowError("Missing required environment variable: DISCORD_BOT_TOKEN");
  });

  test("returns the validated bot environment", () => {
    expect(
      parseBotEnv({
        DISCORD_BOT_TOKEN: "token",
        DISCORD_GUILD_ID: "guild",
      } as NodeJS.ProcessEnv),
    ).toEqual({
      botToken: "token",
      guildId: "guild",
    });
  });
});
