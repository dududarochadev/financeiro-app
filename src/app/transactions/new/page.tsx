'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthProvider';
import { useMonth } from '@/hooks/useMonth';
import { useWallets } from '@/hooks/useWallets';
import { useTransactions } from '@/hooks/useTransactions';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function NewTransactionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { month, year } = useMonth();
  const { selectedWallet } = useWallets();
  const { createTransaction, refresh } = useTransactions({
    walletId: selectedWallet?.id,
    month,
    year,
  });

  if (!user || !selectedWallet) {
    router.push('/dashboard');
    return null;
  }

  const handleSubmit = async (input: any) => {
    const ok = await createTransaction(input);
    if (ok) {
      router.push('/dashboard');
    }
    return ok;
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <div className="mb-4">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1 text-muted-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>
      <TransactionForm
        walletId={selectedWallet.id}
        month={month}
        year={year}
        groups={[]}
        onSubmit={handleSubmit}
        trigger={
          <span />
        }
      />
    </div>
  );
}
