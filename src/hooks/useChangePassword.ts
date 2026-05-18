import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function useChangePassword() {
  const [loading, setLoading] = useState(false);
  const { isLocalMode } = useAuth();

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (isLocalMode) {
      toast.info('در حالت لوکال نیازی به رمز عبور نیست');
      return { success: true };
    }

    if (!currentPassword || !newPassword) {
      toast.error('لطفا تمام فیلدها را پر کنید');
      return { success: false };
    }
    if (newPassword.length < 6) {
      toast.error('رمز عبور جدید باید حداقل 6 کاراکتر باشد');
      return { success: false };
    }

    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        toast.error('خطا: کاربر یافت نشد');
        return { success: false };
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        if (error.message.includes('weak')) {
          toast.error('رمز عبور خیلی ضعیف است. از ترکیب حروف بزرگ، کوچک، عدد و نماد استفاده کنید');
        } else {
          toast.error(`خطا: ${error.message}`);
        }
        return { success: false };
      }
      toast.success('رمز عبور با موفقیت تغییر یافت');
      return { success: true };
    } catch (e) {
      console.error(e);
      toast.error('خطا در تغییر رمز عبور');
      return { success: false };
    } finally { setLoading(false); }
  };

  return { loading, changePassword };
}
