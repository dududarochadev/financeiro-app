'use client';

import { ChevronDown } from 'lucide-react';
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
      <SelectTrigger className="w-auto max-w-[140px] border-0 bg-transparent p-0 text-sm font-medium shadow-none focus:ring-0 gap-1">
        <span className="truncate flex items-center gap-1.5">
          {selected && (
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: selected.color }}
            />
          )}
          <span className="truncate">{selected?.name ?? 'Carteira'}</span>
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
      </SelectTrigger>
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
