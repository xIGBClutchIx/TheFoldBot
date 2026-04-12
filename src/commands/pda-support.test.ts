import { ChannelType, PermissionFlagsBits, PermissionsBitField } from "discord.js";

import { describe, expect, test, vi } from "vite-plus/test";

import { buildPdaEmbed, getMissingPostPermissions, sendPdaMessage } from "./pda-support.ts";

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
      permissionsFor: vi
        .fn()
        .mockReturnValue(new PermissionsBitField(PermissionFlagsBits.ViewChannel)),
      type: ChannelType.GuildText,
    };
    const member = {};

    expect(getMissingPostPermissions(channel as never, member as never)).toEqual([
      "Send Messages",
      "Embed Links",
    ]);
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
});
