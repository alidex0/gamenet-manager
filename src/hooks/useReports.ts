import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as local from '@/lib/localBackend';

interface DailyRevenue {
  date: string; day_name: string; devices_revenue: number; buffet_revenue: number;
}
interface DeviceTypeRevenue {
  type: string; label: string; revenue: number; percentage: number;
}
interface HourlyUsage { hour: string; usage: number; }
interface ReportStats {
  total_revenue: number; devices_revenue: number; buffet_revenue: number; average_daily: number;
}

const persianDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
const typeLabels: Record<string, string> = { pc: 'کامپیوتر', playstation: 'پلی‌استیشن', billiard: 'بیلیارد', other: 'سایر' };
const toFa = (n: number) => n.toString().replace(/\d/g, x => '۰۱۲۳۴۵۶۷۸۹'[parseInt(x)]);

export function useReports() {
  const [loading, setLoading] = useState(true);
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [deviceTypeRevenue, setDeviceTypeRevenue] = useState<DeviceTypeRevenue[]>([]);
  const [hourlyUsage, setHourlyUsage] = useState<HourlyUsage[]>([]);
  const [stats, setStats] = useState<ReportStats>({ total_revenue: 0, devices_revenue: 0, buffet_revenue: 0, average_daily: 0 });
  const { gameCenter, isLocalMode } = useAuth();

  const compute = useCallback((
    sessions: { created_at: string; start_time: string; total_cost: number | null; deviceType: string }[],
    sales: { created_at: string; total_price: number | null }[],
  ) => {
    const today = new Date();
    const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);

    const dailyMap = new Map<string, { devices: number; buffet: number }>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekAgo); d.setDate(d.getDate() + i);
      dailyMap.set(d.toISOString().split('T')[0], { devices: 0, buffet: 0 });
    }
    sessions.forEach(s => {
      const key = new Date(s.created_at).toISOString().split('T')[0];
      const e = dailyMap.get(key); if (e) e.devices += s.total_cost || 0;
    });
    sales.forEach(s => {
      const key = new Date(s.created_at).toISOString().split('T')[0];
      const e = dailyMap.get(key); if (e) e.buffet += s.total_price || 0;
    });
    setDailyRevenue(Array.from(dailyMap.entries()).map(([date, rev]) => ({
      date, day_name: persianDays[new Date(date).getDay()],
      devices_revenue: rev.devices, buffet_revenue: rev.buffet,
    })));

    const typeMap = new Map<string, number>();
    sessions.forEach(s => {
      const t = s.deviceType || 'other';
      typeMap.set(t, (typeMap.get(t) || 0) + (s.total_cost || 0));
    });
    const total = Array.from(typeMap.values()).reduce((a, b) => a + b, 0);
    setDeviceTypeRevenue(Array.from(typeMap.entries()).map(([type, revenue]) => ({
      type, label: typeLabels[type] || type, revenue,
      percentage: total > 0 ? Math.round((revenue / total) * 100) : 0,
    })));

    const hourlyMap = new Map<number, number>();
    for (let h = 10; h <= 24; h += 2) hourlyMap.set(h === 24 ? 0 : h, 0);
    sessions.forEach(s => {
      const hour = new Date(s.start_time).getHours();
      const r = Math.floor(hour / 2) * 2;
      hourlyMap.set(r, (hourlyMap.get(r) || 0) + 1);
    });
    const max = Math.max(...Array.from(hourlyMap.values()), 1);
    setHourlyUsage([10, 12, 14, 16, 18, 20, 22, 0].map(hour => ({
      hour: toFa(hour), usage: Math.round((hourlyMap.get(hour) || 0) / max * 100),
    })));

    const devicesTotal = sessions.reduce((sum, s) => sum + (s.total_cost || 0), 0);
    const buffetTotal = sales.reduce((sum, s) => sum + (s.total_price || 0), 0);
    setStats({
      total_revenue: devicesTotal + buffetTotal,
      devices_revenue: devicesTotal, buffet_revenue: buffetTotal,
      average_daily: Math.round((devicesTotal + buffetTotal) / 7),
    });
  }, []);

  const fetchReports = useCallback(async () => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
    if (isLocalMode) {
      const devices = local.getDevices();
      const sessions = local.getSessions()
        .filter(s => s.total_cost != null && new Date(s.created_at) >= weekAgo)
        .map(s => ({
          created_at: s.created_at, start_time: s.start_time, total_cost: s.total_cost,
          deviceType: devices.find(d => d.id === s.device_id)?.type || 'other',
        }));
      const sales = local.getSales()
        .filter(s => new Date(s.created_at) >= weekAgo)
        .map(s => ({ created_at: s.created_at, total_price: s.total_price }));
      compute(sessions, sales);
      setLoading(false);
      return;
    }

    if (!gameCenter?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: sessionsData } = await supabase
        .from('device_sessions').select('*, devices!device_sessions_device_id_fkey(type)')
        .eq('game_center_id', gameCenter.id).not('total_cost', 'is', null)
        .gte('created_at', weekAgo.toISOString());
      const { data: salesData } = await supabase
        .from('sales').select('*').eq('game_center_id', gameCenter.id)
        .gte('created_at', weekAgo.toISOString());
      compute(
        (sessionsData || []).map(s => ({
          created_at: s.created_at, start_time: s.start_time, total_cost: s.total_cost,
          deviceType: (s.devices as any)?.type || 'other',
        })),
        (salesData || []).map(s => ({ created_at: s.created_at, total_price: s.total_price })),
      );
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, [gameCenter?.id, isLocalMode, compute]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  return { loading, dailyRevenue, deviceTypeRevenue, hourlyUsage, stats, refetch: fetchReports };
}
