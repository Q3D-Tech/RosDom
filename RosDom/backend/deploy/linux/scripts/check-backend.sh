#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://127.0.0.1:4000}"

echo "Health:"
curl -fsS "${BASE_URL}/v1/health"
echo
echo
echo "Headers:"
curl -I "${BASE_URL}/v1/health"
echo
echo
echo "Tuya OAuth callback route:"
curl -I "${BASE_URL}/v1/integrations/tuya/oauth/callback"
echo
