# TheFoldBot

A Vite+ monorepo scaffold for a TypeScript Discord slash-command bot.

## Requirements

- Node.js 22.12.0 or newer
- `vp` available in your shell

## Setup

```bash
vp install
cp apps/bot/.env.example apps/bot/.env
```

Fill in these variables in `apps/bot/.env`:

- `DISCORD_BOT_TOKEN`
- `DISCORD_GUILD_ID`

## Development

Start the bot in watch mode:

```bash
vp run dev
```

Slash commands sync automatically on startup for `DISCORD_GUILD_ID`.

## Commands

- `/set_pda_channel channel:<channel>` sets the destination channel for PDA messages
- `/pda character_name:<name> message:<message>` sends a PDA embed into the configured channel

The PDA channel setting is stored in `apps/bot/config.json` as:

```json
{
  "pda": {
    "channel": "987654321098765432"
  }
}
```

Run the full local verification flow:

```bash
vp run ci
```

Build the bot for production:

```bash
vp run build
```

The bundled output is written to `apps/bot/dist/`.
