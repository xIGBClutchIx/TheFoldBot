import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export interface PdaGuildConfig {
  channel: string;
}

export interface PdaConfig {
  pda: PdaGuildConfig | null;
}

function createEmptyConfig(): PdaConfig {
  return { pda: null };
}

export function getPdaConfigPath(cwd: string = process.cwd()): string {
  return resolve(cwd, "config.json");
}

export async function loadPdaConfig(configPath: string = getPdaConfigPath()): Promise<PdaConfig> {
  try {
    const rawConfig = await readFile(configPath, "utf8");
    const parsedConfig = JSON.parse(rawConfig) as Partial<PdaConfig>;

    return {
      pda: parsedConfig.pda ?? null,
    };
  } catch (error) {
    if (isMissingFileError(error)) {
      return createEmptyConfig();
    }

    throw error;
  }
}

export async function savePdaConfig(
  config: PdaConfig,
  configPath: string = getPdaConfigPath(),
): Promise<void> {
  await mkdir(dirname(configPath), { recursive: true });
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

export async function getConfiguredPdaChannelId(configPath?: string): Promise<string | null> {
  const config = await loadPdaConfig(configPath);

  return config.pda?.channel ?? null;
}

export async function setConfiguredPdaChannelId(
  channelId: string,
  configPath?: string,
): Promise<void> {
  const config = await loadPdaConfig(configPath);

  config.pda = {
    channel: channelId,
  };

  await savePdaConfig(config, configPath);
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
