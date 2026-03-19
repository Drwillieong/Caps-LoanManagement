import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useActiveUrl } from '@/hooks/use-active-url';
import { type NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
  const { urlIsActive } = useActiveUrl();

  return (
    <SidebarGroup className="px-2">
      {/* SECTION LABEL */}
      <SidebarGroupLabel className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70 bg-sidebar/50 rounded-md backdrop-blur-sm">
        Loan Management System
      </SidebarGroupLabel>

      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const isActive = urlIsActive(item.href);

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                className={cn(
                  `relative h-11 rounded-xl px-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200`,
                  `text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`,
                  isActive && `bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-medium ring-1 ring-sidebar-primary/30`
                )}
              >
                <Link href={item.href} prefetch>
                  {/* LEFT ACTIVE BAR */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-sidebar-primary shadow-sm" />
                  )}

                  {item.icon && <item.icon className="size-4 shrink-0 opacity-90" />}
                  <span className="truncate">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
