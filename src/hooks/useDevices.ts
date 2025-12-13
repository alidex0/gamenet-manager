import { useState } from 'react';
import { Device, Session } from '@/types';

const initialDevices: Device[] = [
  { id: '1', name: 'PC شماره ۱', type: 'pc', status: 'available', hourlyRate: 50000 },
  { id: '2', name: 'PC شماره ۲', type: 'pc', status: 'occupied', hourlyRate: 50000, currentSession: {
    id: 's1', deviceId: '2', startTime: new Date(Date.now() - 3600000), totalPausedTime: 0, isPaused: false
  }},
  { id: '3', name: 'PC شماره ۳', type: 'pc', status: 'available', hourlyRate: 50000 },
  { id: '4', name: 'PC شماره ۴', type: 'pc', status: 'maintenance', hourlyRate: 50000 },
  { id: '5', name: 'PC شماره ۵', type: 'pc', status: 'occupied', hourlyRate: 50000, currentSession: {
    id: 's2', deviceId: '5', startTime: new Date(Date.now() - 7200000), totalPausedTime: 0, isPaused: true, pausedAt: new Date(Date.now() - 1800000)
  }},
  { id: '6', name: 'پلی‌استیشن ۱', type: 'playstation', status: 'available', hourlyRate: 80000 },
  { id: '7', name: 'پلی‌استیشن ۲', type: 'playstation', status: 'occupied', hourlyRate: 80000, currentSession: {
    id: 's3', deviceId: '7', startTime: new Date(Date.now() - 1800000), totalPausedTime: 0, isPaused: false
  }},
  { id: '8', name: 'بیلیارد ۱', type: 'billiard', status: 'available', hourlyRate: 120000 },
  { id: '9', name: 'بیلیارد ۲', type: 'billiard', status: 'occupied', hourlyRate: 120000, currentSession: {
    id: 's4', deviceId: '9', startTime: new Date(Date.now() - 5400000), totalPausedTime: 0, isPaused: false
  }},
];

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);

  const startSession = (deviceId: string) => {
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          status: 'occupied' as const,
          currentSession: {
            id: `s${Date.now()}`,
            deviceId,
            startTime: new Date(),
            totalPausedTime: 0,
            isPaused: false,
          },
        };
      }
      return device;
    }));
  };

  const pauseSession = (deviceId: string) => {
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId && device.currentSession) {
        const session = device.currentSession;
        if (session.isPaused && session.pausedAt) {
          // Resume
          const additionalPausedTime = (Date.now() - session.pausedAt.getTime()) / 1000;
          return {
            ...device,
            currentSession: {
              ...session,
              isPaused: false,
              pausedAt: undefined,
              totalPausedTime: session.totalPausedTime + additionalPausedTime,
            },
          };
        } else {
          // Pause
          return {
            ...device,
            currentSession: {
              ...session,
              isPaused: true,
              pausedAt: new Date(),
            },
          };
        }
      }
      return device;
    }));
  };

  const stopSession = (deviceId: string) => {
    setDevices(prev => prev.map(device => {
      if (device.id === deviceId) {
        return {
          ...device,
          status: 'available' as const,
          currentSession: undefined,
        };
      }
      return device;
    }));
  };

  const getStats = () => {
    const available = devices.filter(d => d.status === 'available').length;
    const occupied = devices.filter(d => d.status === 'occupied').length;
    const maintenance = devices.filter(d => d.status === 'maintenance').length;
    return { available, occupied, maintenance, total: devices.length };
  };

  return {
    devices,
    startSession,
    pauseSession,
    stopSession,
    getStats,
  };
}
