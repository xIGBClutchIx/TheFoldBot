import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, test } from "vite-plus/test";

import {
  getConfiguredPdaChannelId,
  loadPdaConfig,
  setConfiguredPdaChannelId,
} from "./pda-config.ts";

describe("pda config", () => {
  test("returns an empty config when the config file does not exist", async () => {
    const configPath = join(await mkdtemp(join(tmpdir(), "thefoldbot-config-")), "config.json");

    await expect(loadPdaConfig(configPath)).resolves.toEqual({ pda: null });
  });

  test("persists the configured PDA channel", async () => {
    const configDirectory = await mkdtemp(join(tmpdir(), "thefoldbot-config-"));
    const configPath = join(configDirectory, "config.json");

    await setConfiguredPdaChannelId("channel-1", configPath);

    await expect(getConfiguredPdaChannelId(configPath)).resolves.toBe("channel-1");

    await expect(readFile(configPath, "utf8")).resolves.toContain('"channel": "channel-1"');
  });
});
