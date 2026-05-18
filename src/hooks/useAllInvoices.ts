import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as local from '@/lib/localBackend';

export interface Invoice {
  id: string;
  type: 'device' | 'buffet';
  date: string;
  time: string;
  description: string;
  amount: number;
  device_name?: string;
  product_name?: string;
  customer_name?: string;
  quantity?: number;
}

export interface InvoiceByDay {
  date: string;
  day_name: string;
  invoices: Invoice[];
  totalAmount: number;
}

const persianDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

function group(invoices: Invoice[]): InvoiceByDay[] {
  const map = new Map<string, Invoice[]>();
  invoices.forEach(inv => {
    const list = map.get(inv.date) || [];
    list.push(inv);
    map.set(inv.date, list);
  });
  return Array.from(map.entries())
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .map(([date, list]) => ({
      date,
      day_name: persianDays[new Date(date).getDay()],
      invoices: list.sort((a, b) => b.time.localeCompare(a.time)),
      totalAmount: list.reduce((s, i) => s + i.amount, 0),
    }));
}

export function useAllInvoices() {
  const [loading, setLoading] = useState(true);
  const [invoicesByDay, setInvoicesByDay] = useState<InvoiceByDay[]>([]);
  const { gameCenter, isLocalMode } = useAuth();

  const fetchInvoices = useCallback(async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (isLocalMode) {
      const devices = local.getDevices();
      const all: Invoice[] = [];
      local.getSessions()
        .filter(s => s.end_time && s.total_cost && new Date(s.end_time) >= thirtyDaysAgo)
        .forEach(s => {
          const d = new Date(s.end_time!);
          all.push({
            id: `device-${s.id}`, type: 'device',
            date: d.toISOString().split('T')[0],
            time: d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            description: `استفاده از ${devices.find(x => x.id === s.device_id)?.name || 'دستگاه'}`,
            amount: s.total_cost || 0,
            device_name: devices.find(x => x.id === s.device_id)?.name,
            customer_name: s.customer_name || undefined,
          });
        });
      local.getSales()
        .filter(s => new Date(s.created_at) >= thirtyDaysAgo)
        .forEach(s => {
          const d = new Date(s.created_at);
          all.push({
            id: `sale-${s.id}`, type: 'buffet',
            date: d.toISOString().split('T')[0],
            time: d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
            description: `فروش ${s.quantity}x`,
            amount: s.total_price || 0,
            customer_name: s.customer_name || undefined,
            quantity: s.quantity,
          });
        });
      setInvoicesByDay(group(all));
      setLoading(false);
      return;
    }

    if (!gameCenter?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const all: Invoice[] = [];
      const { data: sessionsData } = await supabase
        .from('device_sessions').select('*, devices!device_sessions_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id).not('total_cost', 'is', null).not('end_time', 'is', null)
        .gte('end_time', thirtyDaysAgo.toISOString()).order('end_time', { ascending: false });
      sessionsData?.forEach(session => {
        const d = new Date(session.end_time);
        all.push({
          id: `device-${session.id}`, type: 'device',
          date: d.toISOString().split('T')[0],
          time: d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          description: `استفاده از ${(session.devices as any)?.name || 'دستگاه'}`,
          amount: session.total_cost || 0,
          device_name: (session.devices as any)?.name,
          customer_name: session.customer_name || undefined,
        });
      });
      const { data: salesData } = await supabase
        .from('sales').select('*').eq('game_center_id', gameCenter.id)
        .gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: false });
      salesData?.forEach(sale => {
        const d = new Date(sale.created_at);
        all.push({
          id: `sale-${sale.id}`, type: 'buffet',
          date: d.toISOString().split('T')[0],
          time: d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          description: `فروش ${sale.quantity}x`,
          amount: sale.total_price || 0,
          customer_name: sale.customer_name || undefined,
          quantity: sale.quantity,
        });
      });
      setInvoicesByDay(group(all));
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, [gameCenter?.id, isLocalMode]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  return { loading, invoicesByDay, refetch: fetchInvoices };
}
