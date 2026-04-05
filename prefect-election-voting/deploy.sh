#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "==> Building and deploying voting-app..."

mkdir -p "$SCRIPT_DIR/data/uploads"
if chown -R "${APP_UID:-19111}" "$SCRIPT_DIR/data"; then
  chgrp -R "${APP_GID:-19111}" "$SCRIPT_DIR/data" || echo "==> Warning: Failed to set group ownership of uploads directory"
  chmod -R 755 "$SCRIPT_DIR/data" || echo "==> Warning: Failed to set permissions of uploads directory"
else
  echo "==> Warning: Failed to set ownership of uploads directory"
fi

docker compose down
docker compose build \
  ${APP_UID:+--build-arg APP_UID=$APP_UID} \
  ${APP_GID:+--build-arg APP_GID=$APP_GID}

NEED_INIT=0
if [ ! -f "$SCRIPT_DIR/data/voting.db" ]; then
  NEED_INIT=1
else
  # Check if 'users' table exists in the SQLite database
  if ! sqlite3 "$SCRIPT_DIR/data/voting.db" ".schema users" | grep -q "CREATE TABLE"; then
    NEED_INIT=1
  fi
fi

if [ "$NEED_INIT" = "1" ]; then
  echo "==> Database missing or 'users' table not found — initialising..."
  docker compose run --rm voting-app node /app/backend/init-db.js
  echo "==> Database initialised."
fi

docker compose up -d

echo "==> Waiting for container to start..."
sleep 3

echo "==> Deployment complete. App running at http://localhost:49981"
