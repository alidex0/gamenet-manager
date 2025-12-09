import { useState, useEffect, useMemo } from 'react';
import { Monitor, Gamepad, Circle, Play, Pause, Square, Wrench, Trash2, MoreVertical, User, Clock, Pencil, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DeviceWithSession } from '@/hooks/useDevicesDB';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditCustomerDialog } from '@/components/devices/EditCustomerDialog';
import { EditDeviceDialog } from '@/components/devices/EditDeviceDialog';

interface InvoiceData {
  deviceName: string;
  deviceType: string;
  customerName: string | null;
  startTime: Date;
  endTime: Date;
  totalSeconds: number;
  hourlyRate: number;
  deviceCost: number;
  buffetSales: Array<{
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  buffetTotal: number;
  grandTotal: number;
}

interface DeviceCardDBProps {
  device: DeviceWithSession;
  onStart: (id: string, customerName?: string) => void;
  onPause: (id: string) => void;
  onStop: (id: string) => Promise<{ success: boolean; invoiceData?: InvoiceData }>;
  onDelete?: (id: string) => void;
  onSetMaintenance?: (id: string) => void;
  onUpdateCustomerName?: (id: string, customerName: string | null) => void;
  onUpdateDevice?: (id: string, updates: { name?: string; hourly_rate?: number }) => void;
  showManageOptions?: boolean;
  onShowInvoice?: (invoice: InvoiceData) => void;
}

const deviceIcons = {
  pc: Monitor,
  playstation: Gamepad,
  billiard: Circle,
  other: Circle,
};

const deviceLabels = {
  pc: 'کامپیوتر',
  playstation: 'پلی‌استیشن',
  billiard: 'بیلیارد',
  other: 'سایر',
};

const toPersianNumber = (n: number | string) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

export function DeviceCardDB({ 
  device, 
  onStart, 
  onPause, 
  onStop, 
  onDelete,
  onSetMaintenance,
  onUpdateCustomerName,
  onUpdateDevice,
  showManageOptions = false,
  onShowInvoice
}: DeviceCardDBProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditCustomerDialog, setShowEditCustomerDialog] = useState(false);
  const [showEditDeviceDialog, setShowEditDeviceDialog] = useState(false);
  const Icon = deviceIcons[device.type];

  const statusConfig = {
    available: {
      label: 'آزاد',
      color: 'text-success',
      bg: 'bg-success/10 border-success/30',
      glow: '',
    },
    occupied: {
      label: 'مشغول',
      color: 'text-primary',
      bg: 'bg-primary/10 border-primary/30',
      glow: 'glow',
    },
    maintenance: {
      label: 'سرویس',
      color: 'text-warning',
      bg: 'bg-warning/10 border-warning/30',
      glow: '',
    },
  };

  const status = statusConfig[device.status];

  useEffect(() => {
    if (device.status !== 'occupied' || !device.currentSession) {
      setElapsedSeconds(0);
      return;
    }

    const calculateElapsed = () => {
      const session = device.currentSession!;
      const now = new Date();
      const start = new Date(session.start_time);
      let pausedSeconds = session.total_paused_seconds || 0;
      
      // If currently paused, add time since pause started
      if (session.is_paused && session.paused_at) {
        const pausedAt = new Date(session.paused_at);
        pausedSeconds += Math.floor((now.getTime() - pausedAt.getTime()) / 1000);
      }
      
      const elapsed = Math.floor((now.getTime() - start.getTime()) / 1000) - pausedSeconds;
      return Math.max(0, elapsed);
    };

    setElapsedSeconds(calculateElapsed());

    if (device.currentSession.is_paused) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(calculateElapsed());
    }, 1000);

