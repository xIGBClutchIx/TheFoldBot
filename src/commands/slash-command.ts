import type { ChatInputCommandInteraction, RESTPostAPIApplicationCommandsJSONBody } from "discord.js";

// Keep command modules small: metadata for sync plus one execute handler for dispatch.
export interface SlashCommand {
    readonly name: string;
    readonly data: {
        toJSON(): RESTPostAPIApplicationCommandsJSONBody;
    };
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export function toApplicationCommandData(commands: readonly SlashCommand[]): RESTPostAPIApplicationCommandsJSONBody[] {
    return commands.map((command) => command.data.toJSON());
}
