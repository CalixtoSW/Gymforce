.PHONY: setup db-up db-down migrate seed run test clean init

# === Infraestrutura ===
db-up:
	docker compose -f ../docker-compose.yml up -d
	@echo "Aguardando Postgres..."
	@sleep 3
	@echo "Postgres e Redis rodando"

db-down:
	docker compose -f ../docker-compose.yml down

# === Backend ===
setup:
	python -m venv .venv
	. .venv/bin/activate && pip install -e ".[dev]"
	cp -n .env.example .env 2>/dev/null || true
	@echo "Setup completo. Ative o venv: source .venv/bin/activate"

migrate:
	alembic upgrade head
	@echo "Migrations aplicadas"

seed:
	python -m scripts.seed
	@echo "Dados de teste inseridos"

run:
	uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:
	pytest -v

# === Combo ===
init: db-up setup migrate seed
	@echo ""
	@echo "GymForce Backend pronto"
	@echo "Rode: make run"

clean:
	docker compose -f ../docker-compose.yml down -v
	rm -rf .venv __pycache__ .pytest_cache
	@echo "Limpo"
