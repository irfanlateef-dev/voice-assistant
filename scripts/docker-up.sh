#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing .env file. Copy .env.example and fill in your API keys:"
  echo "  cp .env.example .env"
  exit 1
fi

echo "==> Building and starting VoiceAgent (production)..."
docker compose up --build -d

echo ""
echo "==> Stack is starting."
echo "    App:    https://assistantchef.cc"
echo "    API:    https://assistantchef.cc/api/health"
echo ""
echo "Optional demo data:"
echo "    docker compose --profile seed run --rm seed"
echo ""
echo "Logs:"
echo "    docker compose logs -f"
