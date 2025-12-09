import { Monitor, Users, DollarSign, Coffee, LogOut } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { DeviceCardDB } from '@/components/dashboard/DeviceCardDB';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { useDevicesDB } from '@/hooks/useDevicesDB';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const { devices, loading, startSession, pauseSession, stopSession, getStats } = useDevicesDB();
  const { signOut, user, userRole } = useAuth();
  const stats = getStats();

  const toPersianNumber = (n: number) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  const roleLabels = {
    admin: 'مدیر',
    staff: 'کارمند',
    customer: 'مشتری',
  };

  if (loading) {
    return (
      <MainLayout title="داشبورد" subtitle="در حال بارگذاری...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="داشبورد" subtitle="نمای کلی وضعیت گیم نت">
      {/* User Info Bar */}
      <div className="glass rounded-xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-foreground">{user?.email}</p>
            <p className="text-xs text-muted-foreground">
              {userRole ? roleLabels[userRole] : 'کاربر'}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={signOut} className="gap-2">
          <LogOut className="h-4 w-4" />
          خروج
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="دستگاه‌های فعال"
          value={toPersianNumber(stats.occupied)}
          subtitle={`از ${toPersianNumber(stats.total)} دستگاه`}
          icon={Monitor}
          variant="primary"
        />
        <StatCard
          title="درآمد امروز"
          value={`${toPersianNumber(0)} ت`}
          subtitle="تومان"
          icon={DollarSign}
          variant="success"
        />
        <StatCard
          title="فروش بوفه"
          value={`${toPersianNumber(0)} ت`}
          subtitle="۰ تراکنش"
          icon={Coffee}
        />
        <StatCard
          title="کاربران آنلاین"
          value={toPersianNumber(stats.occupied)}
          subtitle="کاربر فعال"
          icon={Users}
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
                <DeviceCardDB
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
