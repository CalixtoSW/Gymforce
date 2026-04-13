# 🏋️ GymForce — Levantamento de Escopo (Fase 2)

> **Versão:** 1.0 | **Data:** 2026-04-11

---

## 1. Visão do Produto

**GymForce** é um app mobile para gerenciamento de academias de musculação com gamificação integrada. O diferencial é transformar a rotina de treino em uma experiência engajante onde alunos acumulam pontos, sobem de nível, completam desafios e trocam pontos por benefícios reais.

### Personas

| Persona | Descrição | Necessidades |
|---------|-----------|-------------|
| **Aluno** | Pessoa que treina na academia | Check-in fácil, ver treinos, acompanhar pontos, trocar recompensas |
| **Personal** | Instrutor/Personal Trainer | Montar fichas, acompanhar alunos, registrar avaliações |
| **Admin/Dono** | Proprietário da academia | Dashboard de gestão, controle financeiro, configurar gamificação |
| **Recepção** | Atendente da recepção | Check-in manual, cadastro de alunos, controle de acesso |

---

## 2. Módulos e Funcionalidades

### 📱 M1 — Autenticação e Perfil
- Login social (Google, Apple) e email/senha
- Cadastro com dados pessoais (nome, CPF, telefone, endereço, foto)
- Perfil do aluno com histórico, tier atual, pontos acumulados
- Recuperação de senha

### 🚪 M2 — Check-in / Controle de Acesso
- Check-in via QR Code na catraca/recepção
- Check-in manual pela recepção
- Registro automático de entrada e saída
- Validação de matrícula ativa
- Bloqueio automático para inadimplentes

### 🏋️ M3 — Treinos e Fichas
- Fichas de treino montadas pelo personal (séries, repetições, carga)
- Histórico de treinos realizados
- Timer de descanso entre séries
- Registro de carga/peso utilizado (progressão)
- Vídeos demonstrativos dos exercícios (opcional, fase futura)
- Marcar treino como concluído

### 🎮 M4 — Gamificação (Core)
- **Pontos:** Acúmulo por ações (check-in, treino completo, streak, etc.)
- **Tiers/Níveis:** Bronze → Prata → Ouro → Diamante → Lenda
- **Streaks:** Contador de dias consecutivos com proteção (freeze 1x/mês)
- **Badges/Conquistas:** Desbloqueáveis por marcos específicos
- **Leaderboard:** Ranking mensal por pontos (top 10 visível para todos)
- **Desafios:** Missões semanais e mensais configuráveis pelo admin
- **Progress Bar:** Visualização de progresso até próximo nível

### 🎁 M5 — Loja de Recompensas
- Catálogo de prêmios configurável pelo admin
- Troca de pontos por recompensas
- Histórico de resgates
- Estoque de itens (quantidade disponível)
- Notificação quando prêmio desejado estiver disponível

### 💰 M6 — Financeiro e Mensalidades
- Planos de mensalidade (mensal, trimestral, semestral, anual)
- Controle de pagamentos (status: pago, pendente, atrasado)
- Integração com gateway (Mercado Pago / PIX)
- Geração de cobranças automáticas
- Relatório de inadimplência
- Desconto via pontos de gamificação

### 📊 M7 — Dashboard Admin
- KPIs: alunos ativos, check-ins/dia, receita, inadimplência
- Gráficos de frequência por horário/dia da semana
- Gestão de alunos (CRUD, busca, filtros)
- Configuração de pontos, tiers, recompensas, desafios
- Relatórios exportáveis (PDF/CSV)

### 📋 M8 — Avaliação Física
- Registro de medidas corporais (peso, % gordura, circunferências)
- Histórico de avaliações com gráficos de evolução
- Agendamento de reavaliação
- Fotos comparativas (antes/depois) — armazenamento seguro

### 🔔 M9 — Notificações
- Push notifications (lembrete de treino, streak em risco)
- Notificação de novo desafio disponível
- Alerta de mensalidade próxima do vencimento
- Parabenização por conquista/nível atingido
- Configuração de preferências pelo aluno

### 👥 M10 — Social e Comunidade (Fase Futura)
- Feed de conquistas dos amigos
- Desafios entre amigos
- Indicação de amigos (com bônus de pontos)

---

## 3. MVP vs Escopo Completo

### 🎯 MVP (Sprint 1-4, ~8 semanas)

| Módulo | Funcionalidades no MVP |
|--------|----------------------|
| M1 | Login email/senha, perfil básico |
| M2 | Check-in via QR Code |
| M3 | Fichas de treino (visualizar), marcar treino concluído |
| M4 | Pontos por check-in e treino, streaks, tiers (sem badges complexos) |
| M5 | Catálogo simples, troca de pontos |
| M7 | Dashboard básico (alunos, check-ins, pontos) |
| M9 | Push básico (lembrete de treino) |

### 🚀 Escopo Completo (Sprint 5-12)

