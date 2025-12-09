import { BarChart3, TrendingUp, Download, Monitor, Coffee, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useReports } from '@/hooks/useReports';

const deviceColors: Record<string, string> = {
  pc: 'hsl(174, 72%, 50%)',
  playstation: 'hsl(270, 70%, 60%)',
  billiard: 'hsl(38, 92%, 50%)',
  other: 'hsl(215, 20%, 55%)',
};

const toPersianNumber = (n: number | string) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

const Reports = () => {
  const { loading, dailyRevenue, deviceTypeRevenue, hourlyUsage, stats } = useReports();

  if (loading) {
    return (
      <MainLayout title="گزارش‌ها" subtitle="در حال بارگذاری...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const chartDailyData = dailyRevenue.map(d => ({
    name: d.day_name,
    devices: d.devices_revenue,
    buffet: d.buffet_revenue,
  }));

  const pieData = deviceTypeRevenue.map(d => ({
    name: d.label,
    value: d.percentage,
    color: deviceColors[d.type] || deviceColors.other,
  }));

  return (
    <MainLayout title="گزارش‌ها" subtitle="تحلیل عملکرد و آمار">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex gap-2">
          <Button variant="default" size="sm">هفتگی</Button>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          دانلود گزارش
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="درآمد کل هفته"
          value={toPersianNumber(stats.total_revenue.toLocaleString())}
          subtitle="تومان"
          icon={TrendingUp}
          variant="primary"
        />
        <StatCard
          title="درآمد دستگاه‌ها"
          value={toPersianNumber(stats.devices_revenue.toLocaleString())}
          subtitle="تومان"
          icon={Monitor}
          variant="success"
        />
        <StatCard
          title="درآمد بوفه"
          value={toPersianNumber(stats.buffet_revenue.toLocaleString())}
          subtitle="تومان"
          icon={Coffee}
        />
        <StatCard
          title="میانگین روزانه"
          value={toPersianNumber(stats.average_daily.toLocaleString())}
          subtitle="تومان"
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="glass rounded-2xl p-6 animate-fade-in">
          <h3 className="font-bold text-foreground mb-6">درآمد هفتگی</h3>
          {chartDailyData.length === 0 || chartDailyData.every(d => d.devices === 0 && d.buffet === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>داده‌ای برای نمایش وجود ندارد</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 18%)" />
                <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={12} />
                <YAxis stroke="hsl(215 20% 55%)" fontSize={12} tickFormatter={(v) => `${(v/1000)}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(222 47% 9%)', 
                    border: '1px solid hsl(222 47% 18%)',
                    borderRadius: '8px',
                    direction: 'rtl'
                  }}
                  formatter={(value: number) => [`${toPersianNumber(value.toLocaleString())} تومان`]}
                />
                <Bar dataKey="devices" name="دستگاه‌ها" fill="hsl(174 72% 50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="buffet" name="بوفه" fill="hsl(270 70% 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Device Usage Pie */}
        <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-bold text-foreground mb-6">سهم درآمد هر نوع دستگاه</h3>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              <div className="text-center">
                <Monitor className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p>داده‌ای برای نمایش وجود ندارد</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, value }) => `${name} ${toPersianNumber(value)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(222 47% 9%)', 
                    border: '1px solid hsl(222 47% 18%)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => [`${toPersianNumber(value)}%`]}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Hourly Usage */}
      <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h3 className="font-bold text-foreground mb-6">ساعات اوج مصرف</h3>
        {hourlyUsage.length === 0 || hourlyUsage.every(h => h.usage === 0) ? (
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            <div className="text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>داده‌ای برای نمایش وجود ندارد</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={hourlyUsage}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 47% 18%)" />
              <XAxis dataKey="hour" stroke="hsl(215 20% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 20% 55%)" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(222 47% 9%)', 
                  border: '1px solid hsl(222 47% 18%)',
                  borderRadius: '8px'
                }}
                formatter={(value: number) => [`${toPersianNumber(value)}% استفاده`]}
              />
              <Line 
                type="monotone" 
                dataKey="usage" 
                stroke="hsl(174 72% 50%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(174 72% 50%)', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: 'hsl(174 72% 50%)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </MainLayout>
  );
};

export default Reports;
