import { Head } from '@inertiajs/react';

import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User Profile',
        href: dashboard().url,
    },
];

export default function MembersProfile() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User Profile" />
           
        </AppLayout>
    );
}
