# 🏋️ GymForce — Estudo de Tecnologias (Fase 1)

> **Projeto:** App de Gerenciamento de Academia com Gamificação
> **Data:** 2026-04-11
> **Autor:** Calixto (Arquiteto) + Claude (Engenheiro)

---

## 1. Decisão de Stack — Resumo Executivo

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| **Mobile** | React Native + Expo SDK 54 | Ecossistema JS, OTA updates, maior pool de devs, AI tooling superior |
| **Backend** | FastAPI (Python 3.12+) | Async nativo, tipagem forte com Pydantic, performance, integração com IA |
| **Banco Principal** | PostgreSQL 16 | ACID, jsonb para flexibilidade, extensões (pg_cron, pg_stat) |
| **Cache / Real-time** | Redis 7+ | Leaderboards (sorted sets), sessões, pub/sub para notificações |
| **Auth** | Supabase Auth ou JWT custom | Social login, magic link, refresh tokens |
| **Storage** | Supabase Storage ou S3 | Fotos de perfil, mídia de exercícios |
| **Notificações** | Expo Push Notifications + OneSignal | Push nativo, segmentação, scheduling |
| **CI/CD** | GitHub Actions + EAS Build | Build cloud, deploy automatizado |
| **Monitoramento** | Sentry (mobile + backend) | Crash reporting, performance traces |

---

## 2. Por que React Native + Expo (e não Flutter)?

### Argumentos Decisivos para este projeto:

1. **Pool de Talentos:** Em 2026, vagas React Native superam Flutter 3:1 (~45k vs ~18k no LinkedIn). Como o time provavelmente já conhece JavaScript/TypeScript, a curva de aprendizado é mínima.

2. **OTA Updates:** Expo EAS Update permite enviar correções e features sem passar pela review da App Store/Google Play. Para uma academia que precisa de iterações rápidas (promoções, desafios semanais), isso é game-changer.

3. **AI Tooling:** GitHub Copilot, Claude, e outros assistentes de IA têm muito mais dados de treinamento em React/JS do que em Dart. O desenvolvimento assistido por IA será significativamente mais rápido.

4. **Expo SDK 54 (2026):** File-based routing (Expo Router v3), New Architecture estável (JSI + Fabric), eliminação do bridge legado. Performance comparável a Flutter para 95% dos casos de uso.

5. **Web Support:** Com Expo + Next.js (via Solito), podemos ter um painel admin web usando o mesmo código base.

6. **Ecossistema npm:** Centenas de milhares de pacotes compatíveis. Para integrações com gateways de pagamento brasileiros (Mercado Pago, PagSeguro), há SDKs JS maduros.

### Quando Flutter seria melhor (e por que NÃO é o nosso caso):
- Apps com animações gráficas pesadas (jogos, 3D) → Não somos um jogo
- UI pixel-perfect idêntica em todas plataformas → Queremos feel nativo
- Time já fluente em Dart → Não é o caso

---

## 3. Por que FastAPI (e não Django/Node)?

| Critério | FastAPI | Django | Node/Express |
|----------|---------|--------|-------------|
| Performance async | ✅ Nativo | ⚠️ Django 5+ parcial | ✅ Nativo |
| Tipagem / Validação | ✅ Pydantic built-in | ⚠️ Serializers | ❌ Manual |
| Docs automáticas | ✅ OpenAPI/Swagger | ❌ Precisa lib | ❌ Precisa lib |
| Integração com IA | ✅ Python nativo | ✅ Python nativo | ⚠️ Limitado |
| Admin panel | ❌ Não tem | ✅ Excelente | ❌ Não tem |
| Velocidade de dev | ✅ Alta | ✅ Alta (ORM) | ✅ Alta |

**Decisão:** FastAPI ganha por ser async-first, ter validação automática via Pydantic, e gerar docs OpenAPI nativamente — essencial para um app mobile que consome API REST.

Para o painel admin, usaremos um frontend separado (React/Next.js) que consome a mesma API.

---

## 4. Arquitetura de Gamificação

### Modelo de Pontos e Recompensas

