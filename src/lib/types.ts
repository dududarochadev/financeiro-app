// ============================================================
// Financial Monthly Workspace — TypeScript Types
// ============================================================

// --- Enums / Literal Types ---

export type TransactionType = 'expense' | 'income';
export type TransactionStatus = 'pending' | 'paid' | 'cancelled';
export type RecurrenceType = 'none' | 'monthly' | 'yearly' | 'custom';

// --- Profile ---

export interface Profile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// --- Wallet ---

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WalletInput {
  name: string;
  description?: string;
  color?: string;
}

// --- Tag ---

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface TagInput {
  name: string;
  color?: string;
}

// --- Transaction (Monthly Occurrence) ---

export interface Transaction {
  id: string;
  wallet_id: string;
  user_id: string;

  type: TransactionType;
  title: string;
  description: string | null;
  expected_amount: number;
  paid_amount: number | null;
  status: TransactionStatus;

  group: string;

  due_date: string | null;
  month: number;
  year: number;

  recurrence_type: RecurrenceType;
  recurrence_interval: number | null;
  recurrence_end_date: string | null;
  template_id: string | null;

  installment_current: number | null;
  installment_total: number | null;

  paid_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;

  // Joined (optional, from API)
  tags?: Tag[];
  wallet?: Wallet;
}

export interface TransactionInput {
  wallet_id: string;
  type: TransactionType;
  title: string;
  description?: string;
  expected_amount: number;
  paid_amount?: number;
  status?: TransactionStatus;
  group?: string;
  due_date?: string;
  month: number;
  year: number;
  recurrence_type?: RecurrenceType;
  recurrence_interval?: number;
  recurrence_end_date?: string;
  installment_current?: number;
  installment_total?: number;
  tag_ids?: string[];
}

// --- Grouped Transactions (for Pay Bills) ---

export interface TransactionGroup {
  name: string;
  transactions: Transaction[];
  total: number;
}

// --- Monthly Summary ---

export interface MonthlySummary {
  pending_total: number;
  paid_total: number;
  income_total: number;
  expected_balance: number;
}

// --- Navigation ---

export interface MonthYear {
  month: number; // 1-12
  year: number;
}

// --- Recurrence Edit Options (Google Calendar style) ---

export type RecurrenceEditScope = 'this' | 'this_and_future' | 'all';
