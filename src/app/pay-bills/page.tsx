'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthProvider';
import { Header } from '@/components/layout/Header';
import { WalletForm } from '@/components/wallets/WalletForm';
import { useMonth } from '@/hooks/useMonth';
import { useWallets } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatMonthYear, formatInstallment } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, CheckCheck, ArrowLeft, PartyPopper, Loader2 } from 'lucide-react';
import type { TransactionGroup, Transaction } from '@/lib/types';
import { toast } from 'sonner';

export default function PayBillsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { month, year, goToPreviousMonth, goToNextMonth } = useMonth();
  const { wallets, selectedWallet, loading: walletsLoading, createWallet, switchWallet } = useWallets();
  const {
    pendingTransactions,
    groupedTransactions,
    summary,
    loading: txLoading,
    markAsPaid,
    markGroupAsPaid,
    refresh,
  } = useTransactions({
    walletId: selectedWallet?.id,
    month,
    year,
    status: 'pending',
  });

  const [payingGroup, setPayingGroup] = useState<string | null>(null);
  const [payingItem, setPayingItem] = useState<string | null>(null);

  const handlePayGroup = async (groupName: string) => {
    setPayingGroup(groupName);
    const ok = await markGroupAsPaid(groupName);
    setPayingGroup(null);
    if (ok) {
      toast.success(`Grupo "${groupName}" pago com sucesso!`);
      await refresh();
    } else {
      toast.error('Erro ao pagar grupo');
    }
  };

  const handlePayItem = async (tx: Transaction) => {
    setPayingItem(tx.id);
    const ok = await markAsPaid(tx.id, tx.expected_amount);
    setPayingItem(null);
    if (ok) {
      toast.success(`"${tx.title}" pago!`);
      await refresh();
    } else {
      toast.error('Erro ao pagar item');
    }
  };

  const allPaid = pendingTransactions.length === 0;

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
        month={month}
        year={year}
        wallet={selectedWallet}
        wallets={wallets}
        onPreviousMonth={goToPreviousMonth}
        onNextMonth={goToNextMonth}
        onWalletChange={switchWallet}
        onAddWallet={() => {}}
      />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-4 pb-24">
        {/* Back button */}
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
            <h1 className="text-lg font-bold">Pagar Contas</h1>
            <p className="text-xs text-muted-foreground">{formatMonthYear(month, year)}</p>
          </div>
          <div className="w-[72px]" /> {/* spacer */}
        </div>

        {/* Balance summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total a pagar</span>
              <span className="text-xl font-bold text-red-500 tabular-nums">
                {formatCurrency(summary.pending_total)}
              </span>
            </div>
            {summary.income_total > 0 && (
              <div className="mt-1 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saldo restante</span>
                <span className={`text-base font-semibold tabular-nums ${
                  summary.expected_balance >= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}>
                  {formatCurrency(summary.expected_balance)}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {allPaid ? (
          /* Completion State 🎉 */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4">
              <PartyPopper className="h-16 w-16 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold">Tudo pago! 🎉</h2>
            <p className="mt-2 text-muted-foreground">
              Todas as contas de {formatMonthYear(month, year)} estão em dia.
            </p>
            <Button
              className="mt-6"
              onClick={() => router.push('/dashboard')}
            >
              Voltar ao início
            </Button>
          </div>
        ) : txLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          /* Grouped pending items */
          <div className="space-y-4">
            {groupedTransactions
              .filter((g) => g.transactions.some((t) => t.status === 'pending' && t.type === 'expense'))
              .map((group) => {
                const pendingExpenses = group.transactions.filter(
                  (t) => t.status === 'pending' && t.type === 'expense'
                );
                const groupTotal = pendingExpenses.reduce(
                  (acc, t) => acc + Number(t.expected_amount), 0
                );

                if (pendingExpenses.length === 0) return null;

                return (
                  <Card key={group.name} className="overflow-hidden">
                    {/* Group Header */}
                    <div className="flex items-center justify-between bg-muted/50 px-4 py-3">
                      <div>
                        <h3 className="font-semibold">{group.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {pendingExpenses.length} {pendingExpenses.length === 1 ? 'item' : 'itens'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold tabular-nums text-red-500">
                          {formatCurrency(groupTotal)}
                        </p>
                        <Button
                          size="sm"
                          className="mt-1 h-7 gap-1 text-xs"
                          onClick={() => handlePayGroup(group.name)}
                          disabled={payingGroup === group.name}
                        >
                          {payingGroup === group.name ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                          Pagar grupo
                        </Button>
                      </div>
                    </div>

                    {/* Group Items */}
                    <div className="divide-y">
                      {pendingExpenses.map((tx) => (
                        <div
                          key={tx.id}
                          className="flex items-center justify-between px-4 py-2.5 transition-colors hover:bg-muted/20"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {tx.title}
                              </span>
                              {tx.installment_total && tx.installment_total > 1 && (
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                  {tx.installment_current}/{tx.installment_total}
                                </span>
                              )}
                            </div>
                            {tx.due_date && (
                              <p className="text-xs text-muted-foreground">
                                Vence {new Date(tx.due_date).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 pl-3">
                            <span className="text-sm font-semibold tabular-nums">
                              {formatCurrency(Number(tx.expected_amount))}
                            </span>
                            <Button
                              variant="outline"
                              size="icon-xs"
                              className="shrink-0 rounded-full border-emerald-300 text-emerald-600 hover:bg-emerald-50"
                              onClick={() => handlePayItem(tx)}
                              disabled={payingItem === tx.id}
                            >
                              {payingItem === tx.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCheck className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                );
              })}
          </div>
        )}

        {/* Keyboard shortcut hint */}
        <p className="text-center text-xs text-muted-foreground">
          Toque no botão verde para pagar um item individualmente
        </p>
      </main>
    </div>
  );
}
