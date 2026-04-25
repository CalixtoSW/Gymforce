# Levantamento Inicial — Codex

> Documento dedicado ao Codex em `docs/codex/`, isolado da documentação existente.

## 1. Escopo do levantamento

Este relatório registra o primeiro levantamento de continuidade do repositório `CalixtoSW/Gymforce`, com foco em:

1. Mapear estrutura do repositório.
2. Ler arquivos raiz disponíveis.
3. Identificar stack, entrada da aplicação e arquitetura atual.
4. Registrar estado real do projeto.
5. Preparar base para decisão posterior do primeiro backlog de desenvolvimento.

Nenhum código de aplicação foi gerado ou alterado neste levantamento.

---

## 2. Arquivos raiz analisados

| Arquivo | Existe? | Propósito | Observações críticas |
|---|---:|---|---|
| `README.md` | Sim | Documento principal do projeto, visão geral, stack resumida e quick start. | Indica que o projeto ainda está em fase de pacote/documentação inicial e aponta próximos passos de Sprint 0. |
| `docker-compose.yml` | Sim | Infraestrutura local com PostgreSQL 16 e Redis 7. | Contém credencial de banco em texto claro para ambiente de desenvolvimento. Deve ser migrado para `.env` antes de uso sério. |
| `package.json` | Não encontrado na raiz | Manifesto esperado para frontend/admin Node.js. | O README cita pasta `admin`, `npm install` e `npm run dev`, mas o manifesto não foi localizado na raiz. Precisa confirmar estrutura real do frontend. |
| `pyproject.toml` | Não encontrado na raiz | Manifesto esperado para backend Python moderno. | O README cita FastAPI + Python 3.12, mas não há manifesto raiz detectado. |
| `requirements.txt` | Não encontrado na raiz | Dependências Python. | Dependências do backend ainda não foram localizadas. |
| `.env.example` | Não confirmado | Exemplo de variáveis de ambiente. | O README cita `.env.local.example` dentro de `admin`, mas não foi validado neste levantamento. |
| `Dockerfile` | Não encontrado na raiz | Build de imagem de aplicação. | Infra atual cobre somente serviços auxiliares. |
| `Makefile` | Não encontrado na raiz | Automação operacional. | Não há comandos padronizados de setup/test/build identificados na raiz. |
| `.github/workflows/*` | Não confirmado | CI/CD. | README cita GitHub Actions, mas workflows não foram validados neste levantamento. |

---

## 3. Evidências diretas dos arquivos lidos

### 3.1 README.md

O README define o projeto como:

> App de gerenciamento de academia com gamificação — pontos, streaks, tiers e recompensas.

Também informa a stack planejada:

| Camada | Tecnologia indicada |
|---|---|
| Mobile | React Native + Expo SDK 54 + TypeScript |
| Backend | FastAPI + Python 3.12 + Pydantic v2 |
| Banco | PostgreSQL 16 |
| Cache | Redis 7 |
| Auth | Supabase Auth |
| CI/CD | GitHub Actions + EAS Build |

O README também aponta um Admin Web com Next/Node, pois orienta:

```bash
cd admin
npm install
cp .env.local.example .env.local
npm run dev
```

### 3.2 docker-compose.yml

Infraestrutura local identificada:

| Serviço | Imagem | Porta | Observação |
|---|---|---:|---|
| `postgres` | `postgres:16-alpine` | `5432` | Banco local `gymforce`, usuário `gym`. |
| `redis` | `redis:7-alpine` | `6379` | Cache com política `allkeys-lru` e limite de 128 MB. |

Risco identificado:

```yaml
POSTGRES_PASSWORD: gym_dev_2026
```

Mesmo sendo ambiente local, recomenda-se mover para `.env` e manter `.env.example` sanitizado.

---

## 4. Topologia inicial do projeto

Com base no README, a estrutura esperada/documentada é:

