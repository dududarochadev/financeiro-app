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
  income_paid: number;
  income_pending: number;
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

  // Group transactions by (group, month) for the spreadsheet view (expense groups only)
  const groups = [...new Set(transactions.filter((t) => t.type === 'expense').map((t) => t.group))].sort();

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
      income_paid: monthTxs
        .filter((t) => t.type === 'income' && t.status === 'paid')
        .reduce((acc, t) => acc + Number(t.paid_amount ?? t.expected_amount), 0),
      income_pending: monthTxs
        .filter((t) => t.type === 'income' && t.status === 'pending')
        .reduce((acc, t) => acc + Number(t.expected_amount), 0),
      expected_balance: 0,
    };
  });

  monthlySummaries.forEach((s) => {
    s.expected_balance = s.income_total - s.pending_total;
  });

  // Group amounts by group x month (expenses only)
  const groupMonthMap = new Map<string, Map<number, { pending: number; paid: number }>>();

  // Separate income tracking per group x month
  const incomeMonthMap = new Map<string, Map<number, { pending: number; paid: number }>>();

  for (const tx of transactions) {
    const amount = Number(tx.expected_amount);

    if (tx.type === 'income') {
      if (!incomeMonthMap.has(tx.group)) {
        incomeMonthMap.set(tx.group, new Map());
      }
      const monthMap = incomeMonthMap.get(tx.group)!;
      if (!monthMap.has(tx.month)) {
        monthMap.set(tx.month, { pending: 0, paid: 0 });
      }
      const entry = monthMap.get(tx.month)!;
      if (tx.status === 'paid') {
        entry.paid += Number(tx.paid_amount ?? amount);
      } else {
        entry.pending += amount;
      }
    } else {
      // expense
      if (!groupMonthMap.has(tx.group)) {
        groupMonthMap.set(tx.group, new Map());
      }
      const monthMap = groupMonthMap.get(tx.group)!;
      if (!monthMap.has(tx.month)) {
        monthMap.set(tx.month, { pending: 0, paid: 0 });
      }
      const entry = monthMap.get(tx.month)!;
      if (tx.status === 'paid') {
        entry.paid += amount;
      } else {
        entry.pending += amount;
      }
    }
  }

  // Separate income groups (groups that have at least one income transaction)
  const incomeGroupsSet = new Set<string>();
  for (const tx of transactions) {
    if (tx.type === 'income') incomeGroupsSet.add(tx.group);
  }
  const incomeGroups = [...incomeGroupsSet].sort();

  // Recalculate yearTotal with separate income tracking
  const yearIncomePaid = [...incomeMonthMap.entries()].reduce((sum, [, monthMap]) => {
    return sum + [...monthMap.values()].reduce((s, e) => s + e.paid, 0);
  }, 0);
  const yearIncomePending = [...incomeMonthMap.entries()].reduce((sum, [, monthMap]) => {
    return sum + [...monthMap.values()].reduce((s, e) => s + e.pending, 0);
  }, 0);

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
    incomeGroups,
    incomeMonthMap,
    yearTotal,
    loading,
    refresh: fetchYear,
  };
}
