# TheFoldBot

A Vite+ TypeScript Discord slash-command bot.

## Requirements

- Node.js 22.12.0 or newer
- `vp` available in your shell

## Setup

```bash
vp install
cp .env.example .env
```

Fill in these variables in `.env`:

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

The PDA channel setting is stored in the global SQLite config database at `~/.thefoldbot/config.sqlite`.

Run the full local verification flow:

```bash
vp run ci
```

Build the bot for production:

```bash
vp run build
```

The bundled output is written to `dist/`.

## Production Run Script

Use the repo-root script to keep the bot running and auto-update from Git:

```bash
./run.sh
```

What it does:

- runs `vp install` and `vp run build` before the bot starts
- launches the production bot with `vp run start`
- checks the configured Git upstream every 60 seconds
- if the checkout is clean and a remote update exists, pulls with `git pull --ff-only`, rebuilds, and restarts the bot

Optional environment variables:

- `CHECK_INTERVAL=300 ./run.sh` to change the polling interval in seconds
- `START_CMD='vp run start' ./run.sh` to override the start command
- `REMOTE_NAME=origin ./run.sh` to choose a different Git remote
