# 🛠️ GymForce — Setup do VS Code (Fase 3)

> **Objetivo:** Configurar o ambiente de desenvolvimento para máxima produtividade

---

## 1. Extensões Obrigatórias

### 🔧 Core Development

| Extensão | ID | Finalidade |
|----------|-----|-----------|
| **ESLint** | `dbaeumer.vscode-eslint` | Linting JS/TS |
| **Prettier** | `esbenp.prettier-vscode` | Formatação automática |
| **TypeScript Nightly** | `ms-vscode.vscode-typescript-next` | Suporte TS avançado |
| **Error Lens** | `usernameheo.errorlens` | Erros inline no editor |
| **Path Intellisense** | `christian-kohler.path-intellisense` | Autocomplete de paths |
| **Auto Rename Tag** | `formulahendry.auto-rename-tag` | Rename de tags JSX |

### 📱 React Native / Expo

| Extensão | ID | Finalidade |
|----------|-----|-----------|
| **React Native Tools** | `msjsdiag.vscode-react-native` | Debug, IntelliSense RN |
| **Expo Tools** | `expo.vscode-expo-tools` | Suporte Expo config |
| **ES7+ React Snippets** | `dsznajder.es7-react-js-snippets` | Snippets rápidos |
| **Tailwind CSS IntelliSense** | `bradlc.vscode-tailwindcss` | Se usar NativeWind |

### 🐍 Python / FastAPI

| Extensão | ID | Finalidade |
|----------|-----|-----------|
| **Python** | `ms-python.python` | Suporte Python |
| **Pylance** | `ms-python.vscode-pylance` | Type checking avançado |
| **Ruff** | `charliermarsh.ruff` | Linter + formatter (substitui flake8+black+isort) |
| **Python Debugger** | `ms-python.debugpy` | Debug Python |
| **Even Better TOML** | `tamasfe.even-better-toml` | Suporte pyproject.toml |

### 🗄️ Banco de Dados

| Extensão | ID | Finalidade |
|----------|-----|-----------|
| **SQLTools** | `mtxr.sqltools` | Client SQL no VS Code |
| **SQLTools PostgreSQL** | `mtxr.sqltools-driver-pg` | Driver Postgres |
| **Redis** | `cweijan.vscode-redis-client` | Client Redis |

### 🤖 IA e Produtividade

| Extensão | ID | Finalidade |
|----------|-----|-----------|
| **Claude Code** | CLI `claude` | AI pair programming no terminal |
| **GitHub Copilot** | `github.copilot` | Autocomplete com IA |
| **GitLens** | `eamodio.gitlens` | Git blame, history inline |
| **Thunder Client** | `rangav.vscode-thunder-client` | REST client (testar API) |
| **Todo Tree** | `gruntfuggly.todo-tree` | Rastrear TODOs no código |
| **Markdown Preview** | `yzhang.markdown-all-in-one` | Preview de docs .md |
| **Docker** | `ms-azuretools.vscode-docker` | Gerenciar containers |

---

## 2. Arquivo `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "editor.tabSize": 2,
  "editor.rulers": [100],
  "editor.bracketPairColorization.enabled": true,
  "editor.guides.bracketPairs": "active",

  "typescript.preferences.importModuleSpecifier": "non-relative",
  "typescript.tsdk": "node_modules/typescript/lib",

  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.tabSize": 4,
    "editor.rulers": [88]
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },

  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["className=\"([^\"]*)\"", "\"([^\"]*)\""]
  ],

  "eslint.workingDirectories": [
    { "directory": "mobile", "changeProcessCWD": true },
    { "directory": "backend", "changeProcessCWD": true }
  ],

  "search.exclude": {
    "**/node_modules": true,
    "**/.expo": true,
    "**/dist": true,
    "**/__pycache__": true
  },

  "todo-tree.general.tags": [
    "TODO", "FIXME", "HACK", "BUG", "REVIEW", "PERF"
  ]
}
```

---

## 3. Arquivo `.vscode/extensions.json`

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "usernameheo.errorlens",
    "msjsdiag.vscode-react-native",
    "expo.vscode-expo-tools",
    "dsznajder.es7-react-js-snippets",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "charliermarsh.ruff",
    "mtxr.sqltools",
    "mtxr.sqltools-driver-pg",
    "github.copilot",
    "eamodio.gitlens",
    "rangav.vscode-thunder-client",
    "gruntfuggly.todo-tree",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker"
  ]
}
```

