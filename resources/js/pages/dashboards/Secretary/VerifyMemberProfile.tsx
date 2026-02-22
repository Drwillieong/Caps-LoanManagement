import { Head } from '@inertiajs/react';

import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Verify Member Profile',
        href: dashboard().url,
    },
];

export default function VerifyMemberProfile() {
    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Verify Member Profile" />
         
        </AppLayout>
    );
}
