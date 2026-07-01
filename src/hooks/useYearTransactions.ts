'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';

interface YearTransaction {
  id: string;
  title: string;
  type: 'expense' | 'income';
  group: string;
  expected_amount: number;
  paid_amount: number | null;
  status: 'pending' | 'paid' | 'cancelled';
  month: number;
  year: number;
  due_date: string | null;
  installment_current: number | null;
  installment_total: number | null;
  recurrence_type: string;
  template_id: string | null;
}

interface YearMonthSummary {
  month: number;
  pending_total: number;
  paid_total: number;
  income_total: number;
  expected_balance: number;
}

export function useYearTransactions(walletId: string | undefined, year: number) {
  const [transactions, setTransactions] = useState<YearTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchYear = useCallback(async () => {
    if (!user || !walletId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const results: YearTransaction[] = [];

    // Fetch all months in parallel
    const promises = [];
    for (let m = 1; m <= 12; m++) {
      promises.push(
        fetch(`/api/transactions?wallet_id=${walletId}&month=${m}&year=${year}`)
          .then((res) => res.ok ? res.json() : [])
          .then((data) => results.push(...data))
      );
    }

    await Promise.all(promises);
    setTransactions(results);
    setLoading(false);
  }, [user, walletId, year]);

  useEffect(() => {
    fetchYear();
  }, [fetchYear]);

  // Group transactions by (group, month) for the spreadsheet view
  const groups = [...new Set(transactions.map((t) => t.group))].sort();

  const monthlySummaries: YearMonthSummary[] = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const monthTxs = transactions.filter((t) => t.month === month);

    return {
      month,
      pending_total: monthTxs
        .filter((t) => t.status === 'pending' && t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.expected_amount), 0),
      paid_total: monthTxs
        .filter((t) => t.status === 'paid' && t.type === 'expense')
        .reduce((acc, t) => acc + Number(t.paid_amount ?? t.expected_amount), 0),
      income_total: monthTxs
        .filter((t) => t.type === 'income')
        .reduce((acc, t) => acc + Number(t.paid_amount ?? t.expected_amount), 0),
      expected_balance: 0,
    };
  });

  monthlySummaries.forEach((s) => {
    s.expected_balance = s.income_total - s.pending_total;
  });

  // Group amounts by group x month
  const groupMonthMap = new Map<string, Map<number, { pending: number; paid: number; income: number }>>();

  for (const tx of transactions) {
    if (!groupMonthMap.has(tx.group)) {
      groupMonthMap.set(tx.group, new Map());
    }
    const monthMap = groupMonthMap.get(tx.group)!;
    if (!monthMap.has(tx.month)) {
      monthMap.set(tx.month, { pending: 0, paid: 0, income: 0 });
    }
    const entry = monthMap.get(tx.month)!;
    const amount = Number(tx.expected_amount);
    if (tx.type === 'income') {
      entry.income += amount;
    } else if (tx.status === 'paid') {
      entry.paid += amount;
    } else {
      entry.pending += amount;
    }
  }

  const yearTotal = {
    pending: monthlySummaries.reduce((s, m) => s + m.pending_total, 0),
    paid: monthlySummaries.reduce((s, m) => s + m.paid_total, 0),
    income: monthlySummaries.reduce((s, m) => s + m.income_total, 0),
  };

  return {
    transactions,
    groups,
    monthlySummaries,
    groupMonthMap,
    yearTotal,
    loading,
    refresh: fetchYear,
  };
}
