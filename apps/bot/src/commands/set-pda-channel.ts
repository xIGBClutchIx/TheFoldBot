import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

import { setConfiguredPdaChannelId } from "../config/pda-config.ts";
import type { SlashCommand } from "./slash-command.ts";
import {
  getMissingPostPermissions,
  isSupportedPdaChannel,
  sendEphemeral,
  supportedPdaChannelTypes,
} from "./pda-support.ts";

export const setPdaChannelCommand: SlashCommand = {
  name: "set_pda_channel",
  data: new SlashCommandBuilder()
    .setName("set_pda_channel")
    .setDescription("Set the PDA message channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to send PDA messages to")
        .setRequired(true)
        .addChannelTypes(...supportedPdaChannelTypes),
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

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.Administrator)) {
      await sendEphemeral(interaction, "You need administrator permission to use this.");
      return;
    }

    const channel = interaction.options.getChannel("channel", true, supportedPdaChannelTypes);

    if (!isSupportedPdaChannel(channel)) {
      await sendEphemeral(interaction, "Selected channel type is not supported for PDA messages.");
      return;
    }

    const me = guild.members.me ?? (await guild.members.fetchMe().catch(() => null));

    if (me !== null) {
      const missingPermissions = getMissingPostPermissions(channel, me);

      if (missingPermissions.length > 0) {
        await sendEphemeral(
          interaction,
          `I cannot use ${channel.toString()} yet. Missing bot permissions: ${missingPermissions.join(", ")}.`,
        );
        return;
      }
    }

    await setConfiguredPdaChannelId(channel.id);
    await sendEphemeral(interaction, `PDA channel set to ${channel.toString()}`);
  },
};