---

## 4. Arquivo `.vscode/launch.json` (Debug)

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Expo: Start",
      "type": "reactnative",
      "request": "launch",
      "platform": "exponent",
      "expoHostType": "lan"
    },
    {
      "name": "FastAPI: Debug",
      "type": "debugpy",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--host", "0.0.0.0", "--port", "8000"],
      "cwd": "${workspaceFolder}/backend",
      "envFile": "${workspaceFolder}/backend/.env"
    },
    {
      "name": "Python: Current File",
      "type": "debugpy",
      "request": "launch",
      "program": "${file}"
    }
  ]
}
```

---

## 5. Estrutura de Pastas do Monorepo

```
gymforce/
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── launch.json
├── mobile/                    # React Native + Expo
│   ├── app/                   # Expo Router (file-based routing)
│   │   ├── (auth)/            # Grupo de rotas de auth
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   ├── (tabs)/            # Tab navigation principal
│   │   │   ├── home.tsx
│   │   │   ├── workouts.tsx
│   │   │   ├── rewards.tsx
│   │   │   ├── leaderboard.tsx
│   │   │   └── profile.tsx
│   │   ├── _layout.tsx
│   │   └── index.tsx
│   ├── components/
│   │   ├── ui/                # Componentes atômicos
│   │   ├── features/          # Componentes de negócio
│   │   └── layout/            # Layouts reutilizáveis
│   ├── hooks/                 # Custom hooks
│   ├── services/              # API clients
│   ├── stores/                # Zustand stores
│   ├── types/                 # TypeScript types
│   ├── utils/                 # Helpers
│   ├── constants/             # Tokens de design, config
│   ├── assets/                # Imagens, fontes
│   ├── app.json
│   ├── tsconfig.json
│   └── package.json
├── backend/                   # FastAPI
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── users.py
│   │   │       ├── checkins.py
│   │   │       ├── workouts.py
│   │   │       ├── gamification.py
│   │   │       ├── rewards.py
│   │   │       └── admin.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── repositories/      # Data access
│   │   └── main.py
│   ├── alembic/               # Migrations
│   ├── tests/
│   ├── pyproject.toml
│   ├── Dockerfile
│   └── .env.example
├── admin/                     # Painel web (Next.js) — futuro
├── docs/                      # Documentação do projeto
│   ├── GOVERNANCA.md
│   ├── HANDOFF.md
│   ├── ADR/                   # Architecture Decision Records
│   └── backlog/
├── docker-compose.yml
├── .gitignore
├── .prettierrc
├── .eslintrc.js
└── README.md
```

---

## 6. Comandos de Setup Inicial

```bash
# 1. Criar o monorepo
mkdir gymforce && cd gymforce
git init

# 2. Mobile (Expo)
npx create-expo-app@latest mobile --template tabs
cd mobile
npx expo install expo-router expo-camera expo-notifications expo-secure-store
npm install zustand @tanstack/react-query zod react-hook-form
npm install -D typescript @types/react
cd ..

# 3. Backend (FastAPI)
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
pip install fastapi uvicorn[standard] sqlalchemy[asyncio] asyncpg
pip install alembic pydantic-settings python-jose[cryptography] passlib[bcrypt]
pip install redis httpx pytest pytest-asyncio
cd ..

# 4. Docker (Postgres + Redis)
docker compose up -d

# 5. VS Code
code .  # Vai sugerir instalar extensões recomendadas
```
