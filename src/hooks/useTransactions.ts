'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import type { Transaction, TransactionInput, MonthlySummary, TransactionGroup, RecurrenceEditScope } from '@/lib/types';

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

  const fetchTransactions = useCallback(async () => {
    if (!user || !walletId) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams({
        wallet_id: walletId,
        month: String(month),
        year: String(year),
      });
      if (status) params.set('status', status);

      const res = await fetch(`/api/transactions?${params}`);
      if (!res.ok) throw new Error('Failed to fetch transactions');

      const data = await res.json();
      setTransactions(data as Transaction[]);
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
    setLoading(false);
  }, [user, walletId, month, year, status]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const createTransaction = async (input: TransactionInput): Promise<boolean> => {
    if (!user) return false;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        console.error('Error creating transaction:', await res.text());
        return false;
      }

      await fetchTransactions();
      return true;
    } catch (err) {
      console.error('Error creating transaction:', err);
      return false;
    }
  };

  const updateTransaction = async (id: string, input: Partial<TransactionInput>): Promise<boolean> => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...input }),
      });

      if (!res.ok) {
        console.error('Error updating transaction:', await res.text());
        return false;
      }

      setTransactions((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...input } as Transaction : t))
      );
      return true;
    } catch (err) {
      console.error('Error updating transaction:', err);
      return false;
    }
  };

  const markAsPaid = async (id: string, paidAmount?: number): Promise<boolean> => {
    const now = new Date().toISOString();

    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'paid',
          paid_amount: paidAmount ?? null,
          paid_at: now,
        }),
      });

      if (!res.ok) {
        console.error('Error marking as paid:', await res.text());
        return false;
      }

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: 'paid' as const, paid_amount: paidAmount ?? t.paid_amount, paid_at: now }
            : t
        )
      );
      return true;
    } catch (err) {
      console.error('Error marking as paid:', err);
      return false;
    }
  };

  const markAsPending = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status: 'pending',
          paid_amount: null,
          paid_at: null,
        }),
      });

      if (!res.ok) {
        console.error('Error marking as pending:', await res.text());
        return false;
      }

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === id
            ? { ...t, status: 'pending' as const, paid_amount: null, paid_at: null }
            : t
        )
      );
      return true;
    } catch (err) {
      console.error('Error marking as pending:', err);
      return false;
    }
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
    try {
      const res = await fetch(`/api/transactions?id=${id}&scope=this`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Error deleting transaction:', await res.text());
        return false;
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting transaction:', err);
      return false;
    }
  };

  const deleteTransactionScope = async (id: string, scope: RecurrenceEditScope): Promise<boolean> => {
    try {
      const res = await fetch(`/api/transactions?id=${id}&scope=${scope}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Error deleting scope:', await res.text());
        return false;
      }

      await fetchTransactions();
      return true;
    } catch (err) {
      console.error('Error deleting scope:', err);
      return false;
    }
  };

  const updateTransactionScope = async (id: string, scope: RecurrenceEditScope, input: Partial<TransactionInput>): Promise<boolean> => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, scope, ...input }),
      });

      if (!res.ok) {
        console.error('Error updating scope:', await res.text());
        return false;
      }

      await fetchTransactions();
      return true;
    } catch (err) {
      console.error('Error updating scope:', err);
      return false;
    }
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
    expected_balance: 0,
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
    updateTransactionScope,
    markAsPaid,
    markAsPending,
    markGroupAsPaid,
    deleteTransaction,
    deleteTransactionScope,
    refresh: fetchTransactions,
  };
}
