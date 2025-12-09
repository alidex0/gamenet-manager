import { useState } from 'react';
import { Search, Package, ShoppingCart, Loader2, User, Monitor, Trash2, Minus, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useProducts } from '@/hooks/useProducts';
import { useDevicesDB } from '@/hooks/useDevicesDB';
import { AddProductDialog } from '@/components/buffet/AddProductDialog';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Buffet = () => {
  const { products, loading, createSale, addProduct } = useProducts();
  const { devices } = useDevicesDB();
  const { isStaffOrAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [saleType, setSaleType] = useState<'device' | 'customer'>('device');
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.includes(searchQuery) || p.category.includes(searchQuery)
  );

  const availableDevices = devices.filter(d => d.status !== 'maintenance');

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => 
          item.productId === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleSubmitSale = async () => {
    if (cart.length === 0) return;
    
    setSubmitting(true);
    const deviceId = saleType === 'device' ? selectedDevice : undefined;
    const customer = saleType === 'customer' ? customerName.trim() : undefined;
    
    const result = await createSale(cart, deviceId, customer);
    if (result.success) {
      setCart([]);
      setSelectedDevice('');
      setCustomerName('');
    }
    setSubmitting(false);
  };

  const toPersianNumber = (n: number | string) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

  if (loading) {
    return (
      <MainLayout title="مدیریت بوفه" subtitle="در حال بارگذاری...">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="مدیریت بوفه" subtitle="محصولات و فروش">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Products */}
        <div className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="جستجوی محصول..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-secondary/50"
              />
            </div>
            {isStaffOrAdmin && (
              <AddProductDialog onAdd={addProduct} />
            )}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">محصولی یافت نشد</h3>
              <p className="text-sm text-muted-foreground mb-4">محصول جدید اضافه کنید.</p>
              {isStaffOrAdmin && (
                <AddProductDialog onAdd={addProduct} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product.id)}
                  disabled={product.stock <= 0}
                  className={cn(
                    'glass glass-hover rounded-xl p-4 text-right transition-all duration-300 animate-fade-in',
                    product.stock > 0 
                      ? 'hover:border-primary/50 hover:scale-[1.02] active:scale-[0.98]'
                      : 'opacity-50 cursor-not-allowed'
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center justify-center h-16 w-16 mx-auto mb-3 rounded-xl bg-secondary">
                    <Package className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{product.category}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-primary">
                      {toPersianNumber(product.price.toLocaleString())} ت
                    </span>
                    <span className={cn(
                      'text-xs',
                      product.stock < 10 ? 'text-warning' : 'text-muted-foreground',
                      product.stock <= 0 && 'text-destructive'
                    )}>
                      {product.stock <= 0 ? 'ناموجود' : `${toPersianNumber(product.stock)} عدد`}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="glass rounded-2xl p-6 h-fit sticky top-28">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
              <ShoppingCart className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-foreground">سبد فروش</h3>
              <p className="text-xs text-muted-foreground">
                {toPersianNumber(cart.reduce((sum, item) => sum + item.quantity, 0))} قلم
              </p>
            </div>
          </div>

          {cart.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">سبد خالی است</p>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6 max-h-64 overflow-auto">
                {cart.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  if (!product) return null;
                  return (
                    <div key={item.productId} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {toPersianNumber(product.price.toLocaleString())} ت
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.productId, -1);
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-bold w-6 text-center">
                          {toPersianNumber(item.quantity)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.productId, 1);
                          }}
                          disabled={item.quantity >= product.stock}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.productId);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Sale type selection */}
              <div className="mb-4">
                <label className="text-xs text-muted-foreground mb-2 block">
                  نوع فروش (اختیاری)
                </label>
                <Tabs value={saleType} onValueChange={(v) => setSaleType(v as 'device' | 'customer')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="device" className="gap-1 text-xs">
                      <Monitor className="h-3 w-3" />
                      دستگاه
                    </TabsTrigger>
                    <TabsTrigger value="customer" className="gap-1 text-xs">
                      <User className="h-3 w-3" />
                      مشتری
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Device Selection */}
              {saleType === 'device' && (
                <div className="mb-4">
                  {availableDevices.length > 0 ? (
                    <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue placeholder="انتخاب دستگاه..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">بدون دستگاه</SelectItem>
                        {availableDevices.map(device => (
                          <SelectItem key={device.id} value={device.id}>
                            {device.name}
                            {device.currentSession?.customer_name && (
                              <span className="text-muted-foreground mr-2">
                                ({device.currentSession.customer_name})
                              </span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      هیچ دستگاهی وجود ندارد
                    </p>
                  )}
                </div>
              )}

              {/* Customer Name Input */}
              {saleType === 'customer' && (
                <div className="mb-4">
                  <Input
                    placeholder="نام مشتری..."
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="bg-secondary/50"
                  />
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">جمع کل</span>
                  <span className="text-xl font-bold text-foreground">
                    {toPersianNumber(getCartTotal().toLocaleString())} تومان
                  </span>
                </div>
                <Button 
                  variant="glow" 
                  className="w-full"
                  onClick={handleSubmitSale}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال ثبت...
                    </>
                  ) : (
                    'ثبت فروش'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setCart([]);
                    setSelectedDevice('');
                    setCustomerName('');
                  }}
                >
                  پاک کردن سبد
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Buffet;
