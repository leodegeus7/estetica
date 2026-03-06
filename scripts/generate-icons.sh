#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."

echo "Convertendo SVG para PNG..."
sips -s format png public/favicon.svg --out public/icon-tmp.png

echo "Gerando 512x512..."
sips --resampleWidth 512 public/icon-tmp.png --out public/pwa-512x512.png

echo "Gerando 192x192..."
sips --resampleWidth 192 public/icon-tmp.png --out public/pwa-192x192.png

echo "Gerando 180x180 (apple-touch-icon)..."
sips --resampleWidth 180 public/icon-tmp.png --out public/apple-touch-icon.png

rm public/icon-tmp.png
echo "Pronto! Ícones gerados em public/"
ls -lh public/*.png
