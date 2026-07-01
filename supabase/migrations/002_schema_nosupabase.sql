-- Financial Monthly Workspace — Database Schema
-- Adapted from Supabase to standalone PostgreSQL (no Supabase Auth)
-- Auth.js manages its own User/Session/Account tables via its adapter

-- ============================================================
-- PROFILES (extends Auth.js users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY, -- Google 'sub' ID (matching Auth.js User.id)
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- WALLETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TAGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRANSACTIONS (core table — both expenses and income)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('expense', 'income');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE transaction_status AS ENUM ('pending', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE recurrence_type AS ENUM ('none', 'monthly', 'yearly', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Core fields
  type transaction_type NOT NULL DEFAULT 'expense',
  title TEXT NOT NULL,
  description TEXT,
  expected_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status transaction_status NOT NULL DEFAULT 'pending',

  -- Grouping
  "group" TEXT DEFAULT 'Outros',

  -- Date
  due_date DATE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,

  -- Recurrence
  recurrence_type recurrence_type NOT NULL DEFAULT 'none',
  recurrence_interval INTEGER DEFAULT 1,
  recurrence_end_date DATE,
  template_id UUID, -- links occurrences from same template

  -- Installments
  installment_current INTEGER,
  installment_total INTEGER,

  -- Audit
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- TRANSACTION TAGS (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transaction_tags (
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_transactions_user_month_year
  ON public.transactions (user_id, year, month, status);

CREATE INDEX IF NOT EXISTS idx_transactions_wallet
  ON public.transactions (wallet_id);

CREATE INDEX IF NOT EXISTS idx_transactions_group
  ON public.transactions ("group");

CREATE INDEX IF NOT EXISTS idx_transactions_template
  ON public.transactions (template_id);

CREATE INDEX IF NOT EXISTS idx_wallets_user
  ON public.wallets (user_id);
