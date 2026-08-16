import { type ComponentPropsWithoutRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useActiveUrl } from '@/hooks/use-active-url';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,

} from '@/components/ui/sidebar';
import { type NavItem, type NotificationBadges, type SharedData } from '@/types';

const sidebarBadgeKeys: Record<keyof NotificationBadges, string> = {
    unreadMemberValidationCount: 'member_validation',
    pendingMemberSignupsCount: 'member_validation',
    pendingProfileEditsCount: 'profile_edits',
    pendingComakerRequestsCount: 'comaker_requests',
    pendingGmLoanValidationCount: 'gm_loan_validation',
    pendingCreditCommitteeCount: 'credit_committee',
    gmApprovedLoanActionCount: 'gm_approved_loan_action',
    hasMemberStatusChanged: 'member_status_changed',
    unreadNotificationsCount: 'unread_notifications',
};

function getBadgeValue(item: NavItem, notificationBadges: NotificationBadges): number {
    if (!item.badgeKey) {
        return 0;
    }

    const value = notificationBadges[item.badgeKey];

    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    return value ?? 0;
}

function markBadgeRead(item: NavItem, count: number) {
    if (!item.badgeKey || count <= 0) {
        return;
    }

    router.post(
        '/sidebar-notification-badges/mark-read',
        { badge_key: sidebarBadgeKeys[item.badgeKey] },
        {
            preserveScroll: true,
            preserveState: true,
            only: ['notificationBadges'],
        },
    );
}

export function NavFooter({
    items,
    className,
    userRole,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
    userRole: string;
}) {
    const { notificationBadges = {} } = usePage<SharedData>().props;
    const { urlIsActive } = useActiveUrl();
    const filteredItems = items.filter(
        (item) => item.href && (!item.role || item.role === userRole),
    );

    return (
        <SidebarGroup
            {...props}
            className={cn(
                "relative bg-sidebar/70 backdrop-blur-sm  border-sidebar-border/50",
                "group-data-[collapsible=icon]:pr-1",
                className
            )}
        >
            <SidebarGroupContent className="p-2">
                <SidebarMenu className="space-y-1">
                    {filteredItems.map((item) => {
                        const href = item.href!;
                        const isActive = urlIsActive(href);
                        const badgeCount = getBadgeValue(item, notificationBadges);

                        return (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isActive}
                                    className={cn(
                                        `relative h-11 rounded-xl px-3 flex items-center gap-3 transition-all shadow-sm hover:shadow-md`,
                                        `text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`,
                                        isActive && `bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-medium`
                                    )}
                                >
                                    <Link
                                        href={href}
                                        prefetch
                                        onClick={() => markBadgeRead(item, badgeCount)}
                                    >
                                        {isActive && (
                                            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-sidebar-primary" />
                                        )}
                                        {item.icon && (
                                            <item.icon className="size-4 shrink-0 opacity-90" />
                                        )}
                                        <span className="truncate">{item.title}</span>
                                        {badgeCount > 0 && (
                                            <Badge
                                                variant="destructive"
                                                className="ml-auto min-w-5 rounded-full px-1.5 py-0 text-xs leading-5"
                                            >
                                                {badgeCount > 99 ? '99+' : badgeCount}
                                            </Badge>
                                        )}
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        );
                    })}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}
