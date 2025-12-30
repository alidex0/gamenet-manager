import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useChangePassword() {
  const [loading, setLoading] = useState(false);

  const changePassword = async (currentPassword: string, newPassword: string) => {
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
      // First, try to sign in with current credentials to verify password
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user?.email) {
        toast.error('خطا: کاربر یافت نشد');
        return { success: false };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        // If error is about weak password, provide specific message
        if (error.message.includes('weak')) {
          toast.error('رمز عبور خیلی ضعیف است. از ترکیب حروف بزرگ، کوچک، عدد و نماد استفاده کنید');
        } else {
          toast.error(`خطا: ${error.message}`);
        }
        return { success: false };
      }

      toast.success('رمز عبور با موفقیت تغییر یافت');
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('خطا در تغییر رمز عبور');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    changePassword,
  };
}
