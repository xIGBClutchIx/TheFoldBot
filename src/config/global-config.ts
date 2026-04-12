import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

const PDA_CHANNEL_ID_KEY = "pda.channel";

export interface GlobalConfig {
    pdaChannelId: string | null;
}

export function getGlobalConfigDatabasePath(cwd: string = process.cwd()): string {
    return resolve(cwd, "config.sqlite");
}

export async function initializeGlobalConfigDatabase(databasePath: string = getGlobalConfigDatabasePath()): Promise<void> {
    const database = await openGlobalConfigDatabase(databasePath);

    database.close();
}

export async function loadGlobalConfig(databasePath: string = getGlobalConfigDatabasePath()): Promise<GlobalConfig> {
    const database = await openGlobalConfigDatabase(databasePath);

    try {
        return {
            pdaChannelId: getSetting(database, PDA_CHANNEL_ID_KEY),
        };
    } finally {
        database.close();
    }
}

export async function getConfiguredPdaChannelId(databasePath?: string): Promise<string | null> {
    const config = await loadGlobalConfig(databasePath);

    return config.pdaChannelId;
}

export async function setConfiguredPdaChannelId(channelId: string, databasePath?: string): Promise<void> {
    const database = await openGlobalConfigDatabase(databasePath);

    try {
        database
            .prepare(
                `
                INSERT INTO settings (key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
            `,
            )
            .run(PDA_CHANNEL_ID_KEY, channelId);
    } finally {
        database.close();
    }
}

async function openGlobalConfigDatabase(databasePath: string = getGlobalConfigDatabasePath()): Promise<DatabaseSync> {
    await mkdir(dirname(databasePath), { recursive: true });

    const database = new DatabaseSync(databasePath);

    initializeSchema(database);

    return database;
}

function initializeSchema(database: DatabaseSync): void {
    database.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    `);
}

function getSetting(database: DatabaseSync, key: string): string | null {
    const row = database.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;

    return row?.value ?? null;
}
