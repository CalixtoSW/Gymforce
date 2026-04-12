# 📘 GymForce — Documento de Continuidade do Projeto

> **Versão:** 1.0 | **Data:** 2026-04-12 | **Release atual:** v1.0.0
> **Propósito:** Este documento é a fonte da verdade para qualquer pessoa (desenvolvedor humano ou agente de IA) que precise entender, manter, ou evoluir o projeto GymForce.

## Atualização de Continuidade (2026-04-12)

- Release `v1.0.0` finalizada e publicada com tag no repositório remoto.
- Branches `main` e `develop` alinhadas (sem divergência).
- Admin Web validado por QA com acesso e dashboard operacional em `http://localhost:3000`.
- PRs de Sprint 8 e de release concluídos (`#24` incluído no fluxo final).

---

## 1. O que é o GymForce

App de gerenciamento de academia de musculação com gamificação integrada. O diferencial é transformar a rotina de treino em uma experiência engajante onde alunos acumulam pontos, sobem de nível, completam desafios e trocam pontos por benefícios reais.

**Três camadas:**
- **Mobile** (React Native + Expo) — app do aluno
- **Backend** (FastAPI + PostgreSQL + Redis) — API REST
- **Admin Web** (Next.js + Tailwind) — painel do dono da academia

**Repositório:** https://github.com/CalixtoSW/Gymforce.git

---

## 2. Quem fez o quê

| Papel | Quem | Responsabilidade |
|-------|------|-----------------|
| Product Owner / Líder técnico | Calixto | Visão do produto, validação, decisões de negócio |
| Arquiteto Chefe | Claude (Anthropic) | Arquitetura, ADRs, diretrizes, code review — **zero código** |
| Agente Dev Backend | Agente IA (via Claude Code) | Implementação Python/FastAPI conforme diretrizes |
| Agente Dev Mobile | Agente IA (via Claude Code) | Implementação React Native/Expo conforme diretrizes |
| Agente Dev Frontend Web | Agente IA (via Claude Code) | Implementação Next.js conforme diretrizes |
| QA | Humano + agente | Validação funcional com roteiro de 48 cenários |

---

## 3. Histórico de Sprints

| Sprint | Tema | PRs | Entregas-chave |
|--------|------|-----|---------------|
| 0 | Setup | #2, #3, #4 | CONSTITUTION.md, scaffold backend + mobile, docker-compose |
| 1 | Auth | #5, #7 | JWT access+refresh, roles (aluno/personal/admin/recepcao), login/cadastro/perfil |
| 2 | Check-in + Treinos | #8, #9 | QR Code JWT (5min TTL), fichas de treino, timer de descanso, registro de workout |
| 3 | Gamificação | #10, #11 | Engine de pontos (event sourcing), streaks com freeze, tiers automáticos, leaderboard Redis |
| 4 | Recompensas | #12-15 | Loja com estoque, resgate+cancelamento+devolução, dashboard KPIs. **Release v0.1.0-mvp** |
| 5 | Badges + Push | #17, #18 | 10 badges com avaliação automática, Expo Push API, streak risk alert |
| 6 | Pagamentos | #19, #20 | Mercado Pago PIX, controle de mensalidades, desconto por pontos (30% max) |
| 7 | Avaliação + Desafios | #21-23 | Avaliação física (14 métricas + evolução), desafios configuráveis, indicação de amigos |
| 8 | Admin Web | #24 | Next.js 15 com dashboard, CRUD completo, exportação CSV. **Release v1.0.0** |

---

