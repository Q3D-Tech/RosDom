#!/usr/bin/env bash
set -euo pipefail

APP_ROOT="/var/opt/rosdom/backend"
ENV_ROOT="/etc/rosdom"
LOG_ROOT="/var/log/rosdom"

echo "[1/6] Creating directories"
sudo mkdir -p "$APP_ROOT" "$ENV_ROOT" "$LOG_ROOT"

echo "[2/6] Copy backend files"
sudo rsync -av --delete ./ "$APP_ROOT"/ \
  --exclude node_modules \
  --exclude dist \
  --exclude .git

echo "[3/6] Installing dependencies"
cd "$APP_ROOT"
npm ci

echo "[4/6] Building backend"
npm run build

echo "[5/6] Preparing env file"
if [[ ! -f "$ENV_ROOT/rosdom-backend.env" ]]; then
  sudo cp "$APP_ROOT/deploy/linux/env/rosdom-backend.env.example" "$ENV_ROOT/rosdom-backend.env"
  echo "Created $ENV_ROOT/rosdom-backend.env"
fi

echo "[6/6] Installing systemd unit"
sudo cp "$APP_ROOT/deploy/linux/systemd/rosdom-backend.service" /etc/systemd/system/rosdom-backend.service
sudo systemctl daemon-reload

echo "Done. Edit $ENV_ROOT/rosdom-backend.env, then run:"
echo "  sudo systemctl enable rosdom-backend"
echo "  sudo systemctl start rosdom-backend"
echo "  sudo systemctl status rosdom-backend"
