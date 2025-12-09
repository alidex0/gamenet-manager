import { useState, useEffect } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface EditDeviceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceName: string;
  hourlyRate: number;
  onSave: (name: string, hourlyRate: number) => void;
}

const toPersianNumber = (n: number | string) => 
  n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

const toEnglishNumber = (str: string) => 
  str.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());

export function EditDeviceDialog({ 
  open, 
  onOpenChange, 
  deviceName, 
  hourlyRate,
  onSave 
}: EditDeviceDialogProps) {
  const [name, setName] = useState(deviceName);
  const [rate, setRate] = useState(hourlyRate.toString());

  useEffect(() => {
    if (open) {
      setName(deviceName);
      setRate(hourlyRate.toString());
    }
  }, [open, deviceName, hourlyRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedRate = parseInt(toEnglishNumber(rate), 10);
    if (name.trim() && !isNaN(parsedRate) && parsedRate > 0) {
      onSave(name.trim(), parsedRate);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5 text-primary" />
            ویرایش دستگاه
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="device-name">نام دستگاه</Label>
            <Input
              id="device-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="نام دستگاه..."
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourly-rate">تعرفه ساعتی (تومان)</Label>
            <Input
              id="hourly-rate"
              type="text"
              inputMode="numeric"
              value={toPersianNumber(rate)}
              onChange={(e) => setRate(toEnglishNumber(e.target.value))}
              placeholder="مثال: ۵۰۰۰۰"
              className="bg-secondary/50"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" className="flex-1">
              ذخیره
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
