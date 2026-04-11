# Constituicao do Projeto Gymforce

Este documento define as regras de trabalho do repositorio.

## 1) Modelo de Branches (Gitflow simplificado)

- `main`: branch de producao, sempre estavel.
- `develop`: branch de integracao continua.
- `feat/*`: novas funcionalidades, abertas a partir de `develop`.
- `fix/*`: correcoes de bug, abertas a partir de `develop`.
- `hotfix/*`: correcoes urgentes em producao, abertas a partir de `main` quando necessario.

## 2) Regra obrigatoria de sincronizacao

Diretriz oficial: **local e remoto devem sempre estar alinhados**.

Isso significa:

- Nao iniciar trabalho com branch local atrasada.
- Nao finalizar trabalho deixando commits locais sem push.
- Nao abrir PR com branch divergente de sua base.

## 3) Protocolo operacional

Antes de iniciar qualquer tarefa:

```bash
git fetch origin --prune
git checkout develop
git pull --rebase origin develop
```

Para criar uma feature/fix:

```bash
git checkout develop
git pull --rebase origin develop
git checkout -b feat/nome-da-feature
# ou:
# git checkout -b fix/nome-da-correcao
```

Durante o trabalho (manter alinhamento):

```bash
git fetch origin --prune
git rebase origin/develop
git push -u origin <sua-branch>
```

Ao concluir:

- Abrir PR para `develop` (feature/fix).
- Garantir branch sem conflitos e atualizada com a base.
- Apos merge, sincronizar local novamente.

## 4) Convencoes de qualidade minima

- Commits pequenos, coesos e com mensagem clara.
- Evitar trabalho direto em `main`.
- Toda alteracao relevante deve passar por PR.

## 5) Autoridade desta constituicao

Estas diretrizes passam a ser o padrao oficial do projeto Gymforce e devem ser seguidas por todos os contribuidores.

## 6) Conventional Commits (obrigatório)

Formato: `tipo(módulo): descrição`

Tipos permitidos: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`
Módulos: `M1` a `M10`, ou nome do componente/área.

Exemplos:
- `feat(M4): implementar engine de pontos por check-in`
- `fix(M2): corrigir leitura QR em baixa luminosidade`
- `docs(adr): ADR-003 decisão Redis para leaderboard`
- `chore(ci): configurar EAS Build para iOS`

## 7) Definition of Done (DoD)

Uma tarefa só é "Done" quando:
- Código implementado e funcional
- Testes escritos (cobertura mínima 80%)
- Lint passa sem erros
- PR criado com descrição
- Code review aprovado
- Documentação atualizada (se API mudou)
- Handoff preenchido (se vai transicionar)

## 8) Handoff obrigatório

Toda transição entre devs ou agentes de IA DEVE usar o template em `docs/handoff/TEMPLATE_HANDOFF.md`.

## 9) Referência de documentação

| Documento | Localização |
|-----------|-------------|
| Tech Stack e decisões | `docs/TECH_STACK.md` |
| Escopo e módulos | `docs/ESCOPO.md` |
| Backlog | `docs/BACKLOG_INICIAL.md` |
| Setup VS Code | `docs/VSCODE_SETUP.md` |
| Governança detalhada | `docs/GOVERNANCA.md` |
| Template de Backlog | `docs/templates/TEMPLATE_BACKLOG.md` |
| Template de Handoff | `docs/handoff/TEMPLATE_HANDOFF.md` |
| Workflow de Agentes | `docs/agentes/AGENTES_WORKFLOW.md` |
| ADRs | `docs/ADR/ADR-XXX-*.md` |
