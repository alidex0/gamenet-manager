import { useState } from 'react';
import { Plus, Search, MoreVertical, UserCheck, UserX, Mail, Phone } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User } from '@/types';
import { cn } from '@/lib/utils';

const initialUsers: User[] = [
  { id: '1', name: 'علی رضایی', email: 'ali@example.com', phone: '۰۹۱۲۳۴۵۶۷۸۹', role: 'customer', isActive: true, createdAt: new Date('2024-01-15') },
  { id: '2', name: 'محمد احمدی', email: 'mohammad@example.com', phone: '۰۹۱۲۸۷۶۵۴۳۲', role: 'customer', isActive: true, createdAt: new Date('2024-02-20') },
  { id: '3', name: 'سارا کریمی', email: 'sara@example.com', phone: '۰۹۳۵۱۲۳۴۵۶۷', role: 'staff', isActive: true, createdAt: new Date('2024-01-10') },
  { id: '4', name: 'رضا حسینی', email: 'reza@example.com', phone: '۰۹۱۹۸۷۶۵۴۳۲', role: 'customer', isActive: false, createdAt: new Date('2024-03-05') },
  { id: '5', name: 'مریم موسوی', email: 'maryam@example.com', phone: '۰۹۳۷۲۳۴۵۶۷۸', role: 'admin', isActive: true, createdAt: new Date('2023-12-01') },
];

const roleLabels = {
  admin: { label: 'مدیر', color: 'bg-accent/20 text-accent' },
  staff: { label: 'کارمند', color: 'bg-primary/20 text-primary' },
  customer: { label: 'مشتری', color: 'bg-secondary text-muted-foreground' },
};

const UsersPage = () => {
  const [users] = useState<User[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter(u => 
    u.name.includes(searchQuery) || u.email.includes(searchQuery)
  );

  return (
    <MainLayout title="مدیریت کاربران" subtitle="کاربران و سطوح دسترسی">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="جستجوی کاربر..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 bg-secondary/50"
          />
        </div>
        <Button variant="glow" className="gap-2">
          <Plus className="h-4 w-4" />
          افزودن کاربر
        </Button>
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">کاربر</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">اطلاعات تماس</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">نقش</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">وضعیت</th>
                <th className="text-right py-4 px-6 text-sm font-medium text-muted-foreground">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr 
                  key={user.id} 
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary text-primary-foreground font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">عضویت: {user.createdAt.toLocaleDateString('fa-IR')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                      roleLabels[user.role].color
                    )}>
                      {roleLabels[user.role].label}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={cn(
                      'inline-flex items-center gap-1 text-sm',
                      user.isActive ? 'text-success' : 'text-destructive'
                    )}>
                      {user.isActive ? (
                        <>
                          <UserCheck className="h-4 w-4" />
                          فعال
                        </>
                      ) : (
                        <>
                          <UserX className="h-4 w-4" />
                          غیرفعال
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </MainLayout>
  );
};

export default UsersPage;
