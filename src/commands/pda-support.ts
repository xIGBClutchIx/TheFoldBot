import {
    ChannelType,
    EmbedBuilder,
    PermissionFlagsBits,
    type ChatInputCommandInteraction,
    type ForumChannel,
    type Guild,
    type GuildBasedChannel,
    type GuildMember,
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

export async function sendEphemeral(interaction: ChatInputCommandInteraction, content: string): Promise<void> {
    const message: InteractionReplyOptions = {
        content,
        ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
        await interaction.followUp(message);
        return;
    }

    await interaction.reply(message);
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

function isThreadOnlyPdaChannel(channel: SupportedPdaChannel): channel is ForumChannel | MediaChannel {
    return channel.type === ChannelType.GuildForum || channel.type === ChannelType.GuildMedia;
}

function isDiscordHttpError(error: object): error is DiscordHttpError {
    return "status" in error && typeof error.status === "number";
}
