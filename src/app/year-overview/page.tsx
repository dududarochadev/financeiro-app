'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthProvider';
import { Header } from '@/components/layout/Header';
import { useMonth } from '@/hooks/useMonth';
import { useWallets } from '@/hooks/useWallets';
import { useYearTransactions } from '@/hooks/useYearTransactions';
import { formatCurrency, getMonthNameShort } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ChevronLeft, ChevronRight, TableIcon } from 'lucide-react';

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function YearOverviewPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { year, goToPreviousYear, goToNextYear } = useMonth();
  const { wallets, selectedWallet, loading: walletsLoading, createWallet, switchWallet } = useWallets();
  const {
    groups,
    monthlySummaries,
    groupMonthMap,
    yearTotal,
    loading: txLoading,
  } = useYearTransactions(selectedWallet?.id, year);

  if (authLoading || walletsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        month={1}
        year={year}
        wallet={selectedWallet}
        wallets={wallets}
        onPreviousMonth={goToPreviousYear}
        onNextMonth={goToNextYear}
        onWalletChange={switchWallet}
        onAddWallet={() => {}}
      />

      <main className="mx-auto w-full max-w-5xl flex-1 space-y-4 px-4 py-4 pb-24">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold">Visão Anual</h1>
            <p className="text-xs text-muted-foreground">Planilha de {year}</p>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon-xs" onClick={goToPreviousYear}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="w-16 text-center text-sm font-semibold">{year}</span>
            <Button variant="outline" size="icon-xs" onClick={goToNextYear}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {!selectedWallet ? (
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <p className="text-muted-foreground">Selecione uma carteira para ver a visão anual.</p>
          </div>
        ) : txLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-muted border-t-primary" />
          </div>
        ) : (
          <>
            {/* Year summary cards */}
            <div className="grid grid-cols-3 gap-2">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total despesas</p>
                  <p className="text-lg font-bold tabular-nums text-red-500">
                    {formatCurrency(yearTotal.pending + yearTotal.paid)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total receitas</p>
                  <p className="text-lg font-bold tabular-nums text-emerald-600">
                    {formatCurrency(yearTotal.income)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-muted-foreground">Saldo anual</p>
                  <p className={`text-lg font-bold tabular-nums ${
                    yearTotal.income - yearTotal.pending - yearTotal.paid >= 0
                      ? 'text-emerald-600'
                      : 'text-red-500'
                  }`}>
                    {formatCurrency(yearTotal.income - yearTotal.pending - yearTotal.paid)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Monthly summaries row */}
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="sticky left-0 bg-muted/50 px-3 py-2 font-semibold text-muted-foreground min-w-[140px]">
                      Grupo
                    </th>
                    {MONTHS.map((m) => (
                      <th key={m} className="px-2 py-2 text-right font-semibold text-muted-foreground text-xs min-w-[80px]">
                        {getMonthNameShort(m)}
                      </th>
                    ))}
                    <th className="px-3 py-2 text-right font-semibold text-muted-foreground text-xs min-w-[90px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* Income row */}
                  <tr className="bg-emerald-50/40">
                    <td className="sticky left-0 bg-emerald-50/40 px-3 py-2 font-medium text-emerald-700 text-xs">
                      💰 Receitas
                    </td>
                    {MONTHS.map((m) => {
                      const total = monthlySummaries[m - 1].income_total;
                      return (
                        <td key={m} className={`px-2 py-2 text-right tabular-nums text-xs ${
                          total > 0 ? 'text-emerald-600 font-medium' : 'text-muted-foreground'
                        }`}>
                          {total > 0 ? formatCurrency(total) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold text-emerald-700">
                      {formatCurrency(yearTotal.income)}
                    </td>
                  </tr>

                  {/* Group rows */}
                  {groups.map((group) => {
                    const monthMap = groupMonthMap.get(group);
                    let groupTotal = 0;
                    return (
                      <tr key={group} className="hover:bg-muted/20">
                        <td className="sticky left-0 bg-card px-3 py-2 font-medium text-xs truncate max-w-[140px]">
                          {group}
                        </td>
                        {MONTHS.map((m) => {
                          const entry = monthMap?.get(m);
                          const pending = entry?.pending ?? 0;
                          const paid = entry?.paid ?? 0;
                          const total = pending + paid;
                          groupTotal += total;

                          if (total === 0) {
                            return (
                              <td key={m} className="px-2 py-2 text-right text-muted-foreground/40 text-xs">
                                -
                              </td>
                            );
                          }

                          if (paid > 0 && pending === 0) {
                            return (
                              <td key={m} className="px-2 py-2 text-right tabular-nums text-xs text-emerald-600 line-through">
                                {formatCurrency(total)}
                              </td>
                            );
                          }

                          return (
                            <td key={m} className="px-2 py-2 text-right tabular-nums text-xs font-medium">
                              {formatCurrency(total)}
                            </td>
                          );
                        })}
                        <td className="px-3 py-2 text-right tabular-nums text-xs font-semibold">
                          {groupTotal > 0 ? formatCurrency(groupTotal) : '-'}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Total per month row */}
                  <tr className="border-t-2 border-border bg-muted/30 font-semibold">
                    <td className="sticky left-0 bg-muted/30 px-3 py-2 text-xs font-bold">
                      Total despesas
                    </td>
                    {MONTHS.map((m) => {
                      const total = monthlySummaries[m - 1].pending_total + monthlySummaries[m - 1].paid_total;
                      return (
                        <td key={m} className={`px-2 py-2 text-right tabular-nums text-xs font-bold ${
                          total > 0 ? 'text-red-600' : 'text-muted-foreground'
                        }`}>
                          {total > 0 ? formatCurrency(total) : '-'}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right tabular-nums text-xs font-bold text-red-600">
                      {formatCurrency(yearTotal.pending + yearTotal.paid)}
                    </td>
                  </tr>

                  {/* Balance per month */}
                  <tr>
                    <td className="sticky left-0 bg-card px-3 py-2 text-xs font-bold">
                      Saldo
                    </td>
                    {MONTHS.map((m) => {
                      const balance = monthlySummaries[m - 1].expected_balance;
                      return (
                        <td key={m} className={`px-2 py-2 text-right tabular-nums text-xs font-bold ${
                          balance >= 0 ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {formatCurrency(balance)}
                        </td>
                      );
                    })}
                    <td className={`px-3 py-2 text-right tabular-nums text-xs font-bold ${
                      yearTotal.income - yearTotal.pending - yearTotal.paid >= 0
                        ? 'text-emerald-600' : 'text-red-500'
                    }`}>
                      {formatCurrency(yearTotal.income - yearTotal.pending - yearTotal.paid)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Valores riscados em verde = totalmente pago no mês
            </p>
          </>
        )}
      </main>
    </div>
  );
}
