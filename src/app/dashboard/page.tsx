'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthProvider';
import { Header } from '@/components/layout/Header';
import { WalletForm } from '@/components/wallets/WalletForm';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { useMonth } from '@/hooks/useMonth';
import { useWallets } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { formatCurrency, formatMonthYear } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, HandCoins, Plus, Filter, Eye, EyeOff } from 'lucide-react';
import type { Transaction, TransactionInput } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { month, year, goToPreviousMonth, goToNextMonth } = useMonth();
  const { wallets, selectedWallet, loading: walletsLoading, createWallet, switchWallet } = useWallets();
  const {
    pendingTransactions,
    paidTransactions,
    summary,
    loading: txLoading,
    createTransaction,
    updateTransaction,
    markAsPaid,
    deleteTransaction,
    refresh,
  } = useTransactions({
    walletId: selectedWallet?.id,
    month,
    year,
  });

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const [showWalletForm, setShowWalletForm] = useState(false);

  // Collect unique groups
  const groups = [
    ...new Set([
      ...pendingTransactions.map((t) => t.group),
      ...paidTransactions.map((t) => t.group),
    ]),
  ];

  // Group pending transactions
  const pendingGroups = [
    ...new Set(pendingTransactions.map((t) => t.group)),
  ].map((groupName) => ({
    name: groupName,
    transactions: pendingTransactions.filter((t) => t.group === groupName),
    total: pendingTransactions
      .filter((t) => t.group === groupName && t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.expected_amount), 0),
  }));

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
  };

  const handleEditSubmit = async (input: TransactionInput) => {
    if (!editingTx) return false;
    const ok = await updateTransaction(editingTx.id, input);
    if (ok) setEditingTx(null);
    return ok;
  };

  if (authLoading || walletsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
      </div>
    );
  }

  if (!user) return null;

  const allExpenses = [...pendingTransactions, ...(showPaid ? paidTransactions : [])];

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
        onAddWallet={() => setShowWalletForm(true)}
      />

      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-4 pb-24">
        {!selectedWallet ? (
          /* Empty state — no wallet */
          <div className="flex flex-col items-center justify-center gap-4 py-16">
            <Wallet className="h-12 w-12 text-muted-foreground/50" />
            <div className="text-center">
              <h2 className="text-lg font-semibold">Bem-vindo!</h2>
              <p className="text-sm text-muted-foreground">
                Crie sua primeira carteira para começar
              </p>
            </div>
            <WalletForm
              onSubmit={createWallet}
              trigger={<Button>Nova carteira</Button>}
            />
          </div>
        ) : (
          <>
            {/* Financial Summary */}
            <div className="grid grid-cols-2 gap-2">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">A pagar</p>
                  <p className="text-lg font-bold text-red-500 tabular-nums">
                    {formatCurrency(summary.pending_total)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Pago</p>
                  <p className="text-lg font-bold text-emerald-500 tabular-nums">
                    {formatCurrency(summary.paid_total)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-lg font-bold text-emerald-600 tabular-nums">
                    {formatCurrency(summary.income_total)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Saldo previsto</p>
                  <p className={`text-lg font-bold tabular-nums ${
                    summary.expected_balance >= 0 ? 'text-emerald-600' : 'text-red-500'
                  }`}>
                    {formatCurrency(summary.expected_balance)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                className="flex-1 gap-2"
                variant="default"
                onClick={() => router.push('/pay-bills')}
              >
                <HandCoins className="h-4 w-4" />
                Pagar contas
              </Button>
              <TransactionForm
                walletId={selectedWallet.id}
                month={month}
                year={year}
                groups={groups}
                onSubmit={createTransaction}
              />
            </div>

            <Separator />

            {/* Pending groups */}
            {pendingGroups.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Pendente
                </h3>
                {pendingGroups.map((group) => (
                  <div key={group.name} className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-sm font-medium">{group.name}</span>
                      <span className="text-sm font-semibold tabular-nums text-red-500">
                        {formatCurrency(group.total)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {group.transactions.map((tx) => (
                        <TransactionCard
                          key={tx.id}
                          transaction={tx}
                          onTogglePaid={markAsPaid}
                          onEdit={handleEdit}
                          onDelete={deleteTransaction}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* No pending items */}
            {pendingTransactions.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <div className="mb-3 text-4xl">🎉</div>
                <h3 className="text-lg font-semibold">Tudo pago!</h3>
                <p className="text-sm text-muted-foreground">
                  Nenhum item pendente para {formatMonthYear(month, year)}
                </p>
              </div>
            )}

            {/* Toggle paid items */}
            {paidTransactions.length > 0 && (
              <div className="flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground"
                  onClick={() => setShowPaid(!showPaid)}
                >
                  {showPaid ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  {showPaid
                    ? 'Esconder pagos'
                    : `Mostrar pagos (${paidTransactions.length})`}
                </Button>
              </div>
            )}

            {/* Paid items */}
            {showPaid && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Itens pagos
                </h3>
                <div className="space-y-1">
                  {paidTransactions.map((tx) => (
                    <TransactionCard
                      key={tx.id}
                      transaction={tx}
                      onTogglePaid={markAsPaid}
                      onEdit={handleEdit}
                      onDelete={deleteTransaction}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Wallet Form Dialog (triggered from Header) */}
      <Dialog open={showWalletForm} onOpenChange={setShowWalletForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova carteira</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const formData = new FormData(form);
              const ok = await createWallet({
                name: formData.get('name') as string,
                description: (formData.get('description') as string) || undefined,
              });
              if (ok) setShowWalletForm(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="wf-name">Nome</Label>
              <Input id="wf-name" name="name" placeholder="Ex: Pessoal" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-desc">Descrição (opcional)</Label>
              <Input id="wf-desc" name="description" placeholder="Opcional" />
            </div>
            <Button type="submit" className="w-full">Criar carteira</Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Transaction Dialog */}
      <Dialog open={!!editingTx} onOpenChange={(open) => !open && setEditingTx(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar transação</DialogTitle>
          </DialogHeader>
          {editingTx && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                await handleEditSubmit({
                  wallet_id: editingTx.wallet_id,
                  type: editingTx.type,
                  title: formData.get('title') as string,
                  expected_amount: parseFloat((formData.get('amount') as string).replace(',', '.')),
                  group: formData.get('group') as string || editingTx.group,
                  month: editingTx.month,
                  year: editingTx.year,
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  name="title"
                  defaultValue={editingTx.title}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-amount">Valor (R$)</Label>
                <Input
                  id="edit-amount"
                  name="amount"
                  type="text"
                  inputMode="decimal"
                  defaultValue={String(editingTx.expected_amount)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-group">Grupo</Label>
                <Input
                  id="edit-group"
                  name="group"
                  defaultValue={editingTx.group}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditingTx(null)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  Salvar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
