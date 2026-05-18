import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as local from '@/lib/localBackend';

export interface Activity {
  id: string;
  type: 'device_start' | 'device_end' | 'sale';
  title: string;
  description: string;
  time: Date;
  timeAgo: string;
}

function getTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const m = Math.floor(diff / 60000), h = Math.floor(m / 60), d = Math.floor(h / 24);
  const toFa = (n: number) => n.toString().replace(/\d/g, x => '۰۱۲۳۴۵۶۷۸۹'[parseInt(x)]);
  if (m < 1) return 'همین الان';
  if (m < 60) return `${toFa(m)} دقیقه پیش`;
  if (h < 24) return `${toFa(h)} ساعت پیش`;
  return `${toFa(d)} روز پیش`;
}

const toFa = (n: number | string) => n.toString().replace(/\d/g, x => '۰۱۲۳۴۵۶۷۸۹'[parseInt(x)]);

export function useRecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { gameCenter, isLocalMode } = useAuth();

  const fetchActivities = useCallback(async () => {
    if (isLocalMode) {
      const devices = local.getDevices();
      const products = local.getProducts();
      const all: Activity[] = [];
      local.getSessions().slice(-20).forEach(s => {
        const deviceName = devices.find(d => d.id === s.device_id)?.name || 'دستگاه';
        all.push({
          id: `session-start-${s.id}`, type: 'device_start', title: deviceName,
          description: s.customer_name ? `شروع استفاده توسط ${s.customer_name}` : 'شروع استفاده',
          time: new Date(s.start_time), timeAgo: getTimeAgo(new Date(s.start_time)),
        });
        if (s.end_time && s.total_cost) {
          const dur = Math.floor((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000);
          const hrs = Math.floor(dur / 60), mins = dur % 60;
          const durStr = hrs > 0 ? `${toFa(hrs)} ساعت و ${toFa(mins)} دقیقه` : `${toFa(mins)} دقیقه`;
          all.push({
            id: `session-end-${s.id}`, type: 'device_end', title: deviceName,
            description: `پایان استفاده - ${durStr} - ${toFa(s.total_cost)} ت`,
            time: new Date(s.end_time), timeAgo: getTimeAgo(new Date(s.end_time)),
          });
        }
      });
      local.getSales().slice(-20).forEach(s => {
        const pName = products.find(p => p.id === s.product_id)?.name || 'محصول';
        const dName = devices.find(d => d.id === s.device_id)?.name;
        all.push({
          id: `sale-${s.id}`, type: 'sale', title: 'فروش بوفه',
          description: dName ? `${toFa(s.quantity)} × ${pName} - ${dName}` : `${toFa(s.quantity)} × ${pName}`,
          time: new Date(s.created_at), timeAgo: getTimeAgo(new Date(s.created_at)),
        });
      });
      all.sort((a, b) => b.time.getTime() - a.time.getTime());
      setActivities(all.slice(0, 10));
      setLoading(false);
      return;
    }

    if (!gameCenter?.id) { setLoading(false); return; }
    try {
      const { data: sessionsData } = await supabase
        .from('device_sessions').select('*, devices!device_sessions_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id).order('created_at', { ascending: false }).limit(20);
      const { data: salesData } = await supabase
        .from('sales').select('*, products!sales_product_id_fkey(name), devices!sales_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id).order('created_at', { ascending: false }).limit(20);

      const all: Activity[] = [];
      sessionsData?.forEach(session => {
        const deviceName = (session.devices as any)?.name || 'دستگاه';
        all.push({
          id: `session-start-${session.id}`, type: 'device_start', title: deviceName,
          description: session.customer_name ? `شروع استفاده توسط ${session.customer_name}` : 'شروع استفاده',
          time: new Date(session.start_time), timeAgo: getTimeAgo(new Date(session.start_time)),
        });
        if (session.end_time && session.total_cost) {
          const dur = Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 60000);
          const hrs = Math.floor(dur / 60), mins = dur % 60;
          const durStr = hrs > 0 ? `${toFa(hrs)} ساعت و ${toFa(mins)} دقیقه` : `${toFa(mins)} دقیقه`;
          all.push({
            id: `session-end-${session.id}`, type: 'device_end', title: deviceName,
            description: `پایان استفاده - ${durStr} - ${toFa(session.total_cost)} ت`,
            time: new Date(session.end_time), timeAgo: getTimeAgo(new Date(session.end_time)),
          });
        }
      });
      salesData?.forEach(sale => {
        const pName = (sale.products as any)?.name || 'محصول';
        const dName = (sale.devices as any)?.name;
        all.push({
          id: `sale-${sale.id}`, type: 'sale', title: 'فروش بوفه',
          description: dName ? `${toFa(sale.quantity)} × ${pName} - ${dName}` : `${toFa(sale.quantity)} × ${pName}`,
          time: new Date(sale.created_at), timeAgo: getTimeAgo(new Date(sale.created_at)),
        });
      });
      all.sort((a, b) => b.time.getTime() - a.time.getTime());
      setActivities(all.slice(0, 10));
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, [gameCenter?.id, isLocalMode]);

  useEffect(() => {
    fetchActivities();
    const id = setInterval(fetchActivities, 60000);
    return () => clearInterval(id);
  }, [fetchActivities]);

  return { activities, loading, refetch: fetchActivities };
}