```txt
gymforce-projeto/
├── fase-1-tecnologias/
│   └── TECH_STACK.md
├── fase-2-escopo/
│   ├── ESCOPO.md
│   └── BACKLOG_INICIAL.md
├── fase-3-ide/
│   └── VSCODE_SETUP.md
├── fase-4-governanca/
│   ├── GOVERNANCA.md
│   ├── templates/
│   │   └── TEMPLATE_BACKLOG.md
│   ├── handoff/
│   │   └── TEMPLATE_HANDOFF.md
│   └── agentes/
│       └── AGENTES_WORKFLOW.md
├── docker-compose.yml
└── README.md
```

Estrutura dedicada criada para este levantamento:

```txt
docs/
└── codex/
    └── levantamento-inicial.md
```

---

## 5. Ponto de entrada da aplicação

### Estado atual

⚠️ Não foi possível confirmar um ponto de entrada executável da aplicação nos arquivos analisados.

### Evidências

O README informa comandos para o Admin Web:

```bash
cd admin
npm install
npm run dev
```

Porém, o `package.json` não foi localizado na raiz durante este levantamento. Também não foi localizado manifesto Python raiz como `pyproject.toml` ou `requirements.txt`.

### Hipótese controlada

O projeto aparenta estar em estágio de documentação/base inicial, com infraestrutura local definida, mas sem confirmação de código backend/frontend versionado no caminho esperado.

---

## 6. Stack identificada

| Camada | Stack planejada | Estado no repositório |
|---|---|---|
| Mobile | React Native + Expo SDK 54 + TypeScript | Planejado no README; não validado em código. |
| Admin Web | Node/Next provável | README orienta `npm install` em `admin`; estrutura não confirmada. |
| Backend | FastAPI + Python 3.12 + Pydantic v2 | Planejado no README; manifesto não confirmado. |
| Banco | PostgreSQL 16 | Confirmado no `docker-compose.yml`. |
| Cache | Redis 7 | Confirmado no `docker-compose.yml`. |
| Auth | Supabase Auth | Planejado no README; configuração não confirmada. |
| CI/CD | GitHub Actions + EAS Build | Planejado no README; workflows não confirmados. |

---

## 7. Arquitetura atual

### Classificação

| Item | Avaliação |
|---|---|
| Padrão arquitetural predominante | Não determinado em código executável. |
| Grau de confiança | Baixo para código; médio para intenção arquitetural documentada. |
| Estado percebido | Projeto em fase de fundação/documentação, antes da implementação plena. |

### Intenção arquitetural documentada

Pelo README, o produto pretende ser composto por:

- App mobile gamificado.
- Backend API.
- Admin Web.
- Banco PostgreSQL.
- Cache Redis.
- Autenticação via Supabase.
- CI/CD com GitHub Actions e EAS Build.

Isso sugere uma arquitetura futura com separação por aplicações, mas a arquitetura real ainda depende de validação dos diretórios e código-fonte.

---

## 8. Estado inicial do código

| Critério | Situação |
|---|---|
| Código backend analisável | Não confirmado. |
| Código frontend/admin analisável | Não confirmado. |
| Código mobile analisável | Não confirmado. |
| Testes | Não confirmados. |
| Pipeline CI/CD | Não confirmado. |
| Infra local | Parcialmente existente com Postgres e Redis. |
| Documentação inicial | Existente via README e estrutura planejada. |

---

## 9. Riscos iniciais

| Severidade | Risco | Evidência | Recomendação |
|---|---|---|---|
| ❌ Crítico | Stack planejada ainda não confirmada por manifestos de aplicação. | README cita FastAPI, Admin Web e Mobile, mas manifestos raiz não foram confirmados. | Mapear árvore completa do repo e validar presença de `admin`, backend e mobile. |
| ⚠️ Atenção | Credencial de banco hardcoded no compose. | `POSTGRES_PASSWORD: gym_dev_2026`. | Migrar para `.env` e criar `.env.example` sanitizado. |
| ⚠️ Atenção | Ausência de automação raiz confirmada. | `Makefile` não localizado na raiz. | Criar comandos padronizados após confirmar stack real. |
| ⚠️ Atenção | CI/CD citado mas não validado. | README cita GitHub Actions + EAS Build. | Validar `.github/workflows`. |
| ⚠️ Atenção | Ponto de entrada não confirmado. | Não localizado manifesto raiz. | Confirmar estrutura real do projeto. |

