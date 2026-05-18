import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import * as local from '@/lib/localBackend';

type Product = Database['public']['Tables']['products']['Row'];

export interface NewProduct {
  name: string;
  price: number;
  stock: number;
  category: string;
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, gameCenter, isLocalMode } = useAuth();

  const fetchProducts = useCallback(async () => {
    if (isLocalMode) {
      const ps = local.getProducts()
        .filter(p => p.is_active)
        .sort((a, b) => (a.category + a.name).localeCompare(b.category + b.name));
      setProducts(ps as unknown as Product[]);
      setLoading(false);
      return;
    }
    if (!gameCenter?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('products').select('*')
        .eq('game_center_id', gameCenter.id).eq('is_active', true)
        .order('category', { ascending: true }).order('name', { ascending: true });
      if (error) throw error;
      setProducts(data || []);
    } catch (e) {
      console.error(e);
      toast.error('خطا در دریافت محصولات');
    } finally { setLoading(false); }
  }, [gameCenter?.id, isLocalMode]);

  useEffect(() => {
    if (isLocalMode || (user && gameCenter)) fetchProducts();
  }, [user, gameCenter, isLocalMode, fetchProducts]);

  const addProduct = async (product: NewProduct) => {
    if (isLocalMode) {
      local.addLocalProduct(product);
      toast.success('محصول اضافه شد');
      fetchProducts();
      return { success: true };
    }
    if (!gameCenter?.id) return { success: false };
    try {
      const { error } = await supabase.from('products').insert({
        ...product, game_center_id: gameCenter.id, is_active: true,
      });
      if (error) throw error;
      toast.success('محصول اضافه شد');
      fetchProducts();
      return { success: true };
    } catch {
      toast.error('خطا در افزودن محصول');
      return { success: false };
    }
  };

  const updateProduct = async (productId: string, updates: Partial<NewProduct>) => {
    if (isLocalMode) {
      local.updateLocalProduct(productId, updates as any);
      toast.success('محصول بروزرسانی شد');
      fetchProducts();
      return { success: true };
    }
    try {
      const { error } = await supabase.from('products').update({
        ...(updates.name && { name: updates.name }),
        ...(updates.price && { price: updates.price }),
        ...(updates.stock !== undefined && { stock: updates.stock }),
        ...(updates.category && { category: updates.category }),
      }).eq('id', productId);
      if (error) throw error;
      toast.success('محصول بروزرسانی شد');
      fetchProducts();
      return { success: true };
    } catch {
      toast.error('خطا در بروزرسانی محصول');
      return { success: false };
    }
  };

  const deleteProduct = async (productId: string) => {
    if (isLocalMode) {
      local.deleteLocalProduct(productId);
      toast.success('محصول حذف شد');
      fetchProducts();
      return { success: true };
    }
    try {
      const { error } = await supabase.from('products').update({ is_active: false }).eq('id', productId);
      if (error) throw error;
      toast.success('محصول حذف شد');
      fetchProducts();
      return { success: true };
    } catch {
      toast.error('خطا در حذف محصول');
      return { success: false };
    }
  };

  const createSale = async (
    items: { productId: string; quantity: number }[],
    deviceId?: string,
    customerName?: string
  ) => {
    if (isLocalMode) {
      const ps = local.getProducts();
      const sales = items.map(it => {
        const p = ps.find(x => x.id === it.productId);
        if (!p) throw new Error('محصول یافت نشد');
        return {
          product_id: it.productId,
          device_id: deviceId || null,
          quantity: it.quantity,
          unit_price: p.price,
          total_price: p.price * it.quantity,
          customer_name: customerName || null,
        };
      });
      local.addLocalSales(sales as any);
      toast.success('فروش ثبت شد');
      fetchProducts();
      return { success: true };
    }

    if (!gameCenter?.id) return { success: false };
    try {
      const salesData = items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) throw new Error('محصول یافت نشد');
        return {
          product_id: item.productId, device_id: deviceId || null,
          game_center_id: gameCenter.id, quantity: item.quantity,
          unit_price: product.price, total_price: product.price * item.quantity,
          sold_by: user?.id, customer_name: customerName || null,
        };
      });
      const { error } = await supabase.from('sales').insert(salesData);
      if (error) throw error;
      for (const item of items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await supabase.from('products')
            .update({ stock: product.stock - item.quantity }).eq('id', item.productId);
        }
      }
      toast.success('فروش ثبت شد');
      fetchProducts();
      return { success: true };
    } catch {
      toast.error('خطا در ثبت فروش');
      return { success: false };
    }
  };

  return { products, loading, addProduct, updateProduct, deleteProduct, createSale, refetch: fetchProducts };
}
