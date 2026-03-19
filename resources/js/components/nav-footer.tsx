import { type ComponentPropsWithoutRef } from 'react';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { useActiveUrl } from '@/hooks/use-active-url';

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,

} from '@/components/ui/sidebar';
import { type NavItem } from '@/types';

export function NavFooter({
    items,
    className,
    userRole,
    ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
    items: NavItem[];
    userRole: string;
}) {
    const filteredItems = items.filter(item => !item.role || item.role === userRole);

    return (
        <SidebarGroup
            {...props}
            className={cn(
                "relative bg-sidebar/70 backdrop-blur-sm border-t border-sidebar-border/50",
                "group-data-[collapsible=icon]:p-1",
                className
            )}
        >
            <SidebarGroupContent className="p-2">
                <SidebarMenu className="space-y-1">
                    {filteredItems.map((item) => {
                        const { urlIsActive } = useActiveUrl();
                        const isActive = urlIsActive(item.href);

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
                                    <Link href={item.href} prefetch>
                                        {isActive && (
                                            <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-sidebar-primary" />
                                        )}
                                        {item.icon && (
                                            <item.icon className="size-4 shrink-0 opacity-90" />
                                        )}
                                        <span className="truncate">{item.title}</span>
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

