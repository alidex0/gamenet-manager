import { useState } from 'react';
import { Save, Monitor, DollarSign, Clock, Bell, Shield, Palette } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const Settings = () => {
  const [rates, setRates] = useState({
    pc: '۵۰۰۰۰',
    playstation: '۸۰۰۰۰',
    billiard: '۱۲۰۰۰۰',
  });

  const settingsSections = [
    {
      title: 'تعرفه‌های ساعتی',
      icon: DollarSign,
      description: 'تنظیم نرخ هر ساعت برای هر نوع دستگاه',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label>کامپیوتر (تومان)</Label>
            <Input 
              value={rates.pc} 
              onChange={(e) => setRates(p => ({ ...p, pc: e.target.value }))}
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label>پلی‌استیشن (تومان)</Label>
            <Input 
              value={rates.playstation} 
              onChange={(e) => setRates(p => ({ ...p, playstation: e.target.value }))}
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label>بیلیارد (تومان)</Label>
            <Input 
              value={rates.billiard} 
              onChange={(e) => setRates(p => ({ ...p, billiard: e.target.value }))}
              className="bg-secondary/50"
            />
          </div>
        </div>
      ),
    },
    {
      title: 'ساعات کاری',
      icon: Clock,
      description: 'تنظیم ساعات باز و بسته شدن گیم نت',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>ساعت شروع</Label>
            <Input type="time" defaultValue="10:00" className="bg-secondary/50" />
          </div>
          <div className="space-y-2">
            <Label>ساعت پایان</Label>
            <Input type="time" defaultValue="00:00" className="bg-secondary/50" />
          </div>
        </div>
      ),
    },
    {
      title: 'اعلان‌ها',
      icon: Bell,
      description: 'تنظیم اعلان‌ها و هشدارها',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">اعلان پایان زمان</p>
              <p className="text-sm text-muted-foreground">نمایش هشدار ۵ دقیقه قبل از پایان زمان</p>
            </div>
            <Switch dir='ltr' defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">اعلان موجودی کم</p>
              <p className="text-sm text-muted-foreground">هشدار کم بودن موجودی محصولات بوفه</p>
            </div>
            <Switch dir='ltr' defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">اعلان صوتی</p>
              <p className="text-sm text-muted-foreground">پخش صدا برای اعلان‌های مهم</p>
            </div>
            <Switch dir='ltr' />
          </div>
        </div>
      ),
    },
    {
      title: 'امنیت',
      icon: Shield,
      description: 'تنظیمات امنیتی و رمز عبور',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>رمز عبور فعلی</Label>
              <Input type="password" className="bg-secondary/50" />
            </div>
            <div className="space-y-2">
              <Label>رمز عبور جدید</Label>
              <Input type="password" className="bg-secondary/50" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">احراز هویت دو مرحله‌ای</p>
              <p className="text-sm text-muted-foreground">افزایش امنیت با تأیید پیامکی</p>
            </div>
            <Switch  dir='ltr' />
          </div>
        </div>
      ),
    },
  ];

  return (
    <MainLayout title="تنظیمات" subtitle="پیکربندی سیستم">
      <div className="space-y-6">
        {settingsSections.map((section, index) => (
          <div 
            key={section.title}
            className="glass rounded-2xl p-6 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary">
                <section.icon className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">{section.title}</h3>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
            </div>
            {section.content}
          </div>
        ))}

        <div className="flex justify-end">
          <Button variant="glow" className="gap-2">
            <Save className="h-4 w-4" />
            ذخیره تغییرات
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
