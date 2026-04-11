# 📋 GymForce — Backlog Inicial (Sprint 0 + MVP)

---

## Sprint 0 — Setup e Fundação (Semana 1-2)

| ID | Título | Tipo | Prioridade | Estimativa |
|----|--------|------|-----------|-----------|
| BL-001 | Setup monorepo com mobile + backend | Infra | P0 | S |
| BL-002 | Configurar Docker Compose (Postgres + Redis) | Infra | P0 | XS |
| BL-003 | Setup Expo com TypeScript e Expo Router v3 | Infra | P0 | S |
| BL-004 | Setup FastAPI com estrutura Clean Architecture | Infra | P0 | M |
| BL-005 | Configurar ESLint + Prettier + Ruff | Infra | P0 | XS |
| BL-006 | Criar schema inicial do banco (Alembic migrations) | Infra | P0 | M |
| BL-007 | Configurar CI/CD básico (lint + test) | Infra | P1 | M |
| BL-008 | Design System: tokens de cor, tipografia, spacing | Docs | P1 | M |
| BL-009 | ADR-001 a ADR-005 documentados | Docs | P1 | S |
| BL-010 | README + CONTRIBUTING + .env.example | Docs | P1 | XS |

---

## Sprint 1 — Auth e Perfil (Semana 3-4)

| ID | Título | Módulo | Prioridade | Estimativa |
|----|--------|--------|-----------|-----------|
| BL-011 | Endpoint de cadastro de usuário | M1 | P0 | M |
| BL-012 | Endpoint de login (email/senha) | M1 | P0 | M |
| BL-013 | JWT access + refresh token flow | M1 | P0 | M |
| BL-014 | Tela de Login (mobile) | M1 | P0 | M |
| BL-015 | Tela de Cadastro (mobile) | M1 | P0 | M |
| BL-016 | Tela de Perfil do aluno (mobile) | M1 | P1 | M |
| BL-017 | CRUD de usuários (admin) | M1 | P1 | M |
| BL-018 | Middleware de autenticação FastAPI | M1 | P0 | S |
| BL-019 | Roles e permissões (aluno, personal, admin) | M1 | P1 | M |

---

## Sprint 2 — Check-in e Treinos (Semana 5-6)

| ID | Título | Módulo | Prioridade | Estimativa |
|----|--------|--------|-----------|-----------|
| BL-020 | Endpoint de check-in | M2 | P0 | M |
| BL-021 | Geração de QR Code por aluno | M2 | P0 | S |
| BL-022 | Tela de Check-in com scanner QR (mobile) | M2 | P0 | L |
| BL-023 | Validação de matrícula ativa no check-in | M2 | P0 | S |
| BL-024 | CRUD de fichas de treino (backend) | M3 | P0 | L |
| BL-025 | Tela de ficha de treino do aluno (mobile) | M3 | P0 | L |
| BL-026 | Marcar treino como concluído | M3 | P0 | M |
| BL-027 | Timer de descanso entre séries | M3 | P2 | S |

---

## Sprint 3 — Engine de Gamificação (Semana 7-8)

| ID | Título | Módulo | Prioridade | Estimativa |
|----|--------|--------|-----------|-----------|
| BL-028 | Service de cálculo e crédito de pontos | M4 | P0 | L |
| BL-029 | Event sourcing: tabela point_events | M4 | P0 | M |
| BL-030 | Pontos automáticos por check-in (+10) | M4 | P0 | S |
| BL-031 | Pontos automáticos por treino completo (+25) | M4 | P0 | S |
| BL-032 | Engine de streaks (cálculo + freeze) | M4 | P0 | L |
| BL-033 | Bônus de streak (7 dias = +100, 30 = +500) | M4 | P0 | M |
| BL-034 | Sistema de tiers (Bronze→Lenda) com promoção automática | M4 | P0 | M |
| BL-035 | Tela Home com pontos, streak e tier (mobile) | M4 | P0 | L |
| BL-036 | Leaderboard backend (Redis sorted sets) | M4 | P1 | M |
| BL-037 | Tela de Leaderboard (mobile) | M4 | P1 | L |

---

## Sprint 4 — Recompensas e Dashboard (Semana 9-10)

| ID | Título | Módulo | Prioridade | Estimativa |
|----|--------|--------|-----------|-----------|
| BL-038 | CRUD de recompensas (admin) | M5 | P0 | M |
| BL-039 | Endpoint de resgate de recompensa | M5 | P0 | M |
| BL-040 | Validação de saldo + controle de estoque | M5 | P0 | M |
| BL-041 | Tela da Loja de Recompensas (mobile) | M5 | P0 | L |
| BL-042 | Histórico de resgates (aluno) | M5 | P1 | S |
| BL-043 | Dashboard admin: KPIs básicos | M7 | P1 | L |
| BL-044 | Dashboard admin: gráfico de check-ins | M7 | P2 | M |
| BL-045 | Push notification: lembrete de treino | M9 | P1 | M |

---

## Backlog Futuro (Sprints 5+)

| ID | Título | Módulo | Prioridade |
|----|--------|--------|-----------|
| BL-046 | Sistema de badges/conquistas | M4 | P2 |
| BL-047 | Desafios semanais configuráveis | M4 | P2 |
| BL-048 | Integração Mercado Pago (PIX) | M6 | P1 |
| BL-049 | Controle de mensalidades e inadimplência | M6 | P1 |
| BL-050 | Avaliação física com gráficos de evolução | M8 | P2 |
| BL-051 | Login social (Google, Apple) | M1 | P2 |
| BL-052 | Notificação de streak em risco | M9 | P2 |
| BL-053 | Indicação de amigo com bônus | M10 | P3 |
| BL-054 | Painel admin web (Next.js) | M7 | P2 |
| BL-055 | Relatórios exportáveis (PDF/CSV) | M7 | P3 |

---

## Métricas de Progresso

| Métrica | Meta Sprint 0-4 |
|---------|-----------------|
| BLs totais no MVP | 45 |
| Velocidade esperada | 8-10 BLs/sprint |
| Cobertura de testes | ≥ 80% |
| ADRs documentados | ≥ 6 |
| Handoffs completos | 100% das transições |
