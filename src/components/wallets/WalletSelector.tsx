'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import type { Wallet } from '@/lib/types';
import { Plus } from 'lucide-react';

interface WalletSelectorProps {
  wallets: Wallet[];
  selected: Wallet | null;
  onChange: (wallet: Wallet) => void;
  onAddWallet: () => void;
}

export function WalletSelector({
  wallets,
  selected,
  onChange,
  onAddWallet,
}: WalletSelectorProps) {
  return (
    <Select
      value={selected?.id ?? ''}
      onValueChange={(value) => {
        if (value === '__add__') {
          onAddWallet();
        } else {
          const wallet = wallets.find((w) => w.id === value);
          if (wallet) onChange(wallet);
        }
      }}
    >
      {/* Icon-only trigger — the chevron is rendered by SelectTrigger itself */}
      <SelectTrigger
        size="sm"
        aria-label={selected ? `Carteira: ${selected.name}` : 'Selecionar carteira'}
        className="w-8 shrink-0 justify-center gap-0 border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-muted hover:text-foreground focus:ring-0 dark:bg-transparent dark:hover:bg-muted/50"
      />
      <SelectContent>
        {wallets.map((wallet) => (
          <SelectItem key={wallet.id} value={wallet.id}>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: wallet.color }}
              />
              {wallet.name}
            </div>
          </SelectItem>
        ))}
        <SelectItem value="__add__" className="text-muted-foreground">
          <div className="flex items-center gap-2">
            <Plus className="h-3 w-3" />
            Nova carteira
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
