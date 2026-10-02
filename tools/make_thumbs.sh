#!/usr/bin/env bash
# Regenerate the still (.jpg beside each .mp4) used by the story tree and the
# caregiver report. Run after replacing any clip:  bash tools/make_thumbs.sh
# Reaction clips take the frame at 80% (the peer's response has landed);
# context and action clips take the midpoint.
set -euo pipefail
cd "$(dirname "$0")/../assets/videos/clips"
n=0
for f in */*.mp4; do
  d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$f")
  case "$f" in */reaction_*) p=0.8 ;; *) p=0.5 ;; esac
  t=$(awk -v d="$d" -v p="$p" 'BEGIN{printf "%.2f", d*p}')
  ffmpeg -loglevel error -y -ss "$t" -i "$f" -frames:v 1 -vf scale=320:-2 -q:v 4 "${f%.mp4}.jpg"
  n=$((n+1))
done
echo "$n stills written"
