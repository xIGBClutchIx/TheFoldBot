import { pdaCommand } from "./pda.ts";
import { setPdaChannelCommand } from "./set-pda-channel.ts";
import { toApplicationCommandData } from "./slash-command.ts";

export const commands = [setPdaChannelCommand, pdaCommand] as const;

export const commandsByName = new Map<string, (typeof commands)[number]>(commands.map((command) => [command.name, command]));

export function buildCommandPayload() {
    return toApplicationCommandData(commands);
}
