'use client';

import { useAuth } from './AuthProvider';
import { ThemeToggle } from './ThemeToggle';
import { Button } from '@/components/ui/button';
import { LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthYear } from '@/lib/utils';
import { WalletSelector } from '@/components/wallets/WalletSelector';
import type { Wallet } from '@/lib/types';

interface HeaderProps {
  month: number;
  year: number;
  wallet: Wallet | null;
  wallets: Wallet[];
  onPreviousMonth: () => void;
  onNextMonth: () => void;
  onWalletChange: (wallet: Wallet) => void;
  onAddWallet: () => void;
}

export function Header({
  month,
  year,
  wallet,
  wallets,
  onPreviousMonth,
  onNextMonth,
  onWalletChange,
  onAddWallet,
}: HeaderProps) {
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
        {/* Left: Wallet */}
        <div className="min-w-0 flex-1">
          <WalletSelector
            wallets={wallets}
            selected={wallet}
            onChange={onWalletChange}
            onAddWallet={onAddWallet}
          />
        </div>

        {/* Center: Month Nav */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onPreviousMonth}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[120px] text-center text-sm font-medium">
            {formatMonthYear(month, year)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNextMonth}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: Theme + Logout */}
        <div className="flex-1 flex items-center justify-end gap-0">
          <ThemeToggle />
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sair">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
