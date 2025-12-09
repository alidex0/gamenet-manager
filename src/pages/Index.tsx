import { Monitor, Users, DollarSign, TrendingUp, Coffee, Gamepad, Circle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DeviceCard } from '@/components/dashboard/DeviceCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useDevices } from '@/hooks/useDevices';

const Index = () => {
  const { devices, startSession, pauseSession, stopSession, getStats } = useDevices();
  const stats = getStats();

  const toPersianNumber = (n: number) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  return (
    <MainLayout title="داشبورد" subtitle="نمای کلی وضعیت گیم نت">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="دستگاه‌های فعال"
          value={toPersianNumber(stats.occupied)}
          subtitle={`از ${toPersianNumber(stats.total)} دستگاه`}
          icon={Monitor}
          variant="primary"
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="درآمد امروز"
          value={`${toPersianNumber(2850000)} ت`}
          subtitle="تومان"
          icon={DollarSign}
          variant="success"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="فروش بوفه"
          value={`${toPersianNumber(450000)} ت`}
          subtitle="۲۳ تراکنش"
          icon={Coffee}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="کاربران آنلاین"
          value={toPersianNumber(stats.occupied)}
          subtitle="کاربر فعال"
          icon={Users}
          trend={{ value: 3, isPositive: false }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Devices Section */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">وضعیت دستگاه‌ها</h2>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-success"></span>
                <span className="text-muted-foreground">آزاد ({toPersianNumber(stats.available)})</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-muted-foreground">مشغول ({toPersianNumber(stats.occupied)})</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-warning"></span>
                <span className="text-muted-foreground">سرویس ({toPersianNumber(stats.maintenance)})</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {devices.map((device, index) => (
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
        </div>

        {/* Activity Feed */}
        <div>
          <RecentActivity />
        </div>
      </div>
    </MainLayout>
  );
};

export default Index;
