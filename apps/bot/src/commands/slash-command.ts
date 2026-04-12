import type {
  ChatInputCommandInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
} from "discord.js";

export interface SlashCommand {
  readonly name: string;
  readonly data: {
    toJSON(): RESTPostAPIApplicationCommandsJSONBody;
  };
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
}

export function toApplicationCommandData(
  commands: readonly SlashCommand[],
): RESTPostAPIApplicationCommandsJSONBody[] {
  return commands.map((command) => command.data.toJSON());
}
