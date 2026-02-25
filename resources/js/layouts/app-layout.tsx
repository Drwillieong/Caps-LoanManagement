import { type ReactNode } from 'react';

import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { Toaster } from '@/components/toaster';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    headerRight?: ReactNode;
}

export default ({ children, breadcrumbs, headerRight, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} headerRight={headerRight} {...props}>
        {children}
        <Toaster />
    </AppLayoutTemplate>
);
