import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface DailyRevenueStats {
  deviceRevenue: number;
  buffetRevenue: number;
  totalRevenue: number;
  transactionCount: number;
}

export function useDailyRevenue() {
  const [stats, setStats] = useState<DailyRevenueStats>({
    deviceRevenue: 0,
    buffetRevenue: 0,
    totalRevenue: 0,
    transactionCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const { gameCenter } = useAuth();

  useEffect(() => {
    if (!gameCenter?.id) {
      setLoading(false);
      return;
    }

    const fetchDailyRevenue = async () => {
      try {
        // Get today's date range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayISO = today.toISOString();
        const tomorrowISO = tomorrow.toISOString();

        // Fetch device sessions revenue (completed sessions today)
        const { data: sessions, error: sessionsError } = await supabase
          .from('device_sessions')
          .select('total_cost')
          .eq('game_center_id', gameCenter.id)
          .gte('end_time', todayISO)
          .lt('end_time', tomorrowISO)
          .not('end_time', 'is', null)
          .not('total_cost', 'is', null);

        if (sessionsError) throw sessionsError;

        // Fetch buffet sales today
        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select('total_price')
          .eq('game_center_id', gameCenter.id)
          .gte('created_at', todayISO)
          .lt('created_at', tomorrowISO);

        if (salesError) throw salesError;

        const deviceRevenue = sessions?.reduce((sum, session) => sum + (session.total_cost || 0), 0) || 0;
        const buffetRevenue = sales?.reduce((sum, sale) => sum + (sale.total_price || 0), 0) || 0;

        setStats({
          deviceRevenue,
          buffetRevenue,
          totalRevenue: deviceRevenue + buffetRevenue,
          transactionCount: (sales?.length || 0),
        });
      } catch (error) {
        console.error('Error fetching daily revenue:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyRevenue();

    // Set up real-time subscription
    const sessionsChannel = supabase
      .channel(`device_sessions_${gameCenter.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_sessions',
          filter: `game_center_id=eq.${gameCenter.id}`,
        },
        () => {
          fetchDailyRevenue();
        }
      )
      .subscribe();

    const salesChannel = supabase
      .channel(`sales_${gameCenter.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `game_center_id=eq.${gameCenter.id}`,
        },
        () => {
          fetchDailyRevenue();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionsChannel);
      supabase.removeChannel(salesChannel);
    };
  }, [gameCenter?.id]);

  return { stats, loading };
}
