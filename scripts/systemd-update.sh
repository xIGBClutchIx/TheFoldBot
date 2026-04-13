#!/usr/bin/env sh

set -eu

REPO_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
REMOTE_NAME=${REMOTE_NAME:-origin}
SERVICE_NAME=${SERVICE_NAME:-thefoldbot.service}

log() {
    printf '%s %s\n' "[systemd-update]" "$*"
}

cd "$REPO_DIR"

if ! git diff --quiet || ! git diff --cached --quiet; then
    log "working tree is dirty; refusing to auto-update"
    exit 0
fi

UPSTREAM_REF=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)
if [ -z "$UPSTREAM_REF" ]; then
    log "no upstream branch is configured; auto-update skipped"
    exit 0
fi

log "fetching from $REMOTE_NAME"
git fetch --quiet "$REMOTE_NAME"

LOCAL_REV=$(git rev-parse HEAD)
UPSTREAM_REV=$(git rev-parse "$UPSTREAM_REF")

if [ "$LOCAL_REV" = "$UPSTREAM_REV" ]; then
    log "already up to date"
    exit 0
fi

log "pulling latest changes"
git pull --ff-only "$REMOTE_NAME"

log "installing dependencies"
vp install

log "building bot"
vp run build

log "restarting $SERVICE_NAME"
systemctl restart "$SERVICE_NAME"
