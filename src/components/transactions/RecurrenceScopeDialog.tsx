'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { RecurrenceEditScope } from '@/lib/types';

interface RecurrenceScopeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isPartOfSeries: boolean;
  actionLabel?: string;
  onConfirm: (scope: RecurrenceEditScope) => void;
  loading?: boolean;
}

export function RecurrenceScopeDialog({
  open,
  onOpenChange,
  title,
  description,
  isPartOfSeries,
  actionLabel = 'Confirmar',
  onConfirm,
  loading = false,
}: RecurrenceScopeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {/* Option 1: This occurrence only */}
          <Button
            variant="outline"
            className="justify-start h-auto py-3 px-4"
            onClick={() => onConfirm('this')}
            disabled={loading}
          >
            <div className="text-left">
              <div className="font-medium">Apenas este registro</div>
              <div className="text-xs text-muted-foreground font-normal">
                A alteração será aplicada apenas a este mês
              </div>
            </div>
          </Button>

          {/* Option 2: This and future (only if part of a series) */}
          {isPartOfSeries && (
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => onConfirm('this_and_future')}
              disabled={loading}
            >
              <div className="text-left">
                <div className="font-medium">Este e futuros</div>
                <div className="text-xs text-muted-foreground font-normal">
                  Aplica a este registro e a todos os próximos meses
                </div>
              </div>
            </Button>
          )}

          {/* Option 3: All (only if part of a series) */}
          {isPartOfSeries && (
            <Button
              variant="outline"
              className="justify-start h-auto py-3 px-4 border-destructive/30 text-destructive hover:text-destructive hover:bg-destructive/5"
              onClick={() => onConfirm('all')}
              disabled={loading}
            >
              <div className="text-left">
                <div className="font-medium">Todos os registros</div>
                <div className="text-xs text-muted-foreground font-normal">
                  Incluindo registros passados e futuros
                </div>
              </div>
            </Button>
          )}

          <Button
            variant="ghost"
            className="mt-2"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
