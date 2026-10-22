#!/bin/sh
# KI092: publish this build's Next.js chunks to the volume nginx serves
# /_next/static/ from, then start the server.
#
# - Hashed names never change content, so a file already there is only
#   touched (its age restarts) and never rewritten while nginx may be sending
#   it. A new file is written under a temporary name and renamed into place,
#   so nginx never sees a half-written chunk.
# - Files no build has published for 30 days are removed (an open tab may
#   still ask for an older build's chunks until then; after that nginx falls
#   back to Node, which no longer has them either).
# - Never blocks the start: anything missing is served by Node.
SRC=apps/web/.next/static
DEST=/app/shared-static

if [ -d "$DEST" ] && [ -w "$DEST" ]; then
  added=0
  kept=0
  cd "$SRC" || exit 1
  for f in $(find . -type f); do
    d="$DEST/${f#./}"
    if [ -e "$d" ]; then
      touch "$d" && kept=$((kept + 1))
    else
      mkdir -p "$(dirname "$d")" && cp "$f" "$d.tmp.$$" && mv "$d.tmp.$$" "$d" && added=$((added + 1))
    fi
  done
  cd - >/dev/null || exit 1
  find "$DEST" -type f -name '*.tmp.*' -delete 2>/dev/null
  find "$DEST" -type f -mtime +30 -delete 2>/dev/null
  echo "[publish-static] added=$added kept=$kept"
else
  echo "[publish-static] $DEST missing or not writable; nginx falls back to Node for chunks"
fi

exec node apps/web/server.js
