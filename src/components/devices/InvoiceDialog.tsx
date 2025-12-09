import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Monitor, Package, Clock, User, Receipt, Printer } from 'lucide-react';

interface SaleItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface InvoiceData {
  deviceName: string;
  deviceType: string;
  customerName: string | null;
  startTime: Date;
  endTime: Date;
  totalSeconds: number;
  hourlyRate: number;
  deviceCost: number;
  buffetSales: SaleItem[];
  buffetTotal: number;
  grandTotal: number;
}

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: InvoiceData | null;
}

const toPersianNumber = (n: number | string) => 
  n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

const formatDuration = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${toPersianNumber(hours)} ساعت`);
  if (minutes > 0) parts.push(`${toPersianNumber(minutes)} دقیقه`);
  if (secs > 0 && hours === 0) parts.push(`${toPersianNumber(secs)} ثانیه`);
  
  return parts.join(' و ') || '۰ ثانیه';
};

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString('fa-IR');
};

const deviceLabels: Record<string, string> = {
  pc: 'کامپیوتر',
  playstation: 'پلی‌استیشن',
  billiard: 'بیلیارد',
  other: 'سایر',
};

export function InvoiceDialog({ open, onOpenChange, invoice }: InvoiceDialogProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md print:shadow-none print:border-none">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            فاکتور پایان نشست
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header Info */}
          <div className="glass rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-4 w-4 text-primary" />
                <span className="font-medium">{invoice.deviceName}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {deviceLabels[invoice.deviceType] || invoice.deviceType}
              </span>
            </div>
            
            {invoice.customerName && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{invoice.customerName}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>
                {formatDate(invoice.startTime)} - {formatTime(invoice.startTime)} تا {formatTime(invoice.endTime)}
              </span>
            </div>
          </div>

          {/* Device Cost */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              هزینه دستگاه
            </h4>
            <div className="glass rounded-lg p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">مدت استفاده</span>
                <span>{formatDuration(invoice.totalSeconds)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-muted-foreground">تعرفه ساعتی</span>
                <span>{toPersianNumber(invoice.hourlyRate.toLocaleString())} تومان</span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between font-medium">
                <span>جمع دستگاه</span>
                <span className="text-primary">{toPersianNumber(invoice.deviceCost.toLocaleString())} تومان</span>
              </div>
            </div>
          </div>

          {/* Buffet Sales */}
          {invoice.buffetSales.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4" />
                خرید بوفه
              </h4>
              <div className="glass rounded-lg p-3 space-y-2">
                {invoice.buffetSales.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product_name} × {toPersianNumber(item.quantity)}
                    </span>
                    <span>{toPersianNumber(item.total_price.toLocaleString())} ت</span>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between font-medium">
                  <span>جمع بوفه</span>
                  <span className="text-primary">{toPersianNumber(invoice.buffetTotal.toLocaleString())} تومان</span>
                </div>
              </div>
            </div>
          )}

          {/* Grand Total */}
          <div className="glass rounded-lg p-4 bg-primary/10 border-primary/30">
            <div className="flex items-center justify-between">
              <span className="font-bold text-lg">جمع کل</span>
              <span className="font-bold text-xl text-primary">
                {toPersianNumber(invoice.grandTotal.toLocaleString())} تومان
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" className="flex-1" onClick={handlePrint}>
              <Printer className="h-4 w-4 ml-2" />
              چاپ
            </Button>
            <Button variant="default" className="flex-1" onClick={() => onOpenChange(false)}>
              بستن
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