## 4. Mapa da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTES                                 │
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │  Mobile App  │    │  Admin Web   │    │   Swagger    │       │
│  │  (Expo/RN)   │    │  (Next.js)   │    │  /api/docs   │       │
│  │  :8081       │    │  :3000       │    │  :8001       │       │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         └───────────────────┼───────────────────┘                │
│                             │ HTTPS / JWT Bearer                 │
│                    ┌────────▼────────┐                           │
│                    │    FastAPI      │                           │
│                    │   (Uvicorn)     │                           │
│                    │    :8001        │                           │
│                    └──┬────┬────┬───┘                           │
│                       │    │    │                                │
│              ┌────────┘    │    └────────┐                       │
│              ▼             ▼             ▼                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ PostgreSQL   │ │    Redis     │ │ Mercado Pago │            │
│  │   16         │ │    7+        │ │   API        │            │
│  │  :5432       │ │  :6379       │ │  (externo)   │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                  │
│  ┌──────────────┐                                               │
│  │ Expo Push    │ ← NotificationService envia push              │
│  │   API        │                                               │
│  │ (externo)    │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Estrutura do Repositório

```
Gymforce/
├── CONSTITUTION.md              ← Regras de trabalho (branches, commits, DoD)
├── RELEASE_NOTES.md             ← Changelog da release atual
├── README.md                    ← Quick start
├── docker-compose.yml           ← PostgreSQL 16 + Redis 7
│
├── backend/                     ← FastAPI (Python 3.12)
│   ├── app/
│   │   ├── api/v1/              ← 15 routers
│   │   │   ├── auth.py          POST /auth/register, /login, /refresh, GET /me
│   │   │   ├── users.py         GET/PATCH/DELETE /users (admin)
│   │   │   ├── checkins.py      POST /checkins, GET /checkins/qr
│   │   │   ├── workouts.py      CRUD fichas, POST /complete
│   │   │   ├── plans.py         GET/POST /plans
│   │   │   ├── gamification.py  GET /summary, /points/history, /leaderboard
│   │   │   ├── rewards.py       CRUD recompensas, POST /redeem, admin deliver/cancel
│   │   │   ├── badges.py        GET /badges
│   │   │   ├── notifications.py POST register-token, send
│   │   │   ├── payments.py      POST create-pix, webhook, GET my-membership
│   │   │   ├── assessments.py   POST assessments, GET history/evolution
│   │   │   ├── challenges.py    CRUD desafios, POST join, GET my
│   │   │   ├── referrals.py     GET my-stats
│   │   │   ├── dashboard.py     GET kpis, checkins by-hour/by-weekday
│   │   │   └── health.py        GET /health
│   │   ├── core/
│   │   │   ├── config.py        ← Pydantic Settings (.env)
│   │   │   ├── database.py      ← AsyncEngine + AsyncSession
│   │   │   ├── redis.py         ← Redis client singleton
│   │   │   └── security.py      ← JWT (access/refresh/QR), bcrypt
│   │   ├── models/              ← 17 SQLAlchemy models (19 com Base+mixins)
│   │   ├── schemas/             ← Pydantic v2 schemas (request/response)
│   │   ├── services/            ← 12 services (business logic)
│   │   └── repositories/        ← 3 repositories (data access)
│   ├── alembic/versions/        ← 7 migrations
│   ├── scripts/seed.py          ← Dados de teste (13 users, planos, fichas, etc.)
│   ├── tests/                   ← 13 test files, ~3.000 linhas
│   ├── Makefile                 ← make init / make run / make test / make seed
│   ├── pyproject.toml           ← Deps + config ruff/pytest
│   ├── Dockerfile
│   └── .env.example
│
├── mobile/                      ← React Native + Expo SDK 54
│   ├── app/                     ← Expo Router (file-based routing)
│   │   ├── (auth)/              ← login.tsx, register.tsx
│   │   ├── (tabs)/              ← home, workouts, rewards, leaderboard, profile
│   │   ├── workout/[id].tsx     ← detalhe ficha + timer
│   │   ├── payment/[id].tsx     ← QR PIX + polling
│   │   ├── assessment.tsx       ← avaliação física + gráficos
│   │   ├── challenges.tsx       ← desafios com progress bar
│   │   ├── badges.tsx           ← grid de conquistas
│   │   ├── membership.tsx       ← status matrícula
│   │   ├── plans.tsx            ← escolher plano + desconto pts
│   │   ├── redemptions.tsx      ← histórico resgates
│   │   └── referral.tsx         ← código de indicação
│   ├── components/features/     ← 14 componentes de domínio
│   ├── stores/authStore.ts      ← Zustand + SecureStore
│   ├── services/api.ts          ← Axios + interceptor refresh
│   ├── services/notifications.ts ← Expo Push setup
│   ├── constants/theme.ts       ← Design tokens (dark-first)
│   └── types/index.ts           ← Types espelhando backend
│
├── admin/                       ← Next.js 15 + Tailwind CSS 4
│   ├── src/app/
│   │   ├── login/page.tsx
│   │   └── (admin)/             ← 9 páginas com sidebar + auth guard
│   │       ├── dashboard/       ← KPIs + gráficos Recharts
│   │       ├── users/           ← CRUD + export CSV
│   │       ├── plans/           ← CRUD planos
│   │       ├── rewards/         ← CRUD + resgates pendentes
│   │       ├── challenges/      ← CRUD desafios
│   │       ├── workouts/        ← criar fichas
│   │       ├── assessments/     ← registrar avaliação
│   │       └── notifications/   ← enviar push
│   ├── src/components/          ← UI + charts + layout
│   ├── src/lib/api.ts           ← Axios client
│   └── .env.local.example
│
└── docs/                        ← Documentação de governança
    ├── TECH_STACK.md
    ├── ESCOPO.md
    ├── BACKLOG_INICIAL.md
    ├── GOVERNANCA.md
    ├── VSCODE_SETUP.md
    ├── QA_SIGNOFF_v0.1.0-mvp.md
    ├── ADR/
    ├── templates/TEMPLATE_BACKLOG.md
    ├── handoff/TEMPLATE_HANDOFF.md + HO-0001 a HO-0011
    └── agentes/AGENTES_WORKFLOW.md
```

