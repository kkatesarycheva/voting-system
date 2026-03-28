#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Building and deploying voting-app..."

docker compose down --remove-orphans
docker compose up -d --build

echo "==> Waiting for container to start..."
sleep 3

if [ ! -f "$SCRIPT_DIR/data/voting.db" ]; then
  echo "==> No database found — initialising..."
  docker compose exec voting-app node /app/backend/init-db.js
  echo "==> Database initialised."
fi

echo "==> Deployment complete. App running at http://localhost:3001"
