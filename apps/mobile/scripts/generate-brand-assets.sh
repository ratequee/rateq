#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WEB_IMG="$ROOT/web/public/images"
MOBILE_IMG="$ROOT/mobile/assets/images"
LOGO="$WEB_IMG/white_logo.svg"

if [[ ! -f "$LOGO" ]]; then
  echo "Missing web logo: $LOGO" >&2
  exit 1
fi

cp "$WEB_IMG/logo.svg" "$WEB_IMG/white_logo.svg" "$MOBILE_IMG/"

magick -density 384 -background none "$LOGO" -resize 900x225 /tmp/rateq-logo-layer.png
magick -size 1284x2778 xc:'#8E2157' /tmp/rateq-logo-layer.png -gravity center -composite "$MOBILE_IMG/splash.png"

magick -density 384 -background none "$LOGO" -resize 640x160 /tmp/rateq-icon-layer.png
magick -size 1024x1024 xc:'#8E2157' /tmp/rateq-icon-layer.png -gravity center -composite "$MOBILE_IMG/icon.png"

magick -density 384 -background none "$LOGO" -resize 620x155 /tmp/rateq-adaptive-layer.png
magick -size 1024x1024 xc:none /tmp/rateq-adaptive-layer.png -gravity center -composite "$MOBILE_IMG/adaptive-icon.png"

echo "Generated brand assets from $LOGO"
