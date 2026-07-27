#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT/.env"
EXAMPLE_FILE="$ROOT/.env.example"

if [[ -f "$ENV_FILE" ]]; then
  echo "Already exists: $ENV_FILE"
  echo "Open it and paste your key after the = if needed."
  exit 0
fi

if [[ -f "$EXAMPLE_FILE" ]]; then
  cp "$EXAMPLE_FILE" "$ENV_FILE"
else
  cat > "$ENV_FILE" <<'EOF'
ELEVENLABS_API_KEY=
EOF
fi

echo "Created: $ENV_FILE"
echo "Open it and paste your ElevenLabs API key after the ="
