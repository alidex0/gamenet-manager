import { Monitor, Coffee, User, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: 'device' | 'sale' | 'user';
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  { id: '1', type: 'device', title: 'PC شماره ۳', description: 'شروع استفاده توسط علی رضایی', time: '۲ دقیقه پیش' },
  { id: '2', type: 'sale', title: 'فروش بوفه', description: '۲ نوشابه - PC شماره ۵', time: '۵ دقیقه پیش' },
  { id: '3', type: 'device', title: 'پلی‌استیشن ۱', description: 'پایان استفاده - ۲ ساعت', time: '۱۰ دقیقه پیش' },
  { id: '4', type: 'user', title: 'کاربر جدید', description: 'محمد احمدی ثبت نام کرد', time: '۱۵ دقیقه پیش' },
  { id: '5', type: 'sale', title: 'فروش بوفه', description: 'چیپس و آبمیوه - بیلیارد ۲', time: '۲۰ دقیقه پیش' },
];

const iconConfig = {
  device: { icon: Monitor, bg: 'bg-primary/10', color: 'text-primary' },
  sale: { icon: Coffee, bg: 'bg-success/10', color: 'text-success' },
  user: { icon: User, bg: 'bg-accent/10', color: 'text-accent' },
};

export function RecentActivity() {
  return (
    <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-foreground">فعالیت‌های اخیر</h3>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const config = iconConfig[activity.type];
          const Icon = config.icon;
          
          return (
            <div 
              key={activity.id} 
              className="flex items-start gap-3 animate-slide-in-right"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                config.bg
              )}>
                <Icon className={cn('h-5 w-5', config.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground text-sm">{activity.title}</p>
                <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
