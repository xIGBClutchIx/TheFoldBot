import { describe, expect, test, vi } from "vite-plus/test";

import { syncGuildCommands } from "./sync.ts";

describe("syncGuildCommands", () => {
    test("publishes the current slash command payload for the configured guild", async () => {
        const publish = vi.fn().mockResolvedValue(undefined);
        const env = {
            botToken: "token",
            guildId: "guild",
        };

        const body = await syncGuildCommands({ publish }, env);

        expect(publish).toHaveBeenCalledWith(body, env);
        expect(body).toHaveLength(2);
        expect(body.map((command) => command.name)).toEqual(["set_pda_channel", "pda"]);
    });
});
