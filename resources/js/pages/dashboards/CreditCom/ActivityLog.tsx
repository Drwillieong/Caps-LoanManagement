import AdminActivityLogPage from '../Shared/AdminActivityLogPage';

const breadcrumbs = [
    { title: 'Credit Committee Dashboard', href: '/dashboard' },
    { title: 'Activity Logs', href: '/dashboards/CreditCom/ActivityLog' },
];

export default function CreditComActivityLogPage() {
    return (
        <AdminActivityLogPage
            breadcrumbs={breadcrumbs}
            description="Review administrative activity history across GM, HR, and Credit Committee users."
            headTitle="Activity Log"
            title="Activity Log"
        />
    );
}
