import { useState } from 'react';
import { Edit2, Package, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface EditProductDialogProps {
  product: Product;
  onUpdate: (productId: string, updates: { name?: string; price?: number; stock?: number; category?: string }) => Promise<{ success: boolean }>;
  onDelete: (productId: string) => Promise<{ success: boolean }>;
}

const categories = [
  { value: 'نوشیدنی', label: 'نوشیدنی' },
  { value: 'خوراکی', label: 'خوراکی' },
  { value: 'تنقلات', label: 'تنقلات' },
  { value: 'سایر', label: 'سایر' },
];

export function EditProductDialog({ product, onUpdate, onDelete }: EditProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());
  const [stock, setStock] = useState(product.stock.toString());
  const [category, setCategory] = useState(product.category);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !price || !stock) return;

    setSubmitting(true);
    const result = await onUpdate(product.id, {
      name: name.trim(),
      price: parseInt(price),
      stock: parseInt(stock),
      category,
    });

    if (result.success) {
      setOpen(false);
    }
    setSubmitting(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await onDelete(product.id);
    if (result.success) {
      setDeleteDialogOpen(false);
      setOpen(false);
    }
    setDeleting(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Edit2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              ویرایش محصول
            </DialogTitle>
            <DialogDescription>
              اطلاعات محصول را ویرایش کنید
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">نام محصول</label>
              <Input
                placeholder="مثال: نوشابه"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">دسته‌بندی</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">قیمت (تومان)</label>
                <Input
                  type="number"
                  placeholder="۱۵۰۰۰"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">موجودی</label>
                <Input
                  type="number"
                  placeholder="۱۰"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="bg-secondary/50"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
            <div className="flex gap-2 flex-1">
              <Button variant="outline" onClick={() => setOpen(false)}>
                انصراف
              </Button>
              <Button
                variant="glow"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>آیا می‌خواهید این محصول را حذف کنید؟</AlertDialogTitle>
            <AlertDialogDescription>
              محصول "{name}" حذف خواهد شد و این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'در حال حذف...' : 'حذف'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
