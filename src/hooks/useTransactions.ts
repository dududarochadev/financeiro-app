'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';
import type { Transaction, TransactionInput, MonthlySummary, TransactionGroup } from '@/lib/types';

interface UseTransactionsOptions {
  walletId?: string;
  month: number;
  year: number;
  status?: 'pending' | 'paid' | 'cancelled';
}

export function useTransactions({ walletId, month, year, status }: UseTransactionsOptions) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchTransactions = useCallback(async () => {
    if (!user || !walletId) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', walletId)
      .eq('month', month)
      .eq('year', year)
      .is('deleted_at', null)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data } = await query;

    if (data) {
      setTransactions(data as Transaction[]);
    }
    setLoading(false);
  }, [user, walletId, month, year, status, supabase]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (input: TransactionInput): Promise<boolean> => {
    if (!user) return false;

    const { data, error } = await supabase
      .from('transactions')
      .insert({
        wallet_id: input.wallet_id,
        user_id: user.id,
        type: input.type,
        title: input.title,
        description: input.description ?? null,
        expected_amount: input.expected_amount,
        paid_amount: input.paid_amount ?? null,
        status: input.status ?? 'pending',
        group: input.group ?? 'Outros',
        due_date: input.due_date ?? null,
        month: input.month,
        year: input.year,
        recurrence_type: input.recurrence_type ?? 'none',
        recurrence_interval: input.recurrence_interval ?? null,
        recurrence_end_date: input.recurrence_end_date ?? null,
        installment_current: input.installment_current ?? null,
        installment_total: input.installment_total ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating transaction:', error);
      return false;
    }

    // If it's a recurrence or installment, generate future occurrences
    if (data && (input.recurrence_type && input.recurrence_type !== 'none' || (input.installment_total && input.installment_total > 1))) {
      await generateFutureOccurrences(data as Transaction, input);
    }

    await fetchTransactions();
    return true;
  };

  const generateFutureOccurrences = async (template: Transaction, input: TransactionInput) => {
    // For installments
    if (input.installment_total && input.installment_total > 1) {
      const occurrences: any[] = [];
      for (let i = 2; i <= input.installment_total; i++) {
        let occMonth = input.month + (i - 1);
        let occYear = input.year;
        while (occMonth > 12) {
          occMonth -= 12;
          occYear++;
        }

        occurrences.push({
          wallet_id: input.wallet_id,
          user_id: user!.id,
          type: input.type,
          title: input.title,
          expected_amount: input.expected_amount,
          status: 'pending',
          group: input.group ?? 'Outros',
          month: occMonth,
          year: occYear,
          recurrence_type: 'none',
          installment_current: i,
          installment_total: input.installment_total,
          template_id: template.id,
        });
      }

      if (occurrences.length > 0) {
        await supabase.from('transactions').insert(occurrences);
      }
    }

    // For monthly recurring
    if (input.recurrence_type === 'monthly' && !input.installment_total) {
      const endDate = input.recurrence_end_date ? new Date(input.recurrence_end_date) : null;
      const now = new Date();
      const occurrences: any[] = [];
      let occMonth = input.month + 1;
      let occYear = input.year;
      let maxFuture = 12; // Generate up to 12 months ahead

      for (let i = 0; i < maxFuture; i++) {
        while (occMonth > 12) {
          occMonth -= 12;
          occYear++;
        }

        const occDate = new Date(occYear, occMonth - 1, 1);
        if (endDate && occDate > endDate) break;

        occurrences.push({
          wallet_id: input.wallet_id,
          user_id: user!.id,
          type: input.type,
          title: input.title,
          expected_amount: input.expected_amount,
          status: 'pending',
          group: input.group ?? 'Outros',
          month: occMonth,
          year: occYear,
          recurrence_type: 'monthly',
          template_id: template.id,
          due_date: input.due_date ? `${occYear}-${String(occMonth).padStart(2, '0')}-${String(new Date(input.due_date).getDate()).padStart(2, '0')}` : null,
        });

        occMonth++;
      }

      if (occurrences.length > 0) {
        await supabase.from('transactions').insert(occurrences);
      }
    }
  };

  const updateTransaction = async (id: string, input: Partial<TransactionInput>): Promise<boolean> => {
    const { error } = await supabase
      .from('transactions')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating transaction:', error);
      return false;
    }
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...input } : t))
    );
    return true;
  };

  const markAsPaid = async (id: string, paidAmount?: number): Promise<boolean> => {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('transactions')
      .update({
        status: 'paid',
        paid_amount: paidAmount ?? null,
        paid_at: now,
        updated_at: now,
      })
      .eq('id', id);

    if (error) {
      console.error('Error marking as paid:', error);
      return false;
    }
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: 'paid' as const,
              paid_amount: paidAmount ?? t.paid_amount,
              paid_at: now,
            }
          : t
      )
    );
    return true;
  };

  const markGroupAsPaid = async (groupName: string): Promise<boolean> => {
    const pendingInGroup = transactions.filter(
      (t) => t.group === groupName && t.status === 'pending'
    );
    let success = true;
    for (const t of pendingInGroup) {
      const ok = await markAsPaid(t.id, t.expected_amount);
      if (!ok) success = false;
    }
    return success;
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting transaction:', error);
      return false;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    return true;
  };

  // --- Derived data ---

  const summary: MonthlySummary = {
    pending_total: transactions
      .filter((t) => t.status === 'pending' && t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.expected_amount), 0),
    paid_total: transactions
      .filter((t) => t.status === 'paid' && t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.paid_amount ?? t.expected_amount), 0),
    income_total: transactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + Number(t.paid_amount ?? t.expected_amount), 0),
    expected_balance: 0, // computed below
  };
  summary.expected_balance = summary.income_total - summary.pending_total;

  const pendingTransactions = transactions.filter((t) => t.status === 'pending');
  const paidTransactions = transactions.filter((t) => t.status === 'paid');

  const groupedTransactions: TransactionGroup[] = [
    ...new Set(transactions.map((t) => t.group)),
  ].map((groupName) => {
    const groupTransactions = transactions.filter((t) => t.group === groupName);
    return {
      name: groupName,
      transactions: groupTransactions,
      total: groupTransactions
        .filter((t) => t.status === 'pending' && t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.expected_amount), 0),
    };
  });

  return {
    transactions,
    pendingTransactions,
    paidTransactions,
    groupedTransactions,
    summary,
    loading,
    createTransaction,
    updateTransaction,
    markAsPaid,
    markGroupAsPaid,
    deleteTransaction,
    refresh: fetchTransactions,
  };
}
