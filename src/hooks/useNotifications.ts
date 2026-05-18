import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as local from '@/lib/localBackend';

export interface Notification {
  id: string;
  type: 'low_stock' | 'session_long' | 'maintenance';
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

const DISMISSED_NOTIFICATIONS_KEY = 'dismissed_notifications';
const toFa = (n: number) => n.toString().replace(/\d/g, x => '۰۱۲۳۴۵۶۷۸۹'[parseInt(x)]);

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
      return new Set(stored ? JSON.parse(stored) : []);
    }
    return new Set();
  });
  const { gameCenter, isLocalMode } = useAuth();

  const fetchNotifications = useCallback(async () => {
    const list: Notification[] = [];
    const threeHoursAgo = new Date(); threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);

    if (isLocalMode) {
      local.getProducts().filter(p => p.is_active && p.stock < 10).forEach(p => {
        const id = `low-stock-${p.id}`;
        if (!dismissedIds.has(id)) list.push({
          id, type: 'low_stock', title: 'موجودی کم',
          message: `${p.name} فقط ${toFa(p.stock)} عدد موجودی دارد`,
          time: new Date(), read: false,
        });
      });
      const devices = local.getDevices();
      local.getSessions().filter(s => !s.end_time && new Date(s.start_time) < threeHoursAgo).forEach(s => {
        const id = `long-session-${s.id}`;
        if (!dismissedIds.has(id)) {
          const dn = devices.find(d => d.id === s.device_id)?.name || 'دستگاه';
          const hrs = Math.floor((Date.now() - new Date(s.start_time).getTime()) / 3600000);
          list.push({ id, type: 'session_long', title: 'جلسه طولانی', message: `${dn} بیش از ${toFa(hrs)} ساعت فعال است`, time: new Date(s.start_time), read: false });
        }
      });
      devices.filter(d => d.status === 'maintenance').forEach(d => {
        const id = `maintenance-${d.id}`;
        if (!dismissedIds.has(id)) list.push({
          id, type: 'maintenance', title: 'در حال سرویس',
          message: `${d.name} در حالت سرویس است`,
          time: new Date(d.updated_at), read: false,
        });
      });
      setNotifications(list);
      setLoading(false);
      return;
    }

    if (!gameCenter?.id) { setLoading(false); return; }
    try {
      const { data: productsData } = await supabase
        .from('products').select('*').eq('game_center_id', gameCenter.id).eq('is_active', true).lt('stock', 10);
      productsData?.forEach(p => {
        const id = `low-stock-${p.id}`;
        if (!dismissedIds.has(id)) list.push({
          id, type: 'low_stock', title: 'موجودی کم',
          message: `${p.name} فقط ${toFa(p.stock)} عدد موجودی دارد`,
          time: new Date(), read: false,
        });
      });
      const { data: sessionsData } = await supabase
        .from('device_sessions').select('*, devices!device_sessions_device_id_fkey(name)')
        .eq('game_center_id', gameCenter.id).is('end_time', null).lt('start_time', threeHoursAgo.toISOString());
      sessionsData?.forEach(s => {
        const id = `long-session-${s.id}`;
        if (!dismissedIds.has(id)) {
          const dn = (s.devices as any)?.name || 'دستگاه';
          const hrs = Math.floor((Date.now() - new Date(s.start_time).getTime()) / 3600000);
          list.push({ id, type: 'session_long', title: 'جلسه طولانی', message: `${dn} بیش از ${toFa(hrs)} ساعت فعال است`, time: new Date(s.start_time), read: false });
        }
      });
      const { data: devicesData } = await supabase
        .from('devices').select('*').eq('game_center_id', gameCenter.id).eq('status', 'maintenance');
      devicesData?.forEach(d => {
        const id = `maintenance-${d.id}`;
        if (!dismissedIds.has(id)) list.push({
          id, type: 'maintenance', title: 'در حال سرویس',
          message: `${d.name} در حالت سرویس است`,
          time: new Date(d.updated_at), read: false,
        });
      });
      setNotifications(list);
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }, [gameCenter?.id, isLocalMode, dismissedIds]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const next = new Set(dismissedIds); next.add(id);
    setDismissedIds(next);
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(Array.from(next)));
  };
  const removeAllRead = () => {
    const readIds = notifications.filter(n => n.read).map(n => n.id);
    setNotifications(prev => prev.filter(n => !n.read));
    const next = new Set(dismissedIds); readIds.forEach(id => next.add(id));
    setDismissedIds(next);
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(Array.from(next)));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, removeNotification, removeAllRead, refetch: fetchNotifications };
}
