'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus, InfinityIcon } from 'lucide-react';
import type { Transaction, TransactionInput, TransactionType } from '@/lib/types';

interface TransactionFormProps {
  walletId: string;
  month: number;
  year: number;
  transaction?: Transaction | null;
  groups: string[];
  onSubmit: (input: TransactionInput) => Promise<boolean>;
  trigger?: React.ReactNode;
}

type RecurrenceMode = 'none' | 'installments' | 'monthly';

const DEFAULT_GROUPS = [
  'Alimentação',
  'Assinaturas',
  'Cartão de Crédito',
  'Casa',
  'Educação',
  'Lazer',
  'Moradia',
  'Saúde',
  'Supermercado',
  'Transporte',
  'Outros',
];

export function TransactionForm({
  walletId,
  month,
  year,
  transaction,
  groups,
  onSubmit,
  trigger,
}: TransactionFormProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(transaction?.type ?? 'expense');
  const [title, setTitle] = useState(transaction?.title ?? '');
  const [description, setDescription] = useState(transaction?.description ?? '');
  const [amount, setAmount] = useState(
    transaction ? String(transaction.expected_amount) : ''
  );
  const [group, setGroup] = useState(transaction?.group ?? 'Outros');
  const [customGroup, setCustomGroup] = useState('');
  const [dueDate, setDueDate] = useState(transaction?.due_date ?? '');

  // Recurrence mode: 'none' | 'installments' | 'monthly'
  const initialMode: RecurrenceMode =
    transaction?.installment_total && transaction.installment_total > 1
      ? 'installments'
      : transaction?.recurrence_type === 'monthly'
        ? 'monthly'
        : 'none';
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode>(initialMode);
  const [installments, setInstallments] = useState(
    transaction?.installment_total ? String(transaction.installment_total) : ''
  );
  const [loading, setLoading] = useState(false);

  const allGroups = [...new Set([...DEFAULT_GROUPS, ...groups])];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    setLoading(true);

    const finalGroup = group === '__custom__' ? customGroup.trim() : group;

    const input: TransactionInput = {
      wallet_id: walletId,
      type,
      title: title.trim(),
      description: description.trim() || undefined,
      expected_amount: parseFloat(amount.replace(',', '.')),
      group: finalGroup || 'Outros',
      due_date: dueDate || undefined,
      month,
      year,
      recurrence_type: recurrenceMode === 'monthly' ? 'monthly' : 'none',
      installment_total: recurrenceMode === 'installments' && installments ? parseInt(installments) : undefined,
      installment_current: recurrenceMode === 'installments' && installments ? 1 : undefined,
    };

    const ok = await onSubmit(input);
    setLoading(false);

    if (ok) {
      setOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setType('expense');
    setTitle('');
    setDescription('');
    setAmount('');
    setGroup('Outros');
    setCustomGroup('');
    setDueDate('');
    setRecurrenceMode('none');
    setInstallments('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="contents">{trigger}</span>
      ) : (
        <Button className="flex-1 gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova transação
        </Button>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {transaction ? 'Editar transação' : 'Nova transação'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === 'expense' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setType('expense')}
            >
              Despesa
            </Button>
            <Button
              type="button"
              variant={type === 'income' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setType('income')}
            >
              Receita
            </Button>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Netflix, Salário..."
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              required
            />
          </div>

          {/* Group */}
          <div className="space-y-2">
            <Label>Grupo</Label>
            <Select value={group} onValueChange={(v) => v && setGroup(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um grupo" />
              </SelectTrigger>
              <SelectContent>
                {allGroups.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Outro (digitar)</SelectItem>
              </SelectContent>
            </Select>
            {group === '__custom__' && (
              <Input
                value={customGroup}
                onChange={(e) => setCustomGroup(e.target.value)}
                placeholder="Nome do grupo"
                className="mt-1"
              />
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Vencimento (opcional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Recurrence Mode */}
          <div className="space-y-2">
            <Label>Recorrência</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => { setRecurrenceMode('none'); setInstallments(''); }}
                className={`rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors ${
                  recurrenceMode === 'none'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="text-sm">Avulso</div>
                <div className="mt-0.5 text-[10px] opacity-70">Uma vez</div>
              </button>

              <button
                type="button"
                onClick={() => { setRecurrenceMode('installments'); }}
                className={`rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors ${
                  recurrenceMode === 'installments'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="text-sm">Parcelado</div>
                <div className="mt-0.5 text-[10px] opacity-70">Nº fixo</div>
              </button>

              <button
                type="button"
                onClick={() => { setRecurrenceMode('monthly'); setInstallments(''); }}
                className={`rounded-lg border px-3 py-2 text-center text-xs font-medium transition-colors ${
                  recurrenceMode === 'monthly'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="text-sm">Mensal</div>
                <div className="mt-0.5 text-[10px] opacity-70">Sem fim</div>
              </button>
            </div>

            {recurrenceMode === 'installments' && (
              <div className="mt-2">
                <Label htmlFor="installments" className="text-xs">Número de parcelas</Label>
                <Input
                  id="installments"
                  type="number"
                  min="2"
                  max="999"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  placeholder="Ex: 12"
                  className="mt-1"
                />
              </div>
            )}

            {recurrenceMode === 'monthly' && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <InfinityIcon className="h-3 w-3" />
                <span>Repete todo mês — gerei 60 parcelas (5 anos). Novos meses serão criados automaticamente.</span>
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? 'Salvando...'
              : transaction
                ? 'Salvar alterações'
                : 'Adicionar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
