import { Link } from '@inertiajs/react';
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
      <SidebarGroupLabel className="mb-2 px-3 text-xs font-semibold uppercase tracking-wide text-sidebar-foreground/60">
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
                className={`
                  relative h-11 rounded-xl px-3
                  flex items-center gap-3
                  text-sidebar-foreground/80
                  transition-all

                  hover:bg-sidebar-accent hover:text-sidebar-accent-foreground
                  ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}
                `}
              >
                <Link href={item.href} prefetch>
                  {/* LEFT ACTIVE BAR */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-sidebar-primary" />
                  )}

                  {item.icon && <item.icon className="size-4" />}
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