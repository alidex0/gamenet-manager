import { useState } from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string | null;
  onSave: (customerName: string | null) => void;
}

export function EditCustomerDialog({
  open,
  onOpenChange,
  currentName,
  onSave,
}: EditCustomerDialogProps) {
  const [customerName, setCustomerName] = useState(currentName || '');

  const handleSave = () => {
    onSave(customerName.trim() || null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            ویرایش نام مشتری
          </DialogTitle>
          <DialogDescription>
            نام مشتری را برای این جلسه تغییر دهید
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              نام مشتری
            </label>
            <Input
              placeholder="نام مشتری..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="bg-secondary/50"
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button variant="glow" onClick={handleSave}>
            ذخیره
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