    return () => clearInterval(interval);
  }, [device]);

  // Calculate current cost based on elapsed time
  const currentCost = useMemo(() => {
    const hours = elapsedSeconds / 3600;
    return Math.ceil(hours * device.hourly_rate);
  }, [elapsedSeconds, device.hourly_rate]);

  // Format elapsed time as compact string
  const formattedTime = useMemo(() => {
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return `${toPersianNumber(hours.toString().padStart(2, '0'))}:${toPersianNumber(minutes.toString().padStart(2, '0'))}:${toPersianNumber(seconds.toString().padStart(2, '0'))}`;
  }, [elapsedSeconds]);

  const handleDelete = () => {
    if (onDelete) {
      onDelete(device.id);
    }
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className={cn(
        'glass rounded-2xl p-5 transition-all duration-500 animate-scale-in relative',
        status.bg,
        status.glow
      )}>
        {/* Menu for manage options */}
        {showManageOptions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-3 left-3 h-8 w-8"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover">
              {onUpdateDevice && (
                <DropdownMenuItem onClick={() => setShowEditDeviceDialog(true)}>
                  <Settings className="h-4 w-4 ml-2" />
                  ویرایش تعرفه
                </DropdownMenuItem>
              )}
              {device.status === 'available' && onSetMaintenance && (
                <DropdownMenuItem onClick={() => onSetMaintenance(device.id)}>
                  <Wrench className="h-4 w-4 ml-2" />
                  انتقال به سرویس
                </DropdownMenuItem>
              )}
              {device.status === 'maintenance' && onSetMaintenance && (
                <DropdownMenuItem onClick={() => onSetMaintenance(device.id)}>
                  <Monitor className="h-4 w-4 ml-2" />
                  فعال کردن
                </DropdownMenuItem>
              )}
              {device.status !== 'occupied' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 ml-2" />
                    حذف دستگاه
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'flex h-12 w-12 items-center justify-center rounded-xl',
              device.status === 'occupied' ? 'gradient-primary' : 'bg-secondary'
            )}>
              <Icon className={cn('h-6 w-6', device.status === 'occupied' ? 'text-primary-foreground' : 'text-foreground')} />
            </div>
            <div>
              <h3 className="font-bold text-foreground">{device.name}</h3>
              <p className="text-xs text-muted-foreground">{deviceLabels[device.type]}</p>
            </div>
          </div>
          <span className={cn('text-xs font-medium px-2 py-1 rounded-full', status.bg, status.color)}>
            {status.label}
          </span>
        </div>

        {device.status === 'occupied' && device.currentSession && (
          <div className="mb-4 space-y-2">
            {/* Customer name if present */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{(device.currentSession as any).customer_name || 'بدون نام'}</span>
              </div>
              {onUpdateCustomerName && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowEditCustomerDialog(true)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
            
            {/* Cost display - main focus */}
            <div className="rounded-lg bg-background/50 p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">هزینه فعلی</span>
                <span className={cn(
                  'text-xl font-bold',
                  device.currentSession.is_paused ? 'text-warning' : 'text-primary glow-text'
                )}>
                  {toPersianNumber(currentCost.toLocaleString())} <span className="text-sm">تومان</span>
                </span>
              </div>
            </div>
            
            {/* Compact timer */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>زمان</span>
              </div>
              <span className={cn(
                'font-mono font-medium',
                device.currentSession.is_paused ? 'text-warning' : 'text-foreground'
              )}>
                {formattedTime}
                {device.currentSession.is_paused && ' ⏸'}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span>تعرفه ساعتی</span>
          <span className="font-medium text-foreground">
            {toPersianNumber(device.hourly_rate.toLocaleString())} تومان
          </span>
        </div>

        <div className="flex gap-2">
          {device.status === 'available' && (
            <Button 
              variant="glow" 
              size="sm" 
              className="flex-1"
              onClick={() => onStart(device.id)}
            >
              <Play className="h-4 w-4" />
              شروع
            </Button>
          )}
          {device.status === 'occupied' && (
            <>
              <Button 
                variant={device.currentSession?.is_paused ? 'success' : 'warning'}
                size="sm"
                className="flex-1"
                onClick={() => onPause(device.id)}
              >
                {device.currentSession?.is_paused ? (
                  <>
                    <Play className="h-4 w-4" />
                    ادامه
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4" />
                    توقف
                  </>
                )}
              </Button>
              <Button 
                variant="destructive" 
                size="sm"
                className="flex-1"
                onClick={async () => {
                  const result = await onStop(device.id);
                  if (result.success && result.invoiceData && onShowInvoice) {
                    onShowInvoice(result.invoiceData);
                  }
                }}
              >
                <Square className="h-4 w-4" />
                پایان
              </Button>
            </>
          )}
          {device.status === 'maintenance' && (
            <Button variant="outline" size="sm" className="flex-1" disabled>
              <Wrench className="h-4 w-4" />
              در حال سرویس
            </Button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دستگاه</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{device.name}» اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Edit Customer Dialog */}
      {device.currentSession && onUpdateCustomerName && (
        <EditCustomerDialog
          open={showEditCustomerDialog}
          onOpenChange={setShowEditCustomerDialog}
          currentName={(device.currentSession as any).customer_name}
          onSave={(name) => onUpdateCustomerName(device.id, name)}
        />
      )}

      {/* Edit Device Dialog */}
      {onUpdateDevice && (
        <EditDeviceDialog
          open={showEditDeviceDialog}
          onOpenChange={setShowEditDeviceDialog}
          deviceName={device.name}
          hourlyRate={device.hourly_rate}
          onSave={(name, hourlyRate) => onUpdateDevice(device.id, { name, hourly_rate: hourlyRate })}
        />
      )}
    </>
  );
}
