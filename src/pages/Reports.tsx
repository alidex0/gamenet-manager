import { BarChart3, TrendingUp, Calendar, Download, Monitor, Coffee } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const dailyData = [
  { name: 'شنبه', devices: 450000, buffet: 120000 },
  { name: 'یکشنبه', devices: 380000, buffet: 95000 },
  { name: 'دوشنبه', devices: 520000, buffet: 140000 },
  { name: 'سه‌شنبه', devices: 490000, buffet: 110000 },
  { name: 'چهارشنبه', devices: 610000, buffet: 180000 },
  { name: 'پنج‌شنبه', devices: 850000, buffet: 250000 },
  { name: 'جمعه', devices: 920000, buffet: 320000 },
];

const deviceUsage = [
  { name: 'PC', value: 45, color: 'hsl(174, 72%, 50%)' },
  { name: 'پلی‌استیشن', value: 35, color: 'hsl(270, 70%, 60%)' },
  { name: 'بیلیارد', value: 20, color: 'hsl(38, 92%, 50%)' },
];

const hourlyData = [
  { hour: '۱۰', usage: 20 },
  { hour: '۱۲', usage: 35 },
  { hour: '۱۴', usage: 55 },
  { hour: '۱۶', usage: 75 },
  { hour: '۱۸', usage: 90 },
  { hour: '۲۰', usage: 95 },
  { hour: '۲۲', usage: 80 },
  { hour: '۰۰', usage: 45 },
];

const toPersianNumber = (n: number | string) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

const Reports = () => {
  return (
    <MainLayout title="گزارش‌ها" subtitle="تحلیل عملکرد و آمار">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex gap-2">
          <Button variant="default" size="sm">روزانه</Button>
          <Button variant="outline" size="sm">هفتگی</Button>
          <Button variant="outline" size="sm">ماهانه</Button>
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
          value={`${toPersianNumber(4220000)}`}
          subtitle="تومان"
          icon={TrendingUp}
          variant="primary"
          trend={{ value: 15, isPositive: true }}
        />
        <StatCard
          title="درآمد دستگاه‌ها"
          value={`${toPersianNumber(3220000)}`}
          subtitle="تومان"
          icon={Monitor}
          variant="success"
        />
        <StatCard
          title="درآمد بوفه"
          value={`${toPersianNumber(1000000)}`}
          subtitle="تومان"
          icon={Coffee}
        />
        <StatCard
          title="میانگین روزانه"
          value={`${toPersianNumber(602857)}`}
          subtitle="تومان"
          icon={BarChart3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <div className="glass rounded-2xl p-6 animate-fade-in">
          <h3 className="font-bold text-foreground mb-6">درآمد هفتگی</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyData}>
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
        </div>

        {/* Device Usage Pie */}
        <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="font-bold text-foreground mb-6">سهم درآمد هر نوع دستگاه</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={deviceUsage}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                label={({ name, value }) => `${name} ${toPersianNumber(value)}%`}
              >
                {deviceUsage.map((entry, index) => (
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
        </div>
      </div>

      {/* Hourly Usage */}
      <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <h3 className="font-bold text-foreground mb-6">ساعات اوج مصرف</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={hourlyData}>
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
      </div>
    </MainLayout>
  );
};

export default Reports;
