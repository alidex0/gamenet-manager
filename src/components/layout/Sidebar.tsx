import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Monitor, 
  Coffee, 
  Users, 
  BarChart3, 
  Settings,
  Gamepad2
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'داشبورد' },
  { to: '/devices', icon: Monitor, label: 'دستگاه‌ها' },
  { to: '/buffet', icon: Coffee, label: 'بوفه' },
  { to: '/users', icon: Users, label: 'کاربران' },
  { to: '/reports', icon: BarChart3, label: 'گزارش‌ها' },
  { to: '/settings', icon: Settings, label: 'تنظیمات' },
];

export function Sidebar() {
  return (
    <aside className="fixed right-0 top-0 z-40 h-screen w-64 border-l border-border bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-20 items-center gap-3 border-b border-border px-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary glow">
            <Gamepad2 className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">گیم نت</h1>
            <p className="text-xs text-muted-foreground">پنل مدیریت</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
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
            <p className="text-xs text-primary">© ۱۴۰۳ گیم نت</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
