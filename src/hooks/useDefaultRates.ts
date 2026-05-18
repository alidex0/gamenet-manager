import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import * as local from '@/lib/localBackend';

export interface DefaultRates {
  pc: number;
  playstation: number;
  billiard: number;
}

export function useDefaultRates() {
  const [rates, setRates] = useState<DefaultRates>({ pc: 50000, playstation: 80000, billiard: 120000 });
  const [loading, setLoading] = useState(true);
  const { gameCenter, isLocalMode } = useAuth();

  const fetchRates = useCallback(async () => {
    if (isLocalMode) {
      setRates(local.getLocalGameCenter().default_rates);
      setLoading(false);
      return;
    }
    if (!gameCenter?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('game_centers').select('*').eq('id', gameCenter.id).single();
      if (error) throw error;
      if (data && (data as any).default_rates) setRates((data as any).default_rates);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, [gameCenter?.id, isLocalMode]);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const updateRates = async (newRates: DefaultRates) => {
    if (isLocalMode) {
      local.updateLocalGameCenter({ default_rates: newRates });
      setRates(newRates);
      toast.success('تعرفه‌های پیشفرض ذخیره شدند');
      return { success: true };
    }
    if (!gameCenter?.id) {
      toast.error('شناسه گیم نت یافت نشد');
      return { success: false };
    }
    try {
      const { error } = await supabase.from('game_centers')
        .update({ default_rates: newRates } as any).eq('id', gameCenter.id);
      if (error) throw error;
      setRates(newRates);
      toast.success('تعرفه‌های پیشفرض ذخیره شدند');
      return { success: true };
    } catch {
      toast.error('خطا در ذخیره تعرفه‌ها');
      return { success: false };
    }
  };

  return { rates, loading, updateRates, refetch: fetchRates };
}
