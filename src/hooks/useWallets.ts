'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import type { Wallet, WalletInput } from '@/lib/types';

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchWallets = useCallback(async () => {
    if (!user) return;

    try {
      const res = await fetch('/api/wallets');
      if (!res.ok) throw new Error('Failed to fetch wallets');

      const data = await res.json();
      setWallets(data);
      if (!selectedWallet && data.length > 0) {
        setSelectedWallet(data[0]);
      }
    } catch (err) {
      console.error('Error fetching wallets:', err);
    }
    setLoading(false);
  }, [user, selectedWallet]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const createWallet = async (input: WalletInput): Promise<boolean> => {
    if (!user) return false;

    try {
      const res = await fetch('/api/wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        console.error('Error creating wallet:', await res.text());
        return false;
      }

      const data = await res.json();
      setWallets((prev) => [...prev, data]);
      setSelectedWallet(data);
      return true;
    } catch (err) {
      console.error('Error creating wallet:', err);
      return false;
    }
  };

  const updateWallet = async (id: string, input: WalletInput): Promise<boolean> => {
    try {
      const res = await fetch('/api/wallets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...input }),
      });

      if (!res.ok) {
        console.error('Error updating wallet:', await res.text());
        return false;
      }

      const data = await res.json();
      setWallets((prev) => prev.map((w) => (w.id === id ? data : w)));
      if (selectedWallet?.id === id) {
        setSelectedWallet(data);
      }
      return true;
    } catch (err) {
      console.error('Error updating wallet:', err);
      return false;
    }
  };

  const deleteWallet = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/wallets?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        console.error('Error deleting wallet:', await res.text());
        return false;
      }

      setWallets((prev) => prev.filter((w) => w.id !== id));
      if (selectedWallet?.id === id) {
        setSelectedWallet(wallets.find((w) => w.id !== id) ?? null);
      }
      return true;
    } catch (err) {
      console.error('Error deleting wallet:', err);
      return false;
    }
  };

  const switchWallet = (wallet: Wallet) => {
    setSelectedWallet(wallet);
  };

  return {
    wallets,
    selectedWallet,
    loading,
    createWallet,
    updateWallet,
    deleteWallet,
    switchWallet,
    refresh: fetchWallets,
  };
}
