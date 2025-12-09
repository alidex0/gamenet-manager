import { useState } from 'react';
import { Plus, Filter, Monitor, Gamepad, Circle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { useDevices } from '@/hooks/useDevices';
import { DeviceType } from '@/types';
import { cn } from '@/lib/utils';

const deviceTypes: { type: DeviceType | 'all'; label: string; icon: typeof Monitor }[] = [
  { type: 'all', label: 'همه', icon: Filter },
  { type: 'pc', label: 'کامپیوتر', icon: Monitor },
  { type: 'playstation', label: 'پلی‌استیشن', icon: Gamepad },
  { type: 'billiard', label: 'بیلیارد', icon: Circle },
];

const Devices = () => {
  const { devices, startSession, pauseSession, stopSession } = useDevices();
  const [filter, setFilter] = useState<DeviceType | 'all'>('all');

  const filteredDevices = filter === 'all' 
    ? devices 
    : devices.filter(d => d.type === filter);

  return (
    <MainLayout title="مدیریت دستگاه‌ها" subtitle="نظارت و کنترل دستگاه‌های گیم نت">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {deviceTypes.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
        <Button variant="glow" className="gap-2">
          <Plus className="h-4 w-4" />
          افزودن دستگاه
        </Button>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDevices.map((device, index) => (
          <div key={device.id} style={{ animationDelay: `${index * 0.05}s` }}>
            <DeviceCard
              device={device}
              onStart={startSession}
              onPause={pauseSession}
              onStop={stopSession}
            />
          </div>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Monitor className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">دستگاهی یافت نشد</h3>
          <p className="text-sm text-muted-foreground">هیچ دستگاهی در این دسته‌بندی وجود ندارد.</p>
        </div>
      )}
    </MainLayout>
  );
};

export default Devices;