---

## 6. Decisões Arquiteturais Vigentes

Estas decisões foram tomadas pelo Arquiteto e estão em vigor. Para alterá-las, criar um ADR novo com justificativa.

| # | Decisão | Justificativa |
|---|---------|---------------|
| 1 | **UUID como PK** (não auto-increment) | Geração client-side, sem colisão em distribuído |
| 2 | **Event sourcing para pontos** (tabela point_events) | Auditoria completa, recálculo possível, append-only |
| 3 | **total_points vs current_points** | total nunca diminui (define tier/rank), current diminui ao resgatar |
| 4 | **Redis é cache, PostgreSQL é truth** | Leaderboard Redis para performance, fallback SQL se Redis cair |
| 5 | **QR Code = JWT assinado** (5min TTL, type=qr_checkin) | Segurança — impede fabricação de QR falso |
| 6 | **Streak freeze** 1x/mês (resetado dia 1) | Equilíbrio entre engajamento e perdão por imprevistos |
| 7 | **Tiers baseados em total_points** | Bronze(0), Prata(1k), Ouro(5k), Diamante(15k), Lenda(50k) |
| 8 | **Badges avaliados automaticamente** após check-in, workout e resgate | Sem ação manual do admin |
| 9 | **PIX only** no pagamento (sem cartão) | Menor complexidade, sem PCI, custo menor, dominante no BR |
| 10 | **Desconto por pontos:** 100pts = R$1, máximo 30% | Incentiva uso de pontos sem desvalorizar o plano |
| 11 | **Assessment imutável** (não edita, cria nova) | Histórico limpo, evolução por sequência de snapshots |
| 12 | **Desafios opt-in** (aluno se inscreve) | Evita spam, permite segmentação futura |
| 13 | **Referral bônus em 2 etapas** (+100 cadastro, +100 primeiro check-in) | Incentiva retenção do indicado, não só cadastro |
| 14 | **Soft delete** para users (is_active=False) | Nunca apagar dados, LGPD compliance |
| 15 | **Admin web light theme** | Contexto profissional de recepção/escritório |

