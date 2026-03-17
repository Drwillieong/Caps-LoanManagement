import { type ReactNode } from 'react';
import { Suspense } from 'react';
import { usePage } from '@inertiajs/react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from './notification-bell';
import { type BreadcrumbItem as BreadcrumbItemType } from '@/types';


export function AppSidebarHeader({
    breadcrumbs = [],
    headerRight,
}: {
    breadcrumbs?: BreadcrumbItemType[];
    headerRight?: ReactNode;
}) {
    const { auth } = usePage().props;
    const isMember = auth?.user?.role === 'member';

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border/50 px-6 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
{headerRight && (
                <div className="ml-auto flex items-center gap-3">
                    {isMember && (
                        <Suspense fallback={<div className="size-9 rounded-full bg-muted/50 animate-pulse" />}>
                            <NotificationBell />
                        </Suspense>
                    )}
                    {headerRight}
                </div>
            )}
        </header>
    );
}

