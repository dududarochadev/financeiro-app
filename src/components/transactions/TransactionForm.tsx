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
import { Plus } from 'lucide-react';
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
  const [isRecurring, setIsRecurring] = useState(
    (transaction?.recurrence_type ?? 'none') === 'monthly'
  );
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
      recurrence_type: isRecurring && !installments ? 'monthly' : 'none',
      installment_total: installments ? parseInt(installments) : undefined,
      installment_current: installments ? 1 : undefined,
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
    setIsRecurring(false);
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

          {/* Recurring / Installment */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (e.target.checked) setInstallments('');
                }}
                className="rounded border-muted-foreground"
              />
              Mensal
            </label>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="number"
                min="2"
                max="999"
                value={installments}
                onChange={(e) => {
                  setInstallments(e.target.value);
                  if (e.target.value) setIsRecurring(false);
                }}
                placeholder="Parcelas"
                className="h-7 w-16 rounded border px-1 text-center text-sm"
              />
              <span>Parcelas</span>
            </label>
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
