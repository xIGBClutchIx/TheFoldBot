import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import { describe, expect, test } from "vite-plus/test";

import { getConfiguredPdaChannelId, loadGlobalConfig, setConfiguredPdaChannelId } from "./global-config.ts";

describe("global config", () => {
    test("returns an empty config when the database does not exist yet", async () => {
        const databasePath = join(await mkdtemp(join(tmpdir(), "thefoldbot-config-")), "config.sqlite");

        await expect(loadGlobalConfig(databasePath)).resolves.toEqual({ pdaChannelId: null });
    });

    test("persists the configured PDA channel in sqlite", async () => {
        const databasePath = join(await mkdtemp(join(tmpdir(), "thefoldbot-config-")), "config.sqlite");

        await setConfiguredPdaChannelId("channel-1", databasePath);
        await expect(getConfiguredPdaChannelId(databasePath)).resolves.toBe("channel-1");

        const database = new DatabaseSync(databasePath);

        try {
            const row = database.prepare("SELECT value FROM settings WHERE key = ?").get("pda.channel") as { value: string } | undefined;

            expect(row?.value).toBe("channel-1");
        } finally {
            database.close();
        }
    });
});
