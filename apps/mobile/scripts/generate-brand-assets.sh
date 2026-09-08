#!/usr/bin/env bash
# Generate RateQ icon + splash assets to Expo / Play Store / App Store specs.
#
# Specs (Expo SDK 52+, Apple, Google):
#   icon.png              1024×1024 PNG, no transparency (iOS + Expo master icon)
#   adaptive-icon.png     1024×1024 PNG + alpha; key art in center 66/108 safe zone (~626²)
#   play-store-icon.png   512×512 32-bit PNG with alpha (Play Console listing)
#   splash-icon.png       1024×1024 PNG + alpha (expo-splash-screen image)
#
# Refs:
#   https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/
#   https://developer.apple.com/design/human-interface-guidelines/app-icons
#   https://developer.android.com/develop/ui/views/launch/icon-design-adaptive
#   https://support.google.com/googleplay/android-developer/answer/9866151
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WEB_IMG="$ROOT/web/public/images"
MOBILE_IMG="$ROOT/mobile/assets/images"
BRAND='#8E2157'
WHITE_LOGO="$WEB_IMG/white_logo.svg"
ICON_MARK="$MOBILE_IMG/app-icon-mark.svg"

# Android adaptive safe zone: 66dp of 108dp canvas → ~626×626 on 1024
# (developer.android.com adaptive icon keylines; content outside may be cropped)
SAFE_ZONE=626
# Keep mark slightly inside the safe zone for circular / squircle masks
MARK_SIZE=560

if [[ ! -f "$WHITE_LOGO" ]]; then
  echo "Missing web logo: $WHITE_LOGO" >&2
  exit 1
fi
if [[ ! -f "$ICON_MARK" ]]; then
  echo "Missing icon mark: $ICON_MARK" >&2
  exit 1
fi
if ! command -v magick >/dev/null 2>&1; then
  echo "ImageMagick (magick) is required" >&2
  exit 1
fi

cp "$WEB_IMG/logo.svg" "$WEB_IMG/white_logo.svg" "$MOBILE_IMG/"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# Shared Q-mark layer at MARK_SIZE
magick -density 384 -background none "$ICON_MARK" \
  -resize "${MARK_SIZE}x${MARK_SIZE}" \
  -strip "$TMP/mark.png"

# --- 1) iOS / Expo master icon: 1024×1024, opaque, no rounded corners ----------
magick -size 1024x1024 xc:"$BRAND" \
  "$TMP/mark.png" -gravity center -compose over -composite \
  -alpha off -strip PNG24:"$MOBILE_IMG/icon.png"

# --- 2) Android adaptive foreground: 1024×1024, transparent, safe-zone mark ---
magick -size 1024x1024 xc:none \
  "$TMP/mark.png" -gravity center -compose over -composite \
  -strip PNG32:"$MOBILE_IMG/adaptive-icon.png"

# Optional: draw safe-zone guide only in CI debug (disabled)
# magick "$MOBILE_IMG/adaptive-icon.png" -fill none -stroke '#00ff0040' -strokewidth 2 \
#   -draw "rectangle $(((1024-SAFE_ZONE)/2)),$(((1024-SAFE_ZONE)/2)) $(((1024+SAFE_ZONE)/2)),$(((1024+SAFE_ZONE)/2))" \
#   "$TMP/adaptive-debug.png"

# --- 3) Google Play high-res icon: exactly 512×512, 32-bit PNG with alpha -----
# https://support.google.com/googleplay/android-developer/answer/9866151
magick -size 512x512 xc:"$BRAND" \
  \( "$TMP/mark.png" -resize 320x320 \) -gravity center -compose over -composite \
  -alpha set -strip PNG32:"$MOBILE_IMG/play-store-icon.png"

# --- 4) Expo splash image: 1024×1024, transparent, large white wordmark -------
magick -density 512 -background none "$WHITE_LOGO" -resize 800x \
  -gravity center -background none -extent 1024x1024 \
  -strip PNG32:"$MOBILE_IMG/splash-icon.png"

# Legacy full-bleed splash (optional reference / older configs)
magick -size 1284x2778 xc:"$BRAND" \
  \( -density 512 -background none "$WHITE_LOGO" -resize 900x \) \
  -gravity center -compose over -composite \
  -alpha off -strip PNG24:"$MOBILE_IMG/splash.png"

assert_size() {
  local file="$1" w="$2" h="$3"
  local actual
  actual="$(magick identify -format '%w %h' "$file")"
  if [[ "$actual" != "$w $h" ]]; then
    echo "FAIL $file expected ${w}x${h}, got $actual" >&2
    exit 1
  fi
  echo "OK   $file ${w}x${h}"
}

echo ""
echo "Dimension checks:"
assert_size "$MOBILE_IMG/icon.png" 1024 1024
assert_size "$MOBILE_IMG/adaptive-icon.png" 1024 1024
assert_size "$MOBILE_IMG/play-store-icon.png" 512 512
assert_size "$MOBILE_IMG/splash-icon.png" 1024 1024
assert_size "$MOBILE_IMG/splash.png" 1284 2778

# Safe-zone coverage: non-transparent pixels outside center SAFE_ZONE² should be ~0
SAFE_OFFSET=$(( (1024 - SAFE_ZONE) / 2 ))
OUTSIDE="$(magick "$MOBILE_IMG/adaptive-icon.png" -alpha extract \
  \( +clone -size 1024x1024 xc:white -fill black \
     -draw "rectangle ${SAFE_OFFSET},${SAFE_OFFSET} $((SAFE_OFFSET+SAFE_ZONE-1)),$((SAFE_OFFSET+SAFE_ZONE-1))" \) \
  -compose multiply -composite -format '%[fx:mean]' info:)"
echo "Adaptive safe-zone check (outside-mean should be ~0): $OUTSIDE"

echo ""
echo "Generated store-ready assets in $MOBILE_IMG"
