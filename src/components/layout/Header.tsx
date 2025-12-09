import { Bell, Search, User, Package, Clock, Wrench, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

const toPersianNumber = (n: number | string) => n.toString().replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);

const notificationIcons = {
  low_stock: { icon: Package, color: 'text-warning' },
  session_long: { icon: Clock, color: 'text-primary' },
  maintenance: { icon: Wrench, color: 'text-muted-foreground' },
};

export function Header({ title, subtitle }: HeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { user, userRole, gameCenter } = useAuth();

  const displayName = gameCenter?.name || 'مدیر سیستم';

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between px-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative hidden md:block">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="جستجو..."
              className="w-64 bg-secondary/50 pr-10 border-border focus:border-primary"
            />
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {toPersianNumber(unreadCount)}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="font-bold text-foreground">اعلان‌ها</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-auto py-1 px-2 text-xs"
                    onClick={markAllAsRead}
                  >
                    <Check className="h-3 w-3 ml-1" />
                    خواندن همه
                  </Button>
                )}
              </div>
              <DropdownMenuSeparator />
              
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">اعلانی وجود ندارد</p>
                </div>
              ) : (
                <div className="max-h-80 overflow-auto">
                  {notifications.map((notification) => {
                    const config = notificationIcons[notification.type];
                    const Icon = config.icon;
                    
                    return (
                      <DropdownMenuItem 
                        key={notification.id}
                        className={cn(
                          'flex items-start gap-3 p-3 cursor-pointer',
                          !notification.read && 'bg-primary/5'
                        )}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                          <Icon className={cn('h-4 w-4', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm',
                            !notification.read ? 'font-medium text-foreground' : 'text-muted-foreground'
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {notification.message}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User */}
          <Button variant="glass" className="gap-2">
            <User className="h-4 w-4" />
            <span>{displayName}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
