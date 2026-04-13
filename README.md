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

## Production With systemd

This repo includes a root/system-level `systemd` setup under [`systemd/`](/root/repos/xigbclutchix/TheFoldBot/systemd) plus an updater script at [`scripts/systemd-update.sh`](/root/repos/xigbclutchix/TheFoldBot/scripts/systemd-update.sh).

These unit files assume the repo lives at `/root/TheFoldBot`.

Install the units on the server:

```bash
cp systemd/thefoldbot.service /etc/systemd/system/
cp systemd/thefoldbot-update.service /etc/systemd/system/
cp systemd/thefoldbot-update.timer /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now thefoldbot.service
systemctl enable --now thefoldbot-update.timer
```

What this setup does:

- `thefoldbot.service` runs `vp run start` and restarts automatically if the bot exits
- `thefoldbot-update.timer` runs every minute
- `thefoldbot-update.service` calls the updater script
- the updater only restarts the bot after `git pull --ff-only`, `vp install`, and `vp run build` all succeed

This keeps downtime to the restart window instead of the full pull/install/build window.

Useful commands:

```bash
systemctl status thefoldbot.service
systemctl status thefoldbot-update.timer
journalctl -u thefoldbot.service -f
journalctl -u thefoldbot-update.service -f
```
