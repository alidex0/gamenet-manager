import { useState } from 'react';
import { Plus, Search, Package, ShoppingCart, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useProducts } from '@/hooks/useProducts';
import { useDevicesDB } from '@/hooks/useDevicesDB';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Buffet = () => {
  const { products, loading, createSale } = useProducts();
  const { devices } = useDevicesDB();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.includes(searchQuery) || p.category.includes(searchQuery)
  );

  const occupiedDevices = devices.filter(d => d.status === 'occupied');

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

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  };

  const handleSubmitSale = async () => {
    if (cart.length === 0) return;
    
    setSubmitting(true);
    const result = await createSale(cart, selectedDevice || undefined);
    if (result.success) {
      setCart([]);
      setSelectedDevice('');
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
            <Button variant="glow" className="gap-2">
              <Plus className="h-4 w-4" />
              افزودن محصول
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product, index) => (
              <button
                key={product.id}
                onClick={() => addToCart(product.id)}
                className={cn(
                  'glass glass-hover rounded-xl p-4 text-right transition-all duration-300 animate-fade-in',
                  'hover:border-primary/50 hover:scale-[1.02] active:scale-[0.98]'
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
                    product.stock < 10 ? 'text-warning' : 'text-muted-foreground'
                  )}>
                    {toPersianNumber(product.stock)} عدد
                  </span>
                </div>
              </button>
            ))}
          </div>
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
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {toPersianNumber(item.quantity)} × {toPersianNumber(product.price.toLocaleString())} ت
                        </p>
                      </div>
                      <span className="text-sm font-bold text-primary">
                        {toPersianNumber((product.price * item.quantity).toLocaleString())} ت
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Device Selection */}
              {occupiedDevices.length > 0 && (
                <div className="mb-4">
                  <label className="text-xs text-muted-foreground mb-2 block">
                    اختصاص به دستگاه (اختیاری)
                  </label>
                  <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="انتخاب دستگاه..." />
                    </SelectTrigger>
                    <SelectContent>
                      {occupiedDevices.map(device => (
                        <SelectItem key={device.id} value={device.id}>
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
