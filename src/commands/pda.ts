import { SlashCommandBuilder } from "discord.js";

import { getConfiguredPdaChannelId } from "../config/global-config.ts";
import { logInfo, logWarn } from "../log.ts";
import type { SlashCommand } from "./slash-command.ts";
import { buildPdaEmbed, deferEphemeralReply, getDiscordHttpStatus, getInteractionDisplayName, resolveConfiguredPdaChannel, sendEphemeral, sendPdaMessage } from "./pda-support.ts";

const pdaCharacterNameMaxLength = 94;
const pdaMessageMaxLength = 4096;

export const pdaCommand: SlashCommand = {
    name: "pda",
    data: new SlashCommandBuilder()
        .setName("pda")
        .setDescription("Send a PDA message")
        .addStringOption((option) => option.setName("character_name").setDescription("Your character name").setMaxLength(pdaCharacterNameMaxLength).setRequired(true))
        .addStringOption((option) => option.setName("message").setDescription("Your message").setMaxLength(pdaMessageMaxLength).setRequired(true)),
    async execute(interaction) {
        if (!interaction.inGuild()) {
            await sendEphemeral(interaction, "This command can only be used in a server.");
            return;
        }

        const guild = interaction.guild!;

        if (!(await deferEphemeralReply(interaction))) {
            logWarn("pda", "interaction was already acknowledged before pda execution", {
                guildId: interaction.guildId,
                interactionId: interaction.id,
            });
            return;
        }

        const configuredChannelId = await getConfiguredPdaChannelId();

        if (configuredChannelId === null) {
            await sendEphemeral(interaction, "PDA channel is not set. Use /set_pda_channel");
            return;
        }

        let resolvedChannel;

        try {
            resolvedChannel = await resolveConfiguredPdaChannel(guild, configuredChannelId);
        } catch (error) {
            const status = typeof error === "object" && error !== null ? getDiscordHttpStatus(error) : null;

            if (status === 403) {
                logWarn("pda", "cannot access configured channel", {
                    channelId: configuredChannelId,
                    guildId: interaction.guildId,
                    status,
                });
                await sendEphemeral(interaction, `I cannot access configured channel \`${configuredChannelId}\`. Grant the bot access to that channel or run \`/set_pda_channel\` again.`);
                return;
            }

            logWarn("pda", "failed to look up configured channel", {
                channelId: configuredChannelId,
                guildId: interaction.guildId,
                status,
            });
            await sendEphemeral(interaction, "Discord returned an error while looking up the configured channel.");
            return;
        }

        if (resolvedChannel.status !== "ok") {
            if (resolvedChannel.status === "not_found") {
                logWarn("pda", "configured channel was not found", {
                    channelId: configuredChannelId,
                    guildId: interaction.guildId,
                });
                await sendEphemeral(interaction, `Configured channel \`${configuredChannelId}\` was not found in this server. Run \`/set_pda_channel\` to pick a valid channel.`);
                return;
            }

            logWarn("pda", "configured channel type is unsupported", {
                channelId: configuredChannelId,
                guildId: interaction.guildId,
            });
            await sendEphemeral(interaction, "Configured channel type is not supported for PDA messages.");
            return;
        }

        const channel = resolvedChannel.channel;

        const characterName = interaction.options.getString("character_name", true);
        const message = interaction.options.getString("message", true);
        const embed = buildPdaEmbed(characterName, message, getInteractionDisplayName(interaction));

        try {
            await sendPdaMessage(channel, embed, characterName);
        } catch (error) {
            const status = typeof error === "object" && error !== null ? getDiscordHttpStatus(error) : null;

            if (status === 403) {
                logWarn("pda", "cannot send to configured channel", {
                    channelId: channel.id,
                    guildId: interaction.guildId,
                    status,
                });
                await sendEphemeral(interaction, "I do not have permission to post in the configured channel.");
                return;
            }

            logWarn("pda", "failed to send pda message", {
                channelId: channel.id,
                guildId: interaction.guildId,
                status,
            });
            await sendEphemeral(interaction, "Failed to send the PDA message to the configured channel.");
            return;
        }

        logInfo("pda", "sent pda message", {
            channelId: channel.id,
            characterName,
            guildId: interaction.guildId,
            sentBy: interaction.user.id,
        });
        const sentConfirmation = await sendEphemeral(interaction, "PDA message sent.");

        if (!sentConfirmation) {
            logWarn("pda", "skipped pda confirmation because the interaction was already acknowledged", {
                guildId: interaction.guildId,
                interactionId: interaction.id,
            });
        }
    },
};

export const pdaCommandLimits = {
    characterNameMaxLength: pdaCharacterNameMaxLength,
    messageMaxLength: pdaMessageMaxLength,
};