---

## 7. Modelo de Dados (Completo)

```
users ─────────────┐
  │                 │
  ├── memberships ──┼── plans
  │                 │
  ├── checkins      │
  │                 │
  ├── workouts ─────┼── workout_sheets ── exercises
  │                 │
  ├── point_events  │
  │                 │
  ├── user_streaks  │
  │                 │
  ├── user_badges ──┼── badges
  │                 │
  ├── redemptions ──┼── rewards
  │                 │
  ├── payments ─────┘
  │
  ├── assessments
  │
  ├── user_challenges ── challenges
  │
  ├── referrals
  │
  └── push_tokens
```

**Regras de integridade:**
- User soft delete (is_active) — FK constraints mantidas
- point_events é append-only — nunca UPDATE/DELETE
- Membership.status é state machine: ACTIVE → EXPIRED/CANCELLED/SUSPENDED
- Payment.status: PENDING → APPROVED/REJECTED/CANCELLED/REFUNDED/EXPIRED
- Redemption.status: PENDING → DELIVERED/CANCELLED

---

## 8. Fluxo de Gamificação (como os pontos fluem)

```
AÇÃO DO ALUNO                TRIGGER                      EFEITO
─────────────                ───────                      ──────
Check-in na academia    →  CheckinService              →  +10 pts
                            ├── GamificationService.credit_points()
                            ├── GamificationService.update_streak()
                            │     ├── streak++ (ou reset)
                            │     └── bônus streak 7d (+100) / 30d (+500)
                            ├── BadgeService.evaluate()
                            ├── ChallengeService.update_progress()
                            └── ReferralService.process_first_checkin()

Concluir treino         →  WorkoutService              →  +25 pts
                            ├── GamificationService.credit_points()
                            ├── BadgeService.evaluate()
                            └── ChallengeService.update_progress()

Resgatar recompensa     →  RewardService               →  -X pts (current)
                            ├── GamificationService.debit_points()
                            └── BadgeService.evaluate()

Completar desafio       →  ChallengeService            →  +N pts (config)
                            └── GamificationService.credit_points()

Pagar com desconto      →  PaymentService              →  -X pts (current)
                            └── GamificationService.debit_points()

Indicar amigo           →  ReferralService              →  +100 pts (cadastro)
                                                         +100 pts (1º check-in)

Subir de tier           →  GamificationService          →  0 pts, evento registrado
                            └── _check_tier_promotion() (automático)
```

**Toda movimentação de pontos gera um PointEvent (event sourcing).**

---

## 9. Variáveis de Ambiente

```bash
# === OBRIGATÓRIAS ===
DATABASE_URL=postgresql+asyncpg://gym:gym_dev_2026@localhost:5432/gymforce
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=TROCAR-EM-PRODUCAO-USAR-64-CHARS-RANDOM

# === MERCADO PAGO ===
MP_ACCESS_TOKEN=TEST-xxxx           # sandbox para dev
MP_PUBLIC_KEY=TEST-xxxx
MP_WEBHOOK_SECRET=                  # TODO: implementar validação HMAC
MP_PIX_EXPIRATION_MINUTES=30

# === OPCIONAIS ===
APP_ENV=development                 # development | production
APP_DEBUG=true                      # false em produção
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:8081,http://localhost:3000
```

---

## 10. Como Subir o Projeto do Zero

```bash
# 1. Clonar
git clone https://github.com/CalixtoSW/Gymforce.git && cd Gymforce

# 2. Infraestrutura
docker compose up -d
# Aguardar: gymforce-db (5432) + gymforce-redis (6379)

# 3. Backend
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
cp .env.example .env                    # editar JWT_SECRET_KEY
alembic upgrade head
python -m scripts.seed                  # dados de teste
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
# Verificar: http://localhost:8001/api/docs

# 4. Admin Web (outro terminal)
cd admin
npm install
cp .env.local.example .env.local        # ajustar NEXT_PUBLIC_API_URL
npm run dev
# Verificar: http://localhost:3000

# 5. Mobile (outro terminal)
cd mobile
npm install
# Editar services/api.ts: trocar localhost pelo IP da máquina
npx expo start
# Abrir Expo Go no celular → escanear QR
```

