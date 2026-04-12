# 🏋️ GymForce

> App de gerenciamento de academia com gamificação — pontos, streaks, tiers e recompensas.

## 📁 Estrutura deste Pacote

```
gymforce-projeto/
├── fase-1-tecnologias/
│   └── TECH_STACK.md            ← Estudo de tecnologias e decisões
├── fase-2-escopo/
│   ├── ESCOPO.md                ← Escopo completo com módulos e MVP
│   └── BACKLOG_INICIAL.md       ← Backlog do Sprint 0 e MVP
├── fase-3-ide/
│   └── VSCODE_SETUP.md          ← Extensões, settings, estrutura de pastas
├── fase-4-governanca/
│   ├── GOVERNANCA.md            ← Branches, commits, DoD, padrão de API
│   ├── templates/
│   │   └── TEMPLATE_BACKLOG.md  ← Template para itens de backlog
│   ├── handoff/
│   │   └── TEMPLATE_HANDOFF.md  ← Template de transição entre agentes
│   └── agentes/
│       └── AGENTES_WORKFLOW.md  ← Papéis dos agentes de IA e pipeline
├── docker-compose.yml           ← Postgres 16 + Redis 7 para dev local
└── README.md                    ← Este arquivo
```

## 🚀 Quick Start

```bash
# 1. Subir infraestrutura local
docker compose up -d

# 2. Verificar
docker compose ps
# gymforce-db    → running (5432)
# gymforce-redis → running (6379)
```

## 🖥️ Admin Web

```bash
cd admin
npm install
cp .env.local.example .env.local
# Editar NEXT_PUBLIC_API_URL se necessário
npm run dev
# Acesse http://localhost:3000
# Login: admin@gymforce.app / Teste@123
```

## 📊 Stack Resumida

| Camada | Tech |
|--------|------|
| Mobile | React Native + Expo SDK 54 + TypeScript |
| Backend | FastAPI + Python 3.12 + Pydantic v2 |
| DB | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | Supabase Auth |
| CI/CD | GitHub Actions + EAS Build |

## 📋 Próximos Passos

1. Revisar `TECH_STACK.md` e validar decisões
2. Revisar `ESCOPO.md` e priorizar MVP
3. Instalar extensões do VS Code (`VSCODE_SETUP.md`)
4. Criar repositório Git e aplicar governança
5. Executar Sprint 0 (setup, design system, DB schema)
