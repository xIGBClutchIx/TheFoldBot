import type { BotEnv } from "../config/env.ts";

import { buildCommandPayload } from "./index.ts";

export type CommandPayload = ReturnType<typeof buildCommandPayload>;

export interface GuildCommandPublisher {
  publish(commands: CommandPayload, env: BotEnv): Promise<unknown>;
}

export async function syncGuildCommands(
  publisher: GuildCommandPublisher,
  env: BotEnv,
): Promise<CommandPayload> {
  const body = buildCommandPayload();

  await publisher.publish(body, env);

  return body;
}
