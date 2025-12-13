import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Device = Database['public']['Tables']['devices']['Row'];
type DeviceSession = Database['public']['Tables']['device_sessions']['Row'];
type DeviceType = Database['public']['Enums']['device_type'];
type DeviceStatus = Database['public']['Enums']['device_status'];

export interface DeviceWithSession extends Device {
  currentSession?: DeviceSession | null;
}

export interface NewDevice {
  name: string;
  type: DeviceType;
  hourly_rate: number;
}

export function useDevicesDB() {
  const [devices, setDevices] = useState<DeviceWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, gameCenter } = useAuth();

  const fetchDevices = useCallback(async () => {
    if (!gameCenter?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .eq('game_center_id', gameCenter.id)
        .order('name');

      if (devicesError) throw devicesError;

      const { data: sessionsData, error: sessionsError } = await supabase
        .from('device_sessions')
        .select('*')
        .eq('game_center_id', gameCenter.id)
        .is('end_time', null);

      if (sessionsError) throw sessionsError;

      const devicesWithSessions: DeviceWithSession[] = (devicesData || []).map(device => ({
        ...device,
        currentSession: sessionsData?.find(s => s.device_id === device.id) || null,
      }));

      setDevices(devicesWithSessions);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('خطا در دریافت اطلاعات دستگاه‌ها');
    } finally {
      setLoading(false);
    }
  }, [gameCenter?.id]);

  useEffect(() => {
    if (user && gameCenter) {
      fetchDevices();
    }
  }, [user, gameCenter, fetchDevices]);

  const addDevice = async (newDevice: NewDevice) => {
    if (!gameCenter?.id) return { success: false };

    try {
      const { error } = await supabase
        .from('devices')
        .insert({
          name: newDevice.name,
          type: newDevice.type,
          hourly_rate: newDevice.hourly_rate,
          status: 'available' as DeviceStatus,
          game_center_id: gameCenter.id,
        });

      if (error) throw error;

      toast.success('دستگاه با موفقیت اضافه شد');
      fetchDevices();
      return { success: true };
    } catch (error) {
      console.error('Error adding device:', error);
      toast.error('خطا در افزودن دستگاه');
      return { success: false };
    }
  };

  const deleteDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return { success: false };

    if (device.status === 'occupied') {
      toast.error('امکان حذف دستگاه مشغول وجود ندارد');
      return { success: false };
    }

    try {
      const { error } = await supabase
        .from('devices')
        .delete()
        .eq('id', deviceId);

      if (error) throw error;

      toast.success('دستگاه با موفقیت حذف شد');
      fetchDevices();
      return { success: true };
    } catch (error) {
      console.error('Error deleting device:', error);
      toast.error('خطا در حذف دستگاه');
      return { success: false };
    }
  };

  const updateDevice = async (deviceId: string, updates: { name?: string; hourly_rate?: number }) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', deviceId);

      if (error) throw error;

      toast.success('اطلاعات دستگاه به‌روز شد');
      fetchDevices();
      return { success: true };
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error('خطا در به‌روزرسانی دستگاه');
      return { success: false };
    }
  };

  const updateDeviceStatus = async (deviceId: string, status: DeviceStatus) => {
    try {
      const { error } = await supabase
        .from('devices')
        .update({ status })
        .eq('id', deviceId);

      if (error) throw error;

      toast.success('وضعیت دستگاه به‌روز شد');
      fetchDevices();
      return { success: true };
    } catch (error) {
      console.error('Error updating device status:', error);
      toast.error('خطا در به‌روزرسانی وضعیت');
      return { success: false };
    }
  };

  const startSession = async (deviceId: string, customerName?: string) => {
    if (!gameCenter?.id) return;

    try {
      const { error: sessionError } = await supabase
        .from('device_sessions')
        .insert({
          device_id: deviceId,
          game_center_id: gameCenter.id,
          user_id: user?.id,
          start_time: new Date().toISOString(),
          is_paused: false,
          total_paused_seconds: 0,
          customer_name: customerName || null,
        });

      if (sessionError) throw sessionError;

      const { error: deviceError } = await supabase
        .from('devices')
        .update({ status: 'occupied' as DeviceStatus })
        .eq('id', deviceId);

      if (deviceError) throw deviceError;

      toast.success('زمان‌بندی شروع شد');
      fetchDevices();
    } catch (error) {
      console.error('Error starting session:', error);
      toast.error('خطا در شروع زمان‌بندی');
    }
  };

  const pauseSession = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device?.currentSession) return;

    const session = device.currentSession;

    try {
      if (session.is_paused) {
        const pausedAt = new Date(session.paused_at!);
        const now = new Date();
        const additionalPausedSeconds = Math.floor((now.getTime() - pausedAt.getTime()) / 1000);

        const { error } = await supabase
          .from('device_sessions')
          .update({
            is_paused: false,
            paused_at: null,
            total_paused_seconds: (session.total_paused_seconds || 0) + additionalPausedSeconds,
          })
          .eq('id', session.id);

        if (error) throw error;
        toast.success('زمان‌بندی ادامه یافت');
      } else {
        const { error } = await supabase
          .from('device_sessions')
          .update({
            is_paused: true,
            paused_at: new Date().toISOString(),
          })
          .eq('id', session.id);

        if (error) throw error;
        toast.success('زمان‌بندی متوقف شد');
      }

      fetchDevices();
    } catch (error) {
      console.error('Error toggling pause:', error);
      toast.error('خطا در تغییر وضعیت');
    }
  };

  const stopSession = async (deviceId: string): Promise<{
    success: boolean;
    invoiceData?: {
      deviceName: string;
      deviceType: string;
      customerName: string | null;
      startTime: Date;
      endTime: Date;
      totalSeconds: number;
      hourlyRate: number;
      deviceCost: number;
      buffetSales: Array<{
        product_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
      }>;
      buffetTotal: number;
      grandTotal: number;
    };
  }> => {
    const device = devices.find(d => d.id === deviceId);
    if (!device?.currentSession) return { success: false };

    const session = device.currentSession;

    try {
      const startTime = new Date(session.start_time);
      const endTime = new Date();
      let totalPausedSeconds = session.total_paused_seconds || 0;
      
      if (session.is_paused && session.paused_at) {
        const pausedAt = new Date(session.paused_at);
        totalPausedSeconds += Math.floor((endTime.getTime() - pausedAt.getTime()) / 1000);
      }

      const totalSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000) - totalPausedSeconds;
      const totalHours = totalSeconds / 3600;
      const totalCost = Math.ceil(totalHours * device.hourly_rate);

      // Fetch buffet sales for this device during the session
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*, products!sales_product_id_fkey(name)')
        .eq('device_id', deviceId)
        .gte('created_at', session.start_time)
        .lte('created_at', endTime.toISOString());

      if (salesError) throw salesError;

      const buffetSales = (salesData || []).map(sale => ({
        product_name: (sale.products as any)?.name || 'محصول حذف شده',
        quantity: sale.quantity,
        unit_price: sale.unit_price,
        total_price: sale.total_price,
      }));

      const buffetTotal = buffetSales.reduce((sum, item) => sum + item.total_price, 0);

      const { error: sessionError } = await supabase
        .from('device_sessions')
        .update({
          end_time: endTime.toISOString(),
          total_cost: totalCost,
          is_paused: false,
          paused_at: null,
          total_paused_seconds: totalPausedSeconds,
        })
        .eq('id', session.id);

      if (sessionError) throw sessionError;

      const { error: deviceError } = await supabase
        .from('devices')
        .update({ status: 'available' as DeviceStatus })
        .eq('id', deviceId);

      if (deviceError) throw deviceError;

      fetchDevices();

      return {
        success: true,
        invoiceData: {
          deviceName: device.name,
          deviceType: device.type,
          customerName: session.customer_name,
          startTime,
          endTime,
          totalSeconds,
          hourlyRate: device.hourly_rate,
          deviceCost: totalCost,
          buffetSales,
          buffetTotal,
          grandTotal: totalCost + buffetTotal,
        },
      };
    } catch (error) {
      console.error('Error stopping session:', error);
      toast.error('خطا در پایان زمان‌بندی');
      return { success: false };
    }
  };

  const updateSessionCustomerName = async (deviceId: string, customerName: string | null) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device?.currentSession) return { success: false };

    try {
      const { error } = await supabase
        .from('device_sessions')
        .update({ customer_name: customerName })
        .eq('id', device.currentSession.id);

      if (error) throw error;

      toast.success('نام مشتری به‌روز شد');
      fetchDevices();
      return { success: true };
    } catch (error) {
      console.error('Error updating customer name:', error);
      toast.error('خطا در به‌روزرسانی نام مشتری');
      return { success: false };
    }
  };

  const getStats = () => {
    const available = devices.filter(d => d.status === 'available').length;
    const occupied = devices.filter(d => d.status === 'occupied').length;
    const maintenance = devices.filter(d => d.status === 'maintenance').length;
    return { available, occupied, maintenance, total: devices.length };
  };

  return {
    devices,
    loading,
    addDevice,
    deleteDevice,
    updateDevice,
    updateDeviceStatus,
    startSession,
    pauseSession,
    stopSession,
    updateSessionCustomerName,
    getStats,
    refetch: fetchDevices,
  };
}
