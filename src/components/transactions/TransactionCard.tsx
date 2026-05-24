'use client';

import { cn, formatCurrency, formatInstallment, formatDate } from '@/lib/utils';
import { Check, CheckCheck, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/types';

interface TransactionCardProps {
  transaction: Transaction;
  onTogglePaid: (id: string, paidAmount?: number) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export function TransactionCard({
  transaction,
  onTogglePaid,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isPending = transaction.status === 'pending';
  const isIncome = transaction.type === 'income';

  return (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-lg border p-3 transition-colors',
        isPending
          ? 'border-border bg-card'
          : 'border-transparent bg-muted/30 opacity-70',
        isIncome && 'border-l-4 border-l-emerald-400'
      )}
    >
      {/* Paid toggle */}
      <Button
        variant="ghost"
        size="icon-xs"
        className={cn(
          'shrink-0 rounded-full',
          isPending
            ? 'border-2 border-muted-foreground/30'
            : 'bg-emerald-500 text-white'
        )}
        onClick={() =>
          isPending
            ? onTogglePaid(transaction.id, transaction.expected_amount)
            : onTogglePaid(transaction.id, 0)
        }
        aria-label={isPending ? 'Marcar como pago' : 'Reabrir'}
      >
        {!isPending && <Check className="h-3 w-3" />}
      </Button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'truncate text-sm font-medium',
              isPending ? '' : 'line-through'
            )}
          >
            {transaction.title}
          </span>
          {transaction.installment_total && transaction.installment_total > 1 && (
            <Badge variant="outline" className="text-[10px]">
              {formatInstallment(
                transaction.installment_current ?? 0,
                transaction.installment_total
              )}
            </Badge>
          )}
          {transaction.recurrence_type === 'monthly' && !transaction.installment_total && (
            <Badge variant="secondary" className="text-[10px]">
              Recorrente
            </Badge>
          )}
        </div>

        {/* Group + tags */}
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{transaction.group}</span>
          {transaction.due_date && (
            <>
              <span>•</span>
              <span>Vence {formatDate(transaction.due_date)}</span>
            </>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className="flex flex-col items-end gap-1">
        <span
          className={cn(
            'text-sm font-semibold tabular-nums',
            isPending && isIncome && 'text-emerald-600',
            isPending && !isIncome && 'text-foreground',
            !isPending && 'text-muted-foreground line-through'
          )}
        >
          {isIncome ? '+' : '-'}
          {formatCurrency(Number(transaction.expected_amount))}
        </span>
        {transaction.status === 'paid' && transaction.paid_amount != null && transaction.paid_amount !== transaction.expected_amount && (
          <span className="text-[11px] text-muted-foreground tabular-nums">
            Pago: {formatCurrency(Number(transaction.paid_amount))}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onEdit(transaction)}
          aria-label="Editar"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onDelete(transaction.id)}
          aria-label="Excluir"
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
