import { MessageFlags, type ChatInputCommandInteraction, type Interaction, type InteractionEditReplyOptions, type InteractionReplyOptions } from "discord.js";

import { commandsByName } from "../commands/index.ts";
import { logError, logWarn } from "../log.ts";
import { getDiscordApiErrorCode } from "../commands/pda-support.ts";

const executionErrorMessage: InteractionReplyOptions = {
    content: "There was an error while executing this command.",
    flags: MessageFlags.Ephemeral,
};
const deferredExecutionErrorMessage: InteractionEditReplyOptions = {
    content: "There was an error while executing this command.",
};

async function replyWithExecutionError(interaction: ChatInputCommandInteraction): Promise<void> {
    try {
        if (interaction.deferred) {
            await interaction.editReply(deferredExecutionErrorMessage);
            return;
        }

        if (interaction.replied) {
            await interaction.followUp(executionErrorMessage);
            return;
        }

        await interaction.reply(executionErrorMessage);
    } catch (error) {
        if (typeof error === "object" && error !== null && getDiscordApiErrorCode(error) === 40060) {
            logWarn("commands", "skipped execution error response because the interaction was already acknowledged", {
                commandName: interaction.commandName,
                guildId: interaction.guildId,
                interactionId: interaction.id,
            });
            return;
        }

        throw error;
    }
}

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = commandsByName.get(interaction.commandName);

    if (!command) {
        logWarn("commands", "received unknown command", {
            commandName: interaction.commandName,
            guildId: interaction.guildId,
        });
        await interaction.reply({
            content: "Unknown command.",
            ephemeral: true,
        });
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        logError("commands", "failed to execute command", {
            commandName: interaction.commandName,
            guildId: interaction.guildId,
        });
        console.error(error);
        await replyWithExecutionError(interaction);
    }
}
