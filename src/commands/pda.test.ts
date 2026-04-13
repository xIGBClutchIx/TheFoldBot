import { describe, expect, test } from "vite-plus/test";

import { pdaCommand, pdaCommandLimits } from "./pda.ts";

describe("pda command", () => {
    test("uses Discord-safe string length limits", () => {
        const command = pdaCommand.data.toJSON();

        expect(command.options).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    max_length: pdaCommandLimits.characterNameMaxLength,
                    name: "character_name",
                }),
                expect.objectContaining({
                    max_length: pdaCommandLimits.messageMaxLength,
                    name: "message",
                }),
            ]),
        );
    });
});
