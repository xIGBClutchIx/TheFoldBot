import { once } from "node:events";

import { Client, Events, GatewayIntentBits } from "discord.js";

import { syncGuildCommands } from "./commands/sync.ts";
import { loadBotEnv } from "./config/env.ts";
import { initializeGlobalConfigDatabase } from "./config/global-config.ts";
import { handleInteractionCreate } from "./events/interaction-create.ts";
import { handleReady } from "./events/ready.ts";
import { logError, logInfo } from "./log.ts";

async function main(): Promise<void> {
    const env = loadBotEnv();
    logInfo("bot", "starting bot", {
        guildId: env.guildId,
    });

    await initializeGlobalConfigDatabase();
    logInfo("config", "initialized global config database");

    const client = new Client({
        intents: [GatewayIntentBits.Guilds],
    });
    const ready = once(client, Events.ClientReady) as Promise<[Client<true>]>;

    client.on(Events.InteractionCreate, (interaction) => {
        void handleInteractionCreate(interaction);
    });

    logInfo("discord", "logging in");
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

void (async () => {
    try {
        await main();
    } catch (error) {
        logError("bot", "failed to start bot");
        console.error(error);
        process.exitCode = 1;
    }
})();
