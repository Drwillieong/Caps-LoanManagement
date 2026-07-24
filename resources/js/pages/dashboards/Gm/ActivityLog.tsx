import type { BreadcrumbItem } from '@/types';

import AdminActivityLogPage from '../Shared/AdminActivityLogPage';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Activity Logs', href: '/dashboards/Gm/ActivityLog' },
];

export default function ActivityLogPage() {
    return (
        <AdminActivityLogPage
            breadcrumbs={breadcrumbs}
            description="Monitor all GM and HR administrative activities and transactions."
            headTitle="Activity Log"
            title="Activity Log"
        />
    );
}
