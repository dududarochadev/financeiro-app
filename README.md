# Financeiro Mensal

Seu workspace de fechamento financeiro mensal. Controle de receitas, despesas, carteiras e contas a pagar.

## Stack

- **Frontend/Backend:** Next.js 16 (App Router)
- **Autenticação:** NextAuth.js v5 (Google OAuth)
- **Banco:** PostgreSQL 16 (Hetzner)
- **Infra:** Docker + Nginx + Let's Encrypt SSL
- **Deploy:** Git push → GitHub Actions → VM Hetzner

## Rodar localmente

```bash
npm install
npm run dev
```

Acessar http://localhost:3000

Login com Google — o banco remoto já está configurado na `DATABASE_URL`.

## Estrutura

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth route handler
│   │   ├── transactions/         # CRUD transações
│   │   ├── wallets/              # CRUD carteiras
│   │   └── tags/                 # CRUD tags
│   ├── login/                    # Página de login
│   ├── dashboard/               # Dashboard principal
│   ├── pay-bills/               # Pagar contas
│   └── transactions/            # Nova transação
├── components/
│   ├── layout/                  # AuthProvider, Header
│   ├── transactions/            # TransactionCard, TransactionForm
│   ├── wallets/                 # WalletForm, WalletSelector
│   └── ui/                      # shadcn/ui components
├── hooks/                       # useTransactions, useWallets, useMonth
├── lib/
│   ├── auth.ts                  # NextAuth config
│   ├── db.ts                    # Pool PostgreSQL (pg)
│   ├── types.ts                 # Types compartilhados
│   └── utils.ts                 # Formatters, helpers
└── middleware.ts                 # Auth middleware (NextAuth)
```

## Produção

**URL:** https://dududarochadev-financeiro.duckdns.org  
**Servidor:** VM Hetzner (46.224.48.211)  
**Banco:** PostgreSQL via `host.docker.internal:5432`

### Deploy

A cada `git push` no `master`, o GitHub Actions automaticamente:
1. Conecta na VM via SSH
2. Faz `git pull`
3. Builda e reinicia o container Docker

Para deploy manual:
```bash
ssh -i ~/Downloads/ssh/general-instance-ssh-key.key root@46.224.48.211 \
  "cd /root/apps/financeiro && git pull && docker compose up -d --build"
```

## Migração do Supabase

Este app foi migrado do Supabase Cloud (banco + auth) para:
- PostgreSQL direto via `pg` (sem ORM)
- NextAuth.js v5 com Google OAuth
- API Routes do Next.js como backend

Nenhuma dependência do Supabase permanece no código.
