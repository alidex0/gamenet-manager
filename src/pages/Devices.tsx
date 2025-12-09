import { useState } from 'react';
import { Filter, Monitor, Gamepad, Circle, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { DeviceCardDB } from '@/components/dashboard/DeviceCardDB';
import { AddDeviceDialog } from '@/components/devices/AddDeviceDialog';
import { StartSessionDialog } from '@/components/devices/StartSessionDialog';
import { InvoiceDialog, InvoiceData } from '@/components/devices/InvoiceDialog';
import { useDevicesDB, DeviceWithSession } from '@/hooks/useDevicesDB';
import { useAuth } from '@/contexts/AuthContext';

type DeviceTypeFilter = 'all' | 'pc' | 'playstation' | 'billiard';

const deviceTypes: { type: DeviceTypeFilter; label: string; icon: typeof Monitor }[] = [
  { type: 'all', label: 'همه', icon: Filter },
  { type: 'pc', label: 'کامپیوتر', icon: Monitor },
  { type: 'playstation', label: 'پلی‌استیشن', icon: Gamepad },
  { type: 'billiard', label: 'بیلیارد', icon: Circle },
];

const Devices = () => {
  const { 
    devices, 
    loading, 
    addDevice,
    deleteDevice,
    updateDevice,
    updateDeviceStatus,
    startSession, 
    pauseSession, 
    stopSession,
    updateSessionCustomerName
  } = useDevicesDB();
  const { isStaffOrAdmin } = useAuth();
  const [filter, setFilter] = useState<DeviceTypeFilter>('all');
  const [startDialogDevice, setStartDialogDevice] = useState<DeviceWithSession | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  const filteredDevices = filter === 'all' 
    ? devices 
    : devices.filter(d => d.type === filter);

  const handleSetMaintenance = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      const newStatus = device.status === 'maintenance' ? 'available' : 'maintenance';
      updateDeviceStatus(deviceId, newStatus);
    }
  };

  const handleStartClick = (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      setStartDialogDevice(device);
    }
  };

  const handleStartConfirm = (customerName?: string) => {
    if (startDialogDevice) {
      startSession(startDialogDevice.id, customerName);
      setStartDialogDevice(null);
    }
  };

  if (loading) {
    return (
      <MainLayout title="مدیریت دستگاه‌ها" subtitle="در حال بارگذاری...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="مدیریت دستگاه‌ها" subtitle="نظارت و کنترل دستگاه‌های گیم نت">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap gap-2">
          {deviceTypes.map(({ type, label, icon: Icon }) => (
            <Button
              key={type}
              variant={filter === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(type)}
              className="gap-2"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Button>
          ))}
        </div>
        {isStaffOrAdmin && (
          <AddDeviceDialog onAdd={addDevice} />
        )}
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredDevices.map((device, index) => (
          <div key={device.id} style={{ animationDelay: `${index * 0.05}s` }}>
            <DeviceCardDB
              device={device}
              onStart={handleStartClick}
              onPause={pauseSession}
              onStop={stopSession}
              onDelete={isStaffOrAdmin ? deleteDevice : undefined}
              onSetMaintenance={isStaffOrAdmin ? handleSetMaintenance : undefined}
              onUpdateCustomerName={isStaffOrAdmin ? updateSessionCustomerName : undefined}
              onUpdateDevice={isStaffOrAdmin ? updateDevice : undefined}
              showManageOptions={isStaffOrAdmin}
              onShowInvoice={setInvoiceData}
            />
          </div>
        ))}
      </div>

      {filteredDevices.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Monitor className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">دستگاهی یافت نشد</h3>
          <p className="text-sm text-muted-foreground mb-4">هیچ دستگاهی در این دسته‌بندی وجود ندارد.</p>
          {isStaffOrAdmin && (
            <AddDeviceDialog onAdd={addDevice} />
          )}
        </div>
      )}

      {/* Start Session Dialog */}
      <StartSessionDialog
        open={!!startDialogDevice}
        onOpenChange={(open) => !open && setStartDialogDevice(null)}
        deviceName={startDialogDevice?.name || ''}
        onConfirm={handleStartConfirm}
      />

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={!!invoiceData}
        onOpenChange={(open) => !open && setInvoiceData(null)}
        invoice={invoiceData}
      />
    </MainLayout>
  );
};

export default Devices;
