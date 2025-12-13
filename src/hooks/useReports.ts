import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface DailyRevenue {
  date: string;
  day_name: string;
  devices_revenue: number;
  buffet_revenue: number;
}

interface DeviceTypeRevenue {
  type: string;
  label: string;
  revenue: number;
  percentage: number;
}

interface HourlyUsage {
  hour: string;
  usage: number;
}

interface ReportStats {
  total_revenue: number;
  devices_revenue: number;
  buffet_revenue: number;
  average_daily: number;
}

export function useReports() {
  const [loading, setLoading] = useState(true);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [deviceTypeRevenue, setDeviceTypeRevenue] = useState<DeviceTypeRevenue[]>([]);
  const [hourlyUsage, setHourlyUsage] = useState<HourlyUsage[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    total_revenue: 0,
    devices_revenue: 0,
    buffet_revenue: 0,
    average_daily: 0,
  });
  const { gameCenter } = useAuth();

  const persianDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

  const fetchReports = useCallback(async () => {
    if (!gameCenter?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Get last 7 days
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 6);

      // Fetch device sessions for revenue
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('device_sessions')
        .select('*, devices!device_sessions_device_id_fkey(type)')
        .eq('game_center_id', gameCenter.id)
        .not('total_cost', 'is', null)
        .gte('created_at', weekAgo.toISOString());

      if (sessionsError) throw sessionsError;

      // Fetch sales for buffet revenue
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('game_center_id', gameCenter.id)
        .gte('created_at', weekAgo.toISOString());

      if (salesError) throw salesError;

      // Calculate daily revenue
      const dailyMap = new Map<string, { devices: number; buffet: number }>();
      
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekAgo);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyMap.set(dateStr, { devices: 0, buffet: 0 });
      }

      // Add session revenue
      sessionsData?.forEach(session => {
        const dateStr = new Date(session.created_at).toISOString().split('T')[0];
        const existing = dailyMap.get(dateStr);
        if (existing) {
          existing.devices += session.total_cost || 0;
        }
      });

      // Add sales revenue
      salesData?.forEach(sale => {
        const dateStr = new Date(sale.created_at).toISOString().split('T')[0];
        const existing = dailyMap.get(dateStr);
        if (existing) {
          existing.buffet += sale.total_price || 0;
        }
      });

      // Convert to array
      const dailyArray: DailyRevenue[] = Array.from(dailyMap.entries()).map(([date, rev]) => {
        const dayIndex = new Date(date).getDay();
        return {
          date,
          day_name: persianDays[dayIndex],
          devices_revenue: rev.devices,
          buffet_revenue: rev.buffet,
        };
      });

      setDailyRevenue(dailyArray);

      // Calculate device type revenue
      const deviceTypeMap = new Map<string, number>();
      const typeLabels: Record<string, string> = {
        pc: 'کامپیوتر',
        playstation: 'پلی‌استیشن',
        billiard: 'بیلیارد',
        other: 'سایر',
      };

      sessionsData?.forEach(session => {
        const type = (session.devices as any)?.type || 'other';
        const current = deviceTypeMap.get(type) || 0;
        deviceTypeMap.set(type, current + (session.total_cost || 0));
      });

      const totalDeviceRevenue = Array.from(deviceTypeMap.values()).reduce((a, b) => a + b, 0);
      const deviceTypeArray: DeviceTypeRevenue[] = Array.from(deviceTypeMap.entries()).map(([type, revenue]) => ({
        type,
        label: typeLabels[type] || type,
        revenue,
        percentage: totalDeviceRevenue > 0 ? Math.round((revenue / totalDeviceRevenue) * 100) : 0,
      }));

      setDeviceTypeRevenue(deviceTypeArray);

      // Calculate hourly usage based on sessions
      const hourlyMap = new Map<number, number>();
      for (let h = 10; h <= 24; h += 2) {
        hourlyMap.set(h === 24 ? 0 : h, 0);
      }

      sessionsData?.forEach(session => {
        const hour = new Date(session.start_time).getHours();
        const roundedHour = Math.floor(hour / 2) * 2;
        const current = hourlyMap.get(roundedHour) || 0;
        hourlyMap.set(roundedHour, current + 1);
      });

      const maxSessions = Math.max(...Array.from(hourlyMap.values()), 1);
      const toPersianNumber = (n: number) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
      
      const hourlyArray: HourlyUsage[] = [10, 12, 14, 16, 18, 20, 22, 0].map(hour => ({
        hour: toPersianNumber(hour === 0 ? 0 : hour),
        usage: Math.round((hourlyMap.get(hour) || 0) / maxSessions * 100),
      }));

      setHourlyUsage(hourlyArray);

      // Calculate stats
      const devicesTotal = sessionsData?.reduce((sum, s) => sum + (s.total_cost || 0), 0) || 0;
      const buffetTotal = salesData?.reduce((sum, s) => sum + (s.total_price || 0), 0) || 0;
      const totalRevenue = devicesTotal + buffetTotal;

      setStats({
        total_revenue: totalRevenue,
        devices_revenue: devicesTotal,
        buffet_revenue: buffetTotal,
        average_daily: Math.round(totalRevenue / 7),
      });

    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  }, [gameCenter?.id]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return {
    loading,
    dailyRevenue,
    deviceTypeRevenue,
    hourlyUsage,
    stats,
    refetch: fetchReports,
  };
}
