import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as local from '@/lib/localBackend';

export interface SaleRecord {
  id: string;
  product_name: string;
  device_name: string | null;
  customer_name: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export function useSalesHistory() {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { gameCenter, isLocalMode } = useAuth();

  const fetchSales = useCallback(async () => {
    if (isLocalMode) {
      const products = local.getProducts();
      const devices = local.getDevices();
      const all = local.getSales()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 50);
      setSales(all.map(s => ({
        id: s.id,
        product_name: products.find(p => p.id === s.product_id)?.name || 'محصول حذف شده',
        device_name: devices.find(d => d.id === s.device_id)?.name || null,
        customer_name: s.customer_name,
        quantity: s.quantity,
        unit_price: s.unit_price,
        total_price: s.total_price,
        created_at: s.created_at,
      })));
      setLoading(false);
      return;
    }

    if (!gameCenter?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, products!sales_product_id_fkey(name), devices!sales_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setSales((data || []).map(sale => ({
        id: sale.id,
        product_name: (sale.products as any)?.name || 'محصول حذف شده',
        device_name: (sale.devices as any)?.name || null,
        customer_name: sale.customer_name,
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        total_price: sale.total_price,
        created_at: sale.created_at,
      })));
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, [gameCenter?.id, isLocalMode]);

  useEffect(() => { fetchSales(); }, [fetchSales]);

  return { sales, loading, refetch: fetchSales };
}
