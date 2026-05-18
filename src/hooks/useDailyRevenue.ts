import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as local from '@/lib/localBackend';

export interface DailyRevenueStats {
  deviceRevenue: number;
  buffetRevenue: number;
  totalRevenue: number;
  transactionCount: number;
}

export function useDailyRevenue() {
  const [stats, setStats] = useState<DailyRevenueStats>({
    deviceRevenue: 0, buffetRevenue: 0, totalRevenue: 0, transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { gameCenter, isLocalMode } = useAuth();

  useEffect(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);

    const computeLocal = () => {
      const sessions = local.getSessions().filter(s => {
        if (!s.end_time || s.total_cost == null) return false;
        const e = new Date(s.end_time);
        return e >= today && e < tomorrow;
      });
      const sales = local.getSales().filter(s => {
        const c = new Date(s.created_at);
        return c >= today && c < tomorrow;
      });
      const deviceRevenue = sessions.reduce((sum, s) => sum + (s.total_cost || 0), 0);
      const buffetRevenue = sales.reduce((sum, s) => sum + (s.total_price || 0), 0);
      setStats({ deviceRevenue, buffetRevenue, totalRevenue: deviceRevenue + buffetRevenue, transactionCount: sales.length });
      setLoading(false);
    };

    if (isLocalMode) {
      computeLocal();
      const id = window.setInterval(computeLocal, 5000);
      return () => window.clearInterval(id);
    }

    if (!gameCenter?.id) { setLoading(false); return; }

    const fetchDailyRevenue = async () => {
      try {
        const todayISO = today.toISOString();
        const tomorrowISO = tomorrow.toISOString();
        const { data: sessions } = await supabase
          .from('device_sessions').select('total_cost').eq('game_center_id', gameCenter.id)
          .gte('end_time', todayISO).lt('end_time', tomorrowISO)
          .not('end_time', 'is', null).not('total_cost', 'is', null);
        const { data: sales } = await supabase
          .from('sales').select('total_price').eq('game_center_id', gameCenter.id)
          .gte('created_at', todayISO).lt('created_at', tomorrowISO);
        const deviceRevenue = sessions?.reduce((sum, s) => sum + (s.total_cost || 0), 0) || 0;
        const buffetRevenue = sales?.reduce((sum, s) => sum + (s.total_price || 0), 0) || 0;
        setStats({ deviceRevenue, buffetRevenue, totalRevenue: deviceRevenue + buffetRevenue, transactionCount: sales?.length || 0 });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };

    fetchDailyRevenue();

    const sessionsChannel = supabase.channel(`device_sessions_${gameCenter.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'device_sessions', filter: `game_center_id=eq.${gameCenter.id}` },
        () => fetchDailyRevenue()).subscribe();
    const salesChannel = supabase.channel(`sales_${gameCenter.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales', filter: `game_center_id=eq.${gameCenter.id}` },
        () => fetchDailyRevenue()).subscribe();
    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(salesChannel);
    };
  }, [gameCenter?.id, isLocalMode]);

  return { stats, loading };
}
