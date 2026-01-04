import { useState, useEffect } from 'react';
import { Save, Monitor, DollarSign, Clock, Bell, Shield, Palette, Eye, EyeOff } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useChangePassword } from '@/hooks/useChangePassword';
import { useDefaultRates } from '@/hooks/useDefaultRates';

const Settings = () => {
  const { rates, loading: ratesLoading, updateRates } = useDefaultRates();
  const [displayRates, setDisplayRates] = useState({
    pc: rates.pc.toString(),
    playstation: rates.playstation.toString(),
    billiard: rates.billiard.toString(),
  });

  useEffect(() => {
    setDisplayRates({
      pc: rates.pc.toString(),
      playstation: rates.playstation.toString(),
      billiard: rates.billiard.toString(),
    });
  }, [rates]);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const { loading: passwordLoading, changePassword } = useChangePassword();

  const handleSaveRates = async () => {
    const newRates = {
      pc: parseInt(displayRates.pc) || 0,
      playstation: parseInt(displayRates.playstation) || 0,
      billiard: parseInt(displayRates.billiard) || 0,
    };
    await updateRates(newRates);
  };

  const handleChangePassword = async () => {
    if (passwordForm.new !== passwordForm.confirm) {
      alert('رمز عبور جدید و تأیید آن با هم مطابقت ندارند');
      return;
    }

    const result = await changePassword(passwordForm.current, passwordForm.new);
    if (result.success) {
      setPasswordForm({ current: '', new: '', confirm: '' });
    }
  };

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
              type="number"
              value={displayRates.pc} 
              onChange={(e) => setDisplayRates(p => ({ ...p, pc: e.target.value }))}
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label>پلی‌استیشن (تومان)</Label>
            <Input 
              type="number"
              value={displayRates.playstation} 
              onChange={(e) => setDisplayRates(p => ({ ...p, playstation: e.target.value }))}
              className="bg-secondary/50"
            />
          </div>
          <div className="space-y-2">
            <Label>بیلیارد (تومان)</Label>
            <Input 
              type="number"
              value={displayRates.billiard} 
              onChange={(e) => setDisplayRates(p => ({ ...p, billiard: e.target.value }))}
              className="bg-secondary/50"
            />
          </div>
          <Button 
            onClick={handleSaveRates}
            disabled={ratesLoading}
            className="md:col-span-3 mt-4"
          >
            {ratesLoading ? 'در حال ذخیره...' : 'ذخیره تعرفه‌ها'}
          </Button>
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
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label>رمز عبور فعلی</Label>
              <div className="relative">
                <Input 
                  type={showPasswords.current ? 'text' : 'password'}
                  placeholder="رمز عبور فعلی را وارد کنید"
                  value={passwordForm.current}
                  onChange={(e) => setPasswordForm(p => ({ ...p, current: e.target.value }))}
                  className="bg-secondary/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>رمز عبور جدید</Label>
              <div className="relative">
                <Input 
                  type={showPasswords.new ? 'text' : 'password'}
                  placeholder="رمز عبور جدید را وارد کنید"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(p => ({ ...p, new: e.target.value }))}
                  className="bg-secondary/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>تأیید رمز عبور جدید</Label>
              <div className="relative">
                <Input 
                  type={showPasswords.confirm ? 'text' : 'password'}
                  placeholder="رمز عبور جدید را دوباره وارد کنید"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(p => ({ ...p, confirm: e.target.value }))}
                  className="bg-secondary/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button 
              onClick={handleChangePassword}
              disabled={passwordLoading || !passwordForm.current || !passwordForm.new || !passwordForm.confirm}
              className="w-full"
            >
              {passwordLoading ? 'در حال تغییر...' : 'تغییر رمز عبور'}
            </Button>
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
            تمام تنظیمات خودکار ذخیره شدند
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;