**Credenciais de teste (senha: `Teste@123`):**

| Role | Email |
|------|-------|
| Admin | admin@gymforce.app |
| Personal | carlos@gymforce.app |
| Recepção | ana@gymforce.app |
| Aluno (Diamante, 15k pts) | pedro@email.com |
| Aluno (Ouro, 5.8k pts) | joao@email.com |
| Aluno (Bronze, 120 pts) | rafael@email.com |

---

## 11. Convenções de Código

### Backend (Python)
- **PEP 8** via Ruff (line-length 88, target Python 3.12)
- **Type hints** obrigatórios em todos os parâmetros e retornos
- **Async/await** em todas as operações de I/O
- **Pydantic v2** para request/response schemas (model_config from_attributes)
- **SQLAlchemy 2.0** style (select, Mapped, mapped_column)
- **Nenhum `any`** — sempre tipado
- **Testes** com pytest-asyncio, SQLite in-memory, dependency_overrides

### Mobile (TypeScript)
- **ESLint + Prettier** (tabSize 2, semi, singleQuote false)
- **Expo Router** file-based routing (nunca react-navigation direto)
- **Zustand** para estado global, **TanStack Query** para server state
- **expo-secure-store** para tokens (nunca AsyncStorage)
- **Zod + react-hook-form** para validação
- **Design tokens** via `constants/theme.ts` (COLORS, SPACING, FONT_SIZE, BORDER_RADIUS)

### Admin Web (TypeScript)
- **Next.js 15 App Router** (client components + TanStack Query)
- **Tailwind CSS 4** utility-first
- **localStorage** para token admin (aceite — é painel interno)

### Git
- Branches: `feat/MX-nome`, `fix/MX-nome`, `docs/nome`, `chore/nome`
- Commits: Conventional Commits → `feat(M4): descrição`
- Flow: `develop` ← feature branches ← PRs. `main` recebe merges de `develop` para releases.
- PRs: sempre para `develop`, nunca direto em `main`

---

## 12. Tech Debt Conhecido

| # | Item | Prioridade | Sprint sugerido |
|---|------|-----------|----------------|
| 1 | Validação HMAC no webhook Mercado Pago | Alta | Próximo |
| 2 | Scheduler/cron para: streak freeze reset (dia 1), expirar matrículas, notificações automáticas | Alta | Próximo |
| 3 | CI/CD (GitHub Actions: lint + test no PR, EAS Build) | Média | Próximo |
| 4 | Sentry para crash reporting (mobile + backend) | Média | Próximo |
| 5 | Rate limiting nos endpoints públicos (webhook, auth) | Média | Próximo |
| 6 | `alembic.ini` sem URL hardcoded (usar env var) | Baixa | Qualquer |
| 7 | Handoffs HO-0012 a HO-0015 não foram preenchidos | Baixa | Documentar retroativamente |
| 8 | Testes E2E mobile (Detox ou Maestro) | Baixa | v1.1 |

---

## 13. Roadmap Futuro (pós v1.0.0)

### v1.1.0 — Hardening (2-3 semanas)
- CI/CD completo (GitHub Actions + EAS Build)
- Sentry integrado (mobile + backend + admin)
- Webhook HMAC validation
- Scheduler com APScheduler ou Celery Beat
- Rate limiting (slowapi)
- Testes E2E mobile

### v1.2.0 — Social e Engajamento
- Login social (Google + Apple Sign-In)
- Fotos comparativas na avaliação física (Supabase Storage)
- Deep links para referral
- Feed de conquistas dos amigos
- Notificações in-app (além de push)
- Dark mode no admin web

