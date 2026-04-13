#!/usr/bin/env sh

set -eu

REPO_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
CHECK_INTERVAL=${CHECK_INTERVAL:-60}
REMOTE_NAME=${REMOTE_NAME:-origin}
START_CMD=${START_CMD:-vp run start}

cd "$REPO_DIR"

BOT_PID=""

log() {
    printf '%s %s\n' "[run.sh]" "$*"
}

require_clean_worktree() {
    if ! git diff --quiet || ! git diff --cached --quiet; then
        log "working tree is dirty; skipping auto-pull until it is clean"
        return 1
    fi

    return 0
}

ensure_runtime() {
    log "installing dependencies"
    vp install

    log "building bot"
    vp run build
}

start_bot() {
    log "starting bot with: $START_CMD"
    sh -c "$START_CMD" &
    BOT_PID=$!
}

stop_bot() {
    if [ -n "${BOT_PID:-}" ] && kill -0 "$BOT_PID" 2>/dev/null; then
        log "stopping bot process $BOT_PID"
        kill "$BOT_PID"
        wait "$BOT_PID" || true
    fi

    BOT_PID=""
}

cleanup() {
    stop_bot
}

trap cleanup INT TERM EXIT

has_remote_update() {
    if ! git fetch --quiet "$REMOTE_NAME"; then
        log "git fetch failed; keeping current bot process running"
        return 1
    fi

    UPSTREAM_REF=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || true)
    if [ -z "$UPSTREAM_REF" ]; then
        log "no upstream branch is configured; auto-update is disabled"
        return 1
    fi

    LOCAL_REV=$(git rev-parse HEAD)
    UPSTREAM_REV=$(git rev-parse "$UPSTREAM_REF")

    [ "$LOCAL_REV" != "$UPSTREAM_REV" ]
}

apply_update() {
    require_clean_worktree || return 1

    log "remote update detected; pulling latest changes"
    git pull --ff-only "$REMOTE_NAME"

    ensure_runtime
    return 0
}

ensure_runtime
start_bot

while :; do
    sleep "$CHECK_INTERVAL"

    if ! kill -0 "$BOT_PID" 2>/dev/null; then
        log "bot exited; restarting"
        start_bot
        continue
    fi

    if ! has_remote_update; then
        continue
    fi

    stop_bot

    if apply_update; then
        start_bot
        continue
    fi

    log "update was not applied; restarting current revision"
    start_bot
done
