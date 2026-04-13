# 📋 GymForce — Governança e Continuidade (Fase 4)

> **Objetivo:** Garantir que qualquer desenvolvedor ou agente de IA consiga pegar o projeto e continuar de onde parou, sem perda de contexto.

---

## 1. Princípios de Governança

1. **Tudo documentado:** Nenhuma decisão arquitetural existe apenas "na cabeça". Toda decisão vira um ADR.
2. **Código é documentação viva:** Testes, types, e docstrings são mais valiosos que wikis desatualizadas.
3. **Handoff explícito:** Toda transição entre humano↔IA ou IA↔IA segue o template de handoff.
4. **Backlog é a fonte da verdade:** Se não está no backlog, não existe.
5. **Convenções sobre configuração:** Seguimos padrões pré-definidos, não reinventamos.

---

## 2. Padrão de Branches

```
main              ← produção, protegida, só via PR
├── develop       ← integração, CI roda aqui
│   ├── feat/M4-gamification-engine
│   ├── feat/M2-checkin-qrcode
│   ├── fix/M3-workout-timer-crash
│   ├── refactor/M1-auth-token-refresh
│   └── docs/adr-003-redis-leaderboard
```

**Convenção de nome:** `{tipo}/{módulo}-{descrição-kebab-case}`

Tipos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`

---

## 3. Padrão de Commits (Conventional Commits)

```
feat(M4): implementar engine de pontos por check-in
fix(M2): corrigir leitura QR em baixa luminosidade
docs(adr): ADR-003 decisão Redis para leaderboard
test(M5): testes unitários do serviço de recompensas
chore(ci): configurar EAS Build para iOS
refactor(M1): extrair lógica de JWT para módulo security
```

---

## 4. Architecture Decision Records (ADR)

### Template: `docs/ADR/ADR-XXX-titulo.md`

```markdown
# ADR-XXX: [Título da Decisão]

**Status:** Proposta | Aceita | Obsoleta | Substituída por ADR-YYY
**Data:** YYYY-MM-DD
**Autor:** [Nome]
**Módulo:** M1-M10

## Contexto
O que motivou essa decisão? Qual problema estamos resolvendo?

## Decisão
O que foi decidido e por quê.

## Alternativas Consideradas
1. **Alternativa A** — prós e contras
2. **Alternativa B** — prós e contras

## Consequências
- Positivas: ...
- Negativas: ...
- Riscos: ...

## Referências
- Links, docs, artigos que embasaram a decisão
```

### ADRs Iniciais do Projeto

| ADR | Título | Status |
|-----|--------|--------|
| ADR-001 | Stack: React Native + Expo | Aceita |
| ADR-002 | Backend: FastAPI + PostgreSQL | Aceita |
| ADR-003 | Redis sorted sets para leaderboard | Aceita |
| ADR-004 | Modelo de gamificação: pontos+tiers+streaks | Aceita |
| ADR-005 | Monorepo com mobile + backend | Aceita |
| ADR-006 | Supabase Auth para autenticação | Proposta |

---

## 5. Definition of Done (DoD)

Uma tarefa só é "Done" quando:

- [ ] Código implementado e funcional
- [ ] Testes unitários escritos (cobertura mínima 80%)
- [ ] Testes de integração para endpoints de API
- [ ] Type-safe (sem `any` em TypeScript, sem `# type: ignore` em Python)
- [ ] Lint passa sem erros (ESLint + Ruff)
- [ ] PR criado com descrição seguindo template
- [ ] Code review aprovado (por humano ou agente reviewer)
- [ ] Documentação atualizada (se API mudou, Pydantic schemas atualizados)
- [ ] Handoff preenchido (se vai transicionar para outro dev/agente)

---

## 6. Padrão de Code Review

### Checklist do Reviewer

```markdown
## Code Review — [PR #XXX]

### Funcionalidade
- [ ] Resolve o que o ticket pede?
- [ ] Edge cases tratados?
- [ ] Erro handling adequado?

### Qualidade
- [ ] Sem código duplicado?
- [ ] Nomes de variáveis/funções claros?
- [ ] Complexidade ciclomática aceitável?

### Segurança
- [ ] Sem secrets hardcoded?
- [ ] Input validation presente?
- [ ] SQL injection protegido (ORM/parameterized)?
- [ ] Auth/authz verificados nos endpoints?

### Performance
- [ ] Queries otimizadas (sem N+1)?
- [ ] Caching onde faz sentido?
- [ ] Sem chamadas bloqueantes em código async?

### Testes
- [ ] Testes cobrem o happy path?
- [ ] Testes cobrem cenários de erro?
- [ ] Mocks/fixtures adequados?
```

---

## 7. Padrão de API

### Convenções REST

```
GET    /api/v1/users              → Listar
GET    /api/v1/users/{id}         → Detalhe
POST   /api/v1/users              → Criar
PATCH  /api/v1/users/{id}         → Atualizar parcial
DELETE /api/v1/users/{id}         → Soft delete

POST   /api/v1/checkins           → Registrar check-in
GET    /api/v1/gamification/points → Saldo de pontos
POST   /api/v1/rewards/{id}/redeem → Resgatar recompensa
GET    /api/v1/leaderboard        → Ranking
```

### Formato de Resposta Padrão

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  }
}

// Erro
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_POINTS",
    "message": "Pontos insuficientes para este resgate",
    "details": {
      "required": 1000,
      "available": 750
    }
  }
}
```

---

## 8. Ambiente e Variáveis

### `.env.example` (Backend)

```bash
# Database
DATABASE_URL=postgresql+asyncpg://gym:gym@localhost:5432/gymforce
REDIS_URL=redis://localhost:6379/0

# Auth
JWT_SECRET_KEY=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Supabase (Auth + Storage)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# Payment
MERCADO_PAGO_ACCESS_TOKEN=xxx
MERCADO_PAGO_PUBLIC_KEY=xxx

# Push
EXPO_PUSH_TOKEN=xxx

# Sentry
SENTRY_DSN=xxx

# App
APP_ENV=development
APP_DEBUG=true
CORS_ORIGINS=http://localhost:8081,http://localhost:3000
```
