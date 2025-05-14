# usemaru

🚀 Gerador de CRUD para Next.js com React Query e Axios

## Instalação

```bash
# Instalação global (recomendado)
npm install -g usemaru

# OU use com npx sem instalar
npx usemaru
```

## O que é?

Usemaru é uma ferramenta CLI para gerar rapidamente estruturas CRUD para Next.js App Router, incluindo:

- Rotas de API completas com GET, POST, PUT e DELETE
- Tipos TypeScript
- Esquemas Zod
- Hooks React Query
- Actions para comunicação com API

## Como usar

Execute o comando no terminal:

```bash
usemaru
```

O assistente interativo irá guiar você pelo processo:

1. Digite o nome do recurso (ex: users, products)
2. Especifique o diretório de destino (padrão: ./src)
3. Escolha se deseja criar uma instância configurada do Axios

## Estrutura gerada

Para um recurso chamado "users", a seguinte estrutura será criada:

```
src/
└── app/
    └── api/
        └── user/
            ├── [id]/
            │   └── route.ts         # GET, PUT, DELETE por ID
            ├── route.ts             # GET, POST para lista
            ├── actions/
            │   └── userActions.ts   # Funções para comunicação com API
            ├── hooks/
            │   └── useUser.ts       # React Query hooks
            ├── schemas/
            │   └── userSchemas.ts   # Esquemas Zod
            └── types/
                └── user.ts          # Interfaces e tipos
```

Se você optar por criar uma instância configurada do Axios:

```
src/
└── lib/
    └── api.ts                   # Instância do Axios configurada
```

## Dependências

Este gerador assume que seu projeto Next.js já possui as seguintes dependências:

- next
- react
- react-dom
- @tanstack/react-query
- axios
- zod
- react-toastify (opcional, mas recomendado para notificações)

## Licença

MIT
