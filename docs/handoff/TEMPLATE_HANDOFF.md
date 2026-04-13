# 🔄 Template de Handoff — Transição entre Agentes/Devs

> **Uso:** Preencher SEMPRE que uma tarefa for passada de um agente de IA para outro, ou de IA para humano, ou vice-versa.

---

## Identificação

| Campo | Valor |
|-------|-------|
| **Handoff ID** | HO-XXXX |
| **Data** | YYYY-MM-DD HH:MM |
| **De (origem)** | [Nome do agente/dev que está entregando] |
| **Para (destino)** | [Nome do agente/dev que vai receber] |
| **Ticket/Backlog** | BL-XXXX |
| **Módulo** | M1-M10 |
| **Branch** | feat/MX-descricao |

---

## O que foi feito

> Descrição objetiva do que foi implementado/alterado. Sem enrolação.

### Arquivos criados/modificados

```
+ mobile/app/(tabs)/leaderboard.tsx     ← NOVO
+ backend/app/services/points.py        ← NOVO
~ backend/app/api/v1/gamification.py    ← MODIFICADO
~ backend/app/models/user.py            ← MODIFICADO
```

### Decisões tomadas durante a execução

1. [Decisão e justificativa]
2. [Decisão e justificativa]

---

## O que NÃO foi feito (e por quê)

> Lista explícita do que ficou pendente. Sem ambiguidade.

| Item Pendente | Motivo | Prioridade |
|--------------|--------|-----------|
| Testes de integração do endpoint X | Faltou mock do Redis | Alta |
| Animação de transição de tier | Precisa definir design | Média |

---

## Estado atual

### O que funciona ✅
- [Item 1]
- [Item 2]

### O que está quebrado ❌
- [Item 1 — com descrição do erro]

### O que precisa de atenção ⚠️
- [Item 1 — risco ou dúvida]

---

## Contexto técnico para o próximo agente

### Dependências instaladas nesta sessão
```bash
npm install victory-native    # charts para leaderboard
pip install redis              # client Redis
```

### Variáveis de ambiente novas
```bash
REDIS_URL=redis://localhost:6379/0   # Adicionada ao .env.example
```

### Como rodar/testar o que foi feito
```bash
# Backend
cd backend && uvicorn app.main:app --reload
# Testar endpoint
curl http://localhost:8000/api/v1/leaderboard

# Mobile
cd mobile && npx expo start
# Navegar para tab "Ranking"
```

---

## Próximos passos sugeridos

1. [ ] [Descrição clara do próximo passo]
2. [ ] [Descrição clara do próximo passo]
3. [ ] [Descrição clara do próximo passo]

---

## Diagrama de dependências (se aplicável)

```
[Tarefa atual] ──depends on──▶ [Tarefa X]
[Tarefa atual] ──blocks──▶ [Tarefa Y]
```

---

> **REGRA:** O agente que recebe este handoff deve LER TUDO antes de começar.
> Se algo está ambíguo, pergunte antes de implementar.
> Nunca assuma — valide.
