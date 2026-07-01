# Projeto: Financeiro Mensal

## Contexto para Agentes

Este é um app Next.js 16 (App Router) de controle financeiro mensal.

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
