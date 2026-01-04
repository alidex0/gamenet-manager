import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface DefaultRates {
  pc: number;
  playstation: number;
  billiard: number;
}

export function useDefaultRates() {
  const [rates, setRates] = useState<DefaultRates>({
    pc: 50000,
    playstation: 80000,
    billiard: 120000,
  });
  const [loading, setLoading] = useState(true);
  const { gameCenter } = useAuth();

  const fetchRates = useCallback(async () => {
    if (!gameCenter?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('game_centers')
        .select('*')
        .eq('id', gameCenter.id)
        .single();

      if (error) throw error;

      if (data && (data as any).default_rates) {
        setRates((data as any).default_rates);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    } finally {
      setLoading(false);
    }
  }, [gameCenter?.id]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const updateRates = async (newRates: DefaultRates) => {
    if (!gameCenter?.id) {
      toast.error('شناسه گیم نت یافت نشد');
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('game_centers')
        .update({ default_rates: newRates } as any)
        .eq('id', gameCenter.id);

      if (error) throw error;

      setRates(newRates);
      toast.success('تعرفه‌های پیشفرض با موفقیت ذخیره شدند');
      return { success: true };
    } catch (error) {
      console.error('Error updating rates:', error);
      toast.error('خطا در ذخیره تعرفه‌ها');
      return { success: false };
    }
  };

  return {
    rates,
    loading,
    updateRates,
    refetch: fetchRates,
  };
}
