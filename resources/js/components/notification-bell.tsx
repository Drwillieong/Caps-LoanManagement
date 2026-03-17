import { usePage, router } from '@inertiajs/react';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface NotificationBellProps {}

export function NotificationBell({ }: NotificationBellProps) {
    const { props } = usePage();
    const count = (props.unread_notifications_count as number) ?? 0;

    const hasNotifications = count > 0;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "relative h-9 w-9 rounded-full hover:bg-accent",
                            hasNotifications && "hover:bg-destructive/10"
                        )}
                        onClick={() => router.visit('/dashboards/Member/Notification')}
                    >
                        <Bell className="h-5 w-5" />
                        {hasNotifications && (
                            <Badge
                                variant="destructive"
                                className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full text-xs flex items-center justify-center animate-pulse"
                            >
                                {count > 99 ? '99+' : count}
                            </Badge>
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{hasNotifications ? `${count} notifications` : 'No new notifications'}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
