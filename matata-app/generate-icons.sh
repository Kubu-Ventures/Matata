#!/bin/bash
mkdir -p public/icons
for size in 72 96 128 144 152 192 384 512; do
  convert source-icon.png -resize ${size}x${size} public/icons/icon-${size}x${size}.png
done
identify public/icons/*.png
