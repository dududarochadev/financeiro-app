# Projeto: Financeiro Mensal

## Contexto para Agentes

App Next.js 16 (App Router) de controle financeiro mensal.

### Stack
- **Auth:** NextAuth.js v5 com Google OAuth. Redirect URI termina com `/google` (ex: `/api/auth/callback/google`)
- **Banco:** PostgreSQL 16 na Hetzner, acesso via Pool do `pg`. NÃO usar Supabase.
- **API:** API Routes do Next.js (CRUD em `/api/transactions`, `/api/wallets`, `/api/tags`)
- **ORM:** Nenhum — SQL raw via `pg` Pool
- **Deploy:** Docker na Hetzner + GitHub Actions

### Regras importantes
- hooks usam `fetch()` para API routes, NÃO chamam Supabase
- `src/lib/auth.ts` usa dynamic import do `pg` para evitar bundling no edge
- Middleware usa `auth()` do NextAuth
- Dados do usuário vêm do `useAuth()` (contexto) ou `auth()` (server-side)

### Para explorar o código
Leia `CONTEXT.md` — contém o mapa completo do projeto: páginas, componentes, hooks, API, tipos, padrões de cor e fluxo de dados. Muito mais rápido que usar `explore`.

### Stack de UI
- Tailwind v4 com `@base-ui/react` (Radix alternativo)
- shadcn/ui-style primitives em `src/components/ui/`
- Tema escuro padrão (`.dark`) com variáveis oklch em `globals.css`

### Estrutura resumida
| Pasta | O que tem |
|-------|-----------|
| `src/app/` | 6 páginas + 4 API routes |
| `src/components/` | 8 componentes de negócio + 14 ui primitives |
| `src/hooks/` | 4 hooks (useMonth, useTransactions, useWallets, useYearTransactions) |
| `src/lib/` | auth, db (pool pg), types, utils |
