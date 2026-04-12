# GymForce v1.0.0 — Release Notes

**Data:** 2026-04-12
**Tipo:** Release Estável
**Status:** Produção

## Stack

| Camada | Tech |
|--------|------|
| Mobile | React Native + Expo SDK 54 + TypeScript |
| Backend | FastAPI + Python 3.12 + PostgreSQL 16 + Redis 7 |
| Admin Web | Next.js 15 + Tailwind CSS 4 + Recharts |
| Auth | JWT (access + refresh tokens) |

## Funcionalidades Completas

### Mobile (Aluno)
- Cadastro/login com email/senha + código de indicação
- QR Code para check-in (auto-refresh 5min)
- Fichas de treino com timer de descanso
- Gamificação: pontos, streaks com freeze, tiers, leaderboard
- 10 badges desbloqueáveis automaticamente
- Loja de recompensas com troca de pontos
- Pagamento PIX via Mercado Pago com desconto por pontos
- Avaliação física com gráficos de evolução
- Desafios semanais/mensais com progresso automático
- Indicação de amigos com bônus duplo
- Push notifications

### Admin Web
- Dashboard com 6 KPIs + gráficos de check-in
- CRUD de alunos com exportação CSV
- CRUD de planos, recompensas, desafios
- Gestão de resgates (entregar/cancelar)
- Criação de fichas de treino
- Registro de avaliação física
- Envio de push notifications
- Expiração de matrículas vencidas

### Backend
- 17 models, 15 routers, 12 services
- JWT com refresh automático
- Redis para leaderboard (fallback PostgreSQL)
- Mercado Pago PIX integration
- Event sourcing para pontos
- ~3.000 linhas de testes
