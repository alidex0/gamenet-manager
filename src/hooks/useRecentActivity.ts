import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Activity {
  id: string;
  type: 'device_start' | 'device_end' | 'sale';
  title: string;
  description: string;
  time: Date;
  timeAgo: string;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const toPersianNumber = (n: number) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  if (diffMinutes < 1) return 'همین الان';
  if (diffMinutes < 60) return `${toPersianNumber(diffMinutes)} دقیقه پیش`;
  if (diffHours < 24) return `${toPersianNumber(diffHours)} ساعت پیش`;
  return `${toPersianNumber(diffDays)} روز پیش`;
}

export function useRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { gameCenter } = useAuth();

  const fetchActivities = useCallback(async () => {
    if (!gameCenter?.id) {
      setLoading(false);
      return;
    }

    try {
      // Fetch recent sessions (both active and completed)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('device_sessions')
        .select('*, devices!device_sessions_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (sessionsError) throw sessionsError;

      // Fetch recent sales with product info
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, products!sales_product_id_fkey(name), devices!sales_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (salesError) throw salesError;

      const toPersianNumber = (n: number | string) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

      const allActivities: Activity[] = [];

      // Add session activities
      sessionsData?.forEach(session => {
        const deviceName = (session.devices as any)?.name || 'دستگاه';
        const customerName = session.customer_name;
        
        // Session start
        allActivities.push({
          id: `session-start-${session.id}`,
          type: 'device_start',
          title: deviceName,
          description: customerName 
            ? `شروع استفاده توسط ${customerName}`
            : 'شروع استفاده',
          time: new Date(session.start_time),
          timeAgo: getTimeAgo(new Date(session.start_time)),
        });

        // Session end (if completed)
        if (session.end_time && session.total_cost) {
          const duration = Math.floor(
            (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000 / 60
          );
          const hours = Math.floor(duration / 60);
          const minutes = duration % 60;
          const durationStr = hours > 0 
            ? `${toPersianNumber(hours)} ساعت و ${toPersianNumber(minutes)} دقیقه` 
            : `${toPersianNumber(minutes)} دقیقه`;

          allActivities.push({
            id: `session-end-${session.id}`,
            type: 'device_end',
            title: deviceName,
            description: `پایان استفاده - ${durationStr} - ${toPersianNumber(session.total_cost)} ت`,
            time: new Date(session.end_time),
            timeAgo: getTimeAgo(new Date(session.end_time)),
          });
        }
      });

      // Add sale activities
      salesData?.forEach(sale => {
        const productName = (sale.products as any)?.name || 'محصول';
        const deviceName = (sale.devices as any)?.name;
        
        allActivities.push({
          id: `sale-${sale.id}`,
          type: 'sale',
          title: 'فروش بوفه',
          description: deviceName
            ? `${toPersianNumber(sale.quantity)} × ${productName} - ${deviceName}`
            : `${toPersianNumber(sale.quantity)} × ${productName}`,
          time: new Date(sale.created_at),
          timeAgo: getTimeAgo(new Date(sale.created_at)),
        });
      });

      // Sort by time descending and take top 10
      allActivities.sort((a, b) => b.time.getTime() - a.time.getTime());
      setActivities(allActivities.slice(0, 10));

    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, [gameCenter?.id]);

  useEffect(() => {
    fetchActivities();
    
    // Refresh every minute
    const interval = setInterval(fetchActivities, 60000);
    return () => clearInterval(interval);
  }, [fetchActivities]);

  return {
    activities,
    loading,
    refetch: fetchActivities,
  };
}
