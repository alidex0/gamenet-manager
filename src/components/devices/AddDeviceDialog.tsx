import { useState, useEffect } from 'react';
import { Monitor, Gamepad, Circle, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NewDevice } from '@/hooks/useDevicesDB';
import { useDefaultRates } from '@/hooks/useDefaultRates';

interface AddDeviceDialogProps {
  onAdd: (device: NewDevice) => Promise<{ success: boolean }>;
}

type DeviceTypeValue = 'pc' | 'playstation' | 'billiard' | 'other';

interface DeviceType {
  value: DeviceTypeValue;
  label: string;
  icon: any;
}

const deviceTypeConfig: DeviceType[] = [
  { value: 'pc', label: 'کامپیوتر', icon: Monitor },
  { value: 'playstation', label: 'پلی‌استیشن', icon: Gamepad },
  { value: 'billiard', label: 'بیلیارد', icon: Circle },
  { value: 'other', label: 'سایر', icon: Circle },
];

export function AddDeviceDialog({ onAdd }: AddDeviceDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { rates } = useDefaultRates();
  const [formData, setFormData] = useState<{
    name: string;
    type: DeviceTypeValue;
    hourly_rate: number;
  }>({
    name: '',
    type: 'pc',
    hourly_rate: 50000,
  });

  // Sync hourly_rate with default rates when they change
  useEffect(() => {
    if (formData.type === 'pc') {
      setFormData(prev => ({ ...prev, hourly_rate: rates.pc }));
    } else if (formData.type === 'playstation') {
      setFormData(prev => ({ ...prev, hourly_rate: rates.playstation }));
    } else if (formData.type === 'billiard') {
      setFormData(prev => ({ ...prev, hourly_rate: rates.billiard }));
    }
  }, [rates, formData.type]);

  const handleTypeChange = (type: string) => {
    const newType = type as DeviceTypeValue;
    let newRate = 50000;
    
    if (newType === 'pc') {
      newRate = rates.pc;
    } else if (newType === 'playstation') {
      newRate = rates.playstation;
    } else if (newType === 'billiard') {
      newRate = rates.billiard;
    }

    setFormData(prev => ({
      ...prev,
      type: newType,
      hourly_rate: newRate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setLoading(true);
    const result = await onAdd(formData);
    setLoading(false);

    if (result.success) {
      const defaultRate = formData.type === 'pc' ? rates.pc : 
                          formData.type === 'playstation' ? rates.playstation :
                          formData.type === 'billiard' ? rates.billiard : 50000;
      setFormData({ name: '', type: 'pc', hourly_rate: defaultRate });
      setOpen(false);
    }
  };

  const toPersianNumber = (n: number | string) => 
    n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glow" className="gap-2">
          <Plus className="h-4 w-4" />
          افزودن دستگاه
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>افزودن دستگاه جدید</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">نام دستگاه</Label>
            <Input
              id="name"
              placeholder="مثال: PC شماره ۶"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-secondary/50"
            />
          </div>

          <div className="space-y-2">
            <Label>نوع دستگاه</Label>
            <Select value={formData.type} onValueChange={handleTypeChange}>
              <SelectTrigger className="bg-secondary/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {deviceTypeConfig.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="rate">تعرفه ساعتی (تومان)</Label>
            <Input
              id="rate"
              type="number"
              value={formData.hourly_rate}
              onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: parseInt(e.target.value) || 0 }))}
              className="bg-secondary/50"
              dir="ltr"
            />
            <p className="text-xs text-muted-foreground">
              {toPersianNumber(formData.hourly_rate.toLocaleString())} تومان در ساعت
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              انصراف
            </Button>
            <Button
              type="submit"
              variant="glow"
              className="flex-1"
              disabled={loading || !formData.name.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  در حال افزودن...
                </>
              ) : (
                'افزودن دستگاه'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
