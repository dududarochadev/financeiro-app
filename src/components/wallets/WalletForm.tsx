'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Plus } from 'lucide-react';
import type { Wallet, WalletInput } from '@/lib/types';

interface WalletFormProps {
  wallet?: Wallet | null;
  onSubmit: (input: WalletInput) => Promise<boolean>;
  trigger?: React.ReactNode;
}

export function WalletForm({ wallet, onSubmit, trigger }: WalletFormProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(wallet?.name ?? '');
  const [description, setDescription] = useState(wallet?.description ?? '');
  const [color, setColor] = useState(wallet?.color ?? '#6366f1');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const ok = await onSubmit({ name: name.trim(), description: description.trim() || undefined, color });
    setLoading(false);
    if (ok) {
      setOpen(false);
      setName('');
      setDescription('');
      setColor('#6366f1');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          {wallet ? 'Editar' : 'Nova carteira'}
        </Button>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{wallet ? 'Editar carteira' : 'Nova carteira'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Pessoal, Empresa..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border"
              />
              <span className="text-sm text-muted-foreground">{color}</span>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : wallet ? 'Salvar' : 'Criar carteira'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