---

## 10. O que está funcional e estável

| Item | Estado | Evidência |
|---|---|---|
| Infra local básica | ✅ Parcialmente funcional | `docker-compose.yml` com Postgres e Redis. |
| Visão inicial do produto | ✅ Documentada | `README.md`. |
| Stack alvo | ✅ Documentada | Tabela de stack no `README.md`. |
| Estrutura de governança planejada | ✅ Documentada | README lista fases, templates, handoff e agentes. |

---

## 11. O que está incompleto ou em progresso

| Item | Estado atual | O que falta |
|---|---|---|
| Backend FastAPI | ⚠️ Planejado | Confirmar código, dependências, ponto de entrada, estrutura de camadas. |
| Admin Web | ⚠️ Planejado | Confirmar pasta `admin`, `package.json`, `.env.local.example` e scripts. |
| Mobile Expo | ⚠️ Planejado | Confirmar app Expo, `app.json`, `package.json`, estrutura mobile. |
| Supabase Auth | ⚠️ Planejado | Confirmar variáveis, SDK, fluxo de autenticação e ambiente. |
| CI/CD | ⚠️ Planejado | Confirmar workflows e EAS Build. |
| Testes | ⚠️ Não determinado | Confirmar diretórios e comandos de teste. |

---

## 12. O que está quebrado ou em risco

| Item | Problema | Severidade | Ação necessária |
|---|---|---|---|
| Manifestos de aplicação | Não confirmados nos caminhos esperados. | ❌ Alta | Executar mapeamento completo da árvore do repositório. |
| Segurança de configuração | Senha no `docker-compose.yml`. | ⚠️ Média | Migrar para `.env`. |
| Continuidade técnica | README descreve muito mais do que foi validado em código. | ⚠️ Média | Separar documentação planejada do estado implementado. |

---

## 13. Próximos passos recomendados

| Prioridade | Ação | Motivo | Resultado esperado |
|---:|---|---|---|
| 1 | Mapear árvore completa do repositório até 3 níveis. | Confirmar se backend, admin e mobile existem fisicamente. | Estado real da estrutura. |
| 2 | Validar arquivos de dependência por módulo. | Confirmar stack real e comandos. | Base segura para setup. |
| 3 | Validar `.env.example` e arquivos de ambiente. | Evitar hardcodes e inconsistências. | Configuração limpa e reprodutível. |
| 4 | Identificar ponto de entrada de cada aplicação. | Necessário para rodar localmente. | Quick start confiável. |
| 5 | Criar backlog inicial somente após validação completa. | Evitar backlog baseado em hipótese. | Desenvolvimento sem retrabalho. |

---

## 14. Resumo executivo

1. O projeto `Gymforce` está documentado como um app de academia gamificado com mobile, backend, admin, PostgreSQL, Redis e Supabase Auth.
2. A infraestrutura local básica com Postgres e Redis existe no `docker-compose.yml`.
3. O ponto de entrada da aplicação ainda não foi confirmado.
4. A stack está bem descrita no README, mas ainda precisa ser validada contra código real.
5. Existe risco de configuração sensível no compose por senha hardcoded.
6. O projeto aparenta estar em fase inicial/fundacional, ainda antes da implementação plena ou com estrutura não totalmente validada.
7. Não é recomendado iniciar backlog de desenvolvimento antes de mapear a árvore completa e validar manifestos.
8. Próxima ação recomendada: inventário completo de diretórios e arquivos por módulo.

---

## 15. Conclusão operacional

Levantamento inicial registrado em área isolada para o Codex:

```txt
docs/codex/levantamento-inicial.md
```

Nenhuma feature foi proposta ainda. Nenhum código de aplicação foi alterado. O próximo passo deve ser aprofundar o inventário técnico antes de decidir o primeiro backlog.
