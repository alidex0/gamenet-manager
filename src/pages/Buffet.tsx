import { useState } from 'react';
import { Plus, Search, Package, ShoppingCart } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Product } from '@/types';

const initialProducts: Product[] = [
  { id: '1', name: 'نوشابه', price: 15000, stock: 48, category: 'نوشیدنی' },
  { id: '2', name: 'آبمیوه', price: 20000, stock: 24, category: 'نوشیدنی' },
  { id: '3', name: 'چیپس', price: 25000, stock: 36, category: 'خوراکی' },
  { id: '4', name: 'شکلات', price: 18000, stock: 60, category: 'خوراکی' },
  { id: '5', name: 'بیسکویت', price: 12000, stock: 40, category: 'خوراکی' },
  { id: '6', name: 'آب معدنی', price: 8000, stock: 100, category: 'نوشیدنی' },
  { id: '7', name: 'ساندویچ', price: 45000, stock: 12, category: 'غذا' },
  { id: '8', name: 'پیتزا شخصی', price: 85000, stock: 8, category: 'غذا' },
];

const Buffet = () => {
  const [products] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<{ productId: string; quantity: number }[]>([]);

  const filteredProducts = products.filter(p => 
    p.name.includes(searchQuery) || p.category.includes(searchQuery)
  );

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

  const toPersianNumber = (n: number | string) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

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

              <div className="border-t border-border pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">جمع کل</span>
                  <span className="text-xl font-bold text-foreground">
                    {toPersianNumber(getCartTotal().toLocaleString())} تومان
                  </span>
                </div>
                <Button variant="glow" className="w-full">
                  ثبت فروش
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setCart([])}
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
