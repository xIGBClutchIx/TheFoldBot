import {
    ChannelType,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    type ChatInputCommandInteraction,
    type ForumChannel,
    type Guild,
    type GuildBasedChannel,
    type GuildMember,
    type InteractionEditReplyOptions,
    type InteractionReplyOptions,
    type MediaChannel,
    type NewsChannel,
    type TextChannel,
} from "discord.js";

export const supportedPdaChannelTypes = [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum, ChannelType.GuildMedia] as const;

export type SupportedPdaChannel = TextChannel | NewsChannel | ForumChannel | MediaChannel;
export type ResolvedConfiguredPdaChannel =
    | {
          status: "ok";
          channel: SupportedPdaChannel;
      }
    | {
          status: "not_found" | "unsupported";
      };

interface DiscordHttpError {
    status: number;
}

interface DiscordApiError {
    code: number;
}

const interactionAlreadyAcknowledgedCode = 40060;

export async function deferEphemeralReply(interaction: ChatInputCommandInteraction): Promise<boolean> {
    if (interaction.deferred || interaction.replied) {
        return true;
    }

    try {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral,
        });
        return true;
    } catch (error) {
        if (typeof error === "object" && error !== null && getDiscordApiErrorCode(error) === interactionAlreadyAcknowledgedCode) {
            return false;
        }

        throw error;
    }
}

export async function sendEphemeral(interaction: ChatInputCommandInteraction, content: string): Promise<boolean> {
    const replyMessage: InteractionReplyOptions = {
        content,
        flags: MessageFlags.Ephemeral,
    };
    const editMessage: InteractionEditReplyOptions = {
        content,
    };

    try {
        if (interaction.deferred) {
            await interaction.editReply(editMessage);
            return true;
        }

        if (interaction.replied) {
            await interaction.followUp(replyMessage);
            return true;
        }

        await interaction.reply(replyMessage);
        return true;
    } catch (error) {
        if (typeof error === "object" && error !== null && getDiscordApiErrorCode(error) === interactionAlreadyAcknowledgedCode) {
            return false;
        }

        throw error;
    }
}

export function isSupportedPdaChannel(channel: GuildBasedChannel | null): channel is SupportedPdaChannel {
    return channel !== null && supportedPdaChannelTypes.includes(channel.type as (typeof supportedPdaChannelTypes)[number]);
}

export function getMissingPostPermissions(channel: SupportedPdaChannel, member: GuildMember): string[] {
    const permissions = channel.permissionsFor(member);
    const missingPermissions: string[] = [];

    if (!permissions.has(PermissionFlagsBits.ViewChannel)) {
        missingPermissions.push("View Channels");
    }

    if (isThreadOnlyPdaChannel(channel)) {
        if (!permissions.has(PermissionFlagsBits.CreatePublicThreads)) {
            missingPermissions.push("Create Public Threads");
        }

        if (!permissions.has(PermissionFlagsBits.SendMessagesInThreads)) {
            missingPermissions.push("Send Messages in Threads");
        }
    } else if (!permissions.has(PermissionFlagsBits.SendMessages)) {
        missingPermissions.push("Send Messages");
    }

    if (!permissions.has(PermissionFlagsBits.EmbedLinks)) {
        missingPermissions.push("Embed Links");
    }

    return missingPermissions;
}

export function buildPdaEmbed(characterName: string, message: string, senderDisplayName: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle("📡 PDA Message")
        .setDescription(message)
        .setColor(0x3498db)
        .addFields({
            name: "Character",
            value: characterName,
            inline: true,
        })
        .setFooter({
            text: `Sent by ${senderDisplayName}`,
        });
}

export function getInteractionDisplayName(interaction: ChatInputCommandInteraction): string {
    if (interaction.member && "displayName" in interaction.member) {
        return interaction.member.displayName;
    }

    return interaction.user.displayName;
}

export async function sendPdaMessage(channel: SupportedPdaChannel, embed: EmbedBuilder, characterName: string): Promise<void> {
    if (isThreadOnlyPdaChannel(channel)) {
        await channel.threads.create({
            name: `PDA - ${characterName}`,
            message: {
                embeds: [embed],
            },
        });
        return;
    }

    await channel.send({
        embeds: [embed],
    });
}

export async function resolveConfiguredPdaChannel(guild: Guild, channelId: string): Promise<ResolvedConfiguredPdaChannel> {
    const channel = guild.channels.cache.get(channelId) ?? (await guild.channels.fetch(channelId));

    if (channel === null) {
        return { status: "not_found" };
    }

    if (!isSupportedPdaChannel(channel)) {
        return { status: "unsupported" };
    }

    return {
        status: "ok",
        channel,
    };
}

export function getDiscordHttpStatus(error: object | null): number | null {
    if (error === null || !isDiscordHttpError(error)) {
        return null;
    }

    return error.status;
}

export function getDiscordApiErrorCode(error: object | null): number | null {
    if (error === null || !isDiscordApiError(error)) {
        return null;
    }

    return error.code;
}

function isThreadOnlyPdaChannel(channel: SupportedPdaChannel): channel is ForumChannel | MediaChannel {
    return channel.type === ChannelType.GuildForum || channel.type === ChannelType.GuildMedia;
}

function isDiscordHttpError(error: object): error is DiscordHttpError {
    return "status" in error && typeof error.status === "number";
}

function isDiscordApiError(error: object): error is DiscordApiError {
    return "code" in error && typeof error.code === "number";
}
