import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('خطا در دریافت محصولات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }
  }, [user, fetchProducts]);

  const createSale = async (
    items: { productId: string; quantity: number }[],
    deviceId?: string
  ) => {
    try {
      const salesData = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error('محصول یافت نشد');
        
        return {
          product_id: item.productId,
          device_id: deviceId || null,
          quantity: item.quantity,
          unit_price: product.price,
          total_price: product.price * item.quantity,
          sold_by: user?.id,
        };
      });

      const { error } = await supabase
        .from('sales')
        .insert(salesData);

      if (error) throw error;

      // Update stock for each product
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await supabase
            .from('products')
            .update({ stock: product.stock - item.quantity })
            .eq('id', item.productId);
        }
      }

      toast.success('فروش با موفقیت ثبت شد');
      fetchProducts();
      return { success: true };
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error('خطا در ثبت فروش');
      return { success: false };
    }
  };

  return {
    products,
    loading,
    createSale,
    refetch: fetchProducts,
  };
}