Todos os módulos M1 a M9 com funcionalidades completas + M10.

---

## 4. Modelo de Dados (Visão Geral)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    users     │────▶│  memberships │────▶│    plans     │
│              │     │              │     │              │
│ id           │     │ id           │     │ id           │
│ name         │     │ user_id (FK) │     │ name         │
│ email        │     │ plan_id (FK) │     │ price        │
│ cpf          │     │ start_date   │     │ duration_days│
│ phone        │     │ end_date     │     │ description  │
│ role         │     │ status       │     └──────────────┘
│ avatar_url   │     │ payment_stat │
│ tier         │     └──────────────┘
│ total_points │
│ current_pts  │     ┌──────────────┐     ┌──────────────┐
│ streak_count │     │  checkins    │     │   workouts   │
│ created_at   │────▶│              │────▶│              │
└──────────────┘     │ id           │     │ id           │
                     │ user_id (FK) │     │ user_id (FK) │
                     │ checked_in_at│     │ sheet_id(FK) │
                     │ checked_out  │     │ completed_at │
                     │ points_earned│     │ duration_min │
                     └──────────────┘     │ points_earned│
                                          └──────────────┘
┌──────────────┐     ┌──────────────┐
│ point_events │     │   rewards    │
│              │     │              │
│ id           │     │ id           │
│ user_id (FK) │     │ name         │
│ action_type  │     │ description  │
│ points       │     │ cost_points  │
│ description  │     │ stock        │
│ created_at   │     │ image_url    │
│ ref_id       │     │ active       │
└──────────────┘     └──────┬───────┘
                            │
                     ┌──────┴───────┐
                     │  redemptions │
                     │              │
                     │ id           │
                     │ user_id (FK) │
                     │ reward_id(FK)│
                     │ points_spent │
                     │ status       │
                     │ redeemed_at  │
                     └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  challenges  │     │ user_chall.  │     │   badges     │
│              │     │              │     │              │
│ id           │     │ id           │     │ id           │
│ title        │     │ user_id (FK) │     │ name         │
│ description  │     │ challenge_id │     │ description  │
│ goal_type    │     │ progress     │     │ icon_url     │
│ goal_value   │     │ completed    │     │ criteria     │
│ reward_points│     │ completed_at │     │ points_bonus │
│ start_date   │     └──────────────┘     └──────────────┘
│ end_date     │
│ active       │     ┌──────────────┐
└──────────────┘     │ user_badges  │
                     │              │
                     │ user_id (FK) │
                     │ badge_id(FK) │
                     │ earned_at    │
                     └──────────────┘

┌──────────────┐     ┌──────────────┐
│workout_sheets│     │  exercises   │
│              │     │              │
│ id           │     │ id           │
│ user_id (FK) │     │ sheet_id(FK) │
│ personal_id  │     │ name         │
│ name         │     │ sets         │
│ active       │     │ reps         │
│ created_at   │     │ rest_seconds │
│ expires_at   │     │ notes        │
└──────────────┘     │ order        │
                     └──────────────┘
```

---

## 5. Requisitos Não-Funcionais

| Requisito | Meta |
|-----------|------|
| **Tempo de resposta API** | < 200ms (p95) |
| **Disponibilidade** | 99.5% uptime |
| **Segurança** | HTTPS, JWT com refresh, bcrypt, LGPD compliance |
| **Leaderboard update** | < 100ms (Redis sorted sets) |
| **Push notification delivery** | < 5s |
| **Suporte offline** | Check-in com sync posterior |
| **Tamanho do app** | < 50MB (iOS/Android) |
| **Tempo de startup** | < 2s |

---

## 6. Integrações Externas

| Serviço | Finalidade | Prioridade |
|---------|-----------|-----------|
| Mercado Pago | Pagamento (PIX, cartão) | MVP |
| Expo Push | Notificações push | MVP |
| Supabase Auth | Autenticação | MVP |
| Sentry | Monitoramento de erros | MVP |
| OneSignal | Push avançado, segmentação | Pós-MVP |
| WhatsApp Business API | Notificações via WhatsApp | Pós-MVP |

---

## 7. Cronograma Macro

| Sprint | Semanas | Entregas |
|--------|---------|----------|
| Sprint 0 | 1-2 | Setup projeto, CI/CD, design system, DB schema |
| Sprint 1 | 3-4 | Auth, Perfil, CRUD de alunos |
| Sprint 2 | 5-6 | Check-in QR, Fichas de treino |
| Sprint 3 | 7-8 | Engine de pontos, Streaks, Tiers |
| Sprint 4 | 9-10 | Loja de recompensas, Dashboard básico |
| Sprint 5 | 11-12 | Notificações, Leaderboard, Badges |
| Sprint 6 | 13-14 | Financeiro, Pagamentos |
| Sprint 7 | 15-16 | Avaliação física, Desafios |
| Sprint 8 | 17-18 | Polish, Testes, Beta fechado |
