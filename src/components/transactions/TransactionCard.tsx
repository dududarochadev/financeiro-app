'use client';

import { useState } from 'react';
import { cn, formatCurrency, formatInstallment, formatDate } from '@/lib/utils';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RecurrenceScopeDialog } from '@/components/transactions/RecurrenceScopeDialog';
import type { Transaction, RecurrenceEditScope } from '@/lib/types';

interface TransactionCardProps {
  transaction: Transaction;
  onTogglePaid: (id: string, paidAmount?: number) => void;
  onMarkPending: (id: string) => void;
  onEdit: (transaction: Transaction, scope?: RecurrenceEditScope) => void;
  onDelete: (id: string, scope?: RecurrenceEditScope) => Promise<boolean>;
}

export function TransactionCard({
  transaction,
  onTogglePaid,
  onMarkPending,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  const isPending = transaction.status === 'pending';
  const isIncome = transaction.type === 'income';
  const isPartOfSeries = !!(transaction.template_id || (transaction.installment_total && transaction.installment_total > 1));

  const [showDeleteScope, setShowDeleteScope] = useState(false);
  const [showEditScope, setShowEditScope] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const handleDelete = async (scope: RecurrenceEditScope) => {
    setDeleting(true);
    const ok = await onDelete(transaction.id, scope);
    setDeleting(false);
    if (ok) setShowDeleteScope(false);
  };

  const handleEdit = async (scope: RecurrenceEditScope) => {
    setEditing(true);
    // For edits with scope, we just pass the scope info — parent handles it
    onEdit(transaction, scope);
    setEditing(false);
    setShowEditScope(false);
  };

  return (
    <>
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
              : onMarkPending(transaction.id)
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
            onClick={() => {
              if (isPartOfSeries) {
                setShowEditScope(true);
              } else {
                onEdit(transaction);
              }
            }}
            aria-label="Editar"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setShowDeleteScope(true)}
            aria-label="Excluir"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Delete Scope Dialog */}
      <RecurrenceScopeDialog
        open={showDeleteScope}
        onOpenChange={setShowDeleteScope}
        title="Excluir transação"
        description={isPartOfSeries
          ? 'Esta transação faz parte de uma série. Qual escopo deseja excluir?'
          : 'Tem certeza que deseja excluir esta transação?'
        }
        isPartOfSeries={isPartOfSeries}
        actionLabel="Excluir"
        onConfirm={handleDelete}
        loading={deleting}
      />

      {/* Edit Scope Dialog */}
      <RecurrenceScopeDialog
        open={showEditScope}
        onOpenChange={setShowEditScope}
        title="Editar transação"
        description="Esta transação faz parte de uma série. Qual escopo deseja editar?"
        isPartOfSeries={isPartOfSeries}
        actionLabel="Editar"
        onConfirm={handleEdit}
        loading={editing}
      />
    </>
  );
}