### v1.3.0 — Escala
- Multi-tenancy (uma instalação, múltiplas academias)
- Assinatura recorrente Mercado Pago
- Pagamento via cartão de crédito
- Relatórios PDF (reportlab)
- Modo offline mobile (expo-sqlite + sync)

### v2.0.0 — Plataforma
- API pública para integrações de terceiros
- Marketplace de desafios entre academias
- Wearable integration (Apple Watch, Garmin)
- AI coach (recomendação de treino baseada em progresso)

---

## 14. Como Adicionar uma Nova Feature

### Passo 1 — Backlog
Criar item seguindo `docs/templates/TEMPLATE_BACKLOG.md`:
- User story com persona
- Critérios de aceitação em Gherkin
- Especificação técnica (endpoints, models, telas)

### Passo 2 — ADR (se envolver decisão arquitetural)
Criar `docs/ADR/ADR-XXX-titulo.md` com contexto, decisão, alternativas e consequências.

### Passo 3 — Implementação
```bash
git checkout develop && git pull --rebase origin develop
git checkout -b feat/MX-nome-da-feature
# Implementar seguindo convenções
git add . && git commit -m "feat(MX): descrição"
git push -u origin feat/MX-nome-da-feature
# Abrir PR para develop
```

### Passo 4 — Review
Seguir checklist de `docs/GOVERNANCA.md` (funcionalidade, qualidade, segurança, performance, testes).

### Passo 5 — Handoff
Se transicionar para outro dev/agente, preencher `docs/handoff/TEMPLATE_HANDOFF.md`.

### Passo 6 — Merge
PR aprovado → merge em `develop`. Acumular features → merge `develop` → `main` + tag.

---

## 15. Como um Agente de IA Deve Operar

Se você é um agente de IA recebendo uma tarefa neste projeto:

1. **Leia este documento inteiro** antes de qualquer ação
2. **Leia `CONSTITUTION.md`** para entender as regras de branch/commit
3. **Clone o repo** e identifique o estado atual (`git log --oneline -10`)
4. **Verifique a branch** — trabalhe sempre a partir de `develop`
5. **Siga o padrão existente** — olhe como os services, schemas e routers estão organizados e replique
6. **Nunca assuma** — se algo está ambíguo no backlog, pergunte antes
7. **Testes obrigatórios** — mínimo: happy path + error cases + edge cases
8. **Handoff obrigatório** — ao finalizar, preencha o template de transição
9. **Não altere código fora do escopo** sem comunicar

### Padrões que DEVEM ser seguidos:

```python
# Backend — sempre este padrão:
# Router → Service → Repository → Model
# Pydantic schema para input/output
# Annotated[User, Depends(get_current_user)] para auth
# Annotated[User, Depends(require_role(UserRole.ADMIN))] para role check
# try/except no Redis (graceful degradation)
# HTTPException com detail em português
```

```typescript
// Mobile — sempre este padrão:
// Expo Router file-based routing
// TanStack Query para fetch (queryKey + staleTime)
// Zustand para estado global
// Zod + react-hook-form para forms
// COLORS/SPACING/FONT_SIZE do theme.ts (nunca valores hardcoded)
// api.get/post do services/api.ts (nunca fetch direto)
```

---

## 16. Contatos e Contexto

| Item | Valor |
|------|-------|
| Repositório | https://github.com/CalixtoSW/Gymforce |
| Release atual | v1.0.0 (tag) |
| Branches ativas | `main`, `develop` |
| Ambiente dev | localhost:8001 (API), :3000 (admin), :8081 (Expo) |
| Seed data | `python -m scripts.seed` (13 users, senha padrão `Teste@123`) |
| Swagger | http://localhost:8001/api/docs |
| Governança | `CONSTITUTION.md` + `docs/GOVERNANCA.md` |

---

> **Este documento deve ser atualizado a cada release.**
> Última atualização: v1.0.0 — 2026-04-12
> Autor: Claude (Arquiteto Chefe) + Calixto (Product Owner)
