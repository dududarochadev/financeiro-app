# Financeiro Mensal — Contexto para Agentes

Mapa completo do projeto para evitar `explore` desnecessários.

---

## Índice

1. [Estrutura de diretórios](#1-estrutura-de-diretórios)
2. [Páginas (App Router)](#2-páginas-app-router)
3. [API Routes](#3-api-routes)
4. [Componentes](#4-componentes)
5. [Hooks](#5-hooks)
6. [Lib](#6-lib)
7. [Padrões de cor](#7-padrões-de-cor)
8. [Fluxo de dados](#8-fluxo-de-dados)
9. [Tarefas comuns](#9-tarefas-comuns)
10. [Gambiarras & gotchas](#10-gambiarras--gotchas)

---

## 1. Estrutura de diretórios

```
src/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts   # NextAuth v5 handler
│   │   ├── tags/route.ts                  # CRUD tags
│   │   ├── transactions/route.ts          # CRUD transações + recorrência
│   │   └── wallets/route.ts               # CRUD carteiras
│   ├── dashboard/page.tsx                 # Dashboard mensal principal
│   ├── login/page.tsx                     # Login Google OAuth
│   ├── transactions/new/page.tsx          # Nova transação standalone
│   ├── year-overview/page.tsx             # Visão anual (planilha)
│   ├── globals.css                        # Tema Tailwind v4 + dark mode
│   ├── layout.tsx                         # Root layout com AuthProvider
│   └── page.tsx                           # Redirect / → /dashboard ou /login
├── components/
│   ├── layout/
│   │   ├── AuthProvider.tsx               # Contexto de auth (useAuth())
│   │   ├── Header.tsx                     # Header sticky com navegação
│   │   └── ThemeToggle.tsx               # Dark/light mode
│   ├── transactions/
│   │   ├── TransactionForm.tsx            # Formulário criar/editar transação
│   │   ├── TransactionCard.tsx            # Card de transação (toggle, edit, delete)
│   │   └── RecurrenceScopeDialog.tsx      # Modal de escopo para recorrência
│   ├── wallets/
│   │   ├── WalletForm.tsx                 # Formulário criar/editar carteira
│   │   └── WalletSelector.tsx             # Select de carteiras no header
│   └── ui/                                # 14 primitives shadcn/@base-ui
├── hooks/
│   ├── useMonth.ts                        # Navegação mês/ano
│   ├── useTransactions.ts                 # CRUD + dados derivados do mês
│   ├── useWallets.ts                      # CRUD carteiras
│   └── useYearTransactions.ts             # 12 meses em paralelo para visão anual
├── lib/
│   ├── auth.ts                            # Config NextAuth v5 (Google)
│   ├── db.ts                              # Pool PostgreSQL singleton
│   ├── types.ts                           # Interfaces TypeScript
│   └── utils.ts                           # Utilitários (currency, month, cn)
└── middleware.ts                          # Proteção de rotas com auth()
```

---

## 2. Páginas (App Router)

| Rota | Arquivo | O que faz |
|------|---------|-----------|
| `/` | `app/page.tsx` | Redirect: logado → `/dashboard`, anônimo → `/login` |
| `/login` | `app/login/page.tsx` | Botão "Entrar com Google" |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard mensal: cards de resumo, lista de grupos, toggle pago/pendente, edição inline |
| `/transactions/new` | `app/transactions/new/page.tsx` | Página avulsa para criar transação (redireciona ao salvar) |
| `/year-overview` | `app/year-overview/page.tsx` | Planilha anual: matriz grupo×mês com receitas e saldo |

Middleware (`src/middleware.ts`) protege `/dashboard`, `/transactions` — redireciona não-autenticados para `/login`.

---

## 3. API Routes

Todas exigem auth — sem sessão → `401`.

| Rota | Métodos | Descrição |
|------|---------|-----------|
| `/api/auth/[...nextauth]` | GET, POST | Handler NextAuth v5 (Google OAuth) |
| `/api/tags` | GET, POST, DELETE | Listar, criar (upsert), deletar tags |
| `/api/transactions` | GET, POST, PATCH, DELETE | Listar por wallet/mês/ano, criar com recorrência, atualizar, soft-delete |
| `/api/wallets` | GET, POST, PATCH, DELETE | Listar, criar, atualizar, hard-delete |

### /api/transactions — detalhes

- **GET**: `?wallet_id=&month=&year=[&status=]` — filtra por wallet+mês+ano
- **POST**: `TransactionInput` — se `installment_total > 1`, gera parcelas futuras; se `recurrence_type='monthly'`, gera até 60 ocorrências mensais
- **PATCH**: `body: { id, ...campos }` — atualiza campos, verifica ownership
- **DELETE**: `?id=&scope=` — soft-delete (`deleted_at = NOW()`)

---

## 4. Componentes

### Layout

| Componente | Props principais | Comportamento |
|---|---|---|
| `AuthProvider` | `children` | Envolve em `SessionProvider`, expõe `{ user, loading, signOut }` via `useAuth()` |
| `Header` | `month, year, wallet, wallets, onPreviousMonth, onNextMonth, onWalletChange, onAddWallet` | Header sticky: seletor de carteira, navegação mês, theme toggle, logout |
| `ThemeToggle` | — | Alterna dark/light, persiste em localStorage |

### Transações

| Componente | Props principais | Comportamento |
|---|---|---|
| `TransactionForm` | `walletId, month, year, transaction?, groups, onSubmit, trigger?` | Dialog com formulário completo. Estado local: `type, title, amount, group, formMonth, formYear, dueDate, recurrenceMode, installments` |
| `TransactionCard` | `transaction, onTogglePaid, onMarkPending, onEdit, onDelete` | Card de transação: toggle pago/pendente, edit/delete com dialog de escopo se recorrente |
| `RecurrenceScopeDialog` | `open, onOpenChange, title, description, isPartOfSeries, onConfirm, loading?` | Modal: "Apenas este", "Este e futuros", "Todos" |

### Carteiras

| Componente | Props principais | Comportamento |
|---|---|---|
| `WalletForm` | `wallet?, onSubmit, trigger?` | Dialog criar/editar carteira (nome, descrição, cor) |
| `WalletSelector` | `wallets, selected, onChange, onAddWallet` | Dropdown no header para trocar/criar carteira |

---

## 5. Hooks

### `useMonth(initial?)`
- **Retorna**: `{ month, year, current, goToPreviousMonth, goToNextMonth, goToPreviousYear, goToNextYear, goToMonth, goToToday }`
- **API calls**: nenhuma (estado puro)
- **Import**: `@/hooks/useMonth`

### `useTransactions({ walletId, month, year, status? })`
- **Retorna**: `{ transactions, pendingTransactions, paidTransactions, summary, loading, createTransaction, updateTransaction, updateTransactionScope, markAsPaid, markAsPending, markGroupAsPaid, deleteTransaction, deleteTransactionScope, refresh }`
- **API calls**: GET/POST/PATCH/DELETE `/api/transactions`
- **Dependências**: `[user, walletId, month, year, status]`

### `useWallets()`
- **Retorna**: `{ wallets, selectedWallet, loading, createWallet, updateWallet, deleteWallet, switchWallet, refresh }`
- **API calls**: GET/POST/PATCH/DELETE `/api/wallets`
- **Nota**: Auto-seleciona a primeira carteira ao carregar

### `useYearTransactions(walletId, year)`
- **Retorna**: `{ groups, monthlySummaries, groupMonthMap, incomeGroups, incomeMonthMap, yearTotal, loading }`
- **API calls**: 12 GETs paralelos (`/api/transactions?wallet_id=&month=1..12&year=`)
- **Uso**: Exclusivo da visão anual

---

## 6. Lib

| Arquivo | Export principal | Descrição |
|---|---|---|
| `auth.ts` | `authConfig`, `handlers`, `auth`, `signIn`, `signOut` | NextAuth v5 com Google OAuth. `signIn` faz upsert em `public.profiles` |
| `db.ts` | `pool` (default + named) | Pool PostgreSQL singleton (`DATABASE_URL`, max 10, idle 30s) |
| `types.ts` | `Transaction`, `Wallet`, `Tag`, `TransactionInput`, `MonthlySummary`, `RecurrenceEditScope`, ... | Todos os tipos do projeto |
| `utils.ts` | `cn`, `formatCurrency`, `getMonthName`, `getMonthNameShort`, `getCurrentMonthYear`, `getPreviousMonth`, `getNextMonth`, `getPreviousYear`, `getNextYear`, `formatDate`, `formatInstallment` | Utilitários |

---

## 7. Padrões de cor

### Tema (dark mode — padrão)
- `--card`: `oklch(0.145 0 0)` — preto (fundo dos cards e linhas de despesa)
- `--background`: `oklch(0.145 0 0)` — preto
- `--foreground`: `oklch(0.985 0 0)` — branco
- `--muted`: `oklch(0.269 0.014 286.375)` — cinza escuro

### Transações / Visão Anual
| Elemento | Classe | Cor |
|---|---|---|
| Receita **não paga** | `text-foreground` | Branco |
| Receita **paga** (strikethrough) | `text-emerald-600 line-through` | Verde escuro |
| Despesa **não paga** | `text-foreground` (padrão) | Branco |
| Despesa **paga** (strikethrough) | `text-red-500 line-through` | Vermelho |
| Fundo linha de **despesa** | `bg-card` | Preto |
| Fundo linha de **receita** | `bg-emerald-50/40` | Verde muito claro |
| Borda esquerda receita (TransactionCard) | `border-l-4 border-l-emerald-400` | Verde |
| Resumo "A pagar" | `text-red-500` | Vermelho |
| Resumo "Pago" / "Receitas" | `text-emerald-600` | Verde |
| Saldo ≥ 0 | `text-emerald-600` | Verde |
| Saldo < 0 | `text-red-500` | Vermelho |

### Legenda (Visão Anual)
> Valores riscados em vermelho = despesa paga | Valores riscados em verde = receita recebida

---

## 8. Fluxo de dados

### Dashboard (mês atual)
```
useMonth() → { month, year }
useWallets() → { selectedWallet }
useTransactions({ walletId, month, year }) → { transactions, summary, grouped, CRUD methods }
                                              ↓
Dashboard render → Header (month/year nav + wallet selector)
                 → Summary cards (pending, paid, income, balance)
                 → Group list (TransactionCard para cada transação)
                 → TransactionForm (create)
```

### Visão Anual
```
useMonth() → { year }
useYearTransactions(walletId, year) → { groups, groupMonthMap, incomeGroups, incomeMonthMap, monthlySummaries }
                                       ↓
YearOverviewPage render → Tabela: linhas de receita → linhas de despesa → total → saldo
```

### Criar transação
```
TransactionForm (formMonth, formYear) → handleSubmit → TransactionInput { month: formMonth, year: formYear }
  → POST /api/transactions
  → se installment_total > 1: gera N parcelas no DB
  → se recurrence_type = 'monthly': gera 60 ocorrências
  → onSuccess: fecha dialog, refresh()
```

---

## 9. Tarefas comuns

### Adicionar campo a uma transação
1. Adicionar coluna no PostgreSQL
2. Atualizar `TransactionInput` e `Transaction` em `lib/types.ts`
3. Adicionar no form (`TransactionForm.tsx`)
4. Se aplicável, mostrar no card (`TransactionCard.tsx`)
5. Incluir no INSERT/UPDATE de `app/api/transactions/route.ts`

### Adicionar novo grupo de despesa
- Só adicionar ao array `DEFAULT_GROUPS` em `TransactionForm.tsx` (linha 35)
- Grupos novos são criados automaticamente ao usar

### Modificar cores no tema
- Editar `src/app/globals.css` (variáveis CSS em `:root` e `.dark`)
- Usar valores oklch para consistência

---

## 10. Gambiarras & gotchas

- **`src/lib/auth.ts`** usa dynamic import do `pg` para evitar bundling no edge runtime
- **Middleware** usa `auth()` do NextAuth — não o client
- **Grupos**: o form tem `DEFAULT_GROUPS` fixos + grupos custom vindos de transações existentes
- **Excluir carteira**: hard-delete (`DELETE FROM`). Excluir transações não é cascata — precisa tratar separadamente
- **Excluir transação**: soft-delete (`deleted_at = NOW()`). GET já filtra `deleted_at IS NULL`
- **Recorrência mensal**: gera 60 ocorrências (5 anos). Sempre cria no futuro
- **Parcelas**: `installment_current` começa em 1, incrementa a cada mês
- **Formulário de transação**: quando edita (`transaction != null`), os selects de mês/ano NÃO resetam para os props — mantêm o valor da transação sendo editada
