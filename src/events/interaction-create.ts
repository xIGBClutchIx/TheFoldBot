import type { ChatInputCommandInteraction, Interaction, InteractionReplyOptions } from "discord.js";

import { commandsByName } from "../commands/index.ts";

const executionErrorMessage: InteractionReplyOptions = {
  content: "There was an error while executing this command.",
  ephemeral: true,
};

async function replyWithExecutionError(interaction: ChatInputCommandInteraction): Promise<void> {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp(executionErrorMessage);
    return;
  }

  await interaction.reply(executionErrorMessage);
}

export async function handleInteractionCreate(interaction: Interaction): Promise<void> {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commandsByName.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: "Unknown command.",
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Failed to execute command: ${interaction.commandName}`, error);
    await replyWithExecutionError(interaction);
  }
}
