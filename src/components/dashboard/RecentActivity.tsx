import { Monitor, Coffee, Clock, Loader2, Play, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRecentActivity, Activity } from '@/hooks/useRecentActivity';

const iconConfig = {
  device_start: { icon: Play, bg: 'bg-primary/10', color: 'text-primary' },
  device_end: { icon: Square, bg: 'bg-success/10', color: 'text-success' },
  sale: { icon: Coffee, bg: 'bg-accent/10', color: 'text-accent' },
};

export function RecentActivity() {
  const { activities, loading } = useRecentActivity();

  if (loading) {
    return (
      <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-foreground">فعالیت‌های اخیر</h3>
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-foreground">فعالیت‌های اخیر</h3>
        <Clock className="h-5 w-5 text-muted-foreground" />
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">هنوز فعالیتی ثبت نشده</p>
        </div>
      ) : (
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
                <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.timeAgo}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
