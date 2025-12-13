import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Invoice {
  id: string;
  type: 'device' | 'buffet'; // device session or buffet sale
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

export function useAllInvoices() {
  const [loading, setLoading] = useState(true);
  const [invoicesByDay, setInvoicesByDay] = useState<InvoiceByDay[]>([]);
  const { gameCenter } = useAuth();

  const persianDays = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];

  const fetchInvoices = useCallback(async () => {
    if (!gameCenter?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Get today's date and 30 days back
      const today = new Date();
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const allInvoices: Invoice[] = [];

      // Fetch device sessions (completed ones with cost)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('device_sessions')
        .select('*, devices!device_sessions_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id)
        .not('total_cost', 'is', null)
        .not('end_time', 'is', null)
        .gte('end_time', thirtyDaysAgo.toISOString())
        .order('end_time', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Add device sessions as invoices
      sessionsData?.forEach(session => {
        const dateObj = new Date(session.end_time);
        allInvoices.push({
          id: `device-${session.id}`,
          type: 'device',
          date: dateObj.toISOString().split('T')[0],
          time: dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          description: `استفاده از ${(session.devices as any)?.name || 'دستگاه'}`,
          amount: session.total_cost || 0,
          device_name: (session.devices as any)?.name,
          customer_name: session.customer_name || undefined,
        });
      });

      // Fetch sales (buffet products)
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('game_center_id', gameCenter.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Add sales as invoices
      salesData?.forEach(sale => {
        const dateObj = new Date(sale.created_at);
        allInvoices.push({
          id: `sale-${sale.id}`,
          type: 'buffet',
          date: dateObj.toISOString().split('T')[0],
          time: dateObj.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
          description: `فروش ${sale.quantity}x`,
          amount: sale.total_price || 0,
          product_name: undefined, // Will be fetched separately if needed
          customer_name: sale.customer_name || undefined,
          quantity: sale.quantity,
        });
      });

      // Group by date
      const dateMap = new Map<string, Invoice[]>();

      allInvoices.forEach(invoice => {
        const invoices = dateMap.get(invoice.date) || [];
        invoices.push(invoice);
        dateMap.set(invoice.date, invoices);
      });

      // Convert to array and sort by date (newest first)
      const result: InvoiceByDay[] = Array.from(dateMap.entries())
        .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
        .map(([date, invoices]) => {
          const dayIndex = new Date(date).getDay();
          const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);

          return {
            date,
            day_name: persianDays[dayIndex],
            invoices: invoices.sort((a, b) => b.time.localeCompare(a.time)), // Sort by time descending
            totalAmount,
          };
        });

      setInvoicesByDay(result);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [gameCenter?.id]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    loading,
    invoicesByDay,
    refetch: fetchInvoices,
  };
}
