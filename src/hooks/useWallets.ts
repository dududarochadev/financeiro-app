'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';
import type { Wallet, WalletInput } from '@/lib/types';

export function useWallets() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const supabase = createClient();

  const fetchWallets = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('wallets')
      .select('*')
      .order('created_at', { ascending: true });

    if (data) {
      setWallets(data);
      if (!selectedWallet && data.length > 0) {
        setSelectedWallet(data[0]);
      }
    }
    setLoading(false);
  }, [user, supabase, selectedWallet]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const createWallet = async (input: WalletInput): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase
      .from('wallets')
      .insert({
        user_id: user.id,
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? '#6366f1',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating wallet:', error);
      return false;
    }
    if (data) {
      setWallets((prev) => [...prev, data]);
      setSelectedWallet(data);
    }
    return true;
  };

  const updateWallet = async (id: string, input: WalletInput): Promise<boolean> => {
    const { error } = await supabase
      .from('wallets')
      .update({
        name: input.name,
        description: input.description ?? null,
        color: input.color ?? '#6366f1',
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating wallet:', error);
      return false;
    }
    setWallets((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, ...input, color: input.color ?? w.color }
          : w
      )
    );
    if (selectedWallet?.id === id) {
      setSelectedWallet((prev) => prev ? { ...prev, ...input, color: input.color ?? prev.color } : null);
    }
    return true;
  };

  const deleteWallet = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('wallets')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting wallet:', error);
      return false;
    }
    setWallets((prev) => prev.filter((w) => w.id !== id));
    if (selectedWallet?.id === id) {
      setSelectedWallet(wallets.find((w) => w.id !== id) ?? null);
    }
    return true;
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
