import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, User } from 'lucide-react';

interface StartSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceName: string;
  onConfirm: (customerName?: string) => void;
}

export function StartSessionDialog({
  open,
  onOpenChange,
  deviceName,
  onConfirm,
}: StartSessionDialogProps) {
  const [customerName, setCustomerName] = useState('');

  const handleConfirm = () => {
    onConfirm(customerName.trim() || undefined);
    setCustomerName('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setCustomerName('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>شروع زمان‌بندی</DialogTitle>
          <DialogDescription>
            شروع استفاده از {deviceName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="customerName" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              نام مشتری (اختیاری)
            </Label>
            <Input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="مثال: علی محمدی"
              className="text-right"
              dir="rtl"
            />
            <p className="text-xs text-muted-foreground">
              می‌توانید نام مشتری را برای پیگیری بهتر وارد کنید
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleCancel}>
            انصراف
          </Button>
          <Button variant="glow" onClick={handleConfirm}>
            <Play className="h-4 w-4 ml-2" />
            شروع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
