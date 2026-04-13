# 📋 Template de Item de Backlog

> **Uso:** Todo item de backlog deve seguir este formato.

---

## BL-XXXX: [Título descritivo da funcionalidade]

### Metadados

| Campo | Valor |
|-------|-------|
| **ID** | BL-XXXX |
| **Módulo** | M1-M10 |
| **Tipo** | Feature / Bug / Refactor / Docs / Infra |
| **Prioridade** | P0 (crítico) / P1 (alto) / P2 (médio) / P3 (baixo) |
| **Estimativa** | XS (< 2h) / S (2-4h) / M (4-8h) / L (1-2d) / XL (3-5d) |
| **Sprint** | Sprint X |
| **Responsável** | [Agente/Dev] |
| **Status** | Backlog / Em Análise / Em Dev / Review / QA / Done |
| **Depende de** | BL-YYYY, BL-ZZZZ |
| **Bloqueia** | BL-WWWW |

### Descrição

> Como [persona], eu quero [ação], para que [benefício].

**Exemplo:**
> Como **aluno**, eu quero **ver meu ranking no leaderboard mensal**, para que **eu me motive a treinar mais e competir com outros alunos**.

### Critérios de Aceitação

```gherkin
DADO que o aluno está logado
QUANDO ele acessa a aba "Ranking"
ENTÃO ele vê o top 10 do mês atual com posição, nome, avatar e pontos
E ele vê sua própria posição destacada (mesmo fora do top 10)

DADO que dois alunos têm a mesma pontuação
QUANDO o ranking é calculado
ENTÃO o aluno que atingiu a pontuação primeiro fica acima

DADO que é dia 1 do mês
QUANDO o ranking é acessado
ENTÃO o ranking anterior é arquivado e um novo ranking zerado é mostrado
```

### Especificação Técnica

#### Backend
```
Endpoint: GET /api/v1/leaderboard?month=2026-04&limit=10
Response: { users: [{rank, user_id, name, avatar, points}], my_rank: {...} }
Fonte: Redis ZREVRANGE com score = pontos do mês
Fallback: Query PostgreSQL se Redis indisponível
```

#### Mobile
```
Tela: app/(tabs)/leaderboard.tsx
Componentes: LeaderboardCard, RankBadge, UserRankRow
Estado: TanStack Query com cache 60s
Animação: Reanimated ao mudar de posição
```

#### Modelo de Dados
```sql
-- Já existe em point_events, agrupado por mês
-- Redis sorted set: leaderboard:2026-04
-- Key: user_id, Score: sum(points) do mês
```

### Wireframe / Mockup (se aplicável)

```
┌──────────────────────────┐
│     🏆 RANKING MENSAL    │
│       Abril 2026         │
├──────────────────────────┤
│ 🥇 1. João Silva   1250 │
│ 🥈 2. Maria Santos 1180 │
│ 🥉 3. Pedro Souza  1050 │
│    4. Ana Costa      980 │
│    5. Carlos Lima    920 │
│    ...                   │
├──────────────────────────┤
│ 📍 Sua posição: #12      │
│    Calixto — 650 pts     │
│    Faltam 270 pts p/ #10 │
└──────────────────────────┘
```

### Notas e Referências

- [Link para ADR relevante]
- [Link para design no Figma]
- [Observações do PO]

---

> **REGRA PARA AGENTES DE IA:** Ao receber um BL para implementar:
> 1. Leia TODOS os critérios de aceitação
> 2. Verifique dependências (BL que este depende)
> 3. Consulte ADRs referenciados
> 4. Implemente seguindo DoD
> 5. Preencha o Handoff ao finalizar
