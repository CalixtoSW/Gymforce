# 🤖 GymForce — Agentes de IA: Papéis e Fluxo de Trabalho

> **Objetivo:** Definir como cada agente de IA opera, o que recebe, o que entrega, e como a análise de qualidade funciona entre eles.

---

## 1. Agentes do Projeto

| # | Agente | Responsabilidade | Input | Output |
|---|--------|-----------------|-------|--------|
| 1 | **Arquiteto** (Humano/Claude) | Decisões de arquitetura, ADRs, review final | Requisitos de negócio | ADRs, Tech Spec, aprovações |
| 2 | **Product Agent** | Refinamento de backlog, critérios de aceitação | Ideia/feature bruta | BL formatado com Gherkin |
| 3 | **Backend Agent** | Implementação FastAPI, models, services | BL aprovado + Tech Spec | Código + testes + Handoff |
| 4 | **Mobile Agent** | Implementação React Native/Expo | BL aprovado + Tech Spec | Código + testes + Handoff |
| 5 | **Reviewer Agent** | Code review automatizado | PR/código implementado | Review report + aprovação/rejeição |
| 6 | **QA Agent** | Testes E2E, validação de critérios | Código em branch + BL | Test report + bugs encontrados |

---

## 2. Fluxo de Trabalho (Pipeline)

```
                    ┌─────────────┐
                    │  ARQUITETO  │
                    │  (Humano)   │
                    └──────┬──────┘
                           │ Aprova escopo + ADRs
                           ▼
                    ┌─────────────┐
                    │   PRODUCT   │
                    │    AGENT    │
                    └──────┬──────┘
                           │ Gera BL formatado
                           │ com critérios de
                           │ aceitação (Gherkin)
                           ▼
              ┌────────────┴────────────┐
              │                         │
        ┌─────▼─────┐           ┌──────▼──────┐
        │  BACKEND  │           │   MOBILE    │
        │   AGENT   │           │    AGENT    │
        └─────┬─────┘           └──────┬──────┘
              │                        │
              │ Handoff + PR           │ Handoff + PR
              │                        │
              └────────────┬───────────┘
                           ▼
                    ┌─────────────┐
                    │  REVIEWER   │
                    │    AGENT    │
                    └──────┬──────┘
                           │ Aprovado? ──▶ Merge
                           │ Rejeitado? ──▶ Volta para agente de origem
                           ▼
                    ┌─────────────┐
                    │   QA AGENT  │
                    └──────┬──────┘
                           │ Testa critérios de aceitação
                           │ Bugs? ──▶ Abre novo BL de fix
                           │ OK? ──▶ Status = Done
                           ▼
                    ┌─────────────┐
                    │  ARQUITETO  │
                    │  (Valida)   │
                    └─────────────┘
```

---

## 3. Protocolo de Comunicação entre Agentes

### 3.1 O que o Product Agent ENTREGA

```yaml
# Exemplo de output do Product Agent
backlog_item:
  id: BL-0012
  module: M4
  title: "Implementar streak de dias consecutivos"
  type: Feature
  priority: P1
  estimate: M
  user_story: >
    Como aluno, eu quero ver meu streak de dias consecutivos
    de treino, para me motivar a não quebrar a sequência.
  acceptance_criteria:
    - given: "aluno treinou ontem e hoje"
      when: "abre o app"
      then: "vê streak = 2 com ícone de fogo"
    - given: "aluno não treinou ontem"
      when: "abre o app"
      then: "streak reseta para 0 com mensagem motivacional"
    - given: "aluno tem streak >= 7"
      when: "completa o 7º dia"
      then: "recebe +100 pontos bônus automaticamente"
    - given: "aluno usa o freeze (1x/mês)"
      when: "pula 1 dia"
      then: "streak não reseta"
  tech_notes: >
    Calcular streak no backend baseado em checkins.
    Timezone do aluno deve ser considerado (fuso BR).
    Redis key: streak:{user_id} com TTL de 48h.
  depends_on: [BL-0005]  # Check-in deve existir
  blocks: [BL-0015]      # Badges dependem de streaks
```

### 3.2 O que o Backend/Mobile Agent ENTREGA

