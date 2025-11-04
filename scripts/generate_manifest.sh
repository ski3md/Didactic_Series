#!/usr/bin/env bash
# wrapper for manifest_builder
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE=$(command -v node || echo node)
AI=false
VALIDATE=false
OUT=""

for arg in "$@"; do
  case "$arg" in
    --ai) AI=true ;;
    --validate) VALIDATE=true ;;
    --out=*) OUT="${arg#--out=}" ;;
  esac
done

CMD_ARGS=()
 $AI && CMD_ARGS+=("--ai")
 $VALIDATE && CMD_ARGS+=("--validate")
[ -n "$OUT" ] && CMD_ARGS+=("--out=$OUT")

echo "🛠️  Running manifest builder (ai=$AI, validate=$VALIDATE)"
cd "$SCRIPT_DIR" || exit 1
 $NODE manifest_builder.js "${CMD_ARGS[@]}"
echo "✅ generate_manifest.sh finished"