import { once } from "node:events";

import { Client, Events, GatewayIntentBits } from "discord.js";

import { syncGuildCommands } from "./commands/sync.ts";
import { loadBotEnv } from "./config/env.ts";
import { handleInteractionCreate } from "./events/interaction-create.ts";
import { handleReady } from "./events/ready.ts";

async function main(): Promise<void> {
  const env = loadBotEnv();
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  });
  const ready = once(client, Events.ClientReady) as Promise<[Client<true>]>;

  client.on(Events.InteractionCreate, (interaction) => {
    void handleInteractionCreate(interaction);
  });

  await client.login(env.botToken);
  const [readyClient] = await ready;
  const commands = await syncGuildCommands(
    {
      async publish(commandData, currentEnv) {
        await readyClient.application.commands.set(commandData, currentEnv.guildId);
      },
    },
    env,
  );

  handleReady(readyClient, commands.length, env.guildId);
}

void main().catch((error: unknown) => {
  console.error("Failed to start bot.", error);
  process.exitCode = 1;
});
