#!/bin/bash
# Download all images from suzanneravenall.com
# Run from repo root: bash infra/scripts/migrations/site-audit/download-assets.sh

AUDIT_DIR="infra/scripts/migrations/site-audit"
IMAGES_DIR="$AUDIT_DIR/assets/images"
LOGOS_DIR="$AUDIT_DIR/assets/logos"
IMAGE_URLS="$AUDIT_DIR/assets/image-urls.txt"

echo "Downloading images from suzanneravenall.com..."
echo ""

downloaded=0
failed=0

while IFS= read -r line; do
  # Skip comments and empty lines
  [[ "$line" =~ ^# ]] && continue
  [[ -z "$line" ]] && continue
  [[ "$line" =~ ^## ]] && continue

  url="$line"
  filename=$(basename "$url" | cut -d'?' -f1)

  # Route logos/favicons to logos dir, rest to images
  if echo "$url" | grep -qiE "logo|favicon|icon|brand"; then
    output="$LOGOS_DIR/$filename"
  else
    output="$IMAGES_DIR/$filename"
  fi

  echo -n "Downloading $filename ... "
  if curl -sL "$url" -o "$output" --max-time 30 --create-dirs; then
    size=$(wc -c < "$output" 2>/dev/null || echo "?")
    echo "✅ (${size} bytes)"
    ((downloaded++))
  else
    echo "❌ failed"
    ((failed++))
  fi

done < "$IMAGE_URLS"

echo ""
echo "Complete: $downloaded downloaded, $failed failed"
echo "Images: $IMAGES_DIR"
echo "Logos:  $LOGOS_DIR"
