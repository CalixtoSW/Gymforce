#!/bin/bash
set -euo pipefail

PROJECT_DIR="/opt/gymforce"
COMPOSE_FILE="deploy/docker-compose.prod.yml"
ENV_FILE="deploy/.env.prod"

cd "$PROJECT_DIR"
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm certbot renew
docker exec gymforce-nginx nginx -s reload

echo "✅ SSL renovado (se necessario) e Nginx recarregado"
