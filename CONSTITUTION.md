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
