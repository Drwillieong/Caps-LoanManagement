import { Badge } from '@/components/ui/badge';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import { useActiveUrl } from '@/hooks/use-active-url';
import { cn } from '@/lib/utils';
import {
    type NavItem,
    type NotificationBadges,
    type SharedData,
} from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { ChevronDown } from 'lucide-react';

const sidebarBadgeKeys: Record<keyof NotificationBadges, string> = {
    unreadMemberValidationCount: 'member_validation',
    pendingComakerRequestsCount: 'comaker_requests',
    pendingGmLoanValidationCount: 'gm_loan_validation',
    pendingCreditCommitteeCount: 'credit_committee',
    gmApprovedLoanActionCount: 'gm_approved_loan_action',
    hasMemberStatusChanged: 'member_status_changed',
};

function getBadgeValue(
    item: NavItem,
    notificationBadges: NotificationBadges,
): number {
    if (!item.badgeKey) {
        return 0;
    }

    const value = notificationBadges[item.badgeKey];

    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }

    return value ?? 0;
}

function SidebarBadge({
    count,
    dot = false,
}: {
    count: number;
    dot?: boolean;
}) {
    if (count <= 0) {
        return null;
    }

    if (dot) {
        return (
            <span className="ml-auto size-2.5 shrink-0 rounded-full bg-destructive" />
        );
    }

    return (
        <Badge
            variant="destructive"
            className="ml-auto min-w-5 rounded-full px-1.5 py-0 text-xs leading-5"
        >
            {count > 99 ? '99+' : count}
        </Badge>
    );
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

function NavItemRow({
    item,
    notificationBadges,
}: {
    item: NavItem;
    notificationBadges: NotificationBadges;
}) {
    const { urlIsActive } = useActiveUrl();
    const badgeCount = getBadgeValue(item, notificationBadges);

    if (item.items && item.items.length > 0) {
        // Group item - use Collapsible
        const anyChildActive = item.items.some((child) =>
            urlIsActive(child.href ?? ''),
        );
        const childBadgeCount = item.items.reduce(
            (total, child) => total + getBadgeValue(child, notificationBadges),
            0,
        );
        const groupClass = cn(
            'relative flex h-11 items-center gap-3 rounded-xl px-3 shadow-sm transition-all duration-200 hover:shadow-md',
            'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            anyChildActive &&
                'bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-md ring-1 ring-sidebar-primary/30',
        );

        return (
            <SidebarMenuItem>
                <Collapsible>
                    <SidebarMenuButton asChild className={groupClass}>
                        <CollapsibleTrigger asChild>
                            <div className="flex h-full w-full items-center gap-3">
                                {item.icon && (
                                    <item.icon className="size-4 shrink-0 opacity-90" />
                                )}
                                <span className="flex-1 truncate">
                                    {item.title}
                                </span>
                                <SidebarBadge count={childBadgeCount} />
                                <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:-rotate-180" />
                            </div>
                        </CollapsibleTrigger>
                    </SidebarMenuButton>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items!.map((subItem, subIndex) => (
                                <SidebarMenuSubItem key={subIndex}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={urlIsActive(subItem.href!)}
                                    >
                                        <Link
                                            href={subItem.href!}
                                            prefetch
                                            className="gap-2"
                                            onClick={() =>
                                                markBadgeRead(
                                                    subItem,
                                                    getBadgeValue(
                                                        subItem,
                                                        notificationBadges,
                                                    ),
                                                )
                                            }
                                        >
                                            {subItem.icon && (
                                                <subItem.icon className="size-4 shrink-0 opacity-90" />
                                            )}
                                            <span className="truncate">
                                                {subItem.title}
                                            </span>
                                            <SidebarBadge
                                                count={getBadgeValue(
                                                    subItem,
                                                    notificationBadges,
                                                )}
                                                dot={
                                                    subItem.badgeKey ===
                                                    'hasMemberStatusChanged'
                                                }
                                            />
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </Collapsible>
            </SidebarMenuItem>
        );
    } else {
        // Leaf item - existing logic
        const isActive = item.href ? urlIsActive(item.href) : false;
        const itemClass = cn(
            `relative flex h-11 items-center gap-3 rounded-xl px-3 shadow-sm transition-all duration-200 hover:shadow-md`,
            `text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`,
            isActive &&
                `bg-sidebar-accent font-medium text-sidebar-accent-foreground shadow-md ring-1 ring-sidebar-primary/30`,
        );

        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    className={itemClass}
                >
                    <Link
                        href={item.href!}
                        prefetch
                        onClick={() => markBadgeRead(item, badgeCount)}
                    >
                        {isActive && (
                            <span className="absolute top-1/2 left-0 h-6 w-1 -translate-y-1/2 rounded-r bg-sidebar-primary shadow-sm" />
                        )}
                        {item.icon && (
                            <item.icon className="size-4 shrink-0 opacity-90" />
                        )}
                        <span className="truncate">{item.title}</span>
                        <SidebarBadge
                            count={badgeCount}
                            dot={item.badgeKey === 'hasMemberStatusChanged'}
                        />
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { notificationBadges = {} } = usePage<SharedData>().props;

    return (
        <SidebarGroup className="px-2">
            {/* SECTION LABEL */}
            <SidebarGroupLabel className="mb-3 rounded-md bg-sidebar/50 px-3 py-1 text-xs font-semibold tracking-wider text-sidebar-foreground/70 uppercase backdrop-blur-sm">
                Loan Management System
            </SidebarGroupLabel>

            <SidebarMenu className="space-y-1">
                {items.map((item, index) => (
                    <NavItemRow
                        key={`${item.title}-${index}`}
                        item={item}
                        notificationBadges={notificationBadges}
                    />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