O agente implementador entrega:

1. **Código** na branch seguindo convenção
2. **Testes** com cobertura mínima 80%
3. **Handoff preenchido** (usando `TEMPLATE_HANDOFF.md`)
4. **PR** com descrição seguindo template

### 3.3 O que o Reviewer Agent ANALISA

```markdown
## Review Report — PR #42

### Pontuação: 7.5/10

### ✅ Aprovado
- Lógica de streak correta
- Timezone handling adequado
- Testes cobrem happy path e edge cases

### ⚠️ Sugestões (não bloqueantes)
- Extrair cálculo de streak para service separado
- Adicionar log estruturado no ponto de bônus

### ❌ Bloqueantes
- Falta validação de user_id no endpoint
- Query N+1 no endpoint de listagem

### Decisão: APROVADO COM RESSALVAS
- Corrigir bloqueantes antes do merge
- Sugestões podem virar tech debt (BL separado)
```

### 3.4 O que o QA Agent VERIFICA

```markdown
## QA Report — BL-0012: Streak

### Critérios de Aceitação
| # | Critério | Status | Evidência |
|---|----------|--------|-----------|
| 1 | Streak incrementa corretamente | ✅ PASS | Screenshot |
| 2 | Streak reseta ao pular dia | ✅ PASS | Log do backend |
| 3 | Bônus de +100 no 7º dia | ❌ FAIL | Bônus creditado 2x |
| 4 | Freeze funciona 1x/mês | ✅ PASS | Testado com mock de data |

### Bugs Encontrados
| ID | Severidade | Descrição |
|----|-----------|-----------|
| BUG-008 | Alta | Bônus de streak duplicado quando check-in duplo no mesmo dia |

### Decisão: REPROVADO — necessita fix de BUG-008
```

---

## 4. Regras para Agentes de IA

### O que TODO agente DEVE fazer:

1. **Ler o contexto completo** antes de começar (BL, ADRs, Handoff anterior)
2. **Seguir o DoD** definido em `GOVERNANCA.md`
3. **Não inventar requisitos** — implementar exatamente o que o BL pede
4. **Documentar decisões** tomadas durante a execução
5. **Preencher Handoff** ao finalizar

### O que TODO agente NÃO DEVE fazer:

1. **Nunca assumir** o que não está escrito — perguntar
2. **Nunca pular testes** por pressa
3. **Nunca alterar código fora do escopo** do BL sem comunicar
4. **Nunca fazer deploy** sem review aprovado
5. **Nunca guardar secrets** no código

### Prompt de Contexto para Agentes

Ao iniciar uma sessão com qualquer agente, forneça este contexto:

```markdown
## Contexto do Projeto: GymForce

Você é o [NOME_DO_AGENTE] do projeto GymForce.

### Projeto
App de gerenciamento de academia com gamificação (pontos, streaks, tiers, recompensas).

### Stack
- Mobile: React Native + Expo SDK 54 + TypeScript
- Backend: FastAPI + Python 3.12 + PostgreSQL 16 + Redis
- Auth: Supabase Auth
- CI/CD: GitHub Actions + EAS Build

### Sua Tarefa
[Colar o BL aqui]

### Referências
- ADRs: docs/ADR/
- Governança: docs/GOVERNANCA.md
- Handoff anterior: [se houver]

### Regras
- Siga PEP 8 para Python, ESLint+Prettier para TS
- Testes obrigatórios
- Handoff obrigatório ao finalizar
- Conventional Commits
```

---

## 5. Ciclo de Vida de um Backlog Item

```
BACKLOG ──▶ EM ANÁLISE ──▶ SPEC APROVADA ──▶ EM DEV ──▶ PR CRIADO
                                                             │
                                              ┌──────────────┘
                                              ▼
                                         EM REVIEW
                                              │
                                    ┌─────────┴─────────┐
                                    ▼                   ▼
                               APROVADO            REJEITADO
                                    │                   │
                                    ▼                   │
                                 EM QA                  │
                                    │                   │
                              ┌─────┴─────┐            │
                              ▼           ▼            │
                            PASS        FAIL ──────────┘
                              │
                              ▼
                            DONE ✅
```
