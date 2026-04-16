#!/bin/bash

set -euo pipefail

ZIP_PATH="/opt/frontend-dev.zip"
DEPLOY_ROOT="/opt/medsgh-frontend-dev"
APP_DIR_DEFAULT="$DEPLOY_ROOT/frontend"
ENV_BACKUP="/tmp/medsgh-frontend-dev.env"
APP_DIR=""

echo "Deploying frontend dev from $ZIP_PATH"

if [ ! -f "$ZIP_PATH" ]; then
  echo "Missing archive: $ZIP_PATH"
  exit 1
fi

if [ -f "$APP_DIR_DEFAULT/.env" ]; then
  cp "$APP_DIR_DEFAULT/.env" "$ENV_BACKUP"
  echo "Backed up .env to $ENV_BACKUP"
fi

pkill -f "nuxi dev" 2>/dev/null || true
pkill -f ".output/server/index.mjs" 2>/dev/null || true

rm -rf "$DEPLOY_ROOT"
mkdir -p "$DEPLOY_ROOT"
set +e
unzip -o "$ZIP_PATH" -d "$DEPLOY_ROOT"
UNZIP_STATUS=$?
set -e
if [ "$UNZIP_STATUS" -gt 1 ]; then
  echo "Archive extraction failed with status $UNZIP_STATUS"
  exit "$UNZIP_STATUS"
fi

if [ -d "$DEPLOY_ROOT/frontend" ]; then
  APP_DIR="$DEPLOY_ROOT/frontend"
elif [ -f "$DEPLOY_ROOT/package.json" ]; then
  APP_DIR="$DEPLOY_ROOT"
else
  echo "Expected app directory missing after extract: $DEPLOY_ROOT or $DEPLOY_ROOT/frontend"
  exit 1
fi

if [ -f "$ENV_BACKUP" ]; then
  cp "$ENV_BACKUP" "$APP_DIR/.env"
  echo "Restored .env"
fi

cd "$APP_DIR"
rm -rf node_modules .nuxt .output
npm install
npm run build
nohup env PORT=4000 HOST=0.0.0.0 node .output/server/index.mjs > frontend-dev.out.log 2> frontend-dev.err.log &
sleep 5

if command -v curl >/dev/null 2>&1; then
  echo "Frontend check:"
  curl -I -fsS http://127.0.0.1:4000 || true
fi

echo "Frontend dev deploy complete"
