import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';

type Device = Database['public']['Tables']['devices']['Row'];
type DeviceSession = Database['public']['Tables']['device_sessions']['Row'];

export interface DeviceWithSession extends Device {
  currentSession?: DeviceSession | null;
}

export function useDevicesDB() {
  const [devices, setDevices] = useState<DeviceWithSession[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDevices = useCallback(async () => {
    try {
      // Fetch devices
      const { data: devicesData, error: devicesError } = await supabase
        .from('devices')
        .select('*')
        .order('name');

      if (devicesError) throw devicesError;

      // Fetch active sessions (no end_time)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('device_sessions')
        .select('*')
        .is('end_time', null);

      if (sessionsError) throw sessionsError;

      // Combine devices with their active sessions
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
  }, []);

  useEffect(() => {
    if (user) {
      fetchDevices();
    }
  }, [user, fetchDevices]);

  const startSession = async (deviceId: string) => {
    try {
      // Create new session
      const { error: sessionError } = await supabase
        .from('device_sessions')
        .insert({
          device_id: deviceId,
          user_id: user?.id,
          start_time: new Date().toISOString(),
          is_paused: false,
          total_paused_seconds: 0,
        });

      if (sessionError) throw sessionError;

      // Update device status
      const { error: deviceError } = await supabase
        .from('devices')
        .update({ status: 'occupied' as const })
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
        // Resume - calculate additional paused time
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
        // Pause
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

  const stopSession = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device?.currentSession) return;

    const session = device.currentSession;

    try {
      // Calculate total cost
      const startTime = new Date(session.start_time);
      const endTime = new Date();
      let totalPausedSeconds = session.total_paused_seconds || 0;
      
      // If currently paused, add current pause duration
      if (session.is_paused && session.paused_at) {
        const pausedAt = new Date(session.paused_at);
        totalPausedSeconds += Math.floor((endTime.getTime() - pausedAt.getTime()) / 1000);
      }

      const totalSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000) - totalPausedSeconds;
      const totalHours = totalSeconds / 3600;
      const totalCost = Math.ceil(totalHours * device.hourly_rate);

      // Update session with end time and cost
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

      // Update device status
      const { error: deviceError } = await supabase
        .from('devices')
        .update({ status: 'available' as const })
        .eq('id', deviceId);

      if (deviceError) throw deviceError;

      const toPersian = (n: number | string) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
      toast.success(`پایان یافت - هزینه: ${toPersian(totalCost.toLocaleString())} تومان`);
      fetchDevices();
    } catch (error) {
      console.error('Error stopping session:', error);
      toast.error('خطا در پایان زمان‌بندی');
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
    startSession,
    pauseSession,
    stopSession,
    getStats,
    refetch: fetchDevices,
  };
}
