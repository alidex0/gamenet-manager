import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  type: 'low_stock' | 'session_long' | 'maintenance';
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { gameCenter } = useAuth();

  const toPersianNumber = (n: number) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  const fetchNotifications = useCallback(async () => {
    if (!gameCenter?.id) {
      setLoading(false);
      return;
    }

    try {
      const newNotifications: Notification[] = [];

      // Check for low stock products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('game_center_id', gameCenter.id)
        .eq('is_active', true)
        .lt('stock', 10);

      if (!productsError && productsData) {
        productsData.forEach(product => {
          newNotifications.push({
            id: `low-stock-${product.id}`,
            type: 'low_stock',
            title: 'موجودی کم',
            message: `${product.name} فقط ${toPersianNumber(product.stock)} عدد موجودی دارد`,
            time: new Date(),
            read: false,
          });
        });
      }

      // Check for long sessions (more than 3 hours)
      const threeHoursAgo = new Date();
      threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('device_sessions')
        .select('*, devices!device_sessions_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id)
        .is('end_time', null)
        .lt('start_time', threeHoursAgo.toISOString());

      if (!sessionsError && sessionsData) {
        sessionsData.forEach(session => {
          const deviceName = (session.devices as any)?.name || 'دستگاه';
          const hours = Math.floor(
            (new Date().getTime() - new Date(session.start_time).getTime()) / 1000 / 3600
          );
          newNotifications.push({
            id: `long-session-${session.id}`,
            type: 'session_long',
            title: 'جلسه طولانی',
            message: `${deviceName} بیش از ${toPersianNumber(hours)} ساعت فعال است`,
            time: new Date(session.start_time),
            read: false,
          });
        });
      }

      // Check for devices in maintenance
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .eq('game_center_id', gameCenter.id)
        .eq('status', 'maintenance');

      if (!devicesError && devicesData) {
        devicesData.forEach(device => {
          newNotifications.push({
            id: `maintenance-${device.id}`,
            type: 'maintenance',
            title: 'در حال سرویس',
            message: `${device.name} در حالت سرویس است`,
            time: new Date(device.updated_at),
            read: false,
          });
        });
      }

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [gameCenter?.id]);

  useEffect(() => {
    fetchNotifications();
    
    // Refresh every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
