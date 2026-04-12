import { SlashCommandBuilder } from "discord.js";

import { getConfiguredPdaChannelId } from "../config/pda-config.ts";
import type { SlashCommand } from "./slash-command.ts";
import {
  buildPdaEmbed,
  getDiscordHttpStatus,
  getInteractionDisplayName,
  resolveConfiguredPdaChannel,
  sendEphemeral,
  sendPdaMessage,
} from "./pda-support.ts";

export const pdaCommand: SlashCommand = {
  name: "pda",
  data: new SlashCommandBuilder()
    .setName("pda")
    .setDescription("Send a PDA message")
    .addStringOption((option) =>
      option.setName("character_name").setDescription("Your character name").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("message").setDescription("Your message").setRequired(true),
    ),
  async execute(interaction) {
    if (!interaction.inGuild()) {
      await sendEphemeral(interaction, "This command can only be used in a server.");
      return;
    }

    const guild = interaction.guild;

    if (guild === null) {
      await sendEphemeral(interaction, "This command can only be used in a server.");
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
      const status = getDiscordHttpStatus(error);

      if (status === 403) {
        await sendEphemeral(
          interaction,
          `I cannot access configured channel \`${configuredChannelId}\`. Grant the bot access to that channel or run \`/set_pda_channel\` again.`,
        );
        return;
      }

      await sendEphemeral(
        interaction,
        "Discord returned an error while looking up the configured channel.",
      );
      return;
    }

    if (resolvedChannel.status !== "ok") {
      if (resolvedChannel.status === "not_found") {
        await sendEphemeral(
          interaction,
          `Configured channel \`${configuredChannelId}\` was not found in this server. Run \`/set_pda_channel\` to pick a valid channel.`,
        );
        return;
      }

      await sendEphemeral(
        interaction,
        "Configured channel type is not supported for PDA messages.",
      );
      return;
    }

    const channel = resolvedChannel.channel;

    const characterName = interaction.options.getString("character_name", true);
    const message = interaction.options.getString("message", true);
    const embed = buildPdaEmbed(characterName, message, getInteractionDisplayName(interaction));

    try {
      await sendPdaMessage(channel, embed, characterName);
    } catch (error) {
      const status = getDiscordHttpStatus(error);

      if (status === 403) {
        await sendEphemeral(
          interaction,
          "I do not have permission to post in the configured channel.",
        );
        return;
      }

      await sendEphemeral(interaction, "Failed to send the PDA message to the configured channel.");
      return;
    }

    await sendEphemeral(interaction, "PDA message sent.");
  },
};
