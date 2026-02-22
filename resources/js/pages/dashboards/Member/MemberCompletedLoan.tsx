import { Head } from '@inertiajs/react';

import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { LiveClock } from '@/components/live-clock';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Completed Loan',
        href: dashboard().url,
    },
];

export default function MemberCompletedLoan() {
    return (
        <AppLayout breadcrumbs={breadcrumbs} headerRight={<LiveClock />}>
            <Head title="Completed Loan" />
         
        </AppLayout>
    );
}
