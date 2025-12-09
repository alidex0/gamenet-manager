import { useState, useEffect } from 'react';
import { Monitor, Gamepad, Circle, Play, Pause, Square, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Device, DeviceType } from '@/types';

interface DeviceCardProps {
  device: Device;
  onStart: (id: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => void;
}

const deviceIcons: Record<DeviceType, typeof Monitor> = {
  pc: Monitor,
  playstation: Gamepad,
  billiard: Circle,
  other: Circle,
};

const deviceLabels: Record<DeviceType, string> = {
  pc: 'کامپیوتر',
  playstation: 'پلی‌استیشن',
  billiard: 'بیلیارد',
  other: 'سایر',
};

export function DeviceCard({ device, onStart, onPause, onStop }: DeviceCardProps) {
  const [elapsedTime, setElapsedTime] = useState('۰۰:۰۰:۰۰');
  const Icon = deviceIcons[device.type];

  const statusConfig = {
    available: {
      label: 'آزاد',
      color: 'text-success',
      bg: 'bg-success/10 border-success/30',
      glow: '',
    },
    occupied: {
      label: 'مشغول',
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/30',
      glow: 'glow',
    },
    maintenance: {
      label: 'سرویس',
      color: 'text-warning',
      bg: 'bg-warning/10 border-warning/30',
      glow: '',
    },
  };

  const status = statusConfig[device.status];

  useEffect(() => {
    if (device.status !== 'occupied' || !device.currentSession || device.currentSession.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      const session = device.currentSession!;
      const now = new Date();
      const start = new Date(session.startTime);
      const pausedMs = session.totalPausedTime * 1000;
      const elapsed = now.getTime() - start.getTime() - pausedMs;
      
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      
      const toPersian = (n: number) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
      
      setElapsedTime(
        `${toPersian(hours).padStart(2, '۰')}:${toPersian(minutes).padStart(2, '۰')}:${toPersian(seconds).padStart(2, '۰')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [device]);

  const toPersianNumber = (n: number | string) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  return (
    <div className={cn(
      'glass rounded-2xl p-5 transition-all duration-500 animate-scale-in',
      status.bg,
      status.glow
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'flex h-12 w-12 items-center justify-center rounded-xl',
            device.status === 'occupied' ? 'gradient-primary' : 'bg-secondary'
          )}>
            <Icon className={cn('h-6 w-6', device.status === 'occupied' ? 'text-primary-foreground' : 'text-foreground')} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">{device.name}</h3>
            <p className="text-xs text-muted-foreground">{deviceLabels[device.type]}</p>
          </div>
        </div>
        <span className={cn('text-xs font-medium px-2 py-1 rounded-full', status.bg, status.color)}>
          {status.label}
        </span>
      </div>

      {device.status === 'occupied' && (
        <div className="mb-4 rounded-lg bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">زمان سپری شده</span>
            <span className={cn(
              'font-mono text-lg font-bold',
              device.currentSession?.isPaused ? 'text-warning' : 'text-primary glow-text'
            )}>
              {elapsedTime}
            </span>
          </div>
          {device.currentSession?.isPaused && (
            <p className="text-xs text-warning mt-1">⏸ متوقف شده</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
        <span>تعرفه ساعتی</span>
        <span className="font-medium text-foreground">
          {toPersianNumber(device.hourlyRate.toLocaleString())} تومان
        </span>
      </div>

      <div className="flex gap-2">
        {device.status === 'available' && (
          <Button 
            variant="glow" 
            size="sm" 
            className="flex-1"
            onClick={() => onStart(device.id)}
          >
            <Play className="h-4 w-4" />
            شروع
          </Button>
        )}
        {device.status === 'occupied' && (
          <>
            <Button 
              variant={device.currentSession?.isPaused ? 'success' : 'warning'}
              size="sm"
              className="flex-1"
              onClick={() => onPause(device.id)}
            >
              {device.currentSession?.isPaused ? (
                <>
                  <Play className="h-4 w-4" />
                  ادامه
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4" />
                  توقف
                </>
              )}
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              className="flex-1"
              onClick={() => onStop(device.id)}
            >
              <Square className="h-4 w-4" />
              پایان
            </Button>
          </>
        )}
        {device.status === 'maintenance' && (
          <Button variant="outline" size="sm" className="flex-1" disabled>
            <Wrench className="h-4 w-4" />
            در حال سرویس
          </Button>
        )}
      </div>
    </div>
  );
}
