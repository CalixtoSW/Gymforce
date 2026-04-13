#!/bin/bash
set -euo pipefail

PROJECT_DIR="/opt/gymforce"
COMPOSE_FILE="deploy/docker-compose.prod.yml"
ENV_FILE="deploy/.env.prod"

echo "╔══════════════════════════════════════════╗"
echo "║  GymForce - Deploy de Producao           ║"
echo "╚══════════════════════════════════════════╝"

cd "$PROJECT_DIR"

echo ">>> Puxando codigo..."
git pull origin main

echo ">>> Construindo imagens..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build --no-cache backend admin

echo ">>> Aplicando migrations..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm backend \
    alembic upgrade head

echo ">>> Reiniciando backend..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps backend

echo ">>> Reiniciando admin..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-deps admin

echo ">>> Recarregando Nginx..."
docker exec gymforce-nginx nginx -s reload

echo ">>> Verificando saude..."
sleep 5
if curl -sf http://localhost:8000/api/v1/health > /dev/null; then
    echo "  ✅ Backend OK"
else
    echo "  ❌ Backend FALHOU"
    exit 1
fi

echo ">>> Limpando imagens antigas..."
docker image prune -f

echo ""
echo "✅ Deploy concluido com sucesso!"
echo "   API:   https://api.gymforce.app/api/docs"
echo "   Admin: https://admin.gymforce.app"
