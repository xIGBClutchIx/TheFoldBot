import type { Client } from "discord.js";
import { logInfo } from "../log.ts";

export function handleReady(client: Client<true>, commandCount: number, guildId: string): void {
    logInfo("discord", "client ready", {
        commandCount,
        guildId,
        userTag: client.user.tag,
    });
}
