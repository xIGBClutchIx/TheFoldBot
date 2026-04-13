import { MessageFlags, type ChatInputCommandInteraction, type Interaction, type InteractionEditReplyOptions, type InteractionReplyOptions } from "discord.js";

import { commandsByName } from "../commands/index.ts";
import { logError, logWarn } from "../log.ts";
import { getDiscordApiErrorCode, isIgnorableInteractionError } from "../commands/pda-support.ts";

const executionErrorMessage: InteractionReplyOptions = {
    content: "There was an error while executing this command.",
    flags: MessageFlags.Ephemeral,
};
const deferredExecutionErrorMessage: InteractionEditReplyOptions = {
    content: "There was an error while executing this command.",
};

// Deferred interactions need `editReply`, while already-replied ones need `followUp`.
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
        if (typeof error === "object" && error !== null && isIgnorableInteractionError(error)) {
            logWarn("commands", "skipped execution error response because the interaction was already acknowledged", {
                guildId: interaction.guildId,
                commandName: interaction.commandName,
                interactionId: interaction.id,
            });
            return;
        }

        throw error;
    }
}

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
    // Ignore everything except slash commands. Normal chat messages never hit this path.
    if (!interaction.isChatInputCommand()) {
        return;
    }

    const command = commandsByName.get(interaction.commandName);

    if (!command) {
        logWarn("commands", "received unknown command", {
            guildId: interaction.guildId,
            commandName: interaction.commandName,
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
        // Discord can invalidate or consume an interaction before we respond; treat that as noise.
        if (typeof error === "object" && error !== null && isIgnorableInteractionError(error)) {
            logWarn("commands", "ignored stale interaction during command execution", {
                guildId: interaction.guildId,
                commandName: interaction.commandName,
                interactionId: interaction.id,
                code: getDiscordApiErrorCode(error),
            });
            return;
        }

        logError("commands", "failed to execute command", {
            guildId: interaction.guildId,
            commandName: interaction.commandName,
        });
        console.error(error);
        await replyWithExecutionError(interaction);
    }
}
