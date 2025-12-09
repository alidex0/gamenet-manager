import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { gameCenter } = useAuth();

  const fetchSales = useCallback(async () => {
    if (!gameCenter?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*, products!sales_product_id_fkey(name), devices!sales_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedSales: SaleRecord[] = (data || []).map(sale => ({
        id: sale.id,
        product_name: (sale.products as any)?.name || 'محصول حذف شده',
        device_name: (sale.devices as any)?.name || null,
        customer_name: sale.customer_name,
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        total_price: sale.total_price,
        created_at: sale.created_at,
      }));

      setSales(formattedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  }, [gameCenter?.id]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  return {
    sales,
    loading,
    refetch: fetchSales,
  };
}
