import { Link } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useActiveUrl } from '@/hooks/use-active-url';
import { type NavItem } from '@/types';

function renderNavItem(item: NavItem, key: string) {
  const { urlIsActive } = useActiveUrl();

  if (item.items && item.items.length > 0) {
    // Group item - use Collapsible
    const anyChildActive = item.items.some(child => urlIsActive(child.href ?? ''));
    const groupClass = cn(
      'relative h-11 rounded-xl px-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200',
      'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
      anyChildActive && 'bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-medium ring-1 ring-sidebar-primary/30'
    );

    return (
      <SidebarMenuItem key={key}>
        <Collapsible>
          <SidebarMenuButton 
            asChild 
            className={groupClass}
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center gap-3 w-full h-full">
                {item.icon && <item.icon className="size-4 shrink-0 opacity-90" />}
                <span className="truncate flex-1">{item.title}</span>
                <ChevronDown className="size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:-rotate-180 ml-auto" />
              </div>
            </CollapsibleTrigger>
          </SidebarMenuButton>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items!.map((subItem, subIndex) => (
                <SidebarMenuSubItem key={subIndex}>
                  <SidebarMenuSubButton asChild isActive={urlIsActive(subItem.href!)}>
                    <Link href={subItem.href!} prefetch className="gap-2">
                      {subItem.icon && <subItem.icon className="size-4 shrink-0 opacity-90" />}
                      <span>{subItem.title}</span>
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
      `relative h-11 rounded-xl px-3 flex items-center gap-3 shadow-sm hover:shadow-md transition-all duration-200`,
      `text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`,
      isActive && `bg-sidebar-accent text-sidebar-accent-foreground shadow-md font-medium ring-1 ring-sidebar-primary/30`
    );

    return (
      <SidebarMenuItem key={key}>
        <SidebarMenuButton asChild isActive={isActive} className={itemClass}>
          <Link href={item.href!} prefetch>
            {isActive && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-sidebar-primary shadow-sm" />
            )}
            {item.icon && <item.icon className="size-4 shrink-0 opacity-90" />}
            <span className="truncate">{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
  return (
    <SidebarGroup className="px-2">
      {/* SECTION LABEL */}
      <SidebarGroupLabel className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/70 bg-sidebar/50 rounded-md backdrop-blur-sm">
        Loan Management System
      </SidebarGroupLabel>

      <SidebarMenu className="space-y-1">
        {items.map((item, index) => renderNavItem(item, `${item.title}-${index}`))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
