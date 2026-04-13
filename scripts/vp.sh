#!/usr/bin/env sh

set -eu

if [ -n "${VP_BIN:-}" ] && [ -x "${VP_BIN}" ]; then
    exec "${VP_BIN}" "$@"
fi

for candidate in \
    /root/.local/bin/vp \
    /usr/local/bin/vp \
    /usr/bin/vp \
    /bin/vp
do
    if [ -x "$candidate" ]; then
        exec "$candidate" "$@"
    fi
done

if command -v vp >/dev/null 2>&1; then
    exec vp "$@"
fi

printf '%s\n' "vp not found. Set VP_BIN to the full path for the Vite+ binary." >&2
exit 127
