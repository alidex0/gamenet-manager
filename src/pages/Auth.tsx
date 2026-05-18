import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Mail, Lock, User, Eye, EyeOff, Loader2, Store, WifiOff, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { probeSupabase } from '@/lib/localBackend';

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
});

const signupSchema = z.object({
  email: z.string().email('ایمیل معتبر نیست'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
  fullName: z.string().min(2, 'نام باید حداقل ۲ کاراکتر باشد'),
  gameCenterName: z.string().min(2, 'نام گیم نت باید حداقل ۲ کاراکتر باشد'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'رمز عبور و تکرار آن مطابقت ندارند',
  path: ['confirmPassword'],
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [online, setOnline] = useState<boolean | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    gameCenterName: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signIn, signUp, signInLocal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    probeSupabase().then(ok => mounted && setOnline(ok));
    return () => { mounted = false; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleLocalEnter = () => {
    signInLocal();
    toast.success('وارد حالت لوکال شدید');
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      if (isLogin) {
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }
        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('ایمیل یا رمز عبور اشتباه است');
          } else {
            toast.error('خطا در ورود: ' + error.message);
          }
        } else {
          toast.success('با موفقیت وارد شدید');
          navigate('/');
        }
      } else {
        const result = signupSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }
        const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.gameCenterName);
        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('این ایمیل قبلاً ثبت شده است');
          } else {
            toast.error('خطا در ثبت نام: ' + error.message);
          }
        } else {
          toast.success('ثبت نام با موفقیت انجام شد! گیم نت شما ایجاد شد.');
          navigate('/');
        }
      }
    } catch (error) {
      toast.error('خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary glow mb-4">
            <Gamepad2 className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">سیستم مدیریت گیم نت</h1>
          <p className="text-muted-foreground">
            {isLogin ? 'وارد حساب خود شوید' : 'گیم نت جدید بسازید'}
          </p>
        </div>

        {online === false && (
          <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-2">
            <WifiOff className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-xs text-destructive">
              اتصال به سرور برقرار نیست. می‌توانید بدون اینترنت و به‌صورت لوکال کار کنید.
            </div>
          </div>
        )}

        <div className="glass rounded-2xl p-8">
          <div className="flex gap-2 mb-8">
            <Button variant={isLogin ? 'default' : 'outline'} className="flex-1" onClick={() => setIsLogin(true)}>
              ورود
            </Button>
            <Button variant={!isLogin ? 'default' : 'outline'} className="flex-1" onClick={() => setIsLogin(false)}>
              ثبت گیم نت جدید
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="gameCenterName">نام گیم نت</Label>
                  <div className="relative">
                    <Store className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="gameCenterName" name="gameCenterName" placeholder="مثال: گیم نت پارس" value={formData.gameCenterName} onChange={handleChange} className="pr-10 bg-secondary/50" />
                  </div>
                  {errors.gameCenterName && <p className="text-xs text-destructive">{errors.gameCenterName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">نام مدیر</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="fullName" name="fullName" placeholder="نام و نام خانوادگی" value={formData.fullName} onChange={handleChange} className="pr-10 bg-secondary/50" />
                  </div>
                  {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">ایمیل</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" name="email" type="email" placeholder="example@email.com" value={formData.email} onChange={handleChange} className="pr-10 bg-secondary/50" dir="ltr" />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">رمز عبور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.password} onChange={handleChange} className="pr-10 pl-10 bg-secondary/50" dir="ltr" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">تکرار رمز عبور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="confirmPassword" name="confirmPassword" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className="pr-10 bg-secondary/50" dir="ltr" />
                </div>
                {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
              </div>
            )}

            <Button type="submit" variant="glow" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  لطفاً صبر کنید...
                </>
              ) : isLogin ? 'ورود به سیستم' : 'ساخت گیم نت'}
            </Button>
          </form>

          {/* Local mode divider + button */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">یا</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full gap-2" onClick={handleLocalEnter}>
            <HardDrive className="h-4 w-4" />
            ورود لوکال بدون رمز عبور
          </Button>
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            داده‌ها فقط روی این دستگاه ذخیره می‌شوند. بعداً می‌توانید با ورود به حساب ابری، آن‌ها را همگام‌سازی کنید.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
