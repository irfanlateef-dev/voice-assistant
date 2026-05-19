#!/bin/sh
set -e

echo "[entrypoint] Running database migrations..."
node scripts/migrate.js

echo "[entrypoint] Starting web server..."
exec "$@"
