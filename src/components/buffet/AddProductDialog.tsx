import { useState } from 'react';
import { Plus, Package } from 'lucide-react';
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

interface NewProduct {
  name: string;
  price: number;
  stock: number;
  category: string;
}

interface AddProductDialogProps {
  onAdd: (product: NewProduct) => Promise<{ success: boolean }>;
}

const categories = [
  { value: 'نوشیدنی', label: 'نوشیدنی' },
  { value: 'خوراکی', label: 'خوراکی' },
  { value: 'تنقلات', label: 'تنقلات' },
  { value: 'سایر', label: 'سایر' },
];

export function AddProductDialog({ onAdd }: AddProductDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [category, setCategory] = useState('نوشیدنی');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !price || !stock) return;

    setSubmitting(true);
    const result = await onAdd({
      name: name.trim(),
      price: parseInt(price),
      stock: parseInt(stock),
      category,
    });

    if (result.success) {
      setName('');
      setPrice('');
      setStock('');
      setCategory('نوشیدنی');
      setOpen(false);
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="glow" className="gap-2">
          <Plus className="h-4 w-4" />
          افزودن محصول
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            افزودن محصول جدید
          </DialogTitle>
          <DialogDescription>
            اطلاعات محصول جدید را وارد کنید
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
                min="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">موجودی</label>
              <Input
                type="number"
                placeholder="۵۰"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="bg-secondary/50"
                min="0"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            انصراف
          </Button>
          <Button 
            variant="glow" 
            onClick={handleSubmit}
            disabled={!name.trim() || !price || !stock || submitting}
          >
            {submitting ? 'در حال ذخیره...' : 'افزودن'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
