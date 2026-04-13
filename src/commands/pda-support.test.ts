import { ChannelType, MessageFlags, PermissionFlagsBits, PermissionsBitField } from "discord.js";

import { describe, expect, test, vi } from "vite-plus/test";

import { buildPdaEmbed, deferEphemeralReply, getMissingPostPermissions, isIgnorableInteractionError, sendEphemeral, sendPdaMessage } from "./pda-support.ts";

describe("pda support", () => {
    test("builds the PDA embed with the sender footer", () => {
        const embed = buildPdaEmbed("Ripley", "Status update", "Ash");

        expect(embed.toJSON()).toMatchObject({
            title: "📡 PDA Message",
            description: "Status update",
            footer: { text: "Sent by Ash" },
            fields: [{ name: "Character", value: "Ripley", inline: true }],
        });
    });

    test("lists missing text-channel permissions", () => {
        const channel = {
            permissionsFor: vi.fn().mockReturnValue(new PermissionsBitField(PermissionFlagsBits.ViewChannel)),
            type: ChannelType.GuildText,
        };
        const member = {};

        expect(getMissingPostPermissions(channel as never, member as never)).toEqual(["Send Messages", "Embed Links"]);
    });

    test("creates a thread when sending to a forum channel", async () => {
        const create = vi.fn().mockResolvedValue(undefined);
        const channel = {
            type: ChannelType.GuildForum,
            threads: { create },
        };

        await sendPdaMessage(channel as never, buildPdaEmbed("Ripley", "Ready", "Ash"), "Ripley");

        expect(create).toHaveBeenCalledWith({
            name: "PDA - Ripley",
            message: {
                embeds: [expect.anything()],
            },
        });
    });

    test("edits the deferred reply when sending an ephemeral response", async () => {
        const editReply = vi.fn().mockResolvedValue(undefined);
        const interaction = {
            deferred: true,
            editReply,
            followUp: vi.fn(),
            replied: false,
            reply: vi.fn(),
        };

        await expect(sendEphemeral(interaction as never, "PDA message sent.")).resolves.toBe(true);
        expect(editReply).toHaveBeenCalledWith({
            content: "PDA message sent.",
        });
    });

    test("defers with an ephemeral flag for long-running command flows", async () => {
        const deferReply = vi.fn().mockResolvedValue(undefined);
        const interaction = {
            deferred: false,
            deferReply,
            replied: false,
        };

        await expect(deferEphemeralReply(interaction as never)).resolves.toBe(true);
        expect(deferReply).toHaveBeenCalledWith({
            flags: MessageFlags.Ephemeral,
        });
    });

    test("treats already-acknowledged and unknown interactions as ignorable", () => {
        expect(isIgnorableInteractionError({ code: 40060 })).toBe(true);
        expect(isIgnorableInteractionError({ code: 10062 })).toBe(true);
        expect(isIgnorableInteractionError({ code: 50013 })).toBe(false);
    });
});
