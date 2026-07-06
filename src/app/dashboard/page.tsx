'use client';

import { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Wallet, Plus, Eye, EyeOff, Table2, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction, TransactionInput, RecurrenceEditScope } from '@/lib/types';

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
    updateTransactionScope,
    markAsPaid,
    markAsPending,
    markGroupAsPaid,
    deleteTransaction,
    deleteTransactionScope,
    refresh,
  } = useTransactions({
    walletId: selectedWallet?.id,
    month,
    year,
  });

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingScope, setEditingScope] = useState<RecurrenceEditScope | undefined>(undefined);
  const [editGroup, setEditGroup] = useState('');
  const [editCustomGroup, setEditCustomGroup] = useState('');
  const [showPaid, setShowPaid] = useState(false);
  const [payingGroup, setPayingGroup] = useState<string | null>(null);
  const [showWalletForm, setShowWalletForm] = useState(false);

  // Collect unique groups (sorted alphabetically for consistent ordering)
  const groups = [
    ...new Set([
      ...pendingTransactions.map((t) => t.group),
      ...paidTransactions.map((t) => t.group),
    ]),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR'));

  // Group pending transactions (sorted alphabetically for consistent ordering)
  const pendingGroups = [
    ...new Set(pendingTransactions.map((t) => t.group)),
  ].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((groupName) => ({
    name: groupName,
    transactions: pendingTransactions.filter((t) => t.group === groupName),
    total: pendingTransactions
      .filter((t) => t.group === groupName && t.type === 'expense')
      .reduce((acc, t) => acc + Number(t.expected_amount), 0),
  }));

  const handleEdit = (tx: Transaction, scope?: RecurrenceEditScope) => {
    setEditingTx(tx);
    setEditingScope(scope);
    setEditGroup(tx.group);
    setEditCustomGroup('');
  };

  const handleEditSubmit = async (input: TransactionInput) => {
    if (!editingTx) return false;
    const finalGroup = editGroup === '__custom__' ? editCustomGroup.trim() : editGroup;
    let ok: boolean;
    if (editingScope) {
      ok = await updateTransactionScope(editingTx.id, editingScope, { ...input, group: finalGroup || editingTx.group });
    } else {
      ok = await updateTransaction(editingTx.id, { ...input, group: finalGroup || editingTx.group });
    }
    if (ok) {
      setEditingTx(null);
      setEditingScope(undefined);
    }
    return ok;
  };

  const handleDelete = async (id: string, scope?: RecurrenceEditScope): Promise<boolean> => {
    if (scope) {
      return deleteTransactionScope(id, scope);
    }
    return deleteTransaction(id);
  };

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
              <TransactionForm
                walletId={selectedWallet.id}
                month={month}
                year={year}
                groups={groups}
                onSubmit={createTransaction}
                trigger={
                  <Button className="flex-1 gap-2" variant="default">
                    <Plus className="h-4 w-4" />
                    Nova transação
                  </Button>
                }
              />
              <Button
                className="flex-1 gap-2"
                variant="outline"
                onClick={() => router.push('/year-overview')}
              >
                <Table2 className="h-4 w-4" />
                Visão anual
              </Button>
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
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{group.name}</span>
                        <button
                          onClick={async () => {
                            setPayingGroup(group.name);
                            const ok = await markGroupAsPaid(group.name);
                            setPayingGroup(null);
                            if (ok) {
                              toast.success(`Grupo "${group.name}" pago!`);
                              await refresh();
                            } else {
                              toast.error('Erro ao pagar grupo');
                            }
                          }}
                          disabled={payingGroup === group.name}
                          className="inline-flex items-center justify-center rounded-full p-0.5 text-emerald-500 transition-colors hover:text-emerald-400 disabled:opacity-50"
                          title="Pagar grupo"
                        >
                          {payingGroup === group.name ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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
                          onMarkPending={markAsPending}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
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
                      onMarkPending={markAsPending}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
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
                <Select
                  value={editGroup}
                  onValueChange={(v) => v && setEditGroup(v)}
                >
                  <SelectTrigger id="edit-group">
                    <SelectValue placeholder="Selecione um grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">Outro (digitar)</SelectItem>
                  </SelectContent>
                </Select>
                {editGroup === '__custom__' && (
                  <Input
                    value={editCustomGroup}
                    onChange={(e) => setEditCustomGroup(e.target.value)}
                    placeholder="Nome do novo grupo"
                    className="mt-1"
                  />
                )}
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
