#!/usr/bin/env bash
set -euo pipefail

# Buckets:
# - 150–249 lines
# - 250–399 lines
# - 400+ lines
#
# Files containing the comment "//tag: approved" are skipped.

bucket400=""
bucket250=""
bucket150=""

while IFS= read -r -d '' file; do
  # Skip approved files
  if grep -q "//tag: approved" "$file" 2>/dev/null; then
    continue
  fi

  lines=$(wc -l <"$file")

  if (( lines >= 400 )); then
    bucket400+="$file ($lines)\n"
  elif (( lines >= 250 )); then
    bucket250+="$file ($lines)\n"
  elif (( lines >= 150 )); then
    bucket150+="$file ($lines)\n"
  fi
done < <(
  find . \
    -type d \( -name node_modules -o -name .next -o -name .storybook -o -name .git \) -prune -o \
    -type f ! -name "*.md" \
    ! -path "./public/*" \
    ! -path "./fonts/*" \
    -print0
)

echo "=== >=400 lines ==="
printf "%b" "$bucket400"
echo "=== 250-399 lines ==="
printf "%b" "$bucket250"
echo "=== 150-249 lines ==="
printf "%b" "$bucket150"