```
┌─────────────────────────────────────────────────┐
│                ENGINE DE PONTOS                  │
├─────────────────────────────────────────────────┤
│                                                  │
│  AÇÕES QUE GERAM PONTOS:                        │
│  ├── Check-in na academia .......... +10 pts     │
│  ├── Treino completo ............... +25 pts     │
│  ├── Streak 7 dias consecutivos .... +100 pts    │
│  ├── Streak 30 dias ................ +500 pts    │
│  ├── Indicar amigo ................. +200 pts    │
│  ├── Avaliação física .............. +50 pts     │
│  ├── Desafio semanal completo ...... +150 pts    │
│  └── Aniversário de matrícula ...... +300 pts    │
│                                                  │
│  TIERS (NÍVEIS):                                │
│  ├── 🥉 Bronze ... 0-999 pts                    │
│  ├── 🥈 Prata .... 1000-4999 pts                │
│  ├── 🥇 Ouro ..... 5000-14999 pts               │
│  ├── 💎 Diamante . 15000+ pts                   │
│  └── 🔥 Lenda ... 50000+ pts (elite)            │
│                                                  │
│  RECOMPENSAS (TROCA):                           │
│  ├── Camiseta da academia .......... 500 pts     │
│  ├── Sessão com personal ........... 1000 pts    │
│  ├── Desconto mensalidade (10%) .... 2000 pts    │
│  ├── Suplemento .................... 1500 pts    │
│  ├── Dia free para convidado ....... 300 pts     │
│  └── Acesso área VIP .............. 3000 pts     │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Mecânicas Comportamentais (além de pontos):

- **Streaks:** Contador visual de dias consecutivos com risco de perder
- **Badges/Conquistas:** "Madrugador" (treino antes das 7h), "Incansável" (30 treinos/mês)
- **Leaderboard:** Ranking mensal por pontos (Redis sorted sets — latência < 50ms)
- **Desafios:** Missões semanais/mensais com recompensa extra
- **Progress Bar:** Barra visual de progresso até o próximo tier

---

## 5. Infraestrutura e Deploy

```
                    ┌──────────────┐
                    │   Expo EAS   │
                    │  (Build/OTA) │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
        ┌─────┴─────┐           ┌──────┴──────┐
        │  iOS App   │           │ Android App │
        └─────┬──────┘           └──────┬──────┘
              │                         │
              └────────────┬────────────┘
                           │ HTTPS
                    ┌──────┴───────┐
                    │   API GW /   │
                    │   Nginx      │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │   FastAPI    │
                    │  (Uvicorn)   │
                    └──┬───┬───┬──┘
                       │   │   │
              ┌────────┘   │   └────────┐
              │            │            │
        ┌─────┴────┐ ┌────┴────┐ ┌─────┴────┐
        │ Postgres │ │  Redis  │ │ Supabase │
        │   16     │ │   7+    │ │ Storage  │
        └──────────┘ └─────────┘ └──────────┘
```

### Opções de Hosting (custo-benefício para Brasil):

| Opção | Custo Mensal | Prós | Contras |
|-------|-------------|------|---------|
| **Railway** | ~$20-50 | Deploy fácil, Postgres incluso | Menos controle |
| **Render** | ~$25-60 | Free tier, auto-deploy | Cold starts no free |
| **VPS (Hetzner)** | ~€10-20 | Controle total, custo baixo | Mais ops manual |
| **Supabase** | Free-$25 | Auth + DB + Storage integrado | Lock-in |
| **AWS (ECS Fargate)** | ~$30-80 | Enterprise, escalável | Complexidade |

**Recomendação inicial:** Supabase (Auth + DB + Storage) + Railway (FastAPI) → migrar para VPS/AWS conforme escalar.

---

## 6. Bibliotecas-Chave (Mobile)

| Categoria | Biblioteca | Versão |
|-----------|-----------|--------|
| Navegação | expo-router v3 | Latest |
| Estado | Zustand ou TanStack Query | 5.x |
| UI Components | Tamagui ou NativeWind v4 | Latest |
| Forms | React Hook Form + Zod | 7.x |
| Charts | Victory Native | 41.x |
| Animações | Reanimated 3 | Latest |
| Notificações | expo-notifications | Latest |
| Camera/QR | expo-camera / expo-barcode-scanner | Latest |
| Pagamento | Stripe React Native SDK | Latest |
| Storage local | expo-secure-store + MMKV | Latest |

---

## 7. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Complexidade da gamificação | Alto | MVP com pontos + streaks apenas, iterar depois |
| Performance do leaderboard | Médio | Redis sorted sets, cache agressivo |
| Integração pagamento BR | Alto | Começar com Mercado Pago (melhor SDK) |
| Churn de usuários | Alto | Notificações inteligentes, streaks com "freeze" |
| Custo de infra | Baixo | Free tiers + escalar sob demanda |
