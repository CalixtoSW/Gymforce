.PHONY: up down restart deploy logs logs-api logs-nginx migrate seed backup ssl-init ssl-renew status

COMPOSE = docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod
PROJECT_DIR = /opt/gymforce

up:
	cd $(PROJECT_DIR) && $(COMPOSE) up -d
	@echo "✅ GymForce rodando"

down:
	cd $(PROJECT_DIR) && $(COMPOSE) down
	@echo "⬇️ GymForce parado"

restart:
	cd $(PROJECT_DIR) && $(COMPOSE) restart backend admin
	cd $(PROJECT_DIR) && docker exec gymforce-nginx nginx -s reload
	@echo "🔄 Reiniciado"

deploy:
	bash $(PROJECT_DIR)/deploy/scripts/deploy.sh

logs:
	cd $(PROJECT_DIR) && $(COMPOSE) logs -f --tail=100

logs-api:
	cd $(PROJECT_DIR) && docker logs -f gymforce-api --tail=100

logs-nginx:
	cd $(PROJECT_DIR) && docker logs -f gymforce-nginx --tail=100

migrate:
	cd $(PROJECT_DIR) && $(COMPOSE) run --rm backend alembic upgrade head

seed:
	cd $(PROJECT_DIR) && $(COMPOSE) run --rm backend python -m scripts.seed

backup:
	bash $(PROJECT_DIR)/deploy/scripts/backup-db.sh

ssl-init:
	cd $(PROJECT_DIR) && docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod up -d nginx
	cd $(PROJECT_DIR) && docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod run --rm certbot certonly \
		--webroot -w /var/www/certbot \
		-d api.gymforce.app -d admin.gymforce.app \
		--email $$(grep CERTBOT_EMAIL deploy/.env.prod | cut -d= -f2) \
		--agree-tos --non-interactive
	cd $(PROJECT_DIR) && docker exec gymforce-nginx nginx -s reload
	@echo "✅ SSL configurado"

ssl-renew:
	cd $(PROJECT_DIR) && docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env.prod run --rm certbot renew
	cd $(PROJECT_DIR) && docker exec gymforce-nginx nginx -s reload

status:
	cd $(PROJECT_DIR) && $(COMPOSE) ps
	@echo ""
	@curl -sf https://api.gymforce.app/api/v1/health && echo " API ✅" || echo " API ❌"
