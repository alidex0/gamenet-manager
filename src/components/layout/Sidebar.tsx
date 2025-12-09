import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Monitor, 
  Coffee, 
  Users, 
  BarChart3, 
  Settings,
  Gamepad2,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'داشبورد' },
  { to: '/devices', icon: Monitor, label: 'دستگاه‌ها' },
  { to: '/buffet', icon: Coffee, label: 'بوفه' },
  { to: '/users', icon: Users, label: 'کاربران', staffOnly: true },
  { to: '/reports', icon: BarChart3, label: 'گزارش‌ها' },
  { to: '/settings', icon: Settings, label: 'تنظیمات', staffOnly: true },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { gameCenter, isStaffOrAdmin } = useAuth();

  const visibleItems = navItems.filter(item => !item.staffOnly || isStaffOrAdmin);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed right-0 top-0 z-50 h-screen w-64 border-l border-border bg-sidebar transition-transform duration-300',
        'lg:translate-x-0',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-20 items-center gap-3 border-b border-border px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary glow">
              <Gamepad2 className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">
                {gameCenter?.name || 'گیم نت'}
              </h1>
              <p className="text-xs text-muted-foreground">پنل مدیریت</p>
            </div>
            {/* Close button for mobile */}
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden h-8 w-8"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            {visibleItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary/10 text-primary glow-text'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  )
                }
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="glass rounded-lg p-4">
              <p className="text-xs text-muted-foreground">نسخه ۱.۰.۰</p>
              <p className="text-xs text-primary">سیستم مدیریت گیم نت</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
