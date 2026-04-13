import type { BotEnv } from "../config/env.ts";
import { logInfo } from "../log.ts";

import { buildCommandPayload } from "./index.ts";

export type CommandPayload = ReturnType<typeof buildCommandPayload>;

export interface GuildCommandPublisher {
    publish(commands: CommandPayload, env: BotEnv): Promise<void>;
}

export async function syncGuildCommands(publisher: GuildCommandPublisher, env: BotEnv): Promise<CommandPayload> {
    // Build the payload once so logging, tests, and Discord publish all use the same command data.
    const body = buildCommandPayload();

    logInfo("sync", "syncing slash commands", {
        commandCount: body.length,
        guildId: env.guildId,
    });

    await publisher.publish(body, env);

    logInfo("sync", "synced slash commands", {
        commandCount: body.length,
        guildId: env.guildId,
    });

    return body;
}
