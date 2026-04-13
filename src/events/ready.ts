import type { Client } from "discord.js";
import { logInfo } from "../log.ts";

export function handleReady(client: Client<true>, commandCount: number, guildId: string): void {
    // Startup logs keep the boot path obvious without dumping the full Discord client state.
    logInfo("discord", "client ready", {
        guildId,
        commandCount,
        userTag: client.user.tag,
    });
}
